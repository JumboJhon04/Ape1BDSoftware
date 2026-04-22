using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaInventario.API.Extensions;
using SistemaInventario.Application.DTOs;
using SistemaInventario.Application.Interfaces;

namespace SistemaInventario.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriasController : ControllerBase
    {
        private readonly ICategoriaRepository _repository;

        public CategoriasController(ICategoriaRepository repository)
        {
            _repository = repository;
        }

        // 1. Listar todas (Para llenar el select en React)
        [HttpGet]
        [Authorize(Roles = "Administrador,Docente,Estudiante")]
        public async Task<IActionResult> GetAll()
        {
            var categorias = await _repository.ObtenerTodasAsync();
            return Ok(categorias);
        }

        // 2. Crear nueva categoría
        [HttpPost]
        [Authorize(Roles = "Administrador,Docente")]
        public async Task<IActionResult> Create(CategoriaCreateDTO dto)
        {
            try
            {
                if (!User.TryGetUserId(out var idUsuarioActor))
                    return Unauthorized(new { message = "Token inválido: no se pudo obtener el usuario actor." });

                var filas = await _repository.CrearManualAsync(dto.Nombre, idUsuarioActor);

                if (filas > 0)
                    return Ok(new { message = "Categoría registrada con éxito en Oracle 10g" });

                return BadRequest(new { message = "No se pudo crear la categoría." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error en el servidor", detail = ex.Message });
            }
        }

        // 3. Eliminar categoría
        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                if (!User.TryGetUserId(out var idUsuarioActor))
                    return Unauthorized(new { message = "Token inválido: no se pudo obtener el usuario actor." });

            var filas = await _repository.EliminarManualAsync(id, idUsuarioActor);

                if (filas == 0)
                    return NotFound(new { message = $"No se encontró la categoría con ID {id}" });

                return Ok(new { message = "Categoría eliminada correctamente." });
            }
            catch (Exception ex)
            {
                // 🚩 OJO: Si la categoría tiene artículos, Oracle lanzará un error de FK
                if (ex.Message.Contains("ORA-02292"))
                {
                    return Conflict(new { message = "No puedes eliminar esta categoría porque ya tiene artículos asociados." });
                }
                return StatusCode(500, new { message = "Error al eliminar", detail = ex.Message });
            }
        }
    }
}