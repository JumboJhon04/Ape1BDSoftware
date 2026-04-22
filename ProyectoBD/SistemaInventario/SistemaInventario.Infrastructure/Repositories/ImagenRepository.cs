using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using SistemaInventario.Application.DTOs;
using SistemaInventario.Application.Interfaces;
using SistemaInventario.Infrastructure.Persistence;

namespace SistemaInventario.Infrastructure.Repositories
{
    public class ImagenRepository : IImagenRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IAuditoriaRepository _auditoria;

        public ImagenRepository(ApplicationDbContext context, IAuditoriaRepository auditoria)
        {
            _context = context;
            _auditoria = auditoria;
        }

        public async Task<bool> SubirImagenAsync(ImagenArticuloDTO dto)
        {
            try
            {
                var sql = @"INSERT INTO IMAGEN_ARTICULO (ID_ARTICULO, URL_IMAGEN) 
                            VALUES ({0}, {1})";

                await _context.Database.ExecuteSqlRawAsync(sql, dto.IdArticulo, dto.UrlImagen);

                // Auditamos la acción
                await _auditoria.RegistrarAccionAsync(new AuditoriaCreateDTO
                {
                    IdUsuario = 1, // ID temporal del admin
                    TablaAfectada = "IMAGEN_ARTICULO",
                    IdRegistroAfectado = dto.IdArticulo,
                    Accion = "INSERT",
                    DetallesCambio = "Se agregó una nueva imagen desde Cloudinary"
                });

                return true;
            }
            catch { return false; }
        }

        public async Task<IEnumerable<object>> ObtenerImagenesPorArticuloAsync(int idArticulo)
        {
            const string sql = @"SELECT ID_IMAGEN, URL_IMAGEN
                                 FROM IMAGEN_ARTICULO
                                 WHERE ID_ARTICULO = :p_id_articulo
                                 ORDER BY ID_IMAGEN DESC";

            var results = new List<object>();
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
                parameter.ParameterName = "p_id_articulo";
                parameter.Value = idArticulo;
                command.Parameters.Add(parameter);

                await using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    results.Add(new
                    {
                        IdImagen = reader.IsDBNull(0) ? 0 : reader.GetInt32(0),
                        UrlImagen = reader.IsDBNull(1) ? string.Empty : reader.GetString(1)
                    });
                }

                return results;
            }
            finally
            {
                if (wasClosed)
                    await connection.CloseAsync();
            }
        }

        public async Task<bool> EliminarImagenAsync(int idImagen)
        {
            try
            {
                await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM IMAGEN_ARTICULO WHERE ID_IMAGEN = {0}", idImagen);
                return true;
            }
            catch { return false; }
        }
    }
}