namespace SistemaInventario.Application.DTOs
{
    public class PrestamoDTO
    {
        public int IdPrestamo { get; set; }
        public string NombreUsuario { get; set; } = string.Empty;
        public DateTime? FechaSalida { get; set; }
        public DateTime FechaPrevista { get; set; }
        public string Estado { get; set; } = string.Empty;
        public int CantidadArticulos { get; set; }
        public string Articulos { get; set; } = string.Empty;
    }
}