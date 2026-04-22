namespace SistemaInventario.Application.Interfaces
{
    public interface IReporteRepository
    {
        Task<object> ObtenerResumenGeneralAsync();
        Task<IEnumerable<object>> ObtenerInventarioPorCategoriaAsync();
        Task<IEnumerable<object>> ObtenerInventarioPorUbicacionAsync();
        Task<IEnumerable<object>> ObtenerPrestamosPorEstadoAsync();
        Task<IEnumerable<object>> ObtenerPrestamosVencidosAsync(DateTime fechaCorte);
        Task<IEnumerable<object>> ObtenerMantenimientosPorEstadoAsync();
        Task<IEnumerable<object>> ObtenerTopArticulosMasMovidosAsync(int top);
    }
}
