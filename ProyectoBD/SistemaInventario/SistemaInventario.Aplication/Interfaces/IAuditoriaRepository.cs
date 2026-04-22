using SistemaInventario.Application.DTOs;

namespace SistemaInventario.Application.Interfaces
{
    public interface IAuditoriaRepository
    {
        // El método estrella para guardar el rastro
        Task RegistrarAccionAsync(AuditoriaCreateDTO dto);

        // Para que el SuperAdmin vea qué han hecho los demás
        Task<IEnumerable<object>> ObtenerLogCompletoAsync();
    }
}