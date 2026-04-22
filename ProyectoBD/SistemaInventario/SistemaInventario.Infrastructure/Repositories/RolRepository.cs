using Microsoft.EntityFrameworkCore;
using SistemaInventario.Application.DTOs;
using SistemaInventario.Application.Interfaces;
using SistemaInventario.Domain.Entities;
using SistemaInventario.Infrastructure.Persistence;

namespace SistemaInventario.Infrastructure.Repositories
{
    public class RolRepository : IRolRepository
    {
        private readonly ApplicationDbContext _context;

        public RolRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<RolDTO>> ObtenerTodosAsync()
        {
            var roles = await _context.Roles
                .AsNoTracking()
                .ToListAsync();

            // Convertimos la entidad con Enum al DTO con string
            return roles.Select(r => new RolDTO
            {
                IdRol = r.IdRol,
                NombreRol = r.NombreRol.ToString() // Convierte 'Estudiante' (Enum) a "Estudiante" (string)
            });
        }
    }
}