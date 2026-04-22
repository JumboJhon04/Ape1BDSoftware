namespace SistemaInventario.Application.DTOs
{
    public class ArticuloCreateDTO
    {
        public int IdUsuarioActor { get; set; }
        public string Codigo { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string? Marca { get; set; }
        public string? Modelo { get; set; }
        public string? NumeroSerie { get; set; }
        public string? DescripcionTecnica { get; set; }
        public string? ObservacionesFisicas { get; set; }
        public int IdCategoria { get; set; }
        public int IdUbicacion { get; set; }
        public int IdResponsable { get; set; }
    }
}