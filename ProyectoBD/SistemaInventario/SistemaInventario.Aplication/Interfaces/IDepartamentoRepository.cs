using SistemaInventario.Application.DTOs;

namespace SistemaInventario.Application.Interfaces
{
    public interface IDepartamentoRepository
    {
        Task<IEnumerable<DepartamentoDTO>> ObtenerTodosAsync();
        Task<int> CrearManualAsync(string nombre, int idUsuarioActor);
        Task<int> EliminarManualAsync(int id, int idUsuarioActor);
    }
}