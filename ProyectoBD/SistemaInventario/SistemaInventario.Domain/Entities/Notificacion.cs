using System.ComponentModel.DataAnnotations;

namespace SistemaInventario.Domain.Entities
{
    public class Notificacion
    {
        [Key]
        public int IdNotificacion { get; private set; }
        public int IdPrestamo { get; private set; }
        public string Mensaje { get; private set; } = string.Empty;
        public string EstadoEnvio { get; private set; } = "Pendiente"; // Pendiente, Enviado

        protected Notificacion() { }
        public Notificacion(int idPrestamo, string mensaje)
        {
            IdPrestamo = idPrestamo;
            Mensaje = mensaje;
        }
    }
}