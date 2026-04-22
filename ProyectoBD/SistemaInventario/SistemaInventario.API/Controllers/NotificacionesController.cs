using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaInventario.Application.Interfaces;

[Route("api/[controller]")]
[ApiController]
public class NotificacionesController : ControllerBase
{
    private readonly INotificacionRepository _repository;
    public NotificacionesController(INotificacionRepository repository) => _repository = repository;

    [HttpGet("pendientes")]
    [Authorize(Roles = "Administrador,Docente")]
    public async Task<IActionResult> Get() => Ok(await _repository.ObtenerPendientesAsync());

    [HttpPost("revisar-vencidos")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Revisar()
    {
        await _repository.GenerarAlertasVencimientoAsync();
        return Ok(new { m = "Escaneo de préstamos vencidos completado." });
    }

    [HttpPut("marcar-enviada/{id}")]
    [Authorize(Roles = "Administrador,Docente")]
    public async Task<IActionResult> Put(int id) => Ok(await _repository.MarcarComoEnviadaAsync(id));
}