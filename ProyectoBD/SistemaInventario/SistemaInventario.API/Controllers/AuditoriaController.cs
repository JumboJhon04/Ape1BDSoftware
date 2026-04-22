using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaInventario.Application.Interfaces;

namespace SistemaInventario.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuditoriaController : ControllerBase
    {
        private readonly IAuditoriaRepository _repository;

        public AuditoriaController(IAuditoriaRepository repository)
        {
            _repository = repository;
        }

        // GET: api/Auditoria/log
        [HttpGet("log")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> GetLog()
        {
            var logs = await _repository.ObtenerLogCompletoAsync();
            return Ok(logs);
        }
    }
}