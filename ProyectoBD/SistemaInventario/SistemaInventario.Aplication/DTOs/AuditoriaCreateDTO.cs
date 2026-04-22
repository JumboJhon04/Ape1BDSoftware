namespace SistemaInventario.Application.DTOs
{
    public class AuditoriaCreateDTO
    {
        public int IdUsuario { get; set; }
        public string TablaAfectada { get; set; } = string.Empty;
        public int IdRegistroAfectado { get; set; }
        public string Accion { get; set; } = string.Empty;
        public string DetallesCambio { get; set; } = string.Empty;
    }
}