import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, BellRing } from 'lucide-react'
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

function getMaintenanceAlertsForDocente(mantenimientosTodos, articulos, userId) {
  if (userId == null) return []

  const articulosMiCargo = Array.isArray(articulos)
    ? articulos.filter((a) => sameId(a.idResponsable ?? a.IdResponsable, userId))
    : []
  
  const idsArticulosMiCargo = new Set(
    articulosMiCargo.map((a) => a.idArticulo ?? a.IdArticulo).filter(id => id != null)
  )

  return (Array.isArray(mantenimientosTodos) ? mantenimientosTodos : [])
    .filter((m) => {
      const estado = normalizeText(pick(m, 'estado', 'Estado') ?? '')
      if (estado === 'finalizado') return false

      const idArticuloMantenimiento = pick(m, 'idArticulo', 'IdArticulo')
      return idArticuloMantenimiento != null && idsArticulosMiCargo.has(idArticuloMantenimiento)
    })
    .sort(
      (a, b) =>
        new Date(pick(b, 'fechaInicio', 'FechaInicio') ?? 0).getTime() -
        new Date(pick(a, 'fechaInicio', 'FechaInicio') ?? 0).getTime(),
    )
    .slice(0, 12)
}

function getMaintenanceAlertBody(alerta) {
  const nombre = pick(alerta, 'articulo', 'Articulo') ?? 'un equipo'
  const tipo = pick(alerta, 'tipo', 'Tipo') ?? ''
  return `El equipo "${nombre}" entró en mantenimiento${tipo ? ` (${tipo})` : ''}.`
}

function getMaintenanceSnapshot(alertas) {
  return alertas
    .map((m) =>
      [
        pick(m, 'idMantenimiento', 'IdMantenimiento'),
        pick(m, 'articulo', 'Articulo'),
        pick(m, 'estado', 'Estado'),
        pick(m, 'fechaInicio', 'FechaInicio'),
      ].join('|'),
    )
    .join(';;')
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
  const [notificationPermission, setNotificationPermission] = useState(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
    return window.Notification.permission
  })
  const lastMaintenanceSnapshotRef = useRef('')
  const hasLoadedOnceRef = useRef(false)

  useEffect(() => {
    let isMounted = true

    const load = async (options = {}) => {
      const { silent = false } = options
      if (!silent) setLoading(true)
      setErrorMessage('')
      try {
        const response = await getDashboardData(role)
        if (!isMounted) return

        const nextAlerts = getMaintenanceAlertsForDocente(
          response.mantenimientosTodos ?? [],
          response.articulos ?? [],
          userId,
        )
        const nextSnapshot = getMaintenanceSnapshot(nextAlerts)
        const previousSnapshot = lastMaintenanceSnapshotRef.current
        const isFirstSuccessfulLoad = !hasLoadedOnceRef.current

        if (
          !isFirstSuccessfulLoad &&
          nextSnapshot !== previousSnapshot &&
          nextAlerts.length > 0 &&
          typeof window !== 'undefined' &&
          'Notification' in window &&
          window.Notification.permission === 'granted'
        ) {
          const firstAlert = nextAlerts[0]
          new window.Notification('Mantenimiento detectado', {
            body: getMaintenanceAlertBody(firstAlert),
          })
        }

        setArticulos(response.articulos)
        setPrestamos(response.prestamos)
        setMantenimientosTodos(response.mantenimientosTodos ?? [])
        setWarnings(response.warnings)
        setPrestamosPage(1)

        lastMaintenanceSnapshotRef.current = nextSnapshot
        hasLoadedOnceRef.current = true
      } catch (error) {
        if (!isMounted) return
        setErrorMessage(
          error.response?.data?.message ??
            'No se pudo cargar el panel. Verifica la conexion con el backend.',
        )
      } finally {
        if (isMounted && !silent) setLoading(false)
      }
    }

    load()

    const intervalId = window.setInterval(() => {
      load({ silent: true })
    }, 45000)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
    }
  }, [role, userId])

  const articulosMiCargo = useMemo(() => {
    if (userId == null) return []
    return articulos.filter((a) => sameId(a.idResponsable ?? a.IdResponsable, userId))
  }, [articulos, userId])

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

  const alertasMantenimiento = useMemo(
    () => getMaintenanceAlertsForDocente(mantenimientosTodos, articulos, userId),
    [mantenimientosTodos, articulos, userId],
  )

  const mantenimientoResumen = alertasMantenimiento[0]
  const mantenimientoCount = alertasMantenimiento.length

  const activarNotificaciones = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    const permission = await window.Notification.requestPermission()
    setNotificationPermission(permission)

    if (permission === 'granted' && mantenimientoResumen) {
      new window.Notification('Mantenimiento detectado', {
        body: getMaintenanceAlertBody(mantenimientoResumen),
      })
    }
  }

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
                          onClick={() => navigate('/mis-prestamos')}
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
          <div className="dashboard-docente-alerts-head">
            <div>
              <span className="dashboard-docente-alerts-kicker">
                <AlertTriangle size={16} aria-hidden="true" />
                Aviso de mantenimiento
              </span>
              <h3 id="docente-alertas-titulo">Mantenimiento de equipo</h3>
              <p className="dashboard-docente-alerts-sub">
                Solo equipos donde figuras como responsable. Aquí ves lo que está en revisión ahora mismo.
              </p>
            </div>
            <div className="dashboard-docente-alerts-countbox" aria-label={`Tienes ${mantenimientoCount} alertas de mantenimiento`}>
              <strong>{loading ? '…' : mantenimientoCount}</strong>
              <span>en curso</span>
            </div>
          </div>

          {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' ? (
            <button
              type="button"
              className="dashboard-docente-alerts-notify"
              onClick={activarNotificaciones}
            >
              <BellRing size={15} aria-hidden="true" />
              Activar aviso del navegador
            </button>
          ) : null}

          {loading ? (
            <p className="users-empty">Cargando alertas…</p>
          ) : alertasMantenimiento.length === 0 ? (
            <div className="dashboard-docente-alerts-emptybox">
              <p className="dashboard-docente-alerts-empty">No hay alertas de mantenimiento de tus equipos.</p>
            </div>
          ) : (
            <>
              <article className="dashboard-docente-alerts-highlight">
                <div className="dashboard-docente-alerts-highlight-icon" aria-hidden="true">
                  <AlertTriangle size={22} aria-hidden="true" />
                </div>
                <div className="dashboard-docente-alerts-highlight-body">
                  <strong>
                    {mantenimientoResumen
                      ? pick(mantenimientoResumen, 'articulo', 'Articulo') ?? 'Equipo en mantenimiento'
                      : 'Equipo en mantenimiento'}
                  </strong>
                  <p>
                    {mantenimientoResumen
                      ? getMaintenanceAlertBody(mantenimientoResumen)
                      : 'Tu equipo quedó bloqueado hasta que finalice la revisión.'}
                  </p>
                </div>
              </article>

              <ul className="dashboard-docente-alerts-list">
                {alertasMantenimiento.map((m) => {
                  const nombre = pick(m, 'articulo', 'Articulo') ?? 'Equipo'
                  const tipo = pick(m, 'tipo', 'Tipo') ?? ''
                  const desc = pick(m, 'descripcion', 'Descripcion')
                  const fechaInicio = pick(m, 'fechaInicio', 'FechaInicio')
                  const texto =
                    desc?.trim() ||
                    `El equipo "${nombre}" está en mantenimiento${tipo ? ` (${tipo})` : ''}.`
                  const id = pick(m, 'idMantenimiento', 'IdMantenimiento')
                  return (
                    <li key={id} className="dashboard-docente-alerts-item">
                      <span className="dashboard-docente-alerts-item-icon" aria-hidden="true">
                        <AlertTriangle size={16} aria-hidden="true" />
                      </span>
                      <div className="dashboard-docente-alerts-item-body">
                        <strong>{nombre}</strong>
                        <p>{texto}</p>
                        <small>{fechaInicio ? `Desde ${formatDateISO(fechaInicio)}` : 'En curso'}</small>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </aside>
      </div>
    </ModulePageShell>
  )
}

export default DocenteDashboardPage
