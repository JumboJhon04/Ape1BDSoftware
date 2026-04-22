using System;
using System.ComponentModel.DataAnnotations;

namespace SistemaInventario.Domain.Entities
{
    public class Movimiento
    {
        [Key]
        public int IdMovimiento { get; private set; }
        public int IdArticulo { get; private set; }
        public int IdUbicacionOrigen { get; private set; }
        public int IdUbicacionDestino { get; private set; }
        public int IdUsuarioAutoriza { get; private set; }
        public DateTime FechaMov { get; private set; } = DateTime.Now;
        public string Motivo { get; private set; } = string.Empty;

        protected Movimiento() { }
        public Movimiento(int idArticulo, int origen, int destino, int idAdmin, string motivo)
        {
            IdArticulo = idArticulo;
            IdUbicacionOrigen = origen;
            IdUbicacionDestino = destino;
            IdUsuarioAutoriza = idAdmin;
            Motivo = motivo;
        }
    }
}