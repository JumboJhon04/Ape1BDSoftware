import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ModulePageShell from '@/shared/components/ModulePageShell'
import useAuth from '@/core/auth/useAuth'
import { getDashboardData } from '@/features/dashboard/services/dashboard.service'
import {
  formatDate,
  getPageNumbers,
  getPercentage,
  getPrestamoStatusClass,
  normalizeText,
} from '@/features/dashboard/utils/dashboardFormat'

const ITEMS_PER_PAGE = 5

function AdminDashboardPage() {
  const { role } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [warnings, setWarnings] = useState([])
  const [articulos, setArticulos] = useState([])
  const [prestamos, setPrestamos] = useState([])
  const [mantenimientos, setMantenimientos] = useState([])
  const [prestamosPage, setPrestamosPage] = useState(1)
  const [mantenimientosPage, setMantenimientosPage] = useState(1)

  useEffect(() => {
    let isMounted = true

    const loadDashboard = async () => {
      setLoading(true)
      setErrorMessage('')

      try {
        const response = await getDashboardData(role)
        if (!isMounted) return

        setArticulos(response.articulos)
        setPrestamos(response.prestamos)
        setMantenimientos(response.mantenimientos)
        setWarnings(response.warnings)
        setPrestamosPage(1)
        setMantenimientosPage(1)
      } catch (error) {
        if (!isMounted) return

        setErrorMessage(
          error.response?.data?.message ??
            'No se pudo cargar el dashboard. Verifica la conexion con el backend.',
        )
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [role])

  const summaryCards = useMemo(() => {
    const totalArticulos = articulos.length
    const disponibles = articulos.filter((item) => normalizeText(item.estado) === 'disponible').length
    const prestadosTotales = articulos.filter((item) => normalizeText(item.estado) === 'prestado').length
    const enMantenimiento = articulos.filter((item) => normalizeText(item.estado) === 'mantenimiento').length
    const hoy = new Date()

    const prestamosVencidos = prestamos.filter((item) => {
      const estado = normalizeText(item.estado)
      const fechaPrevista = item.fechaPrevista ? new Date(item.fechaPrevista) : null

      if (!fechaPrevista || Number.isNaN(fechaPrevista.getTime())) {
        return false
      }

      return estado !== 'finalizado' && fechaPrevista < hoy
    })

    const vencidos = prestamosVencidos.reduce((acc, item) => {
      const cantidad = Number(item.cantidadArticulos ?? 0)
      return acc + (Number.isNaN(cantidad) || cantidad <= 0 ? 1 : cantidad)
    }, 0)

    const prestados = Math.max(prestadosTotales - vencidos, 0)

    const disponiblesPercent = getPercentage(disponibles, totalArticulos)
    const prestadosPercent = getPercentage(prestados, totalArticulos)
    const vencidosPercent = getPercentage(vencidos, totalArticulos)
    const mantenimientoPercent = getPercentage(enMantenimiento, totalArticulos)

    return [
      {
        key: 'total',
        title: 'Total de Articulos',
        value: totalArticulos,
        tone: 'total',
        percent: 100,
        detail: 'Base total del inventario',
      },
      {
        key: 'disponibles',
        title: 'Disponibles',
        value: disponibles,
        tone: 'success',
        percent: disponiblesPercent,
        detail: `${disponiblesPercent}% del inventario`,
      },
      {
        key: 'prestados',
        title: 'Prestados al dia',
        value: prestados,
        tone: 'info',
        percent: prestadosPercent,
        detail: `${prestadosPercent}% del inventario vigente`,
      },
      {
        key: 'vencidos',
        title: 'Vencidos',
        value: vencidos,
        tone: 'danger',
        percent: vencidosPercent,
        detail: `${vencidosPercent}% del inventario en atraso`,
      },
      {
        key: 'mantenimiento',
        title: 'En Mantenimiento',
        value: enMantenimiento,
        tone: 'warning',
        percent: mantenimientoPercent,
        detail: `${mantenimientoPercent}% del inventario`,
      },
    ]
  }, [articulos, prestamos])

  const prestamosRecientes = useMemo(() => {
    return [...prestamos].sort((a, b) => {
      const aDate = new Date(a.fechaSalida ?? a.fechaPrevista ?? 0).getTime()
      const bDate = new Date(b.fechaSalida ?? b.fechaPrevista ?? 0).getTime()
      return bDate - aDate
    })
  }, [prestamos])

  const mantenimientosActivos = useMemo(() => {
    return [...mantenimientos].sort(
      (a, b) => new Date(b.fechaInicio ?? 0).getTime() - new Date(a.fechaInicio ?? 0).getTime(),
    )
  }, [mantenimientos])

  const totalPrestamosPages = Math.max(1, Math.ceil(prestamosRecientes.length / ITEMS_PER_PAGE))
  const totalMantenimientosPages = Math.max(1, Math.ceil(mantenimientosActivos.length / ITEMS_PER_PAGE))

  const prestamosPageSafe = Math.min(prestamosPage, totalPrestamosPages)
  const mantenimientosPageSafe = Math.min(mantenimientosPage, totalMantenimientosPages)

  const prestamosSliceStart = (prestamosPageSafe - 1) * ITEMS_PER_PAGE
  const mantenimientosSliceStart = (mantenimientosPageSafe - 1) * ITEMS_PER_PAGE

  const prestamosPaginados = prestamosRecientes.slice(prestamosSliceStart, prestamosSliceStart + ITEMS_PER_PAGE)
  const mantenimientosPaginados = mantenimientosActivos.slice(
    mantenimientosSliceStart,
    mantenimientosSliceStart + ITEMS_PER_PAGE,
  )

  const prestamosVisibleFrom = prestamosRecientes.length === 0 ? 0 : prestamosSliceStart + 1
  const prestamosVisibleTo = Math.min(prestamosSliceStart + ITEMS_PER_PAGE, prestamosRecientes.length)

  const mantenimientosVisibleFrom = mantenimientosActivos.length === 0 ? 0 : mantenimientosSliceStart + 1
  const mantenimientosVisibleTo = Math.min(
    mantenimientosSliceStart + ITEMS_PER_PAGE,
    mantenimientosActivos.length,
  )

  const prestamosPageNumbers = getPageNumbers(totalPrestamosPages)
  const mantenimientosPageNumbers = getPageNumbers(totalMantenimientosPages)

  return (
    <ModulePageShell
      title="Panel de Control"
      description="Resumen general del sistema con prestamos recientes y mantenimientos programados."
    >
      {errorMessage ? <p className="feedback-error">{errorMessage}</p> : null}
      {warnings.length > 0 ? (
        <div className="dashboard-warning-list">
          {warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      <section className="dashboard-kpi-row">
        {summaryCards.map((card) => (
          <article className={`dashboard-kpi-card dashboard-kpi-card-${card.tone}`} key={card.key}>
            <span className="dashboard-kpi-title">{card.title}</span>
            <strong className="dashboard-kpi-value">{loading ? '...' : card.value}</strong>
            <p className="dashboard-kpi-detail">{loading ? 'Calculando...' : card.detail}</p>
            <div className="dashboard-kpi-meter" aria-hidden="true">
              <span style={{ width: `${loading ? 0 : card.percent}%` }} />
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-table-section">
        <div className="dashboard-section-topline">
          <h3>Prestamos Recientes</h3>
          <p>
            Mostrando {prestamosVisibleFrom}-{prestamosVisibleTo} de {prestamosRecientes.length}
          </p>
        </div>
        <div className="dashboard-table-card">
          <div className="dashboard-table-head dashboard-loan-grid">
            <span>Articulo</span>
            <span>Prestatario</span>
            <span>Fecha de Salida</span>
            <span>Fecha Prevista</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          <div className="dashboard-table-body">
            {loading ? (
              <p className="users-empty">Cargando prestamos...</p>
            ) : prestamosPaginados.length === 0 ? (
              <p className="users-empty">No hay prestamos recientes para mostrar.</p>
            ) : (
              prestamosPaginados.map((item) => (
                <div className="dashboard-table-row dashboard-loan-grid" key={item.idPrestamo}>
                  <span>{item.articulos || `Prestamo #${item.idPrestamo}`}</span>
                  <span>{item.nombreUsuario || '-'}</span>
                  <span>{formatDate(item.fechaSalida)}</span>
                  <span>{formatDate(item.fechaPrevista)}</span>
                  <span>
                    <span className={`dashboard-status-chip ${getPrestamoStatusClass(item.estado)}`}>
                      {item.estado || '-'}
                    </span>
                  </span>
                  <span>
                    <button
                      className="dashboard-action-button"
                      type="button"
                      onClick={() => navigate('/prestamos')}
                    >
                      Ver
                    </button>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {prestamosRecientes.length > 0 ? (
          <div className="dashboard-pagination-row">
            <button
              type="button"
              className="dashboard-page-button"
              onClick={() => setPrestamosPage((prev) => Math.max(1, prev - 1))}
              disabled={prestamosPageSafe === 1}
            >
              Anterior
            </button>
            <div className="dashboard-page-numbers" role="group" aria-label="Paginacion de prestamos">
              {prestamosPageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={`dashboard-page-button dashboard-page-number ${
                    pageNumber === prestamosPageSafe ? 'dashboard-page-number-active' : ''
                  }`}
                  onClick={() => setPrestamosPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
            </div>
            <span className="dashboard-page-info">
              Pagina {prestamosPageSafe} de {totalPrestamosPages}
            </span>
            <button
              type="button"
              className="dashboard-page-button"
              onClick={() => setPrestamosPage((prev) => Math.min(totalPrestamosPages, prev + 1))}
              disabled={prestamosPageSafe === totalPrestamosPages}
            >
              Siguiente
            </button>
          </div>
        ) : null}
      </section>

      <section className="dashboard-table-section">
        <div className="dashboard-section-topline">
          <h3>Mantenimientos Programados</h3>
          <p>
            Mostrando {mantenimientosVisibleFrom}-{mantenimientosVisibleTo} de {mantenimientosActivos.length}
          </p>
        </div>
        <div className="dashboard-table-card">
          <div className="dashboard-table-head dashboard-maintenance-grid">
            <span>Articulo</span>
            <span>Tipo de Mantenimiento</span>
            <span>Fecha Programada</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          <div className="dashboard-table-body">
            {loading ? (
              <p className="users-empty">Cargando mantenimientos...</p>
            ) : mantenimientosPaginados.length === 0 ? (
              <p className="users-empty">No hay mantenimientos activos en este momento.</p>
            ) : (
              mantenimientosPaginados.map((item) => (
                <div className="dashboard-table-row dashboard-maintenance-grid" key={item.idMantenimiento}>
                  <span>{item.articulo || '-'}</span>
                  <span>{item.tipo || '-'}</span>
                  <span>{formatDate(item.fechaInicio)}</span>
                  <span>
                    <span className="dashboard-status-chip dashboard-status-chip-warning">En progreso</span>
                  </span>
                  <span>
                    <button
                      className="dashboard-action-button"
                      type="button"
                      onClick={() => navigate('/mantenimiento')}
                    >
                      Detalles
                    </button>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {mantenimientosActivos.length > 0 ? (
          <div className="dashboard-pagination-row">
            <button
              type="button"
              className="dashboard-page-button"
              onClick={() => setMantenimientosPage((prev) => Math.max(1, prev - 1))}
              disabled={mantenimientosPageSafe === 1}
            >
              Anterior
            </button>
            <div className="dashboard-page-numbers" role="group" aria-label="Paginacion de mantenimientos">
              {mantenimientosPageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={`dashboard-page-button dashboard-page-number ${
                    pageNumber === mantenimientosPageSafe ? 'dashboard-page-number-active' : ''
                  }`}
                  onClick={() => setMantenimientosPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
            </div>
            <span className="dashboard-page-info">
              Pagina {mantenimientosPageSafe} de {totalMantenimientosPages}
            </span>
            <button
              type="button"
              className="dashboard-page-button"
              onClick={() => setMantenimientosPage((prev) => Math.min(totalMantenimientosPages, prev + 1))}
              disabled={mantenimientosPageSafe === totalMantenimientosPages}
            >
              Siguiente
            </button>
          </div>
        ) : null}
      </section>
    </ModulePageShell>
  )
}

export default AdminDashboardPage
