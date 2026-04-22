using SistemaInventario.Application.DTOs;

public interface ICategoriaRepository
{
    Task<IEnumerable<CategoriaDTO>> ObtenerTodasAsync();
    Task<int> CrearManualAsync(string nombre, int idUsuarioActor);
    Task<int> EliminarManualAsync(int id, int idUsuarioActor);
}