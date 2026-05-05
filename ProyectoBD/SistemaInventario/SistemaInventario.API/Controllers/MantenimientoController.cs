using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaInventario.API.Extensions;
using SistemaInventario.Application.DTOs;
using SistemaInventario.Application.Interfaces;

namespace SistemaInventario.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MantenimientosController : ControllerBase
    {
        private readonly IMantenimientoRepository _repository;

        public MantenimientosController(IMantenimientoRepository repository)
        {
            _repository = repository;
        }

        // POST: api/Mantenimientos/iniciar
        [HttpPost("iniciar")]
        [Authorize(Roles = "Administrador,Docente")]
        public async Task<IActionResult> Iniciar([FromBody] MantenimientoCreateDTO dto)
        {
            if (!User.TryGetUserId(out var idUsuarioActor))
                return Unauthorized(new { message = "Token inválido: no se pudo obtener el usuario actor." });

            dto.IdUsuarioActor = idUsuarioActor;
            var result = await _repository.IniciarMantenimientoAsync(dto);
            return result ? Ok(new { m = "Mantenimiento iniciado y artículo bloqueado." }) : BadRequest();
        }

        // PUT: api/Mantenimientos/finalizar
        [HttpPut("finalizar")]
        [Authorize(Roles = "Administrador,Docente")]
        public async Task<IActionResult> Finalizar([FromBody] MantenimientoFinDTO dto)
        {
            if (!User.TryGetUserId(out var idUsuarioActor))
                return Unauthorized(new { message = "Token inválido: no se pudo obtener el usuario actor." });

            dto.IdUsuarioActor = idUsuarioActor;
            var result = await _repository.FinalizarMantenimientoAsync(dto);
            return result ? Ok(new { m = "Mantenimiento cerrado y artículo disponible." }) : BadRequest();
        }

        // GET: api/Mantenimientos/activos
        [HttpGet("activos")]
        [Authorize(Roles = "Administrador,Docente")]
        public async Task<IActionResult> GetActivos()
        {
            var lista = await _repository.ObtenerMantenimientosActivosAsync();
            return Ok(lista);
        }

        // GET: api/Mantenimientos
        [HttpGet]
        [Authorize(Roles = "Administrador,Docente")]
        public async Task<IActionResult> GetAll()
        {
            var lista = await _repository.ObtenerTodosLosMantenimientosAsync();
            return Ok(lista);
        }
    }
}