using SistemaInventario.Domain.Enums;
using SistemaInventario.Domain.Exceptions;
using SistemaInventario.Domain.ValueObjects;
using System.ComponentModel.DataAnnotations;

namespace SistemaInventario.Domain.Entities
{
    public class Articulo
    {
        [Key]
        public int IdArticulo { get; private set; }
        public CodigoInstitucional Codigo { get; private set; }
        public string Nombre { get; private set; } = string.Empty;
        public string? Marca { get; private set; }
        public string? Modelo { get; private set; }
        public string? NumeroSerie { get; private set; }
        public string? DescripcionTecnica { get; private set; }
        public string? ObservacionesFisicas { get; private set; }
        public EstadoArticulo Estado { get; private set; } = EstadoArticulo.Disponible;

        // 🔑 Faltaban estas relaciones (FKs) según tu Repository:
        public int IdCategoria { get; private set; }
        public int IdUbicacion { get; private set; }
        public int IdResponsable { get; private set; }

        protected Articulo() { }

        // 🛠️ Constructor actualizado con todos los campos del Repository
        public Articulo(
            string codigoString,
            string nombre,
            string? marca,
            string? modelo,
            string? numeroSerie,
            string? descripcionTecnica,
            string? observacionesFisicas,
            int idCategoria,
            int idUbicacion,
            int idResponsable)
        {
            Codigo = new CodigoInstitucional(codigoString); // Aquí se valida el -UTA-
            Nombre = nombre;
            Marca = marca;
            Modelo = modelo;
            NumeroSerie = numeroSerie;
            DescripcionTecnica = descripcionTecnica;
            ObservacionesFisicas = observacionesFisicas;
            IdCategoria = idCategoria;
            IdUbicacion = idUbicacion;
            IdResponsable = idResponsable;
            Estado = EstadoArticulo.Disponible;
        }

        public bool EstaDisponibleParaPrestamo()
        {
            return Estado == EstadoArticulo.Disponible;
        }

        public void MarcarComoPrestado()
        {
            if (!EstaDisponibleParaPrestamo())
                throw new DomainException("El artículo no está disponible para préstamo.");

            Estado = EstadoArticulo.Prestado;
        }

        public void MarcarComoDisponible()
        {
            if (Estado != EstadoArticulo.Prestado)
                throw new DomainException("Solo un artículo prestado puede volver a disponible.");

            Estado = EstadoArticulo.Disponible;
        }
    }
}