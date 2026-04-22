using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using SistemaInventario.Application.DTOs;
using SistemaInventario.Application.Interfaces;
using SistemaInventario.Domain.Entities;
using SistemaInventario.Infrastructure.Persistence;

namespace SistemaInventario.Infrastructure.Repositories
{
    public class UbicacionRepository : IUbicacionRepository {
        private readonly ApplicationDbContext _context;
        private readonly IAuditoriaRepository _auditoriaRepository;

        public UbicacionRepository(ApplicationDbContext context, IAuditoriaRepository auditoriaRepository)
        {
            _context = context;
            _auditoriaRepository = auditoriaRepository;
        }

        // 1. Obtener todas las ubicaciones de la FISEI
        public async Task<IEnumerable<UbicacionDTO>> ObtenerTodasAsync()
        {
            return await _context.Ubicaciones
                .AsNoTracking()
                .Select(u => new UbicacionDTO
                {
                    IdUbicacion = u.IdUbicacion,
                    NombreEspacio = u.NombreEspacio, // Este 'Nombre' en C# mapea a 'NOMBRE_ESPACIO'
                    IdDepartamento = u.IdDepartamento
                }).ToListAsync();
        }

        // 2. Crear nueva ubicación con los campos exactos
        public async Task<int> CrearManualAsync(string nombre, int idDepartamento, int idUsuarioActor)
        {
            // Usamos NOMBRE_ESPACIO e ID_DEPARTAMENTO según tu diagrama
            var sql = @"INSERT INTO UBICACIONES (NOMBRE_ESPACIO, ID_DEPARTAMENTO) 
                VALUES ({0}, {1})";

            var affected = await _context.Database.ExecuteSqlRawAsync(sql, nombre, idDepartamento);

            if (affected > 0)
            {
                var idUbicacionCreada = await ObtenerIdUbicacionCreadaAsync(nombre, idDepartamento);

                await _auditoriaRepository.RegistrarAccionAsync(new AuditoriaCreateDTO
                {
                    IdUsuario = idUsuarioActor,
                    TablaAfectada = "UBICACIONES",
                    IdRegistroAfectado = idUbicacionCreada ?? 0,
                    Accion = "INSERT",
                    DetallesCambio = $"Nueva ubicación creada: {nombre} (Departamento ID={idDepartamento})"
                });
            }

            return affected;
        }

        // 3. Eliminar por ID
        public async Task<int> EliminarManualAsync(int id, int idUsuarioActor)
        {
            var sql = "DELETE FROM UBICACIONES WHERE ID_UBICACION = {0}";
            var affected = await _context.Database.ExecuteSqlRawAsync(sql, id);

            if (affected > 0)
            {
                await _auditoriaRepository.RegistrarAccionAsync(new AuditoriaCreateDTO
                {
                    IdUsuario = idUsuarioActor,
                    TablaAfectada = "UBICACIONES",
                    IdRegistroAfectado = id,
                    Accion = "DELETE",
                    DetallesCambio = $"Ubicación eliminada. ID={id}"
                });
            }

            return affected;
        }

        // 4. Buscar una sola ubicación
        public async Task<UbicacionDTO?> ObtenerPorIdAsync(int id)
        {
            var lista = await _context.Ubicaciones
               .Where(u => u.IdUbicacion == id)
               .Select(u => new UbicacionDTO
               {
                   IdUbicacion = u.IdUbicacion,
                   NombreEspacio = u.NombreEspacio,
                   IdDepartamento = u.IdDepartamento
               }).ToListAsync();

            return lista.FirstOrDefault();
        }

        private async Task<int?> ObtenerIdUbicacionCreadaAsync(string nombre, int idDepartamento)
        {
            const string sql = @"SELECT ID_UBICACION
                                 FROM (
                                     SELECT ID_UBICACION
                                     FROM UBICACIONES
                                     WHERE NOMBRE_ESPACIO = :p_nombre
                                       AND ID_DEPARTAMENTO = :p_depto
                                     ORDER BY ID_UBICACION DESC
                                 )
                                 WHERE ROWNUM = 1";

            var connection = _context.Database.GetDbConnection();
            var wasClosed = connection.State != System.Data.ConnectionState.Open;

            if (wasClosed)
                await connection.OpenAsync();

            try
            {
                await using var command = connection.CreateCommand();
                command.CommandText = sql;
                command.Transaction = _context.Database.CurrentTransaction?.GetDbTransaction();

                var pNombre = command.CreateParameter();
                pNombre.ParameterName = "p_nombre";
                pNombre.Value = nombre;
                command.Parameters.Add(pNombre);

                var pDepto = command.CreateParameter();
                pDepto.ParameterName = "p_depto";
                pDepto.Value = idDepartamento;
                command.Parameters.Add(pDepto);

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
    }
}