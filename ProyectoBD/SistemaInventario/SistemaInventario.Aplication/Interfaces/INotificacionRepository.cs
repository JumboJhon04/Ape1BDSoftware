using SistemaInventario.Application.DTOs;

namespace SistemaInventario.Application.Interfaces
{
    public interface INotificacionRepository
    {
        Task<bool> CrearNotificacionAsync(NotificacionCreateDTO dto);
        Task<IEnumerable<object>> ObtenerPendientesAsync(int idUsuario);
        Task<bool> MarcarComoEnviadaAsync(int idNotificacion);
        Task<int> EnviarPendientesAsync();
        Task<int> EnviarPendientesPorPrestamoAsync(int idPrestamo);
        // El "plus": Buscar préstamos vencidos para generar alertas automáticas
        Task GenerarAlertasVencimientoAsync();
    }
}