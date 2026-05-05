using SistemaInventario.Domain.Enums;
using SistemaInventario.Domain.Exceptions;
using System;
using System.ComponentModel.DataAnnotations;

namespace SistemaInventario.Domain.Entities
{
    public class Mantenimiento
    {
        [Key]
        public int IdMantenimiento { get; private set; }
        public int IdArticulo { get; private set; }

        // Campos nuevos basados en tu diagrama
        public string Tipo { get; private set; } = string.Empty; // Preventivo o Correctivo
        public string? ProveedorTecnico { get; private set; }
        public string? Descripcion { get; private set; }

        public DateTime FechaInicio { get; private set; }
        public DateTime? FechaFin { get; private set; }
        public decimal? Costo { get; private set; }

        public EstadoMantenimiento Estado { get; private set; } = EstadoMantenimiento.Pendiente;

        protected Mantenimiento() { }

        // Constructor actualizado para recibir la info completa desde el inicio
        public Mantenimiento(int idArticulo, string tipo, string? proveedor, string? descripcion)
        {
            if (string.IsNullOrWhiteSpace(tipo))
                throw new DomainException("El tipo de mantenimiento es obligatorio.");

            IdArticulo = idArticulo;
            Tipo = tipo;
            ProveedorTecnico = proveedor;
            Descripcion = descripcion;

            FechaInicio = DateTime.Now;
            Estado = EstadoMantenimiento.Pendiente;
        }

        public void AceptarMantenimiento()
        {
            if (Estado != EstadoMantenimiento.Pendiente)
                throw new DomainException("Solo se pueden aceptar mantenimientos en estado Pendiente.");

            Estado = EstadoMantenimiento.En_progreso;
        }

        public void RechazarMantenimiento()
        {
            if (Estado != EstadoMantenimiento.Pendiente)
                throw new DomainException("Solo se pueden rechazar mantenimientos en estado Pendiente.");

            // Al rechazar, el reporte queda cerrado sin pasar a mantenimiento
            Estado = EstadoMantenimiento.Rechazado;
            FechaFin = DateTime.Now;
        }
        public void FinalizarMantenimiento(decimal costoFinal, string? notasFinales)
        {
            if (Estado == EstadoMantenimiento.Finalizado)
                throw new DomainException("El mantenimiento ya se encuentra finalizado.");

            if (costoFinal < 0)
                throw new DomainException("El costo no puede ser negativo, mor.");

            Estado = EstadoMantenimiento.Finalizado;
            FechaFin = DateTime.Now;
            Costo = costoFinal;

            // Opcional: Actualizar la descripción con lo que se hizo finalmente
            if (!string.IsNullOrEmpty(notasFinales))
            {
                Descripcion += $" | Cierre: {notasFinales}";
            }
        }
    }
}