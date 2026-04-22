namespace SistemaInventario.Application.DTOs
{
    public class PrestamoCreateDTO
    {
        public int IdUsuario { get; set; }
        public DateTime FechaPrevista { get; set; }
        // 🚩 Esta lista es clave: son los IDs de los equipos que se presta
        public List<int> ArticulosIds { get; set; } = new List<int>();
    }
}