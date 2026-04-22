namespace SistemaInventario.Application.DTOs
{
    public class MantenimientoFinDTO
    {
        public int IdUsuarioActor { get; set; }
        public int IdMantenimiento { get; set; }
        public decimal Costo { get; set; }
        public string? NotasFinales { get; set; }
    }
}