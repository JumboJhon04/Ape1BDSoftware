using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaInventario.Application.Interfaces;

namespace SistemaInventario.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReportesController : ControllerBase
    {
        private readonly IReporteRepository _repository;

        public ReportesController(IReporteRepository repository)
        {
            _repository = repository;
        }

        [HttpGet("resumen-general")]
        [Authorize(Roles = "Administrador,Docente")]
        public async Task<IActionResult> GetResumenGeneral()
        {
            var data = await _repository.ObtenerResumenGeneralAsync();
            return Ok(data);
        }

        [HttpGet("inventario-por-categoria")]
        [Authorize(Roles = "Administrador,Docente")]
        public async Task<IActionResult> GetInventarioPorCategoria()
        {
            var data = await _repository.ObtenerInventarioPorCategoriaAsync();
            return Ok(data);
        }

        [HttpGet("inventario-por-ubicacion")]
        [Authorize(Roles = "Administrador,Docente")]
        public async Task<IActionResult> GetInventarioPorUbicacion()
        {
            var data = await _repository.ObtenerInventarioPorUbicacionAsync();
            return Ok(data);
        }

        [HttpGet("prestamos-por-estado")]
        [Authorize(Roles = "Administrador,Docente")]
        public async Task<IActionResult> GetPrestamosPorEstado()
        {
            var data = await _repository.ObtenerPrestamosPorEstadoAsync();
            return Ok(data);
        }

        [HttpGet("prestamos-vencidos")]
        [Authorize(Roles = "Administrador,Docente")]
        public async Task<IActionResult> GetPrestamosVencidos([FromQuery] DateTime? fechaCorte = null)
        {
            var data = await _repository.ObtenerPrestamosVencidosAsync(fechaCorte ?? DateTime.Now);
            return Ok(data);
        }

        [HttpGet("mantenimientos-por-estado")]
        [Authorize(Roles = "Administrador,Docente")]
        public async Task<IActionResult> GetMantenimientosPorEstado()
        {
            var data = await _repository.ObtenerMantenimientosPorEstadoAsync();
            return Ok(data);
        }

        [HttpGet("top-articulos-movidos")]
        [Authorize(Roles = "Administrador,Docente")]
        public async Task<IActionResult> GetTopArticulosMovidos([FromQuery] int top = 5)
        {
            var data = await _repository.ObtenerTopArticulosMasMovidosAsync(top);
            return Ok(data);
        }
    }
}
