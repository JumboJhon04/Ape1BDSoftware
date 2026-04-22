namespace SistemaInventario.Application.DTOs
{
    public class UsuarioCreateDTO
    {
        public int IdUsuarioActor { get; set; }
        public string Cedula { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty; // Encriptada luego, por ahora string
        public int IdRol { get; set; }
    }
}