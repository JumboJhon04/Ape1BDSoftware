using SistemaInventario.Application.DTOs;
using SistemaInventario.Domain.Entities;

namespace SistemaInventario.Application.Interfaces
{
    public interface IUsuarioRepository
    {
        Task<IEnumerable<UsuarioDTO>> ObtenerTodosAsync();
        Task<Usuario?> ObtenerPorIdAsync(int id);
        // Para el 10g usamos el mismo truco del SQL manual si el driver se pone espeso
        Task<int> RegistrarManualAsync(string cedula, Usuario usuario, int idUsuarioActor);
        Task<int> ActualizarManualAsync(int id, string cedula, Usuario usuario, string estado, int idUsuarioActor);
        Task<int> EliminarManualAsync(int id, int idUsuarioActor);
        Task GuardarCambiosAsync();
    }
}