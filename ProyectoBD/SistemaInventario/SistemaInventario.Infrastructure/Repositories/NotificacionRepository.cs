using Microsoft.EntityFrameworkCore;
using SistemaInventario.Application.DTOs;
using SistemaInventario.Application.Interfaces;
using SistemaInventario.Infrastructure.Persistence;

namespace SistemaInventario.Infrastructure.Repositories
{
    public class NotificacionRepository : INotificacionRepository
    {
        private readonly ApplicationDbContext _context;

        public NotificacionRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> CrearNotificacionAsync(NotificacionCreateDTO dto)
        {
            var sql = @"INSERT INTO NOTIFICACIONES (ID_PRESTAMO, MENSAJE, ESTADO_ENVIO) 
                        VALUES ({0}, {1}, 'Pendiente')";
            await _context.Database.ExecuteSqlRawAsync(sql, dto.IdPrestamo, dto.Mensaje);
            return true;
        }

        public async Task GenerarAlertasVencimientoAsync()
        {
            // Buscamos préstamos que: 1. No se han devuelto y 2. Ya pasó la fecha prevista
            // Usamos SQL crudo para que Oracle 10g maneje bien las fechas
            var sqlVencidos = @"SELECT ID_PRESTAMO FROM PRESTAMOS 
                                WHERE ESTADO_PRESTAMO = 'ACTIVO' 
                                AND FECHA_PREVISTA < SYSDATE";

            // Esto es lógica pura: si hay vencidos, insertamos notificación
            var prestamosVencidos = await _context.Database.SqlQueryRaw<int>(sqlVencidos).ToListAsync();

            foreach (var id in prestamosVencidos)
            {
                await CrearNotificacionAsync(new NotificacionCreateDTO
                {
                    IdPrestamo = id,
                    Mensaje = "¡Alerta! El plazo de devolución ha vencido. Por favor, acercarse a la bodega."
                });
            }
        }

        public async Task<IEnumerable<object>> ObtenerPendientesAsync()
        {
            // Join simple en memoria para evitar ORA-00933
            var notis = await _context.Set<Domain.Entities.Notificacion>()
                .Where(n => n.EstadoEnvio == "Pendiente").ToListAsync();

            return notis;
        }

        public async Task<bool> MarcarComoEnviadaAsync(int idNotificacion)
        {
            var sql = "UPDATE NOTIFICACIONES SET ESTADO_ENVIO = 'Enviado' WHERE ID_NOTIFICACION = {0}";
            await _context.Database.ExecuteSqlRawAsync(sql, idNotificacion);
            return true;
        }
    }
}