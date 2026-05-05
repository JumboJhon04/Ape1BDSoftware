import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ModulePageShell from '@/shared/components/ModulePageShell'
import useAuth from '@/core/auth/useAuth'
import { getDashboardData } from '@/features/dashboard/services/dashboard.service'
import {
  formatDateISO,
  getPageNumbers,
  getPrestamoStatusClass,
  normalizeText,
  pick,
  sameId,
} from '@/features/dashboard/utils/dashboardFormat'

const ITEMS_PER_PAGE = 5

function isPrestamoRetrasado(item, hoy) {
  const estado = normalizeText(item.estado)
  if (estado === 'vencido') return true
  if (estado === 'finalizado') return false
  const fp = item.fechaPrevista ? new Date(item.fechaPrevista) : null
  if (!fp || Number.isNaN(fp.getTime())) return false
  return fp < hoy
}

function DocenteDashboardPage() {
  const { role, userId, userName } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [warnings, setWarnings] = useState([])
  const [articulos, setArticulos] = useState([])
  const [prestamos, setPrestamos] = useState([])
  const [mantenimientosTodos, setMantenimientosTodos] = useState([])
  const [prestamosPage, setPrestamosPage] = useState(1)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setLoading(true)
      setErrorMessage('')
      try {
        const response = await getDashboardData(role)
        if (!isMounted) return
        setArticulos(response.articulos)
        setPrestamos(response.prestamos)
        setMantenimientosTodos(response.mantenimientosTodos ?? [])
        setWarnings(response.warnings)
        setPrestamosPage(1)
      } catch (error) {
        if (!isMounted) return
        setErrorMessage(
          error.response?.data?.message ??
            'No se pudo cargar el panel. Verifica la conexion con el backend.',
        )
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [role])

  const articulosMiCargo = useMemo(() => {
    if (userId == null) return []
    return articulos.filter((a) => sameId(a.idResponsable ?? a.IdResponsable, userId))
  }, [articulos, userId])

  const nombresArticulosMiCargo = useMemo(() => {
    return new Set(
      articulosMiCargo.map((a) => normalizeText(a.nombre ?? a.Nombre ?? '')).filter(Boolean),
    )
  }, [articulosMiCargo])

  const prestamosMios = useMemo(() => {
    if (!userName?.trim()) return []
    const mine = normalizeText(userName)
    return prestamos.filter((p) => normalizeText(p.nombreUsuario) === mine)
  }, [prestamos, userName])

  const hoy = useMemo(() => new Date(), [])

  const kpiDocente = useMemo(() => {
    const activos = prestamosMios.filter((p) => normalizeText(p.estado) === 'activo').length
    const retrasados = prestamosMios.filter((p) => isPrestamoRetrasado(p, hoy)).length
    const equipos = articulosMiCargo.length
    return [
      {
        key: 'act',
        title: 'Préstamos activos',
        value: activos,
        detail: 'Equipos que has solicitado a la facultad',
        tone: 'info',
        percent: Math.min(100, activos * 18 + 20),
      },
      {
        key: 'ret',
        title: 'Préstamos retrasados',
        value: retrasados,
        detail: 'Equipos con vencimiento de entrega superado',
        tone: 'danger',
        percent: Math.min(100, retrasados * 35 + 15),
      },
      {
        key: 'eq',
        title: 'Equipos a mi cargo',
        value: equipos,
        detail: 'Equipos bajo tu administración en inventario',
        tone: 'success',
        percent: Math.min(100, equipos * 10 + 25),
      },
    ]
  }, [prestamosMios, articulosMiCargo, hoy])

  const prestamosOrdenados = useMemo(() => {
    return [...prestamosMios].sort((a, b) => {
      const aDate = new Date(a.fechaSalida ?? a.fechaPrevista ?? 0).getTime()
      const bDate = new Date(b.fechaSalida ?? b.fechaPrevista ?? 0).getTime()
      return bDate - aDate
    })
  }, [prestamosMios])

  const totalPages = Math.max(1, Math.ceil(prestamosOrdenados.length / ITEMS_PER_PAGE))
  const pageSafe = Math.min(prestamosPage, totalPages)
  const sliceStart = (pageSafe - 1) * ITEMS_PER_PAGE
  const paginados = prestamosOrdenados.slice(sliceStart, sliceStart + ITEMS_PER_PAGE)
  const visibleFrom = prestamosOrdenados.length === 0 ? 0 : sliceStart + 1
  const visibleTo = Math.min(sliceStart + ITEMS_PER_PAGE, prestamosOrdenados.length)
  const pageNumbers = getPageNumbers(totalPages)

  const alertasMantenimiento = useMemo(() => {
    return mantenimientosTodos
      .filter((m) => {
        const estado = normalizeText(pick(m, 'estado', 'Estado') ?? '')
        if (estado === 'finalizado') return false
        const art = normalizeText(pick(m, 'articulo', 'Articulo') ?? '')
        return art && nombresArticulosMiCargo.has(art)
      })
      .sort(
        (a, b) =>
          new Date(pick(b, 'fechaInicio', 'FechaInicio') ?? 0).getTime() -
          new Date(pick(a, 'fechaInicio', 'FechaInicio') ?? 0).getTime(),
      )
      .slice(0, 12)
  }, [mantenimientosTodos, nombresArticulosMiCargo])

  return (
    <ModulePageShell
      title="Panel de Control"
      description={`Bienvenido${userName ? `, ${userName}` : ''}. Resumen de tus préstamos y de los equipos bajo tu responsabilidad.`}
    >
      {errorMessage ? <p className="feedback-error">{errorMessage}</p> : null}
      {warnings.length > 0 ? (
        <div className="dashboard-warning-list">
          {warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      <div className="dashboard-docente-shell">
        <div className="dashboard-docente-main">
          <section className="dashboard-kpi-row dashboard-docente-kpi">
            {kpiDocente.map((card) => (
              <article className={`dashboard-kpi-card dashboard-kpi-card-${card.tone}`} key={card.key}>
                <span className="dashboard-kpi-title">{card.title}</span>
                <strong className="dashboard-kpi-value">{loading ? '…' : card.value}</strong>
                <p className="dashboard-kpi-detail">{loading ? 'Cargando…' : card.detail}</p>
                <div className="dashboard-kpi-meter" aria-hidden="true">
                  <span style={{ width: `${loading ? 0 : card.percent}%` }} />
                </div>
              </article>
            ))}
          </section>

          <section className="dashboard-table-section">
            <div className="dashboard-section-topline">
              <h3>Préstamos recientes</h3>
              <p>
                Mostrando {visibleFrom}-{visibleTo} de {prestamosOrdenados.length}
              </p>
            </div>
            <div className="dashboard-table-card">
              <div className="dashboard-table-head dashboard-docente-loan-grid">
                <span>Equipo</span>
                <span>Fecha de préstamo</span>
                <span>Fecha de devolución</span>
                <span>Estado</span>
                <span>Acciones</span>
              </div>
              <div className="dashboard-table-body">
                {loading ? (
                  <p className="users-empty">Cargando préstamos…</p>
                ) : paginados.length === 0 ? (
                  <p className="users-empty">No tienes préstamos registrados o no se pudieron cargar.</p>
                ) : (
                  paginados.map((item) => (
                    <div className="dashboard-table-row dashboard-docente-loan-grid" key={item.idPrestamo}>
                      <span>{item.articulos || `Préstamo #${item.idPrestamo}`}</span>
                      <span>{formatDateISO(item.fechaSalida)}</span>
                      <span>{formatDateISO(item.fechaPrevista)}</span>
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

            {prestamosOrdenados.length > 0 ? (
              <div className="dashboard-pagination-row">
                <button
                  type="button"
                  className="dashboard-page-button"
                  onClick={() => setPrestamosPage((p) => Math.max(1, p - 1))}
                  disabled={pageSafe === 1}
                >
                  Anterior
                </button>
                <div className="dashboard-page-numbers" role="group" aria-label="Paginación de préstamos">
                  {pageNumbers.map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`dashboard-page-button dashboard-page-number ${
                        n === pageSafe ? 'dashboard-page-number-active' : ''
                      }`}
                      onClick={() => setPrestamosPage(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <span className="dashboard-page-info">
                  Página {pageSafe} de {totalPages}
                </span>
                <button
                  type="button"
                  className="dashboard-page-button"
                  onClick={() => setPrestamosPage((p) => Math.min(totalPages, p + 1))}
                  disabled={pageSafe === totalPages}
                >
                  Siguiente
                </button>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="dashboard-docente-alerts" aria-labelledby="docente-alertas-titulo">
          <h3 id="docente-alertas-titulo">Mantenimiento de equipo</h3>
          <p className="dashboard-docente-alerts-sub">
            Solo equipos de inventario donde figuras como responsable.
          </p>
          {loading ? (
            <p className="users-empty">Cargando alertas…</p>
          ) : alertasMantenimiento.length === 0 ? (
            <p className="dashboard-docente-alerts-empty">No hay alertas de mantenimiento de tus equipos.</p>
          ) : (
            <ul className="dashboard-docente-alerts-list">
              {alertasMantenimiento.map((m) => {
                const nombre = pick(m, 'articulo', 'Articulo') ?? 'Equipo'
                const tipo = pick(m, 'tipo', 'Tipo') ?? ''
                const desc = pick(m, 'descripcion', 'Descripcion')
                const texto =
                  desc?.trim() ||
                  `El equipo «${nombre}» tiene mantenimiento ${tipo ? `(${tipo})` : ''} en curso.`
                const id = pick(m, 'idMantenimiento', 'IdMantenimiento')
                return (
                  <li key={id} className="dashboard-docente-alerts-item">
                    {texto}
                  </li>
                )
              })}
            </ul>
          )}
        </aside>
      </div>
    </ModulePageShell>
  )
}

export default DocenteDashboardPage
