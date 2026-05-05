using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaInventario.API.Extensions;
using SistemaInventario.Application.DTOs;
using SistemaInventario.Application.Interfaces;

[Route("api/[controller]")]
[ApiController]
public class NotificacionesController : ControllerBase
{
    private readonly INotificacionRepository _repository;
    public NotificacionesController(INotificacionRepository repository) => _repository = repository;

    [HttpGet("pendientes")]
    [Authorize(Roles = "Administrador,Docente")]
    public async Task<IActionResult> Get()
    {
        if (!User.TryGetUserId(out var idUsuarioActor))
            return Unauthorized(new { message = "Token inválido: no se pudo obtener el usuario actor." });

        return Ok(await _repository.ObtenerPendientesAsync(idUsuarioActor));
    }

    [HttpPost("revisar-vencidos")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Revisar()
    {
        await _repository.GenerarAlertasVencimientoAsync();
        return Ok(new { m = "Escaneo de préstamos vencidos completado." });
    }

    [HttpPost("enviar-pendientes")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> EnviarPendientes()
    {
        var enviados = await _repository.EnviarPendientesAsync();
        return Ok(new { m = "Despacho de notificaciones ejecutado.", enviados });
    }

    [HttpPut("marcar-enviada/{id}")]
    [Authorize(Roles = "Administrador,Docente")]
    public async Task<IActionResult> Put(int id) => Ok(await _repository.MarcarComoEnviadaAsync(id));

    [HttpPost("prestamo/{idPrestamo}/recordar")]
    [Authorize(Roles = "Administrador,Docente")]
    public async Task<IActionResult> RecordarPrestamo(int idPrestamo)
    {
        var result = await _repository.CrearNotificacionAsync(new NotificacionCreateDTO
        {
            IdPrestamo = idPrestamo,
            Mensaje = "Recordatorio de devolución: su préstamo se encuentra vencido. Por favor devolver el equipo lo antes posible."
        });

        if (!result)
            return BadRequest(new { error = "No se pudo crear el recordatorio." });

        var enviados = await _repository.EnviarPendientesPorPrestamoAsync(idPrestamo);
        return Ok(new { m = "Recordatorio procesado.", enviados });
    }
}