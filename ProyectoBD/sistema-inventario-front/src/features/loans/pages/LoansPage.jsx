import ModulePageShell from '@/shared/components/ModulePageShell'

function LoansPage() {
  return (
    <ModulePageShell
      title="Modulo de Prestamos"
      description="Estructura lista para solicitudes, aprobaciones y devoluciones."
    >
      <div className="panel-placeholder">
        <h3>Prestamos</h3>
        <p>Vista preparada para el flujo de prestamos y devoluciones.</p>
      </div>
    </ModulePageShell>
  )
}

export default LoansPage
