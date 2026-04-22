using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using SistemaInventario.Application.DTOs;
using SistemaInventario.Application.Interfaces;
using SistemaInventario.Domain.Entities;
using SistemaInventario.Domain.Enums;
using SistemaInventario.Infrastructure.Persistence;
using System.Data;

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

                // 🚩 EL CANDADO: Si no existe o NO está Disponible, rebotamos la petición
                if (articulo == null || articulo.Estado != EstadoArticulo.Disponible)
                {
                    return false;
                }

                // 2. Crear la entidad de mantenimiento
                var mantenimiento = new Mantenimiento(dto.IdArticulo, dto.Tipo, dto.ProveedorTecnico, dto.Descripcion);

                var sqlInsert = @"INSERT INTO MANTENIMIENTOS (ID_ARTICULO, TIPO, PROVEEDOR_TECNICO, DESCRIPCION, FECHA_INICIO, ESTADO_MANTENIMIENTO) 
                         VALUES ({0}, {1}, {2}, {3}, {4}, 'En_progreso')";

                await _context.Database.ExecuteSqlRawAsync(sqlInsert,
                    mantenimiento.IdArticulo, mantenimiento.Tipo, mantenimiento.ProveedorTecnico,
                    mantenimiento.Descripcion, mantenimiento.FechaInicio);

                // 3. Bloquear el artículo
                await _context.Database.ExecuteSqlRawAsync(
                    "UPDATE ARTICULOS SET ESTADO = 'Mantenimiento' WHERE ID_ARTICULO = {0}",
                    dto.IdArticulo);

                await _auditoriaRepository.RegistrarAccionAsync(new AuditoriaCreateDTO
                {
                    IdUsuario = dto.IdUsuarioActor,
                    TablaAfectada = "MANTENIMIENTOS",
                    IdRegistroAfectado = dto.IdArticulo,
                    Accion = "INSERT",
                    DetallesCambio = $"Mantenimiento iniciado para artículo ID={dto.IdArticulo}. Tipo={dto.Tipo}"
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

        public async Task<bool> FinalizarMantenimientoAsync(MantenimientoFinDTO dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Recuperamos solo el ID_ARTICULO para evitar hidratar columnas problemáticas en Oracle.
                var idArticulo = await ObtenerIdArticuloPorMantenimientoAsync(dto.IdMantenimiento);
                if (!idArticulo.HasValue) return false;

                // 2. Actualizar mantenimiento con SQL Crudo (Más seguro para 10g)
                // Usamos concatenación simple para la descripción para evitar líos de sintaxis
                var sqlUpdateMant = @"UPDATE MANTENIMIENTOS SET 
                             FECHA_FIN = {0}, 
                             COSTO = {1}, 
                             ESTADO_MANTENIMIENTO = 'Finalizado'
                             WHERE ID_MANTENIMIENTO = {2}";

                await _context.Database.ExecuteSqlRawAsync(sqlUpdateMant,
                    DateTime.Now, dto.Costo, dto.IdMantenimiento);

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
            const string sql = @"SELECT ID_ARTICULO
                                 FROM MANTENIMIENTOS
                                 WHERE ID_MANTENIMIENTO = :p_id";

            var connection = _context.Database.GetDbConnection();
            var wasClosed = connection.State != System.Data.ConnectionState.Open;

            if (wasClosed)
                await connection.OpenAsync();

            try
            {
                await using var command = connection.CreateCommand();
                command.CommandText = sql;
                command.Transaction = _context.Database.CurrentTransaction?.GetDbTransaction();

                var parameter = command.CreateParameter();
                parameter.ParameterName = "p_id";
                parameter.Value = idMantenimiento;
                command.Parameters.Add(parameter);

                var result = await command.ExecuteScalarAsync();
                if (result == null || result == DBNull.Value)
                    return null;

                return Convert.ToInt32(result);
            }
            finally
            {
                if (wasClosed)
                    await connection.CloseAsync();
            }
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
    }
}