using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using SistemaInventario.Application.DTOs;
using SistemaInventario.Application.Interfaces;
using SistemaInventario.Infrastructure.Persistence;

namespace SistemaInventario.Infrastructure.Repositories
{
    public class DepartamentoRepository : IDepartamentoRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IAuditoriaRepository _auditoriaRepository;

        public DepartamentoRepository(ApplicationDbContext context, IAuditoriaRepository auditoriaRepository)
        {
            _context = context;
            _auditoriaRepository = auditoriaRepository;
        }

        public async Task<IEnumerable<DepartamentoDTO>> ObtenerTodosAsync()
        {
            return await _context.Departamentos
                .AsNoTracking()
                .Select(d => new DepartamentoDTO
                {
                    IdDepartamento = d.IdDepartamento,
                    NombreDepartamento = d.NombreDepartamento
                }).ToListAsync();
        }

        public async Task<int> CrearManualAsync(string nombre, int idUsuarioActor)
        {
            var sql = @"INSERT INTO DEPARTAMENTOS (NOMBRE_DEPARTAMENTO) VALUES ({0})";
            var affected = await _context.Database.ExecuteSqlRawAsync(sql, nombre);

            if (affected > 0)
            {
                var idDepartamentoCreado = await ObtenerIdDepartamentoCreadoAsync(nombre);

                await _auditoriaRepository.RegistrarAccionAsync(new AuditoriaCreateDTO
                {
                    IdUsuario = idUsuarioActor,
                    TablaAfectada = "DEPARTAMENTOS",
                    IdRegistroAfectado = idDepartamentoCreado ?? 0,
                    Accion = "INSERT",
                    DetallesCambio = $"Nuevo departamento creado: {nombre}"
                });
            }

            return affected;
        }

        public async Task<int> EliminarManualAsync(int id, int idUsuarioActor)
        {
            var sql = "DELETE FROM DEPARTAMENTOS WHERE ID_DEPARTAMENTO = {0}";
            var affected = await _context.Database.ExecuteSqlRawAsync(sql, id);

            if (affected > 0)
            {
                await _auditoriaRepository.RegistrarAccionAsync(new AuditoriaCreateDTO
                {
                    IdUsuario = idUsuarioActor,
                    TablaAfectada = "DEPARTAMENTOS",
                    IdRegistroAfectado = id,
                    Accion = "DELETE",
                    DetallesCambio = $"Departamento eliminado. ID={id}"
                });
            }

            return affected;
        }

        private async Task<int?> ObtenerIdDepartamentoCreadoAsync(string nombre)
        {
            const string sql = @"SELECT ID_DEPARTAMENTO
                                 FROM (
                                     SELECT ID_DEPARTAMENTO
                                     FROM DEPARTAMENTOS
                                     WHERE NOMBRE_DEPARTAMENTO = :p_nombre
                                     ORDER BY ID_DEPARTAMENTO DESC
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

                var parameter = command.CreateParameter();
                parameter.ParameterName = "p_nombre";
                parameter.Value = nombre;
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
    }
}