using Microsoft.EntityFrameworkCore;
using SistemaInventario.Application.DTOs;
using SistemaInventario.Application.Interfaces;
using SistemaInventario.Domain.Entities;
using SistemaInventario.Domain.Enums;
using SistemaInventario.Infrastructure.Persistence;

namespace SistemaInventario.Infrastructure.Repositories
{
    public class MovimientoRepository : IMovimientoRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IAuditoriaRepository _auditoriaRepository;

        public MovimientoRepository(ApplicationDbContext context, IAuditoriaRepository auditoriaRepository)
        {
            _context = context;
            _auditoriaRepository = auditoriaRepository;
        }

        public async Task<bool> RegistrarMovimientoAsync(MovimientoCreateDTO dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Buscamos el artículo (usando ToList para evitar FETCH FIRST)
                var listaArticulos = await _context.Articulos
                    .Where(a => a.IdArticulo == dto.IdArticulo)
                    .ToListAsync();

                var articulo = listaArticulos.FirstOrDefault();
                if (articulo == null || articulo.Estado == EstadoArticulo.Prestado) return false;

                int origenActual = articulo.IdUbicacion;

                // 2. INSERT MANUAL de Movimiento (Evitamos el SaveChanges que rompe todo)
                // No incluimos ID_MOVIMIENTO porque asumimos que Oracle tiene un TRIGGER o es IDENTITY
                var sqlMov = @"INSERT INTO MOVIMIENTOS 
            (ID_ARTICULO, ID_UBICACION_ORIGEN, ID_UBICACION_DESTINO, ID_USUARIO_AUTORIZA, FECHA_MOV, MOTIVO) 
            VALUES ({0}, {1}, {2}, {3}, {4}, {5})";

                await _context.Database.ExecuteSqlRawAsync(sqlMov,
                    dto.IdArticulo,
                    origenActual,
                    dto.IdUbicacionDestino,
                    dto.IdUsuarioAutoriza,
                    DateTime.Now,
                    dto.Motivo);

                // 3. UPDATE del Artículo
                await _context.Database.ExecuteSqlRawAsync(
                    "UPDATE ARTICULOS SET ID_UBICACION = {0} WHERE ID_ARTICULO = {1}",
                    dto.IdUbicacionDestino, dto.IdArticulo);

                await _auditoriaRepository.RegistrarAccionAsync(new AuditoriaCreateDTO
                {
                    IdUsuario = dto.IdUsuarioAutoriza,
                    TablaAfectada = "MOVIMIENTOS",
                    IdRegistroAfectado = dto.IdArticulo,
                    Accion = "INSERT",
                    DetallesCambio = $"Movimiento de artículo ID={dto.IdArticulo}. Origen={origenActual}, Destino={dto.IdUbicacionDestino}, Motivo={dto.Motivo}"
                });

                // OJO: Ya no llamamos a _context.SaveChangesAsync() porque ya usamos ExecuteSqlRaw
                await transaction.CommitAsync();
                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                // Aquí puedes poner un Console.WriteLine(ex.Message) para debugear
                return false;
            }
        }

        public async Task<IEnumerable<object>> ObtenerHistorialMovimientosAsync()
        {
            return await (from m in _context.Set<Movimiento>()
                          join a in _context.Articulos on m.IdArticulo equals a.IdArticulo
                          join uo in _context.Ubicaciones on m.IdUbicacionOrigen equals uo.IdUbicacion
                          join ud in _context.Ubicaciones on m.IdUbicacionDestino equals ud.IdUbicacion
                          select new
                          {
                              Id = m.IdMovimiento,
                              IdArticulo = m.IdArticulo,
                              Articulo = a.Nombre,
                              De = uo.NombreEspacio,
                              A = ud.NombreEspacio,
                              Fecha = m.FechaMov,
                              Motivo = m.Motivo
                          }).ToListAsync();
        }
    }
}