using SistemaInventario.Application.DTOs;
namespace SistemaInventario.Application.Interfaces
{
    public interface IRolRepository
    {
        Task<IEnumerable<RolDTO>> ObtenerTodosAsync();

    }
}
