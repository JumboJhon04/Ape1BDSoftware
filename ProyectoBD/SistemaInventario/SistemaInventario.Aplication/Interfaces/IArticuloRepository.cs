using SistemaInventario.Application.DTOs;
using SistemaInventario.Domain.Entities;
namespace SistemaInventario.Application.Interfaces
{
    public interface IArticuloRepository
    {
        // Para el GET que ya tienes
        Task<IEnumerable<ArticuloDTO>> ObtenerCatalogoAsync();

        // Para buscar un equipo específico antes de editar o borrar
        Task<Articulo?> ObtenerPorIdAsync(int id);

        // Para el RF01: Registro de nuevos equipos
        Task AgregarAsync(Articulo articulo);

        // Insercion manual para compatibilidad con Oracle 10g
        Task<int> CrearManualAsync(Articulo articulo, int idUsuarioActor);

        // Para actualizar estados (Disponible, Mantenimiento, etc.)
        void Actualizar(Articulo articulo);

        Task<int> ActualizarManualAsync(
            int id,
            Articulo articulo,
            string estado,
            int idUsuarioActor);

        // Para dar de baja equipos
        Task<int> EliminarManualAsync(int id, int idUsuarioActor);

        // El que hace el COMMIT en Oracle
        Task GuardarCambiosAsync();
    }
}