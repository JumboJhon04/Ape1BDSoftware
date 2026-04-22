using Microsoft.EntityFrameworkCore;
using SistemaInventario.Application.Interfaces;
using SistemaInventario.Domain.Enums;
using SistemaInventario.Infrastructure.Persistence;

namespace SistemaInventario.Infrastructure.Repositories
{
    public class ReporteRepository : IReporteRepository
    {
        private readonly ApplicationDbContext _context;

        public ReporteRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<object> ObtenerResumenGeneralAsync()
        {
            var totalArticulos = await _context.Articulos.CountAsync();
            var disponibles = await _context.Articulos.CountAsync(a => a.Estado == EstadoArticulo.Disponible);
            var prestados = await _context.Articulos.CountAsync(a => a.Estado == EstadoArticulo.Prestado);
            var enMantenimiento = await _context.Articulos.CountAsync(a => a.Estado == EstadoArticulo.Mantenimiento);
            var prestamosActivos = await _context.Prestamos.CountAsync(p => p.Estado == EstadoPrestamo.Activo);
            var prestamosPendientes = await _context.Prestamos.CountAsync(p => p.Estado == EstadoPrestamo.Pendiente);

            return new
            {
                FechaCorte = DateTime.Now,
                TotalArticulos = totalArticulos,
                ArticulosDisponibles = disponibles,
                ArticulosPrestados = prestados,
                ArticulosEnMantenimiento = enMantenimiento,
                PrestamosActivos = prestamosActivos,
                PrestamosPendientes = prestamosPendientes
            };
        }

        public async Task<IEnumerable<object>> ObtenerInventarioPorCategoriaAsync()
        {
            return await (from a in _context.Articulos
                          join c in _context.Categorias on a.IdCategoria equals c.IdCategoria
                          group a by c.NombreCategoria into g
                          orderby g.Count() descending
                          select new
                          {
                              Categoria = g.Key,
                              Total = g.Count(),
                              Disponibles = g.Count(x => x.Estado == EstadoArticulo.Disponible),
                              Prestados = g.Count(x => x.Estado == EstadoArticulo.Prestado),
                              EnMantenimiento = g.Count(x => x.Estado == EstadoArticulo.Mantenimiento)
                          }).ToListAsync<object>();
        }

        public async Task<IEnumerable<object>> ObtenerInventarioPorUbicacionAsync()
        {
            return await (from a in _context.Articulos
                          join u in _context.Ubicaciones on a.IdUbicacion equals u.IdUbicacion
                          join d in _context.Departamentos on u.IdDepartamento equals d.IdDepartamento
                          group a by new { u.NombreEspacio, d.NombreDepartamento } into g
                          orderby g.Key.NombreDepartamento, g.Key.NombreEspacio
                          select new
                          {
                              Departamento = g.Key.NombreDepartamento,
                              Ubicacion = g.Key.NombreEspacio,
                              Total = g.Count(),
                              Disponibles = g.Count(x => x.Estado == EstadoArticulo.Disponible),
                              Prestados = g.Count(x => x.Estado == EstadoArticulo.Prestado),
                              EnMantenimiento = g.Count(x => x.Estado == EstadoArticulo.Mantenimiento)
                          }).ToListAsync<object>();
        }

        public async Task<IEnumerable<object>> ObtenerPrestamosPorEstadoAsync()
        {
            return await (from p in _context.Prestamos
                          group p by p.Estado into g
                          orderby g.Key
                          select new
                          {
                              Estado = g.Key.ToString(),
                              Total = g.Count()
                          }).ToListAsync<object>();
        }

        public async Task<IEnumerable<object>> ObtenerPrestamosVencidosAsync(DateTime fechaCorte)
        {
            var data = await (from p in _context.Prestamos
                              join u in _context.Usuarios on p.IdUsuario equals u.IdUsuario
                              where p.Estado == EstadoPrestamo.Activo && p.FechaPrevista < fechaCorte
                              orderby p.FechaPrevista
                              select new
                              {
                                  p.IdPrestamo,
                                  Usuario = u.Nombre,
                                  p.FechaSalida,
                                  p.FechaPrevista
                              }).ToListAsync();

            return data.Select(x => (object)new
            {
                x.IdPrestamo,
                x.Usuario,
                x.FechaSalida,
                x.FechaPrevista,
                DiasRetraso = (fechaCorte.Date - x.FechaPrevista.Date).Days
            });
        }

        public async Task<IEnumerable<object>> ObtenerMantenimientosPorEstadoAsync()
        {
            return await (from m in _context.Mantenimientos
                          group m by m.Estado into g
                          orderby g.Key
                          select new
                          {
                              Estado = g.Key.ToString(),
                              Total = g.Count(),
                              CostoAcumulado = g.Sum(x => x.Costo) ?? 0
                          }).ToListAsync<object>();
        }

        public async Task<IEnumerable<object>> ObtenerTopArticulosMasMovidosAsync(int top)
        {
            var limite = top <= 0 ? 5 : top;

            return await (from m in _context.Movimientos
                          join a in _context.Articulos on m.IdArticulo equals a.IdArticulo
                          group m by new { a.IdArticulo, a.Nombre } into g
                          orderby g.Count() descending
                          select new
                          {
                              IdArticulo = g.Key.IdArticulo,
                              Articulo = g.Key.Nombre,
                              TotalMovimientos = g.Count(),
                              UltimoMovimiento = g.Max(x => x.FechaMov)
                          }).Take(limite).ToListAsync<object>();
        }
    }
}
