using SistemaInventario.Domain.Exceptions;

namespace SistemaInventario.Domain.ValueObjects
{
    public class CodigoInstitucional
    {
        public string Valor { get; private set; }

        public CodigoInstitucional(string valor)
        {
            if (string.IsNullOrWhiteSpace(valor))
                throw new DomainException("El código institucional no puede estar vacío.");

            // Regla de Negocio: Debe incluir el sufijo de la universidad (Ej: LP-UTA-001)
            if (!valor.Contains("-UTA-"))
                throw new DomainException("El código debe contener el identificador de la universidad '-UTA-'.");

            Valor = valor.ToUpper(); // Aseguramos que siempre esté en mayúsculas
        }

        public override string ToString() => Valor;
    }
}