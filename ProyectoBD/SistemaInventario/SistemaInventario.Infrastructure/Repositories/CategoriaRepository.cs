using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using SistemaInventario.Application.DTOs;
using SistemaInventario.Application.Interfaces;
using SistemaInventario.Infrastructure.Persistence;
using SistemaInventario.Domain.Entities;

namespace SistemaInventario.Infrastructure.Repositories
{
    public class CategoriaRepository : ICategoriaRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IAuditoriaRepository _auditoriaRepository;

        public CategoriaRepository(ApplicationDbContext context, IAuditoriaRepository auditoriaRepository)
        {
            _context = context;
            _auditoriaRepository = auditoriaRepository;
        }

        // 1. Obtener todas (Igual que el catálogo de artículos)
        public async Task<IEnumerable<CategoriaDTO>> ObtenerTodasAsync()
        {
            return await _context.Categorias
                .AsNoTracking()
                .Select(c => new CategoriaDTO
                {
                    IdCategoria = c.IdCategoria,
                    Nombre = c.NombreCategoria
                }).ToListAsync();
        }

        // 2. Crear Manual (Como el de Usuarios)
        public async Task<int> CrearManualAsync(string nombre, int idUsuarioActor)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var nuevoId = await ObtenerSiguienteIdCategoriaAsync();

                var sql = @"INSERT INTO CATEGORIAS (ID_CATEGORIA, NOMBRE_CATEGORIA)
                            VALUES ({0}, {1})";

                var affected = await _context.Database.ExecuteSqlRawAsync(sql, nuevoId, nombre);

                if (affected > 0)
                {
                    await _auditoriaRepository.RegistrarAccionAsync(new AuditoriaCreateDTO
                    {
                        IdUsuario = idUsuarioActor,
                        TablaAfectada = "CATEGORIAS",
                        IdRegistroAfectado = nuevoId,
                        Accion = "INSERT",
                        DetallesCambio = $"Nueva categoría creada: {nombre}"
                    });
                }

                await transaction.CommitAsync();
                return affected;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // 3. Eliminar Manual (Como el de Artículos)
        public async Task<int> EliminarManualAsync(int id, int idUsuarioActor)
        {
            var sql = "DELETE FROM CATEGORIAS WHERE ID_CATEGORIA = {0}";
            var affected = await _context.Database.ExecuteSqlRawAsync(sql, id);

            if (affected > 0)
            {
                await _auditoriaRepository.RegistrarAccionAsync(new AuditoriaCreateDTO
                {
                    IdUsuario = idUsuarioActor,
                    TablaAfectada = "CATEGORIAS",
                    IdRegistroAfectado = id,
                    Accion = "DELETE",
                    DetallesCambio = $"Categoría eliminada. ID={id}"
                });
            }

            return affected;
        }

        private async Task<int> ObtenerSiguienteIdCategoriaAsync()
        {
            const string sql = @"SELECT NVL(MAX(ID_CATEGORIA), 0) + 1 FROM CATEGORIAS";

            var connection = _context.Database.GetDbConnection();
            var wasClosed = connection.State != System.Data.ConnectionState.Open;

            if (wasClosed)
                await connection.OpenAsync();

            try
            {
                await using var command = connection.CreateCommand();
                command.CommandText = sql;
                command.Transaction = _context.Database.CurrentTransaction?.GetDbTransaction();

                var result = await command.ExecuteScalarAsync();
                if (result == null || result == DBNull.Value)
                    return 1;

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