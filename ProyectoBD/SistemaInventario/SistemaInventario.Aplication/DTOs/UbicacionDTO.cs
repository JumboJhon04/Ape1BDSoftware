namespace SistemaInventario.Application.DTOs
{
    public class UbicacionDTO
    {
        public int IdUbicacion { get; set; }
        public string NombreEspacio { get; set; } = string.Empty;
        public int? IdDepartamento { get; set; }
    }
}