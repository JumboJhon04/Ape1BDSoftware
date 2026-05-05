using SistemaInventario.Application.DTOs;

namespace SistemaInventario.Application.Interfaces
{
    public interface IMantenimientoRepository
    {
        Task<bool> IniciarMantenimientoAsync(MantenimientoCreateDTO dto);
        Task<bool> FinalizarMantenimientoAsync(MantenimientoFinDTO dto);
        Task<bool> AceptarMantenimientoAsync(int idMantenimiento, int idUsuarioActor);
        Task<bool> RechazarMantenimientoAsync(int idMantenimiento, int idUsuarioActor);
        Task<IEnumerable<object>> ObtenerMantenimientosActivosAsync();
        Task<IEnumerable<object>> ObtenerTodosLosMantenimientosAsync();
    }
}