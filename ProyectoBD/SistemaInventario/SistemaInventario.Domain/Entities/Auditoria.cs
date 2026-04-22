using System;
using System.ComponentModel.DataAnnotations;

namespace SistemaInventario.Domain.Entities
{
    public class Auditoria
    {
        [Key]
        public int IdAuditoria { get; private set; }
        public int IdUsuario { get; private set; }
        public string TablaAfectada { get; private set; } = string.Empty;
        public int IdRegistroAfectado { get; private set; }
        public string Accion { get; private set; } = string.Empty; // INSERT, UPDATE, DELETE
        public string DetallesCambio { get; private set; } = string.Empty;
        public DateTime FechaAccion { get; private set; } = DateTime.Now;

        protected Auditoria() { }
        public Auditoria(int idUsuario, string tabla, int idRegistro, string accion, string detalles)
        {
            IdUsuario = idUsuario;
            TablaAfectada = tabla;
            IdRegistroAfectado = idRegistro;
            Accion = accion;
            DetallesCambio = detalles;
        }
    }
}