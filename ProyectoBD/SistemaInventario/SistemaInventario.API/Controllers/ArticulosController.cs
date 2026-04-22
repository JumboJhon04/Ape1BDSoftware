using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaInventario.API.Extensions;
using SistemaInventario.Application.DTOs;
using SistemaInventario.Application.Interfaces;
using SistemaInventario.Domain.Entities;
using SistemaInventario.Domain.Enums;
using SistemaInventario.Domain.Exceptions;

namespace SistemaInventario.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ArticulosController : ControllerBase
    {
        private readonly IArticuloRepository _repository;

        public ArticulosController(IArticuloRepository repository)
        {
            _repository = repository;
        }

        [HttpGet("catalogo")]
        [Authorize(Roles = "Administrador,Docente,Estudiante")]
        public async Task<IActionResult> GetCatalogo()
        {
            var catalogo = await _repository.ObtenerCatalogoAsync();
            return Ok(catalogo);
        }

        [HttpPost]
        [Authorize(Roles = "Administrador,Docente")]
        public async Task<IActionResult> Create(ArticuloCreateDTO dto)
        {
            try
            {
                if (!User.TryGetUserId(out var idUsuarioActor))
                    return Unauthorized(new { message = "Token inválido: no se pudo obtener el usuario actor." });

                // 1. Validaciones de existencia (Capa de Aplicación/Web)
                var catalogo = await _repository.ObtenerCatalogoAsync();
                if (catalogo.Any(a => a.CodigoInstitucional == dto.Codigo))
                {
                    return Conflict(new { message = "Ya existe un artículo con ese código institucional en la UTA." });
                }

                // 2. 🛡️ INSTANCIAR EL DOMINIO (Aquí ocurre la magia del -UTA-)
                // Al hacer 'new Articulo', si el código no tiene '-UTA-', saltará la DomainException
                var nuevoArticulo = new SistemaInventario.Domain.Entities.Articulo(
                    dto.Codigo,
                    dto.Nombre,
                    dto.Marca,
                    dto.Modelo,
                    dto.NumeroSerie,
                    dto.DescripcionTecnica,
                    dto.ObservacionesFisicas,
                    dto.IdCategoria,
                    dto.IdUbicacion,
                    dto.IdResponsable
                );

                // 3. Persistencia manual para Oracle 10g
                // Ahora pasamos el OBJETO completo al repositorio
                var filas = await _repository.CrearManualAsync(nuevoArticulo, idUsuarioActor);

                if (filas == 0)
                    return BadRequest(new { message = "Oracle 10g no pudo registrar el artículo." });

                return Ok(new { message = "Artículo registrado con éxito siguiendo reglas de dominio." });
            }
            catch (DomainException ex)
            {
                // 🚩 Aquí atrapamos el error del Value Object (ej: falta el -UTA-)
                return BadRequest(new { message = "Error de Regla de Negocio", detail = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error técnico", detail = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrador,Docente")]
        public async Task<IActionResult> Update(int id, ArticuloUpdateDTO dto)
        {
            try
            {
                if (!User.TryGetUserId(out var idUsuarioActor))
                    return Unauthorized(new { message = "Token inválido: no se pudo obtener el usuario actor." });

                var articuloExistente = await _repository.ObtenerPorIdAsync(id);
                if (articuloExistente is null)
                {
                    return NotFound(new { message = $"No se encontró el artículo con ID {id}" });
                }

                var catalogo = await _repository.ObtenerCatalogoAsync();
                if (catalogo.Any(a => a.IdArticulo != id && a.CodigoInstitucional == dto.Codigo))
                {
                    return Conflict(new { message = "Ya existe un artículo con ese código institucional." });
                }

                if (!string.IsNullOrWhiteSpace(dto.NumeroSerie) &&
                    catalogo.Any(a => a.IdArticulo != id && a.NumeroSerie == dto.NumeroSerie))
                {
                    return Conflict(new { message = "Ya existe un artículo con ese número de serie." });
                }

                if (!Enum.TryParse<EstadoArticulo>(dto.Estado, true, out var estadoArticulo))
                {
                    return BadRequest(new { message = "Estado de artículo no válido." });
                }

                var articuloActualizado = new Articulo(
                    dto.Codigo,
                    dto.Nombre,
                    dto.Marca,
                    dto.Modelo,
                    dto.NumeroSerie,
                    dto.DescripcionTecnica,
                    dto.ObservacionesFisicas,
                    dto.IdCategoria,
                    dto.IdUbicacion,
                    dto.IdResponsable
                );

                var filas = await _repository.ActualizarManualAsync(
                    id,
                    articuloActualizado,
                    estadoArticulo.ToString(),
                    idUsuarioActor);

                if (filas == 0)
                {
                    return NotFound(new { message = $"No se pudo actualizar el artículo con ID {id}" });
                }

                return Ok(new { message = "Artículo actualizado correctamente en Oracle 10g" });
            }
            catch (DomainException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error al actualizar el artículo.",
                    detail = ex.InnerException?.Message ?? ex.Message
                });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                if (!User.TryGetUserId(out var idUsuarioActor))
                    return Unauthorized(new { message = "Token inválido: no se pudo obtener el usuario actor." });

            var filasAfectadas = await _repository.EliminarManualAsync(id, idUsuarioActor);

                if (filasAfectadas == 0)
                    return NotFound(new { message = $"No se encontró el artículo con ID {id}" });

                return Ok(new { message = "Artículo eliminado de la base de la FISEI" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al eliminar", detail = ex.Message });
            }
        }
    }
}