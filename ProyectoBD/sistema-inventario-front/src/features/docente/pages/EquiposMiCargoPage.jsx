import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Bell, Check, Wrench, X } from 'lucide-react'
import ModulePageShell from '@/shared/components/ModulePageShell'
import useAuth from '@/core/auth/useAuth'
import { getInventoryCatalog } from '@/features/inventory/services/inventory.service'
import { startMaintenance } from '@/features/maintenance/services/maintenance.service'
import { normalizeText, pick } from '@/features/dashboard/utils/dashboardFormat'

function sameId(a, b) {
  if (a == null || b == null) return false
  return Number(a) === Number(b)
}

function getStatusChipClass(estado) {
  switch (normalizeText(estado)) {
    case 'disponible':
      return 'dashboard-status-chip docente-equipos-status-disponible'
    case 'prestado':
      return 'dashboard-status-chip docente-equipos-status-prestado'
    case 'enmantenimiento':
    case 'mantenimiento':
      return 'dashboard-status-chip docente-equipos-status-mantenimiento'
    case 'dadodebaja':
      return 'dashboard-status-chip docente-equipos-status-baja'
    case 'vencido':
      return 'dashboard-status-chip docente-equipos-status-vencido'
    default:
      return 'dashboard-status-chip docente-equipos-status-neutral'
  }
}

function getStatusLabel(estado) {
  const normalized = normalizeText(estado)

  switch (normalized) {
    case 'disponible':
      return 'Disponible'
    case 'prestado':
      return 'Prestado'
    case 'enmantenimiento':
    case 'mantenimiento':
      return 'En mantenimiento'
    case 'dadodebaja':
      return 'Dado de baja'
    case 'vencido':
      return 'Vencido'
    default:
      return String(estado ?? '—') || '—'
  }
}

function getArticleLabel(item) {
  return pick(item, 'nombre', 'Nombre', 'articulo', 'Articulo') ?? 'Equipo sin nombre'
}

function getArticleSearchText(item) {
  return [
    pick(item, 'nombre', 'Nombre', 'articulo', 'Articulo'),
    pick(item, 'codigoInstitucional', 'CodigoInstitucional', 'codigo', 'Codigo'),
    pick(item, 'numeroSerie', 'NumeroSerie', 'serie', 'Serie'),
    pick(item, 'ubicacion', 'Ubicacion'),
    pick(item, 'estado', 'Estado'),
  ]
    .filter(Boolean)
    .map((value) => normalizeText(value))
    .join(' ')
}

function EquiposMiCargoPage() {
  const { userId, userName } = useAuth()
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [articulos, setArticulos] = useState([])
  const [draftFilters, setDraftFilters] = useState({ estado: 'Todos', equipo: '' })
  const [appliedFilters, setAppliedFilters] = useState({ estado: 'Todos', equipo: '' })

  const [showReportModal, setShowReportModal] = useState(false)
  const [reportingArticulo, setReportingArticulo] = useState(null)
  const [reportForm, setReportForm] = useState({ descripcion: '' })
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportError, setReportError] = useState('')
  const [successModal, setSuccessModal] = useState({ show: false, title: '', message: '' })

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setLoading(true)
      setErrorMessage('')

      try {
        const catalogo = await getInventoryCatalog()
        if (!isMounted) return
        setArticulos(Array.isArray(catalogo) ? catalogo : [])
      } catch (error) {
        if (!isMounted) return
        setErrorMessage(
          error.response?.data?.message ??
            'No se pudo cargar la lista de equipos. Verifica la conexión con el backend.',
        )
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [])

  const articulosMiCargo = useMemo(() => {
    if (userId == null) return []
    return articulos.filter((item) => sameId(item.idResponsable ?? item.IdResponsable, userId))
  }, [articulos, userId])

  const filteredArticulos = useMemo(() => {
    const searchText = normalizeText(appliedFilters.equipo)

    return articulosMiCargo.filter((item) => {
      const estado = normalizeText(pick(item, 'estado', 'Estado') ?? '')
      const matchesEstado = appliedFilters.estado === 'Todos' || estado === normalizeText(appliedFilters.estado)
      const matchesSearch = !searchText || getArticleSearchText(item).includes(searchText)
      return matchesEstado && matchesSearch
    })
  }, [articulosMiCargo, appliedFilters])

  const handleDraftChange = (event) => {
    const { name, value } = event.target
    setDraftFilters((prev) => ({ ...prev, [name]: value }))
  }

  const applyFilters = () => {
    setAppliedFilters(draftFilters)
  }

  const openReportModal = (articulo) => {
    setReportingArticulo(articulo)
    setReportForm({ descripcion: '' })
    setReportError('')
    setShowReportModal(true)
  }

  const closeReportModal = () => {
    if (reportSubmitting) return
    setShowReportModal(false)
    setReportingArticulo(null)
    setReportForm({ descripcion: '' })
    setReportError('')
  }

  const handleSubmitReport = async () => {
    if (!reportingArticulo) {
      setReportError('No se pudo identificar el equipo seleccionado.')
      return
    }

    const descripcion = reportForm.descripcion.trim()
    if (!descripcion) {
      setReportError('Describe el problema del equipo antes de enviarlo.')
      return
    }

    setReportSubmitting(true)
    setReportError('')

    try {
      await startMaintenance({
        IdArticulo: Number(reportingArticulo.idArticulo ?? reportingArticulo.IdArticulo),
        Tipo: 'Correctivo',
        Descripcion: descripcion,
      })

      setShowReportModal(false)
      setReportingArticulo(null)
      setReportForm({ descripcion: '' })
      setSuccessModal({
        show: true,
        title: 'Reporte Enviado',
        message: 'El fallo del equipo fue registrado correctamente. El área de mantenimiento revisará el caso.',
      })
    } catch (error) {
      setReportError(error.response?.data?.error ?? error.response?.data?.message ?? 'No se pudo registrar el reporte.')
    } finally {
      setReportSubmitting(false)
    }
  }

  return (
    <>
      <ModulePageShell
        title="Equipos a mi cargo"
        description={`Consulta los equipos asignados a tu responsabilidad${userName ? `, ${userName}` : ''} y reporta incidencias cuando sea necesario.`}
      >
        {errorMessage ? <p className="feedback-error">{errorMessage}</p> : null}

        <section className="inventory-filters-card">
          <div className="inventory-filter-grid docente-equipos-filter-grid" style={{ gridTemplateColumns: 'minmax(170px, 220px) minmax(0, 1fr) auto' }}>
            <label>
              <span>Estado</span>
              <select name="estado" value={draftFilters.estado} onChange={handleDraftChange}>
                <option value="Todos">Todos</option>
                <option value="Disponible">Disponible</option>
                <option value="Prestado">Prestado</option>
                <option value="En mantenimiento">En mantenimiento</option>
                <option value="Dado de baja">Dado de baja</option>
              </select>
            </label>

            <label>
              <span>Equipo</span>
              <input
                type="text"
                name="equipo"
                value={draftFilters.equipo}
                onChange={handleDraftChange}
                placeholder="Buscar equipo..."
              />
            </label>

            <div className="inventory-filter-actions docente-equipos-filter-actions">
              <button type="button" className="btn btn-primary" onClick={applyFilters}>
                Aplicar filtros
              </button>
            </div>
          </div>
        </section>

        <div className="inventory-table-toolbar docente-equipos-toolbar">
          <div>
            <h3>Mis equipos</h3>
            <p>
              Mostrando {filteredArticulos.length} de {articulosMiCargo.length} registros
            </p>
          </div>
        </div>

        {loading ? (
          <p className="users-empty">Cargando equipos asignados...</p>
        ) : filteredArticulos.length === 0 ? (
          <div className="docente-equipos-empty-state">
            <Bell size={22} aria-hidden="true" />
            <div>
              <strong>No tienes equipos para mostrar.</strong>
              <p>Prueba con otro filtro o revisa si ya cuentas con equipos asignados.</p>
            </div>
          </div>
        ) : (
          <div className="inventory-table-card">
            <div className="inventory-table-head docente-equipos-grid">
              <span>Artículo</span>
              <span>Código institucional</span>
              <span>Número de Serie</span>
              <span>Ubicación</span>
              <span>Estado</span>
              <span>Acciones</span>
            </div>

            <div className="inventory-table-body">
              {filteredArticulos.map((item) => {
                const estado = pick(item, 'estado', 'Estado') ?? '-'
                const idArticulo = item.idArticulo ?? item.IdArticulo
                const canReportIssue = normalizeText(estado) === 'disponible'

                return (
                  <div key={idArticulo} className="inventory-table-row docente-equipos-grid">
                    <span className="docente-equipos-article">{getArticleLabel(item)}</span>
                    <span className="docente-equipos-code">{pick(item, 'codigoInstitucional', 'CodigoInstitucional', 'codigo', 'Codigo') ?? '-'}</span>
                    <span>{pick(item, 'numeroSerie', 'NumeroSerie', 'serie', 'Serie') ?? '-'}</span>
                    <span>{pick(item, 'ubicacion', 'Ubicacion') ?? '-'}</span>
                    <span>
                      <span className={`dashboard-status-chip ${getStatusChipClass(estado)}`}>
                        {getStatusLabel(estado)}
                      </span>
                    </span>
                    <span className="inventory-actions">
                      {canReportIssue ? (
                        <button
                          type="button"
                          className="docente-equipos-action-button"
                          onClick={() => openReportModal(item)}
                        >
                          <Bell size={14} aria-hidden="true" />
                          Reportar fallo
                        </button>
                      ) : (
                        <span className="docente-equipos-action-empty">—</span>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </ModulePageShell>

      {showReportModal ? (
        <div
          className="modal-backdrop"
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.68)' }}
          role="presentation"
          onClick={closeReportModal}
        >
          <section
            className="modal-card"
            style={{ maxWidth: 560, width: '100%', position: 'relative', zIndex: 10000, padding: 0, overflow: 'hidden', borderRadius: 16 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="docente-report-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-header" style={{ background: '#fff7ed', borderBottom: '1px solid #fed7aa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f97316', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Wrench size={18} aria-hidden="true" />
                </div>
                <div>
                  <h2 id="docente-report-modal-title" style={{ fontSize: '1.15rem', color: '#9a3412' }}>
                    Reportar fallo
                  </h2>
                  <p style={{ color: '#c2410c', fontSize: '0.86rem' }}>
                    {getArticleLabel(reportingArticulo)}
                  </p>
                </div>
              </div>
              <button type="button" className="icon-button" onClick={closeReportModal} disabled={reportSubmitting}>
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            <div style={{ padding: 24, background: '#fff' }}>
              {reportError ? (
                <div style={{ padding: 12, background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, color: '#991b1b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <X size={16} aria-hidden="true" />
                  {reportError}
                </div>
              ) : null}

              <label className="form-label" style={{ gap: 8 }}>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>Descripción del problema *</span>
                <textarea
                  rows={5}
                  value={reportForm.descripcion}
                  onChange={(event) => setReportForm({ descripcion: event.target.value })}
                  placeholder="Describe qué fallo presenta el equipo..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    background: '#fff',
                    resize: 'vertical',
                  }}
                />
              </label>
            </div>

            <div style={{ padding: '16px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end', background: '#fff7ed', borderTop: '1px solid #fed7aa' }}>
              <button type="button" className="btn btn-secondary" onClick={closeReportModal} disabled={reportSubmitting}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSubmitReport} disabled={reportSubmitting}>
                {reportSubmitting ? 'Enviando...' : 'Reportar fallo'}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <SuccessModal
        show={successModal.show}
        title={successModal.title}
        message={successModal.message}
        onClose={() => setSuccessModal({ show: false, title: '', message: '' })}
      />
    </>
  )
}

export default EquiposMiCargoPage

function SuccessModal({ show, message, title = 'Operación exitosa', onClose }) {
  if (!show) return null

  return (
    <div
      className="modal-backdrop"
      style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15, 23, 42, 0.68)', display: 'grid', placeItems: 'center' }}
      role="presentation"
      onClick={onClose}
    >
      <section
        className="modal-card"
        style={{ maxWidth: 480, width: '90%', padding: 0, overflow: 'hidden', borderRadius: 16 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="docente-success-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header" style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#16a34a', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Check size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 id="docente-success-modal-title" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#166534' }}>{title}</h2>
              <p style={{ color: '#15803d', fontSize: '0.82rem' }}>La acción se completó correctamente.</p>
            </div>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div style={{ padding: 24, background: '#fff' }}>
          <div style={{ padding: 16, background: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ccfbf1', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Check size={16} color="#0d9488" aria-hidden="true" />
            </div>
            <div>
              <p style={{ fontWeight: 600, color: '#115e59', fontSize: '0.9rem' }}>Detalle</p>
              <p style={{ color: '#0f766e', fontSize: '0.95rem', lineHeight: 1.6 }}>{message}</p>
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