using System.ComponentModel.DataAnnotations;

namespace SistemaInventario.Domain.Entities
{
    public class Ubicacion
    {
        [Key]
        public int IdUbicacion { get; private set; }
        public int IdDepartamento { get; private set; }
        public string NombreEspacio { get; private set; } = string.Empty;

        protected Ubicacion() { }
        public Ubicacion(int idDepartamento, string nombreEspacio)
        {
            IdDepartamento = idDepartamento;
            NombreEspacio = nombreEspacio;
        }
    }
}