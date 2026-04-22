using System.ComponentModel.DataAnnotations;

namespace SistemaInventario.Domain.Entities
{
    public class DetallePrestamo
    {
        [Key]
        public int IdDetalle { get; private set; }
        public int IdPrestamo { get; private set; }
        public int IdArticulo { get; private set; }

        protected DetallePrestamo() { }

        public DetallePrestamo(int idArticulo)
        {
            IdArticulo = idArticulo;
        }

        // Método para cuando registramos el detalle (EF llenará el IdPrestamo)
        public void AsignarPrestamo(int idPrestamo)
        {
            IdPrestamo = idPrestamo;
        }
    }
}