using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using SistemaInventario.Application.DTOs;
using SistemaInventario.Application.Interfaces;
using SistemaInventario.Domain.Entities;
using SistemaInventario.Domain.Enums;
using SistemaInventario.Infrastructure.Persistence;
using System.Data;
using System.Data.Common;

namespace SistemaInventario.Infrastructure.Repositories
{
    public class MantenimientoRepository : IMantenimientoRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IAuditoriaRepository _auditoriaRepository;

        public MantenimientoRepository(ApplicationDbContext context, IAuditoriaRepository auditoriaRepository)
        {
            _context = context;
            _auditoriaRepository = auditoriaRepository;
        }

        public async Task<bool> IniciarMantenimientoAsync(MantenimientoCreateDTO dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. BUSCAR EL ARTÍCULO (Usando ToList para evitar el FETCH FIRST de Oracle 10g)
                var listaArticulos = await _context.Articulos
                    .Where(a => a.IdArticulo == dto.IdArticulo)
                    .ToListAsync();

                var articulo = listaArticulos.FirstOrDefault();

                // Permitimos reportar fallo sin importar el estado actual (la validación rigurosa se hace al aceptar)
                if (articulo == null)
                {
                    throw new InvalidOperationException("El artículo del préstamo no existe.");
                }

                // 2. Crear la entidad de mantenimiento como reporte pendiente
                var mantenimiento = new Mantenimiento(dto.IdArticulo, dto.Tipo, dto.ProveedorTecnico, dto.Descripcion);

                await InsertarMantenimientoAsync(mantenimiento);

                await _auditoriaRepository.RegistrarAccionAsync(new AuditoriaCreateDTO
                {
                    IdUsuario = dto.IdUsuarioActor,
                    TablaAfectada = "MANTENIMIENTOS",
                    IdRegistroAfectado = dto.IdArticulo,
                    Accion = "INSERT",
                    DetallesCambio = $"Reporte de mantenimiento creado para artículo ID={dto.IdArticulo}. Tipo={dto.Tipo}"
                });

                await transaction.CommitAsync();
                return true;
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> FinalizarMantenimientoAsync(MantenimientoFinDTO dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Recuperamos solo el ID_ARTICULO para evitar hidratar columnas problemáticas en Oracle.
                var idArticulo = await ObtenerIdArticuloPorMantenimientoAsync(dto.IdMantenimiento);
                if (!idArticulo.HasValue) return false;

                var estadoMantenimiento = await ObtenerEstadoMantenimientoAsync(dto.IdMantenimiento);
                if (estadoMantenimiento != EstadoMantenimiento.En_progreso)
                    return false;

                // 2. Actualizar mantenimiento con SQL Crudo (Más seguro para 10g)
                // Usamos concatenación simple para la descripción para evitar líos de sintaxis
                await FinalizarMantenimientoEnBdAsync(dto.IdMantenimiento, dto.Costo);

                // 3. Liberar el artículo (Volver a 'Disponible')
                await _context.Database.ExecuteSqlRawAsync(
                    "UPDATE ARTICULOS SET ESTADO = 'Disponible' WHERE ID_ARTICULO = {0}",
                    idArticulo.Value);

                await _auditoriaRepository.RegistrarAccionAsync(new AuditoriaCreateDTO
                {
                    IdUsuario = dto.IdUsuarioActor,
                    TablaAfectada = "MANTENIMIENTOS",
                    IdRegistroAfectado = dto.IdMantenimiento,
                    Accion = "UPDATE",
                    DetallesCambio = $"Mantenimiento finalizado. ID={dto.IdMantenimiento}, Artículo ID={idArticulo.Value}, Costo={dto.Costo}"
                });

                await transaction.CommitAsync();
                return true;
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                return false;
            }
        }

        private async Task<int?> ObtenerIdArticuloPorMantenimientoAsync(int idMantenimiento)
        {
            // Usamos ToListAsync + FirstOrDefault para evitar que EF genere FETCH FIRST (incompatible con Oracle 10g)
            var lista = await _context.Mantenimientos
                .Where(m => m.IdMantenimiento == idMantenimiento)
                .Select(m => (int?)m.IdArticulo)
                .ToListAsync();

            return lista.FirstOrDefault();
        }

        private async Task<EstadoMantenimiento?> ObtenerEstadoMantenimientoAsync(int idMantenimiento)
        {
            var lista = await _context.Mantenimientos
                .Where(m => m.IdMantenimiento == idMantenimiento)
                .Select(m => (EstadoMantenimiento?)m.Estado)
                .ToListAsync();

            return lista.FirstOrDefault();
        }

        public async Task<IEnumerable<object>> ObtenerMantenimientosActivosAsync()
        {
            // Oracle 10g falla al materializar toda la entidad; leemos solo columnas necesarias.
            const string sql = @"
                SELECT
                    m.ID_MANTENIMIENTO,
                    a.NOMBRE AS ARTICULO,
                    m.TIPO,
                    m.PROVEEDOR_TECNICO,
                    m.FECHA_INICIO
                FROM MANTENIMIENTOS m
                INNER JOIN ARTICULOS a ON a.ID_ARTICULO = m.ID_ARTICULO
                WHERE m.ESTADO_MANTENIMIENTO = :p_estado
                ORDER BY m.FECHA_INICIO DESC";

            var connection = _context.Database.GetDbConnection();
            var wasClosed = connection.State != ConnectionState.Open;

            if (wasClosed)
                await connection.OpenAsync();

            try
            {
                await using var command = connection.CreateCommand();
                command.CommandText = sql;
                command.Transaction = _context.Database.CurrentTransaction?.GetDbTransaction();

                var estadoParam = command.CreateParameter();
                estadoParam.ParameterName = "p_estado";
                estadoParam.Value = EstadoMantenimiento.En_progreso.ToString();
                command.Parameters.Add(estadoParam);

                var resultado = new List<object>();

                await using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    resultado.Add(new
                    {
                        IdMantenimiento = reader.GetInt32(0),
                        Articulo = reader.IsDBNull(1) ? string.Empty : reader.GetString(1),
                        Tipo = reader.IsDBNull(2) ? string.Empty : reader.GetString(2),
                        ProveedorTecnico = reader.IsDBNull(3) ? null : reader.GetString(3),
                        FechaInicio = reader.IsDBNull(4) ? (DateTime?)null : reader.GetDateTime(4)
                    });
                }

                return resultado;
            }
            finally
            {
                if (wasClosed)
                    await connection.CloseAsync();
            }
        }

        public async Task<IEnumerable<object>> ObtenerTodosLosMantenimientosAsync()
        {
            // Oracle 10g falla con NUMBER(10,2); usamos raw SQL con CAST como workaround
            const string sql = @"
                SELECT
                    m.ID_MANTENIMIENTO,
                    a.NOMBRE AS ARTICULO,
                    m.TIPO,
                    m.PROVEEDOR_TECNICO,
                    m.DESCRIPCION,
                    m.FECHA_INICIO,
                    m.FECHA_FIN,
                    CAST(m.COSTO AS VARCHAR2(20)) AS COSTO,
                    CAST(m.ESTADO_MANTENIMIENTO AS VARCHAR2(50)) AS ESTADO,
                    m.ID_ARTICULO
                FROM MANTENIMIENTOS m
                INNER JOIN ARTICULOS a ON a.ID_ARTICULO = m.ID_ARTICULO
                ORDER BY m.FECHA_INICIO DESC";

            var connection = _context.Database.GetDbConnection();
            var wasClosed = connection.State != ConnectionState.Open;

            if (wasClosed)
                await connection.OpenAsync();

            try
            {
                await using var command = connection.CreateCommand();
                command.CommandText = sql;
                command.Transaction = _context.Database.CurrentTransaction?.GetDbTransaction();

                var resultado = new List<object>();

                await using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var costoStr = reader.IsDBNull(7) ? null : reader.GetString(7);
                    decimal? costo = null;
                    if (!string.IsNullOrEmpty(costoStr) && decimal.TryParse(costoStr, out var costoValue))
                        costo = costoValue;

                    resultado.Add(new
                    {
                        IdMantenimiento = reader.GetInt32(0),
                        Articulo = reader.IsDBNull(1) ? string.Empty : reader.GetString(1),
                        Tipo = reader.IsDBNull(2) ? string.Empty : reader.GetString(2),
                        ProveedorTecnico = reader.IsDBNull(3) ? null : reader.GetString(3),
                        Descripcion = reader.IsDBNull(4) ? null : reader.GetString(4),
                        FechaInicio = reader.IsDBNull(5) ? (DateTime?)null : reader.GetDateTime(5),
                        FechaFin = reader.IsDBNull(6) ? (DateTime?)null : reader.GetDateTime(6),
                        Costo = costo,
                        Estado = reader.IsDBNull(8) ? string.Empty : reader.GetString(8),
                        IdArticulo = reader.IsDBNull(9) ? 0 : reader.GetInt32(9)
                    });
                }

                return resultado;
            }
            finally
            {
                if (wasClosed)
                    await connection.CloseAsync();
            }
        }

        private async Task InsertarMantenimientoAsync(Mantenimiento mantenimiento)
        {
            const string sql = @"
                INSERT INTO MANTENIMIENTOS
                    (ID_ARTICULO, TIPO, PROVEEDOR_TECNICO, DESCRIPCION, FECHA_INICIO, ESTADO_MANTENIMIENTO)
                VALUES
                    ({0}, {1}, {2}, {3}, {4}, 'Pendiente')";

            await _context.Database.ExecuteSqlRawAsync(
                sql,
                mantenimiento.IdArticulo,
                mantenimiento.Tipo,
                mantenimiento.ProveedorTecnico ?? string.Empty,
                mantenimiento.Descripcion ?? string.Empty,
                mantenimiento.FechaInicio);
        }

        private async Task FinalizarMantenimientoEnBdAsync(int idMantenimiento, decimal costo)
        {
            const string sql = @"
                UPDATE MANTENIMIENTOS SET 
                    FECHA_FIN = {0},
                    COSTO = {1},
                    ESTADO_MANTENIMIENTO = 'Finalizado'
                WHERE ID_MANTENIMIENTO = {2}";

            await _context.Database.ExecuteSqlRawAsync(
                sql,
                DateTime.Now,
                costo,
                idMantenimiento);
        }

        // El admin acepta el mantenimiento y pasa de Pendiente a En_progreso
        public async Task<bool> AceptarMantenimientoAsync(int idMantenimiento, int idUsuarioActor)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var idArticulo = await ObtenerIdArticuloPorMantenimientoAsync(idMantenimiento);
                if (!idArticulo.HasValue)
                    throw new InvalidOperationException("No se pudo identificar el artículo asociado al reporte.");

                var articulosList = await _context.Articulos
                    .Where(a => a.IdArticulo == idArticulo.Value)
                    .Select(a => new { a.IdArticulo, a.Estado })
                    .ToListAsync();
                var articulo = articulosList.FirstOrDefault();

                if (articulo == null || articulo.Estado != EstadoArticulo.Disponible)
                    throw new InvalidOperationException("El artículo todavía sigue prestado. Debe devolverse antes de aceptar el reporte.");

                const string sql = @"
                    UPDATE MANTENIMIENTOS SET 
                        ESTADO_MANTENIMIENTO = 'En_progreso'
                    WHERE ID_MANTENIMIENTO = {0}
                      AND ESTADO_MANTENIMIENTO = 'Pendiente'";

                var filasActualizadas = await _context.Database.ExecuteSqlRawAsync(
                    sql,
                    idMantenimiento);

                if (filasActualizadas == 0)
                    throw new InvalidOperationException("El reporte no está en estado Pendiente o ya fue procesado.");

                await _context.Database.ExecuteSqlRawAsync(
                    "UPDATE ARTICULOS SET ESTADO = 'Mantenimiento' WHERE ID_ARTICULO = {0}",
                    idArticulo.Value);

                await _auditoriaRepository.RegistrarAccionAsync(new AuditoriaCreateDTO
                {
                    IdUsuario = idUsuarioActor,
                    TablaAfectada = "MANTENIMIENTOS",
                    IdRegistroAfectado = idMantenimiento,
                    Accion = "UPDATE",
                    DetallesCambio = $"Mantenimiento aceptado. ID={idMantenimiento}. Estado: Pendiente → En_progreso"
                });

                await transaction.CommitAsync();
                return true;
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // El admin rechaza el mantenimiento y vuelve a poner disponible el artículo
        public async Task<bool> RechazarMantenimientoAsync(int idMantenimiento, int idUsuarioActor)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Obtener el ID del artículo
                var idArticulo = await ObtenerIdArticuloPorMantenimientoAsync(idMantenimiento);
                if (!idArticulo.HasValue)
                    return false;

                // 2. Actualizar estado del mantenimiento a Rechazado
                const string sqlMant = @"
                    UPDATE MANTENIMIENTOS SET 
                        FECHA_FIN = {0},
                        ESTADO_MANTENIMIENTO = 'Rechazado'
                    WHERE ID_MANTENIMIENTO = {1}
                      AND ESTADO_MANTENIMIENTO = 'Pendiente'";

                var filasActualizadas = await _context.Database.ExecuteSqlRawAsync(
                    sqlMant,
                    DateTime.Now,
                    idMantenimiento);

                if (filasActualizadas == 0)
                    return false;

                await _auditoriaRepository.RegistrarAccionAsync(new AuditoriaCreateDTO
                {
                    IdUsuario = idUsuarioActor,
                    TablaAfectada = "MANTENIMIENTOS",
                    IdRegistroAfectado = idMantenimiento,
                    Accion = "UPDATE",
                    DetallesCambio = $"Reporte de mantenimiento rechazado. ID={idMantenimiento}."
                });

                await transaction.CommitAsync();
                return true;
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                return false;
            }
        }

        private DbParameter CrearParametro(DbType dbType, object? value)
        {
            var parameter = _context.Database.GetDbConnection().CreateCommand().CreateParameter();
            parameter.DbType = dbType;
            parameter.Value = value ?? DBNull.Value;
            return parameter;
        }
    }
}