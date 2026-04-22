using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaInventario.API.Extensions;
using SistemaInventario.Application.DTOs;
using SistemaInventario.Application.Interfaces;
using SistemaInventario.Domain.Entities;
using SistemaInventario.Domain.Exceptions;

namespace SistemaInventario.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsuariosController : ControllerBase
    {
        private readonly IUsuarioRepository _repository;

        public UsuariosController(IUsuarioRepository repository)
        {
            _repository = repository;
        }

        [HttpGet]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> GetAll()
        {
            var usuarios = await _repository.ObtenerTodosAsync();
            return Ok(usuarios);
        }

        [HttpPost]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Create(UsuarioCreateDTO dto)
        {
            try
            {
                if (!User.TryGetUserId(out var idUsuarioActor))
                    return Unauthorized(new { message = "Token inválido: no se pudo obtener el usuario actor." });

                var lista = await _repository.ObtenerTodosAsync();
                if (lista.Any(u => u.Correo.Equals(dto.Correo, StringComparison.OrdinalIgnoreCase)))
                {
                    return Conflict(new { message = "Ese correo ya está registrado en el sistema." });
                }

                var nuevoUsuario = new Usuario(
                    dto.Nombre,
                    string.Empty,
                    dto.Correo,
                    dto.Password,
                    dto.IdRol);

                var filas = await _repository.RegistrarManualAsync(
                    dto.Cedula,
                    nuevoUsuario,
                    idUsuarioActor);

                if (filas == 0)
                {
                    return BadRequest(new { message = "No se pudo registrar el usuario." });
                }

                return Ok(new { message = "Usuario registrado correctamente en Oracle 10g" });
            }
            catch (DomainException ex)
            {
                return BadRequest(new { message = "Error de Regla de Negocio", detail = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Error en Oracle", detail = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Update(int id, UsuarioUpdateDTO dto)
        {
            try
            {
                if (!User.TryGetUserId(out var idUsuarioActor))
                    return Unauthorized(new { message = "Token inválido: no se pudo obtener el usuario actor." });

                var usuarioExistente = await _repository.ObtenerPorIdAsync(id);
                if (usuarioExistente is null)
                {
                    return NotFound(new { message = $"No se encontró el usuario con ID {id}" });
                }

                var lista = await _repository.ObtenerTodosAsync();
                if (lista.Any(u => u.IdUsuario != id && u.Correo.Equals(dto.Correo, StringComparison.OrdinalIgnoreCase)))
                {
                    return Conflict(new { message = "Ese correo ya está registrado en el sistema." });
                }

                var usuarioActualizado = new Usuario(
                    dto.Nombre,
                    string.Empty,
                    dto.Correo,
                    dto.Password,
                    dto.IdRol);

                var filas = await _repository.ActualizarManualAsync(
                    id,
                    dto.Cedula,
                    usuarioActualizado,
                    dto.Estado,
                    idUsuarioActor);

                if (filas == 0)
                {
                    return NotFound(new { message = $"No se pudo actualizar el usuario con ID {id}" });
                }

                return Ok(new { message = "Usuario actualizado correctamente en Oracle 10g" });
            }
            catch (DomainException ex)
            {
                return BadRequest(new { message = "Error de Regla de Negocio", detail = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Error en Oracle", detail = ex.Message });
            }
        }

        [HttpPatch("{id}/desactivar")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Desactivar(int id)
        {
            try
            {
                if (!User.TryGetUserId(out var idUsuarioActor))
                    return Unauthorized(new { message = "Token inválido: no se pudo obtener el usuario actor." });

                var usuarioExistente = await _repository.ObtenerPorIdAsync(id);
                if (usuarioExistente is null)
                {
                    return NotFound(new { message = $"No se encontró el usuario con ID {id}" });
                }

                // Cambiar estado a Inactivo (soft delete)
                var filas = await _repository.ActualizarManualAsync(
                    id,
                    "",  // cedula no se usa en UPDATE
                    usuarioExistente,
                    "Inactivo",
                    idUsuarioActor);

                if (filas == 0)
                {
                    return NotFound(new { message = $"No se pudo desactivar el usuario con ID {id}" });
                }

                return Ok(new { message = "Usuario desactivado correctamente" });
            }
            catch (DomainException ex)
            {
                return BadRequest(new { message = "Error de Regla de Negocio", detail = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Error en Oracle", detail = ex.Message });
            }
        }
    }
}