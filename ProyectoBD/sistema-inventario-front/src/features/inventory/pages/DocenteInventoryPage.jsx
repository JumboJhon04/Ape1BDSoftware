import { useEffect, useMemo, useState } from 'react'
import { X, ImageOff, ShoppingBag, Trash2, Check } from 'lucide-react'
import ModulePageShell from '@/shared/components/ModulePageShell'
import useAuth from '@/core/auth/useAuth'
import { getInventoryCatalog, getArticuloImages } from '@/features/inventory/services/inventory.service'
import { requestLoan } from '@/features/loans/services/loans.service'
import { normalizeText } from '@/features/dashboard/utils/dashboardFormat'
import { API_BASE_URL } from '@/core/config/env'

function resolveImageUrl(urlImagen) {
  if (!urlImagen) return ''
  if (/^(https?:|data:|blob:)/i.test(urlImagen)) return urlImagen
  const origin = API_BASE_URL.replace(/\/api\/?$/, '')
  const normalizedPath = urlImagen.startsWith('/') ? urlImagen : `/${urlImagen}`
  return `${origin}${normalizedPath}`
}

function ArticuloImage({ idArticulo, alt }) {
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const fetchImage = async () => {
      try {
        const imgs = await getArticuloImages(idArticulo)
        if (isMounted && imgs && imgs.length > 0) {
          setImageUrl(resolveImageUrl(imgs[0]?.urlImagen ?? imgs[0]?.UrlImagen ?? ''))
        }
      } catch (error) {
        // Ignorar error si no hay imagen
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchImage()
    return () => { isMounted = false }
  }, [idArticulo])

  if (loading) {
    return <div className="docente-catalog-image-placeholder" style={{ backgroundColor: 'var(--color-gray-100)' }} />
  }

  if (imageUrl) {
    return <img src={imageUrl} alt={alt} className="docente-catalog-image-placeholder" style={{ objectFit: 'cover' }} />
  }

  return (
    <div className="docente-catalog-image-placeholder">
      <ImageOff size={40} style={{ color: 'var(--color-gray-400)' }} />
    </div>
  )
}

function DocenteInventoryPage() {
  const { userName } = useAuth()
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [articulos, setArticulos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [draftFilters, setDraftFilters] = useState({ categoria: 'Todas', search: '' })
  const [appliedFilters, setAppliedFilters] = useState({ categoria: 'Todas', search: '' })

  // Solicitud múltiple (Carrito)
  const [selectedArticulos, setSelectedArticulos] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [fechaDevolucion, setFechaDevolucion] = useState('')
  const [solicitarLoading, setSolicitarLoading] = useState(false)
  const [solicitarError, setSolicitarError] = useState('')
  const [solicitarSuccess, setSolicitarSuccess] = useState('')

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      setLoading(true)
      try {
        const [catalogoRes, categoriasRes] = await Promise.all([
          getInventoryCatalog(),
          import('@/features/inventory/services/inventory.service').then(m => m.getCategorias())
        ])
        if (isMounted) {
          setArticulos(catalogoRes)
          setCategorias(categoriasRes)
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error.response?.data?.message ?? 'No se pudo cargar el catálogo. Verifica la conexión con el backend.'
          )
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => { isMounted = false }
  }, [])

  const filteredArticulos = useMemo(() => {
    return articulos.filter((item) => {
      // Solo mostrar artículos disponibles
      if (normalizeText(item.estado) !== 'disponible') {
        return false
      }

      const matchesCategoria = appliedFilters.categoria === 'Todas' || normalizeText(item.categoria) === normalizeText(appliedFilters.categoria)
      const matchesSearch = !appliedFilters.search || normalizeText(item.nombre).includes(normalizeText(appliedFilters.search)) || normalizeText(item.codigoInstitucional).includes(normalizeText(appliedFilters.search))
      return matchesCategoria && matchesSearch
    })
  }, [articulos, appliedFilters])

  const handleDraftChange = (e) => {
    const { name, value } = e.target
    setDraftFilters((prev) => ({ ...prev, [name]: value }))
  }

  const applyFilters = () => {
    setAppliedFilters(draftFilters)
  }

  const toggleSelection = (item) => {
    const id = item.idArticulo ?? item.IdArticulo;
    setSelectedArticulos(prev => {
      const exists = prev.some(a => (a.idArticulo ?? a.IdArticulo) === id)
      if (exists) {
        return prev.filter(a => (a.idArticulo ?? a.IdArticulo) !== id)
      } else {
        return [...prev, item]
      }
    })
  }

  const removeItemFromCart = (idToRemove) => {
    setSelectedArticulos(prev => {
      const updated = prev.filter(a => (a.idArticulo ?? a.IdArticulo) !== idToRemove)
      // Si se queda vacío el carrito y estamos en el modal, lo cerramos
      if (updated.length === 0 && showModal) {
        closeModal()
      }
      return updated
    })
  }

  const openModal = () => {
    if (selectedArticulos.length === 0) return
    setFechaDevolucion('')
    setSolicitarError('')
    setSolicitarSuccess('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setFechaDevolucion('')
    setSolicitarError('')
    setSolicitarSuccess('')
  }

  const handleSolicitar = async (e) => {
    e.preventDefault()
    if (!fechaDevolucion) {
      setSolicitarError('Debes seleccionar una fecha de devolución.')
      return
    }

    if (selectedArticulos.length === 0) {
      setSolicitarError('No tienes equipos seleccionados.')
      return
    }

    const prevDate = new Date(fechaDevolucion)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (prevDate < today) {
      setSolicitarError('La fecha no puede ser en el pasado.')
      return
    }

    setSolicitarLoading(true)
    setSolicitarError('')
    setSolicitarSuccess('')

    try {
      const ids = selectedArticulos.map(item => item.idArticulo ?? item.IdArticulo)
      await requestLoan({
        fechaPrevista: prevDate.toISOString(),
        articulosIds: ids
      })
      setSolicitarSuccess(ids.length.toString())
      setTimeout(() => {
        setSelectedArticulos([])
        closeModal()
      }, 2500)
    } catch (error) {
      setSolicitarError(error.response?.data?.error ?? error.response?.data?.message ?? 'No se pudo registrar la solicitud.')
    } finally {
      setSolicitarLoading(false)
    }
  }

  const isItemSelected = (item) => {
    const id = item.idArticulo ?? item.IdArticulo
    return selectedArticulos.some(a => (a.idArticulo ?? a.IdArticulo) === id)
  }

  return (
    <>
      <ModulePageShell
        title="Catálogo de Equipos"
        description="Explora y selecciona equipos disponibles para tu solicitud de préstamo."
      >
        {errorMessage ? <p className="feedback-error">{errorMessage}</p> : null}

        <section className="inventory-filters-card">
          <div className="inventory-filter-grid" style={{ gridTemplateColumns: '1fr 2fr auto' }}>
            <label>
              <span>Categoría</span>
              <select name="categoria" value={draftFilters.categoria} onChange={handleDraftChange}>
                <option value="Todas">Todas</option>
                {categorias.map(cat => (
                  <option key={cat.idCategoria} value={cat.nombre}>{cat.nombre}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Equipo</span>
              <input
                type="text"
                name="search"
                value={draftFilters.search}
                onChange={handleDraftChange}
                placeholder="Buscar equipo..."
              />
            </label>

            <div className="inventory-filter-actions" style={{ alignSelf: 'end' }}>
              <button className="btn btn-primary" type="button" onClick={applyFilters}>
                Aplicar Filtros
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <p className="users-empty">Cargando catálogo de equipos...</p>
        ) : filteredArticulos.length === 0 ? (
          <p className="users-empty">No se encontraron equipos disponibles con los filtros actuales.</p>
        ) : (
          <div className="docente-catalog-grid">
            {filteredArticulos.map((item) => {
              const selected = isItemSelected(item);
              return (
                <article key={item.idArticulo ?? item.IdArticulo} className={`docente-catalog-card ${selected ? 'selected-card' : ''}`}>
                  <ArticuloImage idArticulo={item.idArticulo ?? item.IdArticulo} alt={item.nombre} />
                  <div className="docente-catalog-info">
                    <h3>{item.nombre || (item.marca ? `${item.marca} ${item.modelo}` : 'Equipo sin nombre')}</h3>
                    <p><strong>Categoría:</strong> {item.categoria || '-'}</p>
                    <p><strong>Código:</strong> {item.codigoInstitucional || '-'}</p>
                    <p><strong>Ubicación:</strong> {item.ubicacion || '-'}</p>
                  </div>
                  <button
                    className={`btn docente-catalog-btn ${selected ? 'docente-btn-quitar' : 'docente-btn-agregar'}`}
                    onClick={() => toggleSelection(item)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    {selected ? (
                      <>
                        <Trash2 size={18} /> Quitar
                      </>
                    ) : (
                      <>
                        <Check size={18} /> Agregar
                      </>
                    )}
                  </button>
                </article>
              )
            })}
          </div>
        )}
      </ModulePageShell>

      {/* Botón flotante del carrito */}
      {selectedArticulos.length > 0 && (
        <button className="cart-floating-btn shadow-lg" onClick={openModal} aria-label="Ver solicitud">
          <div className="cart-floating-icon">
            <ShoppingBag size={24} />
            <span className="cart-floating-badge">{selectedArticulos.length}</span>
          </div>
          <span className="cart-floating-text">Ver Solicitud</span>
        </button>
      )}

      {/* Modal de Detalles y Solicitud Múltiple */}
      {showModal && selectedArticulos.length > 0 ? (
        <div className="modal-backdrop" role="presentation" onClick={closeModal}>
          <section
            className="modal-card docente-modal-card premium-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="solicitar-equipo-title"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '600px' }}
          >
            <header className="modal-header premium-modal-header">
              <h2 id="solicitar-equipo-title">
                {solicitarSuccess ? '¡Solicitud Exitosa!' : `Resumen de Solicitud (${selectedArticulos.length} ${selectedArticulos.length === 1 ? 'equipo' : 'equipos'})`}
              </h2>
              <button type="button" className="icon-button close-btn" onClick={closeModal} aria-label="Cerrar modal">
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            <div className="docente-modal-body" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
              {solicitarSuccess ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', marginBottom: '1.5rem' }}>
                    <Check size={40} strokeWidth={3} />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-gray-900)', marginBottom: '0.75rem' }}>¡Solicitud Enviada!</h3>
                  <p style={{ color: 'var(--color-gray-600)', fontSize: '1.05rem', lineHeight: '1.5' }}>
                    Tus <strong>{selectedArticulos.length}</strong> equipos han sido solicitados correctamente.<br/>
                    El administrador revisará tu petición en breve.
                  </p>
                </div>
              ) : (
                <>
                  <div className="cart-modal-items-list">
                    {selectedArticulos.map(item => {
                      const id = item.idArticulo ?? item.IdArticulo;
                      return (
                        <div key={id} className="cart-modal-item">
                          <div className="cart-modal-item-info">
                            <strong>{item.nombre || (item.marca ? `${item.marca} ${item.modelo}` : 'Equipo')}</strong>
                            <span>{item.codigoInstitucional || '-'} • {item.categoria || '-'}</span>
                          </div>
                          <button 
                            type="button" 
                            className="icon-button text-danger" 
                            onClick={() => removeItemFromCart(id)}
                            aria-label={`Quitar ${item.nombre}`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  
                  <form onSubmit={handleSolicitar} className="docente-modal-form mt-4">
                    <div className="docente-modal-form-group p-4 bg-gray-50 border rounded-md">
                      <label htmlFor="fecha-devolucion" className="docente-modal-label text-primary font-semibold">Fecha de Devolución para el Lote</label>
                      <p className="text-sm text-gray-500 mb-2">Selecciona cuándo devolverás todos los equipos listados.</p>
                      <input
                        id="fecha-devolucion"
                        type="date"
                        className="docente-modal-date-input premium-input"
                        value={fechaDevolucion}
                        onChange={(e) => setFechaDevolucion(e.target.value)}
                        required
                      />
                    </div>

                    {solicitarError && <p className="feedback-error mt-3">{solicitarError}</p>}

                    <div className="docente-modal-actions mt-4">
                      <button type="submit" className="btn btn-primary premium-submit-btn w-full" disabled={solicitarLoading}>
                        {solicitarLoading ? 'Procesando...' : 'Confirmar Solicitud de Préstamo'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}

export default DocenteInventoryPage
