using SistemaInventario.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace SistemaInventario.Domain.Entities
{
    public class Rol
    {
        [Key]
        public int IdRol { get; private set; }
        public RolUsuario NombreRol { get; private set; } = RolUsuario.Estudiante;

        protected Rol() { }
        public Rol(int id, RolUsuario nombre)
        {
            IdRol = id;
            NombreRol = nombre;
        }
    }
}