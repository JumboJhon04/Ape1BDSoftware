namespace SistemaInventario.Application.DTOs
{
    public class PrestamoDTO
    {
        public int IdPrestamo { get; set; }
        public string NombreUsuario { get; set; } = string.Empty;
        public DateTime? FechaSalida { get; set; }
        public DateTime FechaPrevista { get; set; }
        public DateTime? FechaDevolucionReal { get; set; }
        public string Estado { get; set; } = string.Empty;
        public int CantidadArticulos { get; set; }
        public string Articulos { get; set; } = string.Empty;
        public int? IdAdminAutoriza { get; set; }
        public string? NombreAdminAutoriza { get; set; }
        public List<int> IdArticulos { get; set; } = new List<int>();
    }
}