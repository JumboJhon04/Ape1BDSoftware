namespace SistemaInventario.Application.DTOs
{
    public class MantenimientoCreateDTO
    {
        public int IdUsuarioActor { get; set; }
        public int IdArticulo { get; set; }
        public string Tipo { get; set; } = string.Empty; // Preventivo o Correctivo
        public string? ProveedorTecnico { get; set; }
        public string? Descripcion { get; set; }
    }
}