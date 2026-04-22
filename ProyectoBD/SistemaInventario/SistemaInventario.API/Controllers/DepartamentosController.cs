using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaInventario.API.Extensions;
using SistemaInventario.Application.DTOs;
using SistemaInventario.Application.Interfaces;

namespace SistemaInventario.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DepartamentosController : ControllerBase
    {
        private readonly IDepartamentoRepository _repository;

        public DepartamentosController(IDepartamentoRepository repository)
        {
            _repository = repository;
        }

        [HttpGet]
        [Authorize(Roles = "Administrador,Docente,Estudiante")]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _repository.ObtenerTodosAsync());
        }

        [HttpPost]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Create([FromBody] DepartamentoCreateDTO departamento)
        {
            if (!User.TryGetUserId(out var idUsuarioActor))
                return Unauthorized(new { message = "Token inválido: no se pudo obtener el usuario actor." });

            var result = await _repository.CrearManualAsync(departamento.NombreDepartamento, idUsuarioActor);
            return result > 0 ? Ok(new { message = "Departamento creado" }) : BadRequest();
        }
    }
}