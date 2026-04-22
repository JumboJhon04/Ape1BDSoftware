namespace SistemaInventario.Application.DTOs
{
    public class DepartamentoCreateDTO
    {
        public int IdUsuarioActor { get; set; }
        public string NombreDepartamento { get; set; } = string.Empty;
    }
}