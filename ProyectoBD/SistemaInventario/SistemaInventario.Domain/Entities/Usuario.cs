using SistemaInventario.Domain.Enums;
using SistemaInventario.Domain.ValueObjects;
using System.ComponentModel.DataAnnotations;

namespace SistemaInventario.Domain.Entities
{
    public class Usuario
    {
        [Key]
        public int IdUsuario { get; set; }

        public string Cedula { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public CorreoInstitucional Correo { get; private set; }
        // Guardaremos la contraseña encriptada por seguridad
        public string PasswordHash { get; set; } = string.Empty;
        public int IdRol { get; private set; } // FK hacia la tabla Roles

        // Propiedad de navegación (Opcional, para traer el nombre del rol)
        public virtual Rol Rol { get; private set; }
        public string Estado { get; set; } = "Activo";
        protected Usuario() { }
        public Usuario(string nombre, string apellido, string correoString, string passwordHash, int idRol)
        {
            Nombre = nombre;
            Apellido = apellido;
            Correo = new CorreoInstitucional(correoString); // ¡Se valida solo al instanciarse!
            PasswordHash = passwordHash;
            IdRol = idRol;
        }
    }
}