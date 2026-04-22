namespace SistemaInventario.Application.DTOs
{
    public class UsuarioDTO
    {
        public int IdUsuario { get; set; }
        public string Cedula { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public int IdRol { get; set; }
        public string? NombreRol { get; set; } // Para mostrar en el GET
        public string Estado { get; set; } = "Activo";
    }
}