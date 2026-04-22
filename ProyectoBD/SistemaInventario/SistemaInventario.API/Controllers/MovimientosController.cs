using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaInventario.API.Extensions;
using SistemaInventario.Application.DTOs;
using SistemaInventario.Application.Interfaces;

[Route("api/[controller]")]
[ApiController]
public class MovimientosController : ControllerBase
{
    private readonly IMovimientoRepository _repository;
    public MovimientosController(IMovimientoRepository repository) => _repository = repository;

    [HttpPost]
    [Authorize(Roles = "Administrador,Docente")]
    public async Task<IActionResult> Post([FromBody] MovimientoCreateDTO dto)
    {
        if (!User.TryGetUserId(out var idUsuarioActor))
            return Unauthorized(new { message = "Token inválido: no se pudo obtener el usuario actor." });

        dto.IdUsuarioAutoriza = idUsuarioActor;
        var res = await _repository.RegistrarMovimientoAsync(dto);
        return res ? Ok(new { m = "Movimiento y ubicación actualizados" }) : BadRequest("No se pudo mover el artículo.");
    }

    [HttpGet("historial")]
    [Authorize(Roles = "Administrador,Docente")]
    public async Task<IActionResult> Get() => Ok(await _repository.ObtenerHistorialMovimientosAsync());
}