using SistemaInventario.Application.DTOs;

namespace SistemaInventario.Application.Interfaces
{
    public interface IMovimientoRepository
    {
        Task<bool> RegistrarMovimientoAsync(MovimientoCreateDTO dto);
        Task<IEnumerable<object>> ObtenerHistorialMovimientosAsync();
    }
}