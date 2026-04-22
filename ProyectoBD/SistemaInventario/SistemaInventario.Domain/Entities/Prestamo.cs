using SistemaInventario.Domain.Enums;
using SistemaInventario.Domain.Exceptions;
using System;
using System.ComponentModel.DataAnnotations;

namespace SistemaInventario.Domain.Entities
{
    public class Prestamo
    {
        [Key]
        public int IdPrestamo { get; private set; }
        public int IdUsuario { get; private set; }
        public int? IdAdminAutoriza { get; private set; }

        public DateTime? FechaSalida { get; private set; }
        public DateTime FechaPrevista { get; private set; }
        public DateTime? FechaDevolucionReal { get; private set; }

        // El préstamo se registra como solicitud y requiere aprobación administrativa.
        public EstadoPrestamo Estado { get; private set; } = EstadoPrestamo.Pendiente;

        protected Prestamo() { }

        public Prestamo(int idUsuario, DateTime fechaPrevista)
        {
            if (fechaPrevista <= DateTime.Now)
                throw new DomainException("La fecha prevista de devolución debe ser en el futuro.");

            IdUsuario = idUsuario;
            FechaSalida = null;
            FechaPrevista = fechaPrevista;
            Estado = EstadoPrestamo.Pendiente;
        }

        public void AprobarPrestamo(int idAdminAutoriza)
        {
            if (Estado != EstadoPrestamo.Pendiente)
                throw new DomainException("Solo se pueden aprobar préstamos en estado Pendiente.");

            IdAdminAutoriza = idAdminAutoriza;
            FechaSalida = DateTime.Now;
            Estado = EstadoPrestamo.Activo;
        }

        public void FinalizarPrestamo()
        {
            if (Estado != EstadoPrestamo.Activo)
                throw new DomainException("Solo se puede finalizar un préstamo en estado Activo.");

            Estado = EstadoPrestamo.Finalizado;
            FechaDevolucionReal = DateTime.Now;
        }
    }
}