using SistemaInventario.Application.DTOs;

namespace SistemaInventario.Application.Interfaces
{
    public interface INotificacionRepository
    {
        Task<bool> CrearNotificacionAsync(NotificacionCreateDTO dto);
        Task<IEnumerable<object>> ObtenerPendientesAsync();
        Task<bool> MarcarComoEnviadaAsync(int idNotificacion);
        // El "plus": Buscar préstamos vencidos para generar alertas automáticas
        Task GenerarAlertasVencimientoAsync();
    }
}