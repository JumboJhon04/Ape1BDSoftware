using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SistemaInventario.Application.DTOs;
using SistemaInventario.Infrastructure.Persistence;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SistemaInventario.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] AuthLoginDTO dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Correo) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new { message = "Correo y contraseña son obligatorios." });
            }

            var correoIngresado = dto.Correo.Trim();
            var passwordIngresado = dto.Password.Trim();

            var usuarios = await _context.Usuarios
                .Include(u => u.Rol)
                .AsNoTracking()
                .ToListAsync();

            var usuario = usuarios.FirstOrDefault(u =>
                u.Correo.Valor.Trim().Equals(correoIngresado, StringComparison.OrdinalIgnoreCase));

            if (usuario == null)
            {
                return Unauthorized(new { message = "Credenciales inválidas." });
            }

            var passwordValido = BCrypt.Net.BCrypt.Verify(passwordIngresado, usuario.PasswordHash.Trim());
            if (!passwordValido)
            {
                return Unauthorized(new { message = "Credenciales inválidas." });
            }

            if (!string.Equals(usuario.Estado, "Activo", StringComparison.OrdinalIgnoreCase))
            {
                return Unauthorized(new { message = "El usuario está inactivo." });
            }

            var expiresMinutes = int.TryParse(_configuration["Jwt:ExpiresMinutes"], out var value) ? value : 120;
            var token = GenerarToken(usuario.IdUsuario, usuario.Nombre, usuario.Correo.Valor, usuario.Rol.NombreRol.ToString(), expiresMinutes);

            return Ok(new AuthTokenResponseDTO
            {
                Token = token,
                ExpiresIn = expiresMinutes * 60,
                IdUsuario = usuario.IdUsuario,
                Nombre = usuario.Nombre,
                Rol = usuario.Rol.NombreRol.ToString()
            });
        }

        private string GenerarToken(int idUsuario, string nombre, string correo, string rol, int expiresMinutes)
        {
            var issuer = _configuration["Jwt:Issuer"] ?? "SistemaInventario.API";
            var audience = _configuration["Jwt:Audience"] ?? "SistemaInventario.Client";
            var key = _configuration["Jwt:Key"] ?? "DEV_ONLY_CAMBIAR_CLAVE_2026_MINIMO_32_CARACTERES";

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, idUsuario.ToString()),
                new Claim(ClaimTypes.NameIdentifier, idUsuario.ToString()),
                new Claim(ClaimTypes.Name, nombre),
                new Claim(ClaimTypes.Email, correo),
                new Claim(ClaimTypes.Role, rol),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiresMinutes),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
