import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Plus, AlertTriangle, X, Check, Wrench } from 'lucide-react'
import ModulePageShell from '@/shared/components/ModulePageShell'
import useAuth from '@/core/auth/useAuth'
import { getAllLoans } from '../services/loans.service'
import { startMaintenance } from '@/features/maintenance/services/maintenance.service'
import { formatDateISO, normalizeText, pick } from '@/features/dashboard/utils/dashboardFormat'

const ITEMS_PER_PAGE = 5

function getStatusClass(status) {
  switch (String(status ?? '')) {
    case 'Pendiente':
      return 'dashboard-status-chip-warning'
    case 'Activo':
      return 'dashboard-status-chip-info'
    case 'Finalizado':
      return 'dashboard-status-chip-success'
    case 'Vencido':
      return 'dashboard-status-chip-danger'
    case 'Rechazado':
      return 'dashboard-status-chip-neutral'
    default:
      return 'dashboard-status-chip-neutral'
  }
}

function formatCellDate(value) {
  return formatDateISO(value)
}

function sameUserName(a, b) {
  return normalizeText(a) === normalizeText(b)
}

function MyLoansPage() {
  const navigate = useNavigate()
  const { userName } = useAuth()

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loans, setLoans] = useState([])
  const [page, setPage] = useState(1)
  const [appliedEstado, setAppliedEstado] = useState('Todos')
  const [searchTerm, setSearchTerm] = useState('')

  // Modal para reportar fallo
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportingLoan, setReportingLoan] = useState(null)
  const [reportForm, setReportForm] = useState({ idArticulo: '', descripcion: '' })
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportError, setReportError] = useState('')

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setLoading(true)
      setErrorMessage('')
      setSuccessMessage('')
      try {
        const data = await getAllLoans()
        if (!isMounted) return
        setLoans(Array.isArray(data) ? data : [])
      } catch (error) {
        if (!isMounted) return
        setErrorMessage('No se pudo cargar tu historial de préstamos.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [])

  const myLoans = useMemo(() => {
    if (!userName?.trim()) return []
    return loans.filter((loan) => sameUserName(pick(loan, 'nombreUsuario', 'NombreUsuario') ?? '', userName))
  }, [loans, userName])

  const filteredLoans = useMemo(() => {
    return myLoans.filter((loan) => {
      const estado = pick(loan, 'estado', 'Estado') ?? ''
      if (appliedEstado !== 'Todos' && estado !== appliedEstado) return false

      if (searchTerm.trim()) {
        const terms = searchTerm.toLowerCase().split(' ')
        const articleStr = String(pick(loan, 'articulos', 'Articulos') ?? '').toLowerCase()
        const idStr = String(pick(loan, 'idPrestamo', 'IdPrestamo') ?? '')

        const matches = terms.every(term =>
          articleStr.includes(term) || idStr.includes(term)
        )
        if (!matches) return false
      }
      return true
    })
  }, [myLoans, appliedEstado, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredLoans.length / ITEMS_PER_PAGE))
  const pageSafe = Math.min(page, totalPages)
  const pageStart = (pageSafe - 1) * ITEMS_PER_PAGE
  const paginatedLoans = filteredLoans.slice(pageStart, pageStart + ITEMS_PER_PAGE)
  const visibleFrom = filteredLoans.length === 0 ? 0 : pageStart + 1
  const visibleTo = Math.min(pageStart + ITEMS_PER_PAGE, filteredLoans.length)

  const handleOpenReportModal = (loan) => {
    setReportingLoan(loan)
    const articulosIds = pick(loan, 'idArticulos', 'IdArticulos') ?? []
    setReportForm({
      idArticulo: articulosIds.length > 0 ? articulosIds[0] : '',
      descripcion: ''
    })
    setReportError('')
    setShowReportModal(true)
  }

  const [successModal, setSuccessModal] = useState({ show: false, message: '', title: '' })

  const handleSubmitReport = async () => {
    // Validar que tengamos un préstamo y un artículo seleccionado
    if (!reportingLoan) {
      setReportError('Error: préstamo no encontrado')
      return
    }

    const idArticuloNum = Number(reportForm.idArticulo)
    if (!reportForm.idArticulo || idArticuloNum <= 0) {
      setReportError('Por favor selecciona un artículo válido')
      return
    }

    setReportSubmitting(true)
    try {
      const payload = {
        IdArticulo: idArticuloNum,
        Tipo: 'Correctivo',
        Descripcion: reportForm.descripcion?.trim() || undefined
      }

      await startMaintenance(payload)
      setShowReportModal(false)
      setReportingLoan(null)
      setReportForm({ idArticulo: '', descripcion: '' })

      setSuccessModal({
        show: true,
        title: 'Reporte Enviado',
        message: 'Tu reporte de fallo fue enviado correctamente. El administrador lo revisará y se pondrá en contacto pronto.'
      })

      // Recargar datos para reflejar el cambio
      const data = await getAllLoans()
      setLoans(Array.isArray(data) ? data : [])
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'No se pudo reportar el fallo'
      setReportError(errorMsg)
      console.error('Error reporting fallo:', err)
    } finally {
      setReportSubmitting(false)
    }
  }

  return (
    <>
      <ModulePageShell
        title="Mis Préstamos"
        description="Consulta tus préstamos, revisa fechas y gestiona incidencias de tus equipos."
      >
        {errorMessage ? <p className="feedback-error mb-4">{errorMessage}</p> : null}
        {successMessage ? <p className="feedback-success mb-4">{successMessage}</p> : null}

        <section className="inventory-filters-card my-loans-filters-card">
          <div className="inventory-filter-grid my-loans-filter-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
            <label>
              <span>Estado</span>
              <select value={appliedEstado} onChange={(e) => { setAppliedEstado(e.target.value); setPage(1); }}>
                <option value="Todos">Todos</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Activo">Activo</option>
                <option value="Vencido">Vencido</option>
                <option value="Finalizado">Finalizado</option>
                <option value="Rechazado">Rechazado</option>
              </select>
            </label>
            <label>
              <span>Buscar artículo</span>
              <input
                type="text"
                placeholder="Nombre del equipo..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
              />
            </label>
          </div>
        </section>

        <div className="inventory-table-toolbar my-loans-toolbar">
          <div>
            <h3>Mis préstamos</h3>
            <p>
              Mostrando {visibleFrom}-{visibleTo} de {filteredLoans.length} registros
            </p>
          </div>
          <button
            className="btn btn-primary my-loans-new-button"
            type="button"
            onClick={() => navigate('/inventario')}
          >
            <Plus size={18} /> Nuevo Préstamo
          </button>
        </div>

        {loading ? (
          <p className="users-empty">Cargando tus préstamos...</p>
        ) : filteredLoans.length === 0 ? (
          <div className="my-loans-empty-state">
            <AlertTriangle size={22} aria-hidden="true" />
            <div>
              <strong>No tienes préstamos para mostrar.</strong>
              <p>Prueba otro filtro o solicita un equipo desde el catálogo.</p>
            </div>
          </div>
        ) : (
          <div className="inventory-table-card my-loans-table-card">
            <div className="inventory-table-head my-loans-grid">
              <span>ID Préstamo</span>
              <span>Artículo</span>
              <span>Fecha Salida</span>
              <span>Fecha Prevista</span>
              <span>Autorizado por</span>
              <span>Estado</span>
              <span>Acciones</span>
              <span>Fecha devolución real</span>
            </div>

            <div className="inventory-table-body">
              {paginatedLoans.map((loan) => {
                const estado = pick(loan, 'estado', 'Estado') ?? '-'
                const autorizadoPor =
                  pick(loan, 'nombreAdminAutoriza', 'NombreAdminAutoriza', 'autorizadoPor', 'AutorizadoPor') ?? '—'
                const canReportIssue = estado === 'Activo' || estado === 'Vencido'
                return (
                  <div key={loan.idPrestamo} className="inventory-table-row my-loans-grid">
                    <span className="my-loans-id">#{String(loan.idPrestamo).padStart(3, '0')}</span>
                    <span className="my-loans-article">{pick(loan, 'articulos', 'Articulos') ?? '-'}</span>
                    <span>{formatCellDate(pick(loan, 'fechaSalida', 'FechaSalida'))}</span>
                    <span>{formatCellDate(pick(loan, 'fechaPrevista', 'FechaPrevista'))}</span>
                    <span>{String(autorizadoPor) || '—'}</span>
                    <span>
                      <span className={`dashboard-status-chip ${getStatusClass(estado)}`}>{estado}</span>
                    </span>
                    <span className="inventory-actions">
                      {canReportIssue ? (
                        <button
                          type="button"
                          className="btn my-loans-action-button my-loans-action-button-report"
                          title="Reportar fallo"
                          aria-label="Reportar fallo"
                          onClick={() => handleOpenReportModal(loan)}
                        >
                          <Bell size={16} />
                          Reportar fallo
                        </button>
                      ) : (
                        <span className="my-loans-action-empty">—</span>
                      )}
                    </span>
                    <span>{formatCellDate(pick(loan, 'fechaDevolucionReal', 'FechaDevolucionReal'))}</span>
                  </div>
                )
              })}
            </div>

            {filteredLoans.length > 0 ? (
              <div className="dashboard-pagination-row inventory-pagination-row">
                <button
                  type="button"
                  className="dashboard-page-button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pageSafe === 1}
                >
                  Anterior
                </button>
                <div className="dashboard-page-numbers">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`dashboard-page-button dashboard-page-number ${num === pageSafe ? 'dashboard-page-number-active' : ''}`}
                      onClick={() => setPage(num)}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <span className="dashboard-page-info">Página {pageSafe} de {totalPages}</span>
                <button
                  type="button"
                  className="dashboard-page-button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={pageSafe === totalPages}
                >
                  Siguiente
                </button>
              </div>
            ) : null}
          </div>
        )}


      </ModulePageShell>
      {showReportModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.68)' }} role="presentation" onClick={() => !reportSubmitting && setShowReportModal(false)}>
          <section className="modal-card" style={{ maxWidth: 560, position: 'relative', zIndex: 10000, padding: 0, overflow: 'hidden', borderRadius: 16 }} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: '#f59e0b', color: '#fff', display: 'grid', placeItems: 'center' }}>
                  <Wrench size={18} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Reportar Fallo</h2>
                  <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.88rem' }}>¿El equipo presenta problemas? Repórtalo aquí.</p>
                </div>
              </div>
              <button type="button" className="icon-button" onClick={() => setShowReportModal(false)}>
                <X size={18} />
              </button>
            </header>
            <div style={{ padding: 24, background: '#fff' }}>
              {reportError && (
                <div style={{ padding: 12, background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, color: '#991b1b', fontSize: '0.9rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <X size={16} />
                  {reportError}
                </div>
              )}

              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>
                    Artículo a reportar *
                  </label>
                  {(() => {
                    const articulosIds = pick(reportingLoan, 'idArticulos', 'IdArticulos') ?? []
                    const articulos = pick(reportingLoan, 'articulos', 'Articulos') ?? ''
                    const articulosList = articulos.split(', ').filter(Boolean)

                    if (!articulosIds || articulosIds.length === 0) {
                      return (
                        <div style={{ padding: '10px', color: '#64748b', fontSize: '0.9rem' }}>
                          No hay artículos en este préstamo.
                        </div>
                      )
                    }

                    return (
                      <select
                        value={reportForm.idArticulo}
                        onChange={(e) => setReportForm({ ...reportForm, idArticulo: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1px solid #cbd5e1',
                          fontSize: '0.95rem',
                          background: '#fff'
                        }}
                      >
                        <option value="">Selecciona un artículo</option>
                        {articulosIds.map((id, index) => {
                          const nombreStr = articulosList[index] || `Artículo ID: ${id}`
                          return (
                            <option key={id} value={id}>
                              {nombreStr}
                            </option>
                          )
                        })}
                      </select>
                    )
                  })()}
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>
                    Descripción del problema *
                  </label>
                  <textarea
                    rows={4}
                    value={reportForm.descripcion}
                    onChange={(e) => setReportForm({ ...reportForm, descripcion: e.target.value })}
                    placeholder="Describe qué fallo o problema presenta el equipo..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      fontFamily: 'inherit',
                      background: '#fff',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            </div>
            <div style={{ padding: '16px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowReportModal(false)}
                disabled={reportSubmitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmitReport}
                disabled={reportSubmitting || !reportForm.idArticulo}
              >
                {reportSubmitting ? 'Reportando...' : 'Reportar Fallo'}
              </button>
            </div>
          </section>
        </div>
      )}
      <SuccessModal
        show={successModal.show}
        title={successModal.title}
        message={successModal.message}
        onClose={() => setSuccessModal({ show: false, message: '', title: '' })}
      />
    </>
  )
}

export default MyLoansPage

function SuccessModal({ show, message, title = "Operación exitosa", onClose }) {
  if (!show) return null

  return (
    <div
      className="modal-backdrop"
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.68)', display: 'grid', placeItems: 'center' }}
      role="presentation"
      onClick={onClose}
    >
      <section
        className="modal-card"
        style={{ maxWidth: 480, width: '90%', padding: 0, overflow: 'hidden', borderRadius: 16 }}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header" style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#16a34a', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Check size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#166534' }}>{title}</h2>
              <p style={{ margin: '2px 0 0', color: '#15803d', fontSize: '0.82rem' }}>La acción se completó correctamente.</p>
            </div>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div style={{ padding: 24, background: '#fff' }}>
          <div style={{
            padding: 16,
            background: '#f0fdfa',
            border: '1px solid #ccfbf1',
            borderRadius: 12,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start'
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ccfbf1', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2 }}>
              <Check size={16} color="#0d9488" />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: '#115e59', fontSize: '0.9rem', marginBottom: 4 }}>Detalle</p>
              <p style={{ margin: 0, color: '#0f766e', fontSize: '0.95rem', lineHeight: 1.6 }}>{message}</p>
            </div>
          </div>
        </div>

        <footer style={{ padding: '14px 24px', display: 'flex', justifyContent: 'flex-end', background: '#f0fdf4', borderTop: '1px solid #bbf7d0' }}>
          <button className="btn btn-primary" style={{ background: '#16a34a', borderColor: '#16a34a' }} type="button" onClick={onClose}>
            Aceptar
          </button>
        </footer>
      </section>
    </div>
  )
}