using SistemaInventario.Application.DTOs;

namespace SistemaInventario.Application.Interfaces
{
    public interface IImagenRepository
    {
        Task<bool> SubirImagenAsync(ImagenArticuloDTO dto);
        Task<bool> EliminarImagenAsync(int idImagen);
        Task<IEnumerable<object>> ObtenerImagenesPorArticuloAsync(int idArticulo);
    }
}