using System;
using System.Text.RegularExpressions;
using SistemaInventario.Domain.Exceptions; // Usamos nuestras propias excepciones

namespace SistemaInventario.Domain.ValueObjects
{
    public class CorreoInstitucional
    {
        public string Valor { get; private set; }

        public CorreoInstitucional(string valor)
        {
            if (string.IsNullOrWhiteSpace(valor))
                throw new DomainException("El correo institucional no puede estar vacío.");

            // Regla de negocio pura: ¡Debe ser de la UTA!
            if (!valor.EndsWith("@uta.edu.ec", StringComparison.OrdinalIgnoreCase))
                throw new DomainException("El correo debe pertenecer al dominio institucional @uta.edu.ec.");

            Valor = valor;
        }

        // Esto permite que el Value Object se comporte como un string normal cuando lo necesitemos
        public override string ToString() => Valor;
    }
}