namespace SistemaInventario.Application.DTOs
{
    public class UsuarioUpdateDTO
    {
        public int IdUsuarioActor { get; set; }
        public string Cedula { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public int IdRol { get; set; }
        public string Estado { get; set; } = "Activo";
    }
}