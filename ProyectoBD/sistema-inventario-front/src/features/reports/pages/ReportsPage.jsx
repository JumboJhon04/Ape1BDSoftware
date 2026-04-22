import ModulePageShell from '@/shared/components/ModulePageShell'

function ReportsPage() {
  return (
    <ModulePageShell
      title="Informes y Auditoria"
      description="Seccion preparada para reportes y trazabilidad de acciones."
    >
      <div className="panel-placeholder">
        <h3>Reportes</h3>
        <p>Aqui conectaremos filtros, exportacion y bitacora de auditoria.</p>
      </div>
    </ModulePageShell>
  )
}

export default ReportsPage
