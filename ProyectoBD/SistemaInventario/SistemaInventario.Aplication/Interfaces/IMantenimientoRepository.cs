using SistemaInventario.Application.DTOs;

namespace SistemaInventario.Application.Interfaces
{
    public interface IMantenimientoRepository
    {
        Task<bool> IniciarMantenimientoAsync(MantenimientoCreateDTO dto);
        Task<bool> FinalizarMantenimientoAsync(MantenimientoFinDTO dto);
        Task<IEnumerable<object>> ObtenerMantenimientosActivosAsync();
    }
}