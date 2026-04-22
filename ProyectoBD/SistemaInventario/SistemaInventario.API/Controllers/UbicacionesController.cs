using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaInventario.API.Extensions;
using SistemaInventario.Application.DTOs;
using SistemaInventario.Application.Interfaces;

namespace SistemaInventario.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UbicacionesController : ControllerBase
    {
        private readonly IUbicacionRepository _repository;

        public UbicacionesController(IUbicacionRepository repository)
        {
            _repository = repository;
        }

        [HttpGet]
        [Authorize(Roles = "Administrador,Docente,Estudiante")]
        public async Task<IActionResult> GetAll()
        {
            var ubicaciones = await _repository.ObtenerTodasAsync();
            return Ok(ubicaciones);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Administrador,Docente,Estudiante")]
        public async Task<IActionResult> GetById(int id)
        {
            var ubicacion = await _repository.ObtenerPorIdAsync(id);

            if (ubicacion is null)
            {
                return NotFound(new { message = $"No se encontró la ubicación con ID {id}" });
            }

            return Ok(ubicacion);
        }

        [HttpPost]
        [Authorize(Roles = "Administrador,Docente")]
        public async Task<IActionResult> Create([FromBody] UbicacionCreateDTO dto)
        {
            if (!User.TryGetUserId(out var idUsuarioActor))
            {
                return Unauthorized(new { message = "Token inválido: no se pudo obtener el usuario actor." });
            }

            if (string.IsNullOrWhiteSpace(dto.NombreEspacio))
            {
                return BadRequest(new { message = "El nombre del espacio es obligatorio." });
            }

            if (dto.IdDepartamento <= 0)
            {
                return BadRequest(new { message = "El departamento es obligatorio." });
            }

            var filas = await _repository.CrearManualAsync(dto.NombreEspacio, dto.IdDepartamento, idUsuarioActor);
            if (filas == 0)
            {
                return BadRequest(new { message = "No se pudo crear la ubicación." });
            }

            return Ok(new { message = "Ubicación registrada correctamente." });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Delete(int id)
        {
            if (!User.TryGetUserId(out var idUsuarioActor))
            {
                return Unauthorized(new { message = "Token inválido: no se pudo obtener el usuario actor." });
            }

            var filas = await _repository.EliminarManualAsync(id, idUsuarioActor);

            if (filas == 0)
            {
                return NotFound(new { message = $"No se encontró la ubicación con ID {id}" });
            }

            return Ok(new { message = "Ubicación eliminada correctamente." });
        }
    }
}