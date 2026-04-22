using System.ComponentModel.DataAnnotations;

namespace SistemaInventario.Domain.Entities
{
    public class Departamento
    {
        [Key]
        public int IdDepartamento { get; private set; }
        public string NombreDepartamento { get; private set; } = string.Empty;

        protected Departamento() { }
        public Departamento(string nombre) => NombreDepartamento = nombre;
    }
}