namespace SistemaInventario.Application.DTOs
{
    public class NotificacionCreateDTO
    {
        public int IdPrestamo { get; set; }
        public string Mensaje { get; set; } = string.Empty;
    }
}