using Microsoft.EntityFrameworkCore;
using SistemaInventario.Domain.Entities;
using SistemaInventario.Domain.Enums;
using SistemaInventario.Domain.ValueObjects;

namespace SistemaInventario.Infrastructure.Persistence
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<Articulo> Articulos { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Rol> Roles { get; set; }
        public DbSet<Prestamo> Prestamos { get; set; }
        public DbSet<DetallePrestamo> DetallesPrestamos { get; set; }
        public DbSet<Mantenimiento> Mantenimientos { get; set; }
        public DbSet<Categoria> Categorias { get; set; }
        public DbSet<Departamento> Departamentos { get; set; }
        public DbSet<Ubicacion> Ubicaciones { get; set; }
        public DbSet<ImagenArticulo> ImagenesArticulos { get; set; }
        public DbSet<Movimiento> Movimientos { get; set; }
        public DbSet<Auditoria> Auditorias { get; set; }
        public DbSet<Notificacion> Notificaciones { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 1. ARTICULOS
            modelBuilder.Entity<Articulo>(entity =>
            {
                entity.ToTable("ARTICULOS"); 
                entity.HasKey(e => e.IdArticulo);
                entity.Property(e => e.IdArticulo)
          .HasColumnName("ID_ARTICULO").ValueGeneratedNever();
                entity.Property(e => e.Nombre).HasColumnName("NOMBRE");
                entity.Property(e => e.Estado).HasColumnName("ESTADO").HasConversion<string>();
                entity.Property(e => e.DescripcionTecnica).HasColumnName("DESCRIPCION_TECNICA");
                entity.Property(e => e.Marca).HasColumnName("MARCA");
                entity.Property(e => e.Modelo).HasColumnName("MODELO");
                entity.Property(e => e.NumeroSerie).HasColumnName("NUMERO_SERIE");
                entity.Property(e => e.IdCategoria).HasColumnName("ID_CATEGORIA");
                entity.Property(e => e.IdUbicacion).HasColumnName("ID_UBICACION");
                entity.Property(e => e.IdResponsable).HasColumnName("ID_RESPONSABLE");
                entity.Property(e => e.ObservacionesFisicas).HasColumnName("OBSERVACIONES_FISICAS");
                entity.Property(e => e.Codigo)
                      .HasConversion(vo => vo.Valor, s => new CodigoInstitucional(s))
                      .HasColumnName("COD_INSTITUCIONAL");
            });

            // 2. USUARIOS Y ROLES
            modelBuilder.Entity<Usuario>(entity =>
            {
                entity.ToTable("USUARIOS");
                entity.HasKey(u => u.IdUsuario);
                entity.Property(e => e.IdUsuario).HasColumnName("ID_USUARIO");
                entity.Property(e => e.Cedula).HasColumnName("CEDULA");
                entity.Property(e => e.Nombre).HasColumnName("NOMBRE");
                entity.Ignore(e => e.Apellido);
                entity.Property(e => e.IdRol).HasColumnName("ID_ROL");
                entity.Property(e => e.PasswordHash).HasColumnName("PASSWORD");
                entity.Property(e => e.Estado).HasColumnName("ESTADO");
                entity.Property(e => e.Correo)
                      .HasConversion(vo => vo.Valor, s => new CorreoInstitucional(s))
                      .HasColumnName("CORREO");

                // Relación formal para evitar el error de mapeo del tipo 'Rol'
                entity.HasOne(u => u.Rol)
                      .WithMany()
                      .HasForeignKey(u => u.IdRol);
            });

            modelBuilder.Entity<Rol>(entity =>
            {
                entity.ToTable("ROLES");
                entity.HasKey(r => r.IdRol);
                entity.Property(e => e.IdRol).HasColumnName("ID_ROL");
                entity.Property(e => e.NombreRol)
                    .HasColumnName("NOMBRE_ROL")
                    .HasConversion<string>();
            });

            // 3. PRESTAMOS Y DETALLE
            modelBuilder.Entity<Prestamo>(entity =>
            {
                entity.ToTable("PRESTAMOS");
                entity.HasKey(e => e.IdPrestamo);
                entity.Property(e => e.IdPrestamo).HasColumnName("ID_PRESTAMO");
                entity.Property(e => e.IdUsuario).HasColumnName("ID_USUARIO");
                entity.Property(e => e.IdAdminAutoriza).HasColumnName("ID_ADMIN_AUTORIZA");
                entity.Property(e => e.Estado)
                    .HasColumnName("ESTADO_PRESTAMO")
                    .HasConversion(
                        v => v.ToString(),
                        v => Enum.Parse<EstadoPrestamo>(v, true));
                entity.Property(e => e.FechaSalida).HasColumnName("FECHA_SALIDA");
                entity.Property(e => e.FechaPrevista).HasColumnName("FECHA_PREVISTA");
                entity.Property(e => e.FechaDevolucionReal).HasColumnName("FECHA_DEVOLUCION_REAL");
            });

            modelBuilder.Entity<DetallePrestamo>(entity =>
            {
                entity.ToTable("DETALLE_PRESTAMO");
                entity.HasKey(e => e.IdDetalle);
                entity.Property(e => e.IdDetalle).HasColumnName("ID_DETALLE");
                entity.Property(e => e.IdPrestamo).HasColumnName("ID_PRESTAMO");
                entity.Property(e => e.IdArticulo).HasColumnName("ID_ARTICULO");
            });

            // 4. MANTENIMIENTOS
            modelBuilder.Entity<Mantenimiento>(entity =>
            {
                entity.ToTable("MANTENIMIENTOS");
                entity.HasKey(e => e.IdMantenimiento);
                entity.Property(e => e.IdMantenimiento).HasColumnName("ID_MANTENIMIENTO");
                entity.Property(e => e.IdArticulo).HasColumnName("ID_ARTICULO");
                entity.Property(e => e.Tipo).HasColumnName("TIPO");
                entity.Property(e => e.ProveedorTecnico).HasColumnName("PROVEEDOR_TECNICO");
                entity.Property(e => e.Descripcion).HasColumnName("DESCRIPCION");
                entity.Property(e => e.FechaInicio).HasColumnName("FECHA_INICIO");
                entity.Property(e => e.FechaFin).HasColumnName("FECHA_FIN");
                entity.Property(e => e.Costo)
          .HasColumnName("COSTO")
          .HasPrecision(10, 2);

                // Mapeamos el Enum como String para Oracle
                entity.Property(e => e.Estado)
                      .HasColumnName("ESTADO_MANTENIMIENTO")
                      .HasConversion<string>();
            });

            // 5. CATALOGOS
            modelBuilder.Entity<Categoria>(entity => {
                entity.ToTable("CATEGORIAS");
                entity.Property(e => e.IdCategoria).HasColumnName("ID_CATEGORIA");
                entity.Property(e => e.NombreCategoria).HasColumnName("NOMBRE_CATEGORIA");
            });

            modelBuilder.Entity<Departamento>(entity => {
                entity.ToTable("DEPARTAMENTOS");
                entity.HasKey(e => e.IdDepartamento);
                entity.Property(e => e.IdDepartamento).HasColumnName("ID_DEPARTAMENTO");
                entity.Property(e => e.NombreDepartamento).HasColumnName("NOMBRE_DEPARTAMENTO");
            });

            modelBuilder.Entity<Ubicacion>(entity =>
            {
                entity.ToTable("UBICACIONES");

                entity.HasKey(e => e.IdUbicacion);
                entity.Property(e => e.IdUbicacion).HasColumnName("ID_UBICACION");
                entity.Property(e => e.NombreEspacio).HasColumnName("NOMBRE_ESPACIO");
                entity.Property(e => e.IdDepartamento).HasColumnName("ID_DEPARTAMENTO");
            });

            // 6. TRAZABILIDAD Y SEGURIDAD
            modelBuilder.Entity<Auditoria>(entity =>
            {
                entity.ToTable("AUDITORIA"); // Asegúrate que el nombre sea igual en Oracle
                entity.HasKey(e => e.IdAuditoria);

                entity.Property(e => e.IdAuditoria).HasColumnName("ID_AUDITORIA");
                entity.Property(e => e.IdUsuario).HasColumnName("ID_USUARIO");
                entity.Property(e => e.TablaAfectada).HasColumnName("TABLA_AFECTADA");
                entity.Property(e => e.IdRegistroAfectado).HasColumnName("ID_REGISTRO_AFECTADO");
                entity.Property(e => e.Accion).HasColumnName("ACCION");
                entity.Property(e => e.DetallesCambio).HasColumnName("DETALLES_CAMBIO");
                entity.Property(e => e.FechaAccion).HasColumnName("FECHA_ACCION");
            });

            modelBuilder.Entity<Movimiento>(entity =>
            {
                entity.ToTable("MOVIMIENTOS");
                entity.HasKey(e => e.IdMovimiento);
                entity.Property(e => e.IdMovimiento).HasColumnName("ID_MOVIMIENTO");
                entity.Property(e => e.IdArticulo).HasColumnName("ID_ARTICULO");
                entity.Property(e => e.IdUbicacionOrigen).HasColumnName("ID_UBICACION_ORIGEN");
                entity.Property(e => e.IdUbicacionDestino).HasColumnName("ID_UBICACION_DESTINO");
                entity.Property(e => e.IdUsuarioAutoriza).HasColumnName("ID_USUARIO_AUTORIZA");
                entity.Property(e => e.FechaMov).HasColumnName("FECHA_MOV");
                entity.Property(e => e.Motivo).HasColumnName("MOTIVO");
            });

            modelBuilder.Entity<Notificacion>(entity => {
                entity.ToTable("NOTIFICACIONES");
                entity.Property(e => e.IdNotificacion).HasColumnName("ID_NOTIFICACION");
                entity.Property(e => e.EstadoEnvio).HasColumnName("ESTADO_ENVIO");
            });

            modelBuilder.Entity<ImagenArticulo>(entity => {
                entity.ToTable("IMAGEN_ARTICULO");
                entity.HasKey(e => e.IdImagen);
                entity.Property(e => e.IdImagen).HasColumnName("ID_IMAGEN");
                entity.Property(e => e.IdArticulo).HasColumnName("ID_ARTICULO");
                entity.Property(e => e.UrlImagen).HasColumnName("URL_IMAGEN");
            });
        }
    }
}