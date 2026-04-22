using System.ComponentModel.DataAnnotations;

namespace SistemaInventario.Domain.Entities
{
    public class ImagenArticulo
    {
        [Key]
        public int IdImagen { get; private set; }
        public int IdArticulo { get; private set; }
        public string UrlImagen { get; private set; } = string.Empty;

        protected ImagenArticulo() { }

        public ImagenArticulo(int idArticulo, string url)
        {
            if (string.IsNullOrWhiteSpace(url))
                throw new ArgumentException("La URL de la imagen no puede estar vacía.");

            IdArticulo = idArticulo;
            UrlImagen = url;
        }
    }
}