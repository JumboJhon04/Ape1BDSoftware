namespace SistemaInventario.Application.DTOs
{
    public class AuthTokenResponseDTO
    {
        public string Token { get; set; } = string.Empty;
        public int ExpiresIn { get; set; }
        public int IdUsuario { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Rol { get; set; } = string.Empty;
    }
}
