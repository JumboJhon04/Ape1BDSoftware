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
            return result ? Ok(new { m = "Reporte de mantenimiento registrado y pendiente de aceptación." }) : BadRequest();
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

        // PUT: api/Mantenimientos/aceptar/{id}
        [HttpPut("aceptar/{id}")]
        [Authorize(Roles = "Administrador,Docente")]
        public async Task<IActionResult> Aceptar(int id)
        {
            try
            {
                if (!User.TryGetUserId(out var idUsuarioActor))
                    return Unauthorized(new { message = "Token inválido: no se pudo obtener el usuario actor." });

                var result = await _repository.AceptarMantenimientoAsync(id, idUsuarioActor);
                return result ? Ok(new { m = "Mantenimiento aceptado y pasado a En_progreso." }) : BadRequest(new { error = "No se pudo aceptar el mantenimiento." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // PUT: api/Mantenimientos/rechazar/{id}
        [HttpPut("rechazar/{id}")]
        [Authorize(Roles = "Administrador,Docente")]
        public async Task<IActionResult> Rechazar(int id)
        {
            if (!User.TryGetUserId(out var idUsuarioActor))
                return Unauthorized(new { message = "Token inválido: no se pudo obtener el usuario actor." });

            var result = await _repository.RechazarMantenimientoAsync(id, idUsuarioActor);
            return result ? Ok(new { m = "Reporte de mantenimiento rechazado." }) : BadRequest(new { error = "No se pudo rechazar el reporte." });
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