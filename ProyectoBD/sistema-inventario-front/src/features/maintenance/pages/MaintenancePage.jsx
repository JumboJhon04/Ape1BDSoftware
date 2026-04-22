import ModulePageShell from '@/shared/components/ModulePageShell'

function MaintenancePage() {
  return (
    <ModulePageShell
      title="Mantenimiento"
      description="Base lista para mantenimientos preventivos y correctivos."
    >
      <div className="panel-placeholder">
        <h3>Control de Mantenimientos</h3>
        <p>Registraremos fechas, estados y evidencia de mantenimiento.</p>
      </div>
    </ModulePageShell>
  )
}

export default MaintenancePage
