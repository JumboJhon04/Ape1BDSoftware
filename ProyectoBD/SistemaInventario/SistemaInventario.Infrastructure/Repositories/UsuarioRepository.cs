using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using SistemaInventario.Application.DTOs;
using SistemaInventario.Application.Interfaces;
using SistemaInventario.Infrastructure.Persistence;
using SistemaInventario.Domain.Entities;
using BCrypt.Net;

namespace SistemaInventario.Infrastructure.Repositories
{
    public class UsuarioRepository : IUsuarioRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IAuditoriaRepository _auditoriaRepository;

        public UsuarioRepository(ApplicationDbContext context, IAuditoriaRepository auditoriaRepository)
        {
            _context = context;
            _auditoriaRepository = auditoriaRepository;
        }

        // 1. Obtener todos con el nombre del Rol (Para el combo en React)
        public async Task<IEnumerable<UsuarioDTO>> ObtenerTodosAsync()
        {
            var usuarios = await _context.Usuarios
                .Include(u => u.Rol) // Hacemos el JOIN con ROLES
                .AsNoTracking()
                .ToListAsync();

            // Proyectamos en memoria para evitar traducciones CASE de Enum.ToString() en Oracle 10g.
            return usuarios.Select(u => new UsuarioDTO
                {
                    IdUsuario = u.IdUsuario,
                    Cedula = u.Cedula,
                    Nombre = u.Nombre,
                    Correo = u.Correo.Valor, // Usamos .Valor por tu Value Object
                    IdRol = u.IdRol,
                    NombreRol = u.Rol.NombreRol.ToString(), // Convierte 'Estudiante' (Enum) a "Estudiante" (string)
                    Estado = u.Estado
                })
                .ToList();
        }

        // 2. Obtener por ID para validaciones
        public async Task<Usuario?> ObtenerPorIdAsync(int id)
        {
            var usuarios = await _context.Usuarios
                .Include(u => u.Rol)
                .Where(u => u.IdUsuario == id)
                .ToListAsync();

            return usuarios.FirstOrDefault();
        }

        // 3. El registro manual a prueba de balas para Oracle 10g
        public async Task<int> RegistrarManualAsync(string cedula, Usuario usuario, int idUsuarioActor)
        {
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(usuario.PasswordHash);
            var sql = @"INSERT INTO USUARIOS (CEDULA, NOMBRE, CORREO, PASSWORD, ID_ROL, ESTADO) 
                VALUES ({0}, {1}, {2}, {3}, {4}, 'Activo')";

            var affected = await _context.Database.ExecuteSqlRawAsync(sql,
        cedula,
        usuario.Nombre,
        usuario.Correo.Valor,
        passwordHash,
        usuario.IdRol);

            if (affected > 0)
            {
                var idUsuarioCreado = await ObtenerIdUsuarioPorCedulaAsync(cedula);

                await _auditoriaRepository.RegistrarAccionAsync(new AuditoriaCreateDTO
                {
                    IdUsuario = idUsuarioActor,
                    TablaAfectada = "USUARIOS",
                    IdRegistroAfectado = idUsuarioCreado ?? 0,
                    Accion = "INSERT",
                    DetallesCambio = $"Usuario creado: {usuario.Nombre} ({usuario.Correo.Valor})"
                });
            }

            return affected;
        }

        public async Task<int> ActualizarManualAsync(int id, string cedula, Usuario usuario, string estado, int idUsuarioActor)
        {
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(usuario.PasswordHash);
            // CEDULA no se actualiza: es inmutable (PK única)
            var sql = @"UPDATE USUARIOS
                SET NOMBRE = {1},
                    CORREO = {2},
                    PASSWORD = {3},
                    ID_ROL = {4},
                    ESTADO = {5}
                WHERE ID_USUARIO = {0}";

            var affected = await _context.Database.ExecuteSqlRawAsync(sql,
                id,
                usuario.Nombre,
                usuario.Correo.Valor,
                passwordHash,
                usuario.IdRol,
                estado);

            if (affected > 0)
            {
                await _auditoriaRepository.RegistrarAccionAsync(new AuditoriaCreateDTO
                {
                    IdUsuario = idUsuarioActor,
                    TablaAfectada = "USUARIOS",
                    IdRegistroAfectado = id,
                    Accion = "UPDATE",
                    DetallesCambio = $"Usuario actualizado. ID={id}, Estado={estado}"
                });
            }

            return affected;
        }

        public async Task<int> EliminarManualAsync(int id, int idUsuarioActor)
        {
            var sql = "DELETE FROM USUARIOS WHERE ID_USUARIO = {0}";

            var affected = await _context.Database.ExecuteSqlRawAsync(sql, id);

            if (affected > 0)
            {
                await _auditoriaRepository.RegistrarAccionAsync(new AuditoriaCreateDTO
                {
                    IdUsuario = idUsuarioActor,
                    TablaAfectada = "USUARIOS",
                    IdRegistroAfectado = id,
                    Accion = "DELETE",
                    DetallesCambio = $"Usuario eliminado. ID={id}"
                });
            }

            return affected;
        }
        // 4. El Commit para Oracle
        public async Task GuardarCambiosAsync()
        {
            await _context.SaveChangesAsync();
        }

        private async Task<int?> ObtenerIdUsuarioPorCedulaAsync(string cedula)
        {
            const string sql = @"SELECT ID_USUARIO
                                 FROM USUARIOS
                                 WHERE CEDULA = :p_cedula";

            var connection = _context.Database.GetDbConnection();
            var wasClosed = connection.State != System.Data.ConnectionState.Open;

            if (wasClosed)
                await connection.OpenAsync();

            try
            {
                await using var command = connection.CreateCommand();
                command.CommandText = sql;
                command.Transaction = _context.Database.CurrentTransaction?.GetDbTransaction();

                var parameter = command.CreateParameter();
                parameter.ParameterName = "p_cedula";
                parameter.Value = cedula;
                command.Parameters.Add(parameter);

                var result = await command.ExecuteScalarAsync();
                if (result == null || result == DBNull.Value)
                    return null;

                return Convert.ToInt32(result);
            }
            finally
            {
                if (wasClosed)
                    await connection.CloseAsync();
            }
        }
    }
}