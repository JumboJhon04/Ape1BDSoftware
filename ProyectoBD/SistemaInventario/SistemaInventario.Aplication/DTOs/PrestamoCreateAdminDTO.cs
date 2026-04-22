namespace SistemaInventario.Application.DTOs
{
    public class PrestamoCreateAdminDTO
    {
        public int IdUsuario { get; set; }
        public int IdAdminAutoriza { get; set; }
        public DateTime FechaPrevista { get; set; }
        public List<int> ArticulosIds { get; set; } = new List<int>();
    }
}