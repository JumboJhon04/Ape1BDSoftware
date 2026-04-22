using System.ComponentModel.DataAnnotations;

namespace SistemaInventario.Domain.Entities
{
    public class Categoria
    {
        [Key]
        public int IdCategoria { get; private set; }
        public string NombreCategoria { get; private set; } = string.Empty;

        protected Categoria() { }
        public Categoria(string nombre) => NombreCategoria = nombre;
    }
}