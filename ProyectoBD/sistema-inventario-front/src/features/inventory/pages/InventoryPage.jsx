import { useEffect, useMemo, useState } from 'react'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ModulePageShell from '@/shared/components/ModulePageShell'
import { getInventoryCatalog } from '@/features/inventory/services/inventory.service'

const ITEMS_PER_PAGE = 5

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function getEstadoChipClass(estado) {
  const normalizedEstado = normalizeText(estado)

  if (normalizedEstado === 'disponible') return 'dashboard-status-chip-success'
  if (normalizedEstado === 'prestado') return 'dashboard-status-chip-info'
  if (normalizedEstado === 'mantenimiento') return 'dashboard-status-chip-warning'

  return 'dashboard-status-chip-neutral'
}

function InventoryPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [articulos, setArticulos] = useState([])
  const [appliedFilters, setAppliedFilters] = useState({
    categoria: 'Todos',
    estado: 'Todos',
    ubicacion: 'Todos',
    responsable: '',
  })
  const [draftFilters, setDraftFilters] = useState(appliedFilters)
  const [page, setPage] = useState(1)

  useEffect(() => {
    let isMounted = true

    const loadInventory = async () => {
      setLoading(true)
      setErrorMessage('')

      try {
        const response = await getInventoryCatalog()
        if (!isMounted) return

        setArticulos(response)
      } catch (error) {
        if (!isMounted) return

        setErrorMessage(
          error.response?.data?.message ??
            'No se pudo cargar el inventario. Verifica la conexion con el backend.',
        )
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadInventory()

    return () => {
      isMounted = false
    }
  }, [])

  const filterOptions = useMemo(() => {
    const categories = [...new Set(articulos.map((item) => item.categoria).filter(Boolean))].sort()
    const locations = [...new Set(articulos.map((item) => item.ubicacion).filter(Boolean))].sort()

    return { categories, locations }
  }, [articulos])

  const filteredArticulos = useMemo(() => {
    return articulos.filter((item) => {
      const matchesCategoria =
        appliedFilters.categoria === 'Todos' || item.categoria === appliedFilters.categoria
      const matchesEstado =
        appliedFilters.estado === 'Todos' || normalizeText(item.estado) === normalizeText(appliedFilters.estado)
      const matchesUbicacion =
        appliedFilters.ubicacion === 'Todos' || item.ubicacion === appliedFilters.ubicacion
      const matchesResponsable =
        !appliedFilters.responsable ||
        normalizeText(item.responsable).includes(normalizeText(appliedFilters.responsable))

      return matchesCategoria && matchesEstado && matchesUbicacion && matchesResponsable
    })
  }, [appliedFilters, articulos])

  const totalPages = Math.max(1, Math.ceil(filteredArticulos.length / ITEMS_PER_PAGE))
  const pageSafe = Math.min(page, totalPages)
  const pageStart = (pageSafe - 1) * ITEMS_PER_PAGE
  const paginatedArticulos = filteredArticulos.slice(pageStart, pageStart + ITEMS_PER_PAGE)
  const visibleFrom = filteredArticulos.length === 0 ? 0 : pageStart + 1
  const visibleTo = Math.min(pageStart + ITEMS_PER_PAGE, filteredArticulos.length)

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    setDraftFilters((prev) => ({ ...prev, [name]: value }))
  }

  const applyFilters = () => {
    setAppliedFilters(draftFilters)
    setPage(1)
  }

  const clearFilters = () => {
    const resetFilters = {
      categoria: 'Todos',
      estado: 'Todos',
      ubicacion: 'Todos',
      responsable: '',
    }

    setDraftFilters(resetFilters)
    setAppliedFilters(resetFilters)
    setPage(1)
  }

  return (
    <ModulePageShell
      title="Gestion de Inventario"
      description="Consulta y administra los articulos desde el listado principal."
    >
      {errorMessage ? <p className="feedback-error">{errorMessage}</p> : null}

      <section className="inventory-filters-card">
        <div className="inventory-filter-grid">
          <label>
            <span>Categoría</span>
            <select name="categoria" value={draftFilters.categoria} onChange={handleFilterChange}>
              <option value="Todos">Todos</option>
              {filterOptions.categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Estado</span>
            <select name="estado" value={draftFilters.estado} onChange={handleFilterChange}>
              <option value="Todos">Todos</option>
              <option value="Disponible">Disponible</option>
              <option value="Prestado">Prestado</option>
              <option value="Mantenimiento">Mantenimiento</option>
            </select>
          </label>

          <label>
            <span>Ubicación</span>
            <select name="ubicacion" value={draftFilters.ubicacion} onChange={handleFilterChange}>
              <option value="Todos">Todos</option>
              {filterOptions.locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Responsable</span>
            <input
              type="text"
              name="responsable"
              value={draftFilters.responsable}
              onChange={handleFilterChange}
              placeholder="Buscar responsable..."
            />
          </label>

          <div className="inventory-filter-actions">
            <button className="btn btn-primary" type="button" onClick={applyFilters}>
              Aplicar Filtros
            </button>
            <button className="btn btn-ghost" type="button" onClick={clearFilters}>
              Limpiar
            </button>
          </div>
        </div>
      </section>

      <div className="inventory-table-toolbar">
        <div>
          <h3>Listado de Artículos</h3>
          <p>
            Mostrando {visibleFrom}-{visibleTo} de {filteredArticulos.length} resultados
          </p>
        </div>

        <button className="btn btn-primary" type="button" disabled>
          + Añadir Artículo
        </button>
      </div>

      <div className="inventory-table-card">
        <div className="inventory-table-head inventory-grid">
          <span>ID</span>
          <span>Nombre</span>
          <span>Categoría</span>
          <span>Estado</span>
          <span>Ubicación</span>
          <span>Responsable</span>
          <span>Acciones</span>
        </div>

        <div className="inventory-table-body">
          {loading ? (
            <p className="users-empty">Cargando inventario...</p>
          ) : paginatedArticulos.length === 0 ? (
            <p className="users-empty">No hay artículos para mostrar con esos filtros.</p>
          ) : (
            paginatedArticulos.map((item) => (
              <article className="inventory-table-row inventory-grid" key={item.idArticulo}>
                <span>{String(item.idArticulo).padStart(3, '0')}</span>
                <span>{item.nombre}</span>
                <span>{item.categoria || '-'}</span>
                <span>
                  <span className={`dashboard-status-chip ${getEstadoChipClass(item.estado)}`}>
                    {item.estado}
                  </span>
                </span>
                <span>{item.ubicacion || '-'}</span>
                <span>{item.responsable || '-'}</span>
                <span className="inventory-actions">
                  <button
                    type="button"
                    className="inventory-icon-button inventory-icon-button-view"
                    title="Mirar detalle"
                    aria-label="Mirar detalle"
                    onClick={() => navigate(`/inventario/detalle/${item.idArticulo}`)}
                  >
                    <Eye size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="inventory-icon-button inventory-icon-button-edit"
                    title="Editar artículo"
                    aria-label="Editar artículo"
                    disabled
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="inventory-icon-button inventory-icon-button-delete"
                    title="Eliminar artículo"
                    aria-label="Eliminar artículo"
                    disabled
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </span>
              </article>
            ))
          )}
        </div>
      </div>

      {filteredArticulos.length > 0 ? (
        <div className="dashboard-pagination-row inventory-pagination-row">
          <button
            type="button"
            className="dashboard-page-button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={pageSafe === 1}
          >
            Anterior
          </button>

          <div className="dashboard-page-numbers" role="group" aria-label="Paginacion de inventario">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={`dashboard-page-button dashboard-page-number ${
                  pageNumber === pageSafe ? 'dashboard-page-number-active' : ''
                }`}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
          </div>

          <span className="dashboard-page-info">
            Página {pageSafe} de {totalPages}
          </span>

          <button
            type="button"
            className="dashboard-page-button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={pageSafe === totalPages}
          >
            Siguiente
          </button>
        </div>
      ) : null}
    </ModulePageShell>
  )
}

export default InventoryPage