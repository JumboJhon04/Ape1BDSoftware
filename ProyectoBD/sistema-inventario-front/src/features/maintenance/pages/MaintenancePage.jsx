import { useEffect, useState } from 'react'
import { Eye, Check, X, Wrench } from 'lucide-react'
import ModulePageShell from '@/shared/components/ModulePageShell'
import { getNotifications } from '@/features/notifications/services/notifications.service'
import { getInventoryCatalog } from '@/features/inventory/services/inventory.service'
import useAuth from '@/core/auth/useAuth'
import { getAllMaintenances, startMaintenance, finishMaintenance } from '../services/maintenance.service'

function MaintenancePage() {
  const [reports, setReports] = useState([])
  const [maintenances, setMaintenances] = useState([])
  const [loading, setLoading] = useState(true)
  const { role: currentRole } = useAuth()

  // create modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createError, setCreateError] = useState('')
  const [articles, setArticles] = useState([])

  // view modal
  const [selectedItem, setSelectedItem] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [finishingItem, setFinishingItem] = useState(null)
  const [finishSubmitting, setFinishSubmitting] = useState(false)
  const [finishError, setFinishError] = useState('')
  const [finishForm, setFinishForm] = useState({ costo: '' })

  // simple filter state
  const [filters, setFilters] = useState({ estado: 'Todos', tipo: 'Todos', equipo: '' })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [n, m, a] = await Promise.all([getNotifications(), getAllMaintenances(), getInventoryCatalog()])
      setReports(n)
      setMaintenances(m)
      setArticles((Array.isArray(a) ? a : []).filter((item) => String(item.estado ?? '').toLowerCase() === 'disponible'))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const applyFilters = () => {
    // for now filters are client-side and simple; reload data if needed
    // kept minimal per request
  }

  const handleStartFromReport = async (report) => {
    // open a quick confirm modal would be better; keep simple: start maintenance with defaults
    try {
      await startMaintenance({ IdArticulo: report.idArticulo ?? 0, Tipo: 'Correctivo', ProveedorTecnico: null })
      await loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const openView = (item) => {
    setSelectedItem(item)
    setShowViewModal(true)
  }

  const openCreate = () => {
    setCreateError('')
    setShowCreateModal(true)
  }

  const handleCreateSubmit = async (form) => {
    setCreateSubmitting(true)
    try {
      await startMaintenance({ IdArticulo: Number(form.idArticulo), Tipo: form.tipo, ProveedorTecnico: form.proveedor, Descripcion: form.descripcion })
      setShowCreateModal(false)
      await loadData()
    } catch (err) {
      setCreateError(err.response?.data?.error ?? 'No se pudo programar mantenimiento')
      console.error(err)
    } finally {
      setCreateSubmitting(false)
    }
  }

  const handleFinish = async (m) => {
    setFinishingItem(m)
    setFinishError('')
    setFinishForm({ costo: '' })
    setShowFinishModal(true)
  }

  const confirmFinish = async () => {
    if (!finishingItem) return

    const costoNormalizado = Number(String(finishForm.costo).replace(',', '.'))
    if (Number.isNaN(costoNormalizado) || costoNormalizado < 0) {
      setFinishError('Ingresa un costo válido mayor o igual a cero.')
      return
    }

    setFinishSubmitting(true)
    try {
      await finishMaintenance({
        IdMantenimiento: finishingItem.idMantenimiento ?? finishingItem.id,
        Costo: costoNormalizado,
      })
      await loadData()
      setShowFinishModal(false)
      setFinishingItem(null)
    } catch (err) {
      setFinishError(err.response?.data?.error ?? 'No se pudo finalizar el mantenimiento.')
      console.error(err)
    } finally {
      setFinishSubmitting(false)
    }
  }

  const allMaintenances = maintenances

  return (
    <>
      <ModulePageShell title="Módulo de Mantenimientos" description="Gestiona reportes, programación y cierre de mantenimientos.">
      <section className="inventory-filters-card">
        <div className="inventory-filter-grid">
          <label>
            <span>Estado</span>
            <select name="estado" value={filters.estado} onChange={handleFilterChange}>
              <option>Todos</option>
              <option>En Progreso</option>
              <option>Programado</option>
              <option>Completado</option>
            </select>
          </label>

          <label>
            <span>Tipo de Mantenimiento</span>
            <select name="tipo" value={filters.tipo} onChange={handleFilterChange}>
              <option>Todos</option>
              <option>Preventivo</option>
              <option>Correctivo</option>
            </select>
          </label>

          <label>
            <span>Equipo</span>
            <div style={{ position: 'relative' }}>
              <input type="text" name="equipo" value={filters.equipo} onChange={handleFilterChange} placeholder="Buscar equipo..." />
            </div>
          </label>

          <div className="inventory-filter-actions">
            <button className="btn btn-primary" onClick={() => { applyFilters() }}>Aplicar Filtros</button>
          </div>
        </div>
      </section>

      <div className="inventory-table-toolbar" style={{ marginTop: 8 }}>
        <div>
          <h3>Tabla de Reportes(Equipos)</h3>
          <p>Reportes recientes enviados por usuarios</p>
        </div>
      </div>

      <div className="inventory-table-card" style={{ marginBottom: 18 }}>
        <div className="inventory-table-head inventory-grid" style={{ gridTemplateColumns: '140px 1.2fr 160px 1fr 1fr 160px' }}>
          <span>ID</span>
          <span>Equipo</span>
          <span>Ubicación</span>
          <span>Fecha Reporte</span>
          <span>Descripción</span>
          <span>Acciones</span>
        </div>

        <div className="inventory-table-body">
          {loading ? (
            <p className="users-empty">Cargando reportes...</p>
          ) : reports.length === 0 ? (
            <p className="users-empty">No hay reportes.</p>
          ) : (
            reports.map((r) => (
              <div key={r.idNotificacion ?? r.id} className="inventory-table-row inventory-grid" style={{ gridTemplateColumns: '140px 1.2fr 160px 1fr 1fr 160px' }}>
                <span style={{ fontWeight: 700 }}>{r.codigo ?? `REP${String(r.idNotificacion ?? r.id ?? 0).padStart(3, '0')}`}</span>
                <span>{r.articuloNombre ?? r.titulo ?? r.mensaje ?? '-'}</span>
                <span>{r.ubicacion ?? r.espacio ?? '-'}</span>
                <span>{new Date(r.fecha ?? r.fechaCreacion ?? Date.now()).toLocaleDateString()}</span>
                <span style={{ fontSize: '0.9rem' }}>{r.descripcion ?? r.mensaje ?? '-'}</span>
                <span className="inventory-actions">
                  <button className="inventory-icon-button inventory-icon-button-view" title="Ver detalles" aria-label="Ver detalles" onClick={() => openView(r)}>
                    <Eye size={16} />
                  </button>
                  <button className="inventory-icon-button" style={{ background: '#22c55e' }} title="Iniciar mantenimiento" aria-label="Iniciar mantenimiento" onClick={() => handleStartFromReport(r)}>
                    <Wrench size={16} />
                  </button>
                  <button className="inventory-icon-button inventory-icon-button-delete" title="Ignorar reporte" aria-label="Ignorar reporte" onClick={() => setReports(prev => prev.filter(x => x !== r))}>
                    <X size={16} />
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="inventory-table-toolbar">
        <div>
          <h3>Tabla de Mantenimientos</h3>
          <p>Programados, en progreso y finalizados</p>
        </div>
        {currentRole === 'administrador' ? (
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={openCreate}>
            <Wrench size={16} /> Programar Nuevo Mantenimiento
          </button>
        ) : null}
      </div>

      <div className="inventory-table-card">
        <div className="inventory-table-head inventory-grid" style={{ gridTemplateColumns: '140px 1.4fr 1fr 1fr 160px' }}>
          <span>ID</span>
          <span>Equipo</span>
          <span>Tipo</span>
          <span>Fecha Inicio</span>
          <span>Acciones</span>
        </div>

        <div className="inventory-table-body">
          {loading ? (
            <p className="users-empty">Cargando mantenimientos...</p>
          ) : allMaintenances.length === 0 ? (
            <p className="users-empty">No hay mantenimientos registrados.</p>
          ) : (
            allMaintenances.map((m) => (
              <div key={m.idMantenimiento ?? m.id} className="inventory-table-row inventory-grid" style={{ gridTemplateColumns: '140px 1.4fr 1fr 1fr 160px' }}>
                <span style={{ fontWeight: 700 }}>{m.codigo ?? `MNT${String(m.idMantenimiento ?? m.id ?? 0).padStart(3, '0')}`}</span>
                <span>{m.articulo ?? m.articuloNombre ?? '-'}</span>
                <span>{m.tipo ?? m.tipoMantenimiento ?? '-'}</span>
                <span>{m.fechaInicio ? new Date(m.fechaInicio).toLocaleDateString() : (m.fechaFin ? new Date(m.fechaFin).toLocaleDateString() : '-')}</span>
                <span className="inventory-actions">
                  <button className="inventory-icon-button inventory-icon-button-view" title="Ver detalles" aria-label="Ver detalles" onClick={() => openView(m)}>
                    <Eye size={16} />
                  </button>
                  {String(m.estado ?? m.estadoMantenimiento ?? '').toLowerCase() === 'finalizado' ? (
                    <span className="dashboard-status-chip dashboard-status-chip-success" style={{ fontSize: '0.75rem' }}>Finalizado</span>
                  ) : (
                    <button className="inventory-icon-button" style={{ background: '#f97316' }} title="Finalizar mantenimiento" aria-label="Finalizar mantenimiento" onClick={() => handleFinish(m)}>
                      <Check size={16} />
                    </button>
                  )}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
      </ModulePageShell>
      <CreateMaintenanceModal show={showCreateModal} onClose={() => setShowCreateModal(false)} onSubmit={handleCreateSubmit} submitting={createSubmitting} error={createError} articles={articles} />
      <ViewModal show={showViewModal} item={selectedItem} onClose={() => setShowViewModal(false)} />
      <FinishMaintenanceModal
        show={showFinishModal}
        item={finishingItem}
        submitting={finishSubmitting}
        error={finishError}
        form={finishForm}
        setForm={setFinishForm}
        onClose={() => !finishSubmitting && setShowFinishModal(false)}
        onSubmit={confirmFinish}
      />
    </>
  )
}

export default MaintenancePage

function CreateMaintenanceModal({ show, onClose, onSubmit, submitting, error, articles }) {
  const [form, setForm] = useState({ idArticulo: '', tipo: 'Preventivo', proveedor: '', descripcion: '' })

  if (!show) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    if (!form.idArticulo) return
    onSubmit(form)
  }

  const selectedArticle = articles.find((item) => String(item.idArticulo ?? item.id) === String(form.idArticulo))

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.68)' }} role="presentation" onClick={() => !submitting && onClose()}>
      <section className="modal-card" style={{ maxWidth: 640, position: 'relative', zIndex: 10000, padding: 0, overflow: 'hidden', borderRadius: 16 }} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#c0392b', color: '#fff', display: 'grid', placeItems: 'center' }}>
              <Wrench size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Programar Mantenimiento</h2>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>Selecciona un artículo disponible para registrar el mantenimiento.</p>
            </div>
          </div>
          <button type="button" className="icon-button" onClick={() => onClose()}>
            <X size={18} />
          </button>
        </header>
        <div className="articulo-modal-body" style={{ padding: 28, background: '#fff', maxHeight: '70vh', overflowY: 'auto' }}>
          {error ? (
            <div style={{
              padding: 12,
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              color: '#991b1b',
              fontSize: '0.9rem',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <X size={16} />
              {error}
            </div>
          ) : null}
          
          <div style={{ display: 'grid', gap: 18 }}>
            {/* Artículo */}
            <div>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', display: 'block' }}>Artículo *</span>
              </label>
              <select 
                name="idArticulo" 
                value={form.idArticulo} 
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid ' + (form.idArticulo ? '#10b981' : '#cbd5e1'),
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  background: '#fff',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s'
                }}
              >
                <option value="">Seleccione un artículo...</option>
                {articles.map((a) => (
                  <option key={a.idArticulo ?? a.id} value={a.idArticulo ?? a.id}>{a.nombre ?? a.nombreArticulo}</option>
                ))}
              </select>
            </div>

            {/* Tipo */}
            <div>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', display: 'block' }}>Tipo de Mantenimiento *</span>
              </label>
              <select 
                name="tipo" 
                value={form.tipo} 
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  background: '#fff',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s'
                }}
              >
                <option>Preventivo</option>
                <option>Correctivo</option>
              </select>
            </div>

            {/* Vista previa */}
            {selectedArticle && (
              <div style={{ padding: 16, borderRadius: 12, background: '#f0fdf4', border: '2px solid #86efac' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontWeight: 600, color: '#166534', fontSize: '0.9rem' }}>Artículo seleccionado</span>
                  <span style={{ background: '#22c55e', color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>✓ Disponible</span>
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#65a30d', textTransform: 'uppercase', letterSpacing: 0.5 }}>Equipo</p>
                    <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 600, color: '#15803d' }}>{selectedArticle.nombre ?? selectedArticle.nombreArticulo ?? '-'}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#65a30d', textTransform: 'uppercase', letterSpacing: 0.5 }}>Código</p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#22c55e', fontWeight: 500 }}>#{String(selectedArticle.idArticulo ?? selectedArticle.id).padStart(3, '0')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Proveedor técnico */}
            <div>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', display: 'block' }}>
                  Proveedor técnico
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400, marginLeft: 4 }}>Opcional</span>
                </span>
              </label>
              <input 
                name="proveedor" 
                value={form.proveedor} 
                onChange={handleChange} 
                placeholder="Ej: Tech Solutions S.A."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  background: '#fff',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>

            {/* Descripción */}
            <div>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', display: 'block' }}>
                  Descripción
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400, marginLeft: 4 }}>Opcional</span>
                </span>
              </label>
              <textarea 
                name="descripcion" 
                value={form.descripcion} 
                onChange={handleChange} 
                rows={3}
                placeholder="Describe el mantenimiento a realizar..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  background: '#fff',
                  resize: 'vertical',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>
          </div>
        </div>
        <footer className="users-form-footer" style={{ padding: '16px 28px', display: 'flex', gap: 10, justifyContent: 'flex-end', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <button 
            className="btn btn-ghost" 
            type="button" 
            onClick={() => onClose()} 
            disabled={submitting}
            style={{ padding: '10px 16px', fontSize: '0.9rem', fontWeight: 500 }}
          >
            Cancelar
          </button>
          <button 
            className="btn btn-primary" 
            type="button" 
            onClick={handleSubmit} 
            disabled={submitting || !form.idArticulo}
            style={{ padding: '10px 20px', fontSize: '0.9rem', fontWeight: 500 }}
          >
            {submitting ? 'Programando...' : 'Programar'}
          </button>
        </footer>
      </section>
    </div>
  )
}

function ViewModal({ show, item, onClose }) {
  if (!show || !item) return null

  const isReport = Boolean(item.idNotificacion || item.mensaje)
  const estado = item.estado ?? item.estadoMantenimiento ?? '-'
  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.68)' }} role="presentation" onClick={() => onClose()}>
      <section className="modal-card" style={{ maxWidth: 620, position: 'relative', zIndex: 10000, padding: 0, overflow: 'hidden', borderRadius: 16 }} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: isReport ? '#475569' : '#c0392b', color: '#fff', display: 'grid', placeItems: 'center' }}>
              <Eye size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0 }}>{isReport ? 'Detalle del Reporte' : 'Detalle del Mantenimiento'}</h2>
              <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.88rem' }}>Información resumida del registro seleccionado.</p>
            </div>
          </div>
          <button type="button" className="icon-button" onClick={() => onClose()}>
            <X size={18} />
          </button>
        </header>
        <div className="articulo-modal-body" style={{ padding: 22, background: '#fff' }}>
          {isReport ? (
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Solicitante</p>
                  <strong style={{ color: '#1e293b' }}>{item.usuario ?? item.nombreUsuario ?? '-'}</strong>
                </div>
                <div style={{ padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Equipo</p>
                  <strong style={{ color: '#1e293b' }}>{item.articuloNombre ?? item.titulo ?? '-'}</strong>
                </div>
              </div>
              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Fecha</p>
                <strong style={{ color: '#1e293b' }}>{new Date(item.fecha ?? item.fechaCreacion ?? Date.now()).toLocaleString()}</strong>
              </div>
              <div style={{ padding: 14, background: '#fff7ed', borderRadius: 12, border: '1px solid #fed7aa' }}>
                <p style={{ margin: 0, fontSize: 12, color: '#9a3412' }}>Descripción</p>
                <p style={{ margin: '6px 0 0', color: '#7c2d12', lineHeight: 1.5 }}>{item.descripcion ?? item.mensaje}</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Artículo</p>
                  <strong style={{ color: '#1e293b' }}>{item.articulo ?? item.articuloNombre ?? '-'}</strong>
                </div>
                <div style={{ padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Tipo</p>
                  <strong style={{ color: '#1e293b' }}>{item.tipo ?? item.tipoMantenimiento ?? '-'}</strong>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Fecha Inicio</p>
                  <strong style={{ color: '#1e293b' }}>{item.fechaInicio ? new Date(item.fechaInicio).toLocaleString() : '-'}</strong>
                </div>
                <div style={{ padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Fecha Fin</p>
                  <strong style={{ color: '#1e293b' }}>{item.fechaFin ? new Date(item.fechaFin).toLocaleString() : '-'}</strong>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Estado</p>
                  <span className="dashboard-status-chip" style={{ marginTop: 6, display: 'inline-flex' }}>{estado}</span>
                </div>
                <div style={{ padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Costo</p>
                  <strong style={{ color: '#1e293b' }}>{item.costo ?? '-'}</strong>
                </div>
              </div>
              {item.descripcion ? (
                <div style={{ padding: 14, background: '#fff7ed', borderRadius: 12, border: '1px solid #fed7aa' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#9a3412' }}>Descripción</p>
                  <p style={{ margin: '6px 0 0', color: '#7c2d12', lineHeight: 1.5 }}>{item.descripcion}</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
        <footer className="users-form-footer" style={{ padding: '14px 16px', display: 'flex', gap: 8, justifyContent: 'flex-end', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <button className="btn btn-primary" type="button" onClick={() => onClose()}>Cerrar</button>
        </footer>
      </section>
    </div>
  )
}

function FinishMaintenanceModal({ show, item, submitting, error, form, setForm, onClose, onSubmit }) {
  if (!show || !item) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.68)' }} role="presentation" onClick={() => !submitting && onClose()}>
      <section className="modal-card" style={{ maxWidth: 560, position: 'relative', zIndex: 10000, padding: 0, overflow: 'hidden', borderRadius: 16 }} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: '#f97316', color: '#fff', display: 'grid', placeItems: 'center' }}>
              <Check size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0 }}>Finalizar mantenimiento</h2>
              <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                Confirma el costo y deja una nota final antes de cerrar el registro.
              </p>
            </div>
          </div>
          <button type="button" className="icon-button" onClick={() => onClose()}>
            <X size={18} />
          </button>
        </header>

        <div className="articulo-modal-body" style={{ padding: 24, background: '#fff' }}>
          <div style={{ display: 'grid', gap: 18 }}>
            {/* Información del artículo */}
            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Artículo</p>
              <strong style={{ color: '#1e293b', fontSize: '1rem', display: 'block', marginTop: 6 }}>{item.articulo ?? item.articuloNombre ?? '-'}</strong>
              {item.fechaInicio && (
                <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Iniciado: {new Date(item.fechaInicio).toLocaleDateString('es-ES')}
                </p>
              )}
            </div>

            {/* Costo final */}
            <div>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  Costo final
                  {form.costo && form.costo > 0 && <span style={{ fontSize: '0.75rem', background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: 4 }}>Válido</span>}
                </span>
              </label>
              <input
                type="number"
                name="costo"
                min="0"
                step="0.01"
                value={form.costo}
                onChange={handleChange}
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid ' + (form.costo && form.costo > 0 ? '#10b981' : '#cbd5e1'),
                  fontSize: '1rem',
                  fontWeight: 500,
                  background: '#fff',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>

            {error ? (
              <div style={{
                padding: 12,
                background: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: 8,
                color: '#991b1b',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <X size={16} />
                {error}
              </div>
            ) : null}
          </div>
        </div>

        <footer className="users-form-footer" style={{ padding: '16px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <button 
            className="btn btn-ghost" 
            type="button" 
            onClick={() => onClose()} 
            disabled={submitting}
            style={{ padding: '10px 16px', fontSize: '0.9rem', fontWeight: 500 }}
          >
            Cancelar
          </button>
          <button 
            className="btn btn-primary" 
            type="button" 
            onClick={onSubmit} 
            disabled={submitting || !form.costo || form.costo <= 0}
            style={{ padding: '10px 20px', fontSize: '0.9rem', fontWeight: 500 }}
          >
            {submitting ? 'Procesando...' : 'Confirmar cierre'}
          </button>
        </footer>
      </section>
    </div>
  )
}

// render modals in the page via portal-like inclusion
/* eslint-disable react/jsx-no-bind */
