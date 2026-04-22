using Microsoft.EntityFrameworkCore;
using SistemaInventario.Application.DTOs;
using SistemaInventario.Application.Interfaces;
using SistemaInventario.Domain.Entities;
using SistemaInventario.Infrastructure.Persistence;

namespace SistemaInventario.Infrastructure.Repositories
{
    public class AuditoriaRepository : IAuditoriaRepository
    {
        private readonly ApplicationDbContext _context;

        public AuditoriaRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task RegistrarAccionAsync(AuditoriaCreateDTO dto)
        {
            // Insert directo a Oracle 10g
            var sql = @"INSERT INTO AUDITORIA 
                (ID_USUARIO, TABLA_AFECTADA, ID_REGISTRO_AFECTADO, ACCION, DETALLES_CAMBIO, FECHA_ACCION) 
                VALUES ({0}, {1}, {2}, {3}, {4}, {5})";

            await _context.Database.ExecuteSqlRawAsync(sql,
                dto.IdUsuario,
                dto.TablaAfectada,
                dto.IdRegistroAfectado,
                dto.Accion,
                dto.DetallesCambio,
                DateTime.Now);
        }

        public async Task<IEnumerable<object>> ObtenerLogCompletoAsync()
        {
            // Traemos todo en memoria para evitar líos de joins en Oracle
            var logs = await _context.Set<Auditoria>().AsNoTracking().ToListAsync();
            var usuarios = await _context.Usuarios.AsNoTracking().ToListAsync();

            return from l in logs
                   join u in usuarios on l.IdUsuario equals u.IdUsuario
                   orderby l.FechaAccion descending
                   select new
                   {
                       l.IdAuditoria,
                       Usuario = u.Nombre,
                       l.TablaAfectada,
                       l.Accion,
                       l.DetallesCambio,
                       l.FechaAccion
                   };
        }
    }
}