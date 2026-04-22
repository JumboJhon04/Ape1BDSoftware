namespace SistemaInventario.Application.DTOs
{
    public class MovimientoCreateDTO
    {
        public int IdArticulo { get; set; }
        public int IdUbicacionDestino { get; set; }
        public int IdUsuarioAutoriza { get; set; }
        public string Motivo { get; set; } = string.Empty;
    }
}