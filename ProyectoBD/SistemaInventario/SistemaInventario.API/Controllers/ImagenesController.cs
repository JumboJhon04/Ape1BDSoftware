using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaInventario.Application.DTOs;
using SistemaInventario.Application.Interfaces;

namespace SistemaInventario.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ImagenesController : ControllerBase
    {
        private readonly IImagenRepository _repository;

        public ImagenesController(IImagenRepository repository)
        {
            _repository = repository;
        }

        [HttpPost("subir")]
        [Authorize(Roles = "Administrador,Docente")]
        public async Task<IActionResult> Subir([FromBody] ImagenArticuloDTO dto)
        {
            var res = await _repository.SubirImagenAsync(dto);
            return res ? Ok(new { m = "Imagen vinculada con éxito" }) : BadRequest();
        }

        [HttpGet("articulo/{idArticulo}")]
        [Authorize(Roles = "Administrador,Docente,Estudiante")]
        public async Task<IActionResult> GetByArticulo(int idArticulo)
        {
            return Ok(await _repository.ObtenerImagenesPorArticuloAsync(idArticulo));
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrador,Docente")]
        public async Task<IActionResult> Delete(int id)
        {
            var res = await _repository.EliminarImagenAsync(id);
            return res ? Ok() : BadRequest();
        }
    }
}