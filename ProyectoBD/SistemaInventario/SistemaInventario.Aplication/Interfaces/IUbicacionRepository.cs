
using SistemaInventario.Application.DTOs; // 👈 Deja solo este, que está bien escrito

namespace SistemaInventario.Application.Interfaces
{
    public interface IUbicacionRepository
    {
        // Para listar en los selectores del front de React
        Task<IEnumerable<UbicacionDTO>> ObtenerTodasAsync();

        // Para el mantenimiento de ubicaciones desde el panel de admin
        Task<int> CrearManualAsync(string nombreEspacio, int idDepartamento, int idUsuarioActor);
        // Para borrar espacios que ya no se usen (siempre que no tengan artículos)
        Task<int> EliminarManualAsync(int id, int idUsuarioActor);

        // Para buscar una específica (útil para el Editar)
        Task<UbicacionDTO?> ObtenerPorIdAsync(int id);
    }
}