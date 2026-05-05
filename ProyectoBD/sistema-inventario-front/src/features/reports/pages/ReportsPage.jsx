import { useEffect, useMemo, useState } from 'react'
import { Download, Eye, RotateCw, Search, X } from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import ModulePageShell from '@/shared/components/ModulePageShell'
import {
  getAuditoriaLog,
  getInventarioPorCategoria,
  getInventarioPorUbicacion,
  getMantenimientosPorEstado,
  getPrestamosPorEstado,
  getPrestamosVencidos,
  getResumenGeneral,
  getTopArticulosMovidos,
} from '../services/reports.service'
import jsPDF from 'jspdf'

const AUDIT_PAGE_SIZE = 12

const CHART_COLORS = ['#2563eb', '#0d9488', '#d97706', '#dc2626', '#7c3aed', '#059669', '#db2777', '#64748b', '#ea580c', '#4f46e5']

function pick(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return undefined
  for (const k of keys) {
    if (obj[k] != null && obj[k] !== '') return obj[k]
  }
  return undefined
}

function formatAuditDate(value) {
  try {
    return new Date(value ?? Date.now()).toLocaleString()
  } catch {
    return '-'
  }
}

function accionBadgeClass(accion) {
  const a = String(accion ?? '').toUpperCase()
  if (a === 'INSERT') return 'reports-accion-insert'
  if (a === 'UPDATE') return 'reports-accion-update'
  if (a === 'DELETE') return 'reports-accion-delete'
  return 'reports-accion-default'
}

function ReportsPage() {
  const [auditLog, setAuditLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [resumen, setResumen] = useState(null)
  const [porCategoria, setPorCategoria] = useState([])
  const [porUbicacion, setPorUbicacion] = useState([])
  const [prestamosEstado, setPrestamosEstado] = useState([])
  const [prestamosVencidos, setPrestamosVencidos] = useState([])
  const [mantenimientosEstado, setMantenimientosEstado] = useState([])
  const [topArticulos, setTopArticulos] = useState([])

  const [chartsOk, setChartsOk] = useState({
    resumen: true,
    categoria: true,
    ubicacion: true,
    prestamos: true,
    vencidos: true,
    mantenimientos: true,
    top: true,
  })

  const [filters, setFilters] = useState({
    tipo: 'Todos',
    tabla: '',
    fechaInicio: '',
    fechaFin: '',
    busqueda: '',
  })

  const [auditPage, setAuditPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [modalItem, setModalItem] = useState(null)

  const safeFetch = async (promiseFactory) => {
    try {
      const data = await promiseFactory()
      return { ok: true, data }
    } catch (error) {
      console.error(error)
      return { ok: false, data: null }
    }
  }

  const loadData = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const logPromise = getAuditoriaLog().catch(() => [])

      const [
        logData,
        resumenResult,
        catResult,
        ubiResult,
        prestResult,
        vencResult,
        mantResult,
        topResult,
      ] = await Promise.all([
        logPromise,
        safeFetch(() => getResumenGeneral()),
        safeFetch(() => getInventarioPorCategoria()),
        safeFetch(() => getInventarioPorUbicacion()),
        safeFetch(() => getPrestamosPorEstado()),
        safeFetch(() => getPrestamosVencidos()),
        safeFetch(() => getMantenimientosPorEstado()),
        safeFetch(() => getTopArticulosMovidos(8)),
      ])

      setAuditLog(Array.isArray(logData) ? logData : [])
      setResumen(resumenResult.ok ? resumenResult.data : null)
      setPorCategoria(Array.isArray(catResult.data) ? catResult.data : [])
      setPorUbicacion(Array.isArray(ubiResult.data) ? ubiResult.data : [])
      setPrestamosEstado(Array.isArray(prestResult.data) ? prestResult.data : [])
      setPrestamosVencidos(Array.isArray(vencResult.data) ? vencResult.data : [])
      setMantenimientosEstado(Array.isArray(mantResult.data) ? mantResult.data : [])
      setTopArticulos(Array.isArray(topResult.data) ? topResult.data : [])

      setChartsOk({
        resumen: resumenResult.ok,
        categoria: catResult.ok,
        ubicacion: ubiResult.ok,
        prestamos: prestResult.ok,
        vencidos: vencResult.ok,
        mantenimientos: mantResult.ok,
        top: topResult.ok,
      })
      setAuditPage(1)
    } catch (err) {
      console.error(err)
      setLoadError('No se pudo cargar parte de la información. Revisa la conexión con el API.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredLog = useMemo(() => {
    let list = [...auditLog]

    if (filters.tipo !== 'Todos') {
      const t = filters.tipo.toUpperCase()
      list = list.filter((item) =>
        String(pick(item, 'accion', 'Accion') ?? '')
          .toUpperCase()
          .includes(t),
      )
    }

    if (filters.tabla.trim()) {
      const q = filters.tabla.trim().toLowerCase()
      list = list.filter((item) =>
        String(pick(item, 'tablaAfectada', 'TablaAfectada') ?? '')
          .toLowerCase()
          .includes(q),
      )
    }

    if (filters.busqueda.trim()) {
      const q = filters.busqueda.trim().toLowerCase()
      list = list.filter((item) => {
        const usuario = String(pick(item, 'usuario', 'Usuario') ?? '').toLowerCase()
        const det = String(pick(item, 'detallesCambio', 'DetallesCambio') ?? '').toLowerCase()
        const id = String(pick(item, 'idAuditoria', 'IdAuditoria') ?? '')
        return usuario.includes(q) || det.includes(q) || id.includes(q)
      })
    }

    if (filters.fechaInicio) {
      const start = new Date(filters.fechaInicio)
      start.setHours(0, 0, 0, 0)
      list = list.filter((item) => {
        const d = new Date(pick(item, 'fechaAccion', 'FechaAccion') ?? item.fecha ?? 0)
        return !Number.isNaN(d.getTime()) && d >= start
      })
    }

    if (filters.fechaFin) {
      const end = new Date(filters.fechaFin)
      end.setHours(23, 59, 59, 999)
      list = list.filter((item) => {
        const d = new Date(pick(item, 'fechaAccion', 'FechaAccion') ?? item.fecha ?? 0)
        return !Number.isNaN(d.getTime()) && d <= end
      })
    }

    return list
  }, [auditLog, filters])

  useEffect(() => {
    setAuditPage(1)
  }, [filters.tipo, filters.tabla, filters.fechaInicio, filters.fechaFin, filters.busqueda, auditLog.length])

  const totalAuditPages = Math.max(1, Math.ceil(filteredLog.length / AUDIT_PAGE_SIZE))
  const auditPageSafe = Math.min(auditPage, totalAuditPages)
  const auditSliceStart = (auditPageSafe - 1) * AUDIT_PAGE_SIZE
  const paginatedAudit = filteredLog.slice(auditSliceStart, auditSliceStart + AUDIT_PAGE_SIZE)

  const pieCategoria = useMemo(() => {
    return porCategoria
      .map((row) => ({
        name: String(pick(row, 'categoria', 'Categoria') ?? 'Sin categoría'),
        value: Number(pick(row, 'total', 'Total') ?? 0),
      }))
      .filter((x) => x.value > 0)
  }, [porCategoria])

  const barUbicaciones = useMemo(() => {
    const mapped = porUbicacion.map((row) => {
      const dep = String(pick(row, 'departamento', 'Departamento') ?? '')
      const ubi = String(pick(row, 'ubicacion', 'Ubicacion') ?? '')
      const label = dep && ubi ? `${dep} · ${ubi}` : ubi || dep || '—'
      return {
        name: label.length > 48 ? `${label.slice(0, 45)}…` : label,
        fullName: label,
        total: Number(pick(row, 'total', 'Total') ?? 0),
      }
    })
    return [...mapped].sort((a, b) => b.total - a.total).slice(0, 10)
  }, [porUbicacion])

  const barPrestamos = useMemo(() => {
    return prestamosEstado.map((row) => ({
      name: String(pick(row, 'estado', 'Estado') ?? '—'),
      total: Number(pick(row, 'total', 'Total') ?? 0),
    }))
  }, [prestamosEstado])

  const barMantenimientos = useMemo(() => {
    return mantenimientosEstado.map((row) => ({
      name: String(pick(row, 'estado', 'Estado') ?? '—'),
      total: Number(pick(row, 'total', 'Total') ?? 0),
    }))
  }, [mantenimientosEstado])

  const barTopMovidos = useMemo(() => {
    return topArticulos.map((row) => ({
      name: String(
        pick(row, 'articulo', 'Articulo', 'nombre', 'Nombre') ?? `Art. ${pick(row, 'idArticulo', 'IdArticulo') ?? ''}`,
      ),
      total: Number(
        pick(row, 'totalMovimientos', 'TotalMovimientos', 'total', 'Total') ?? 0,
      ),
    }))
  }, [topArticulos])

  const kpiCards = useMemo(() => {
    const total = Number(pick(resumen, 'totalArticulos', 'TotalArticulos') ?? 0)
    const disp = Number(pick(resumen, 'articulosDisponibles', 'ArticulosDisponibles') ?? 0)
    const pct = total > 0 ? Math.round((disp / total) * 100) : 0
    return [
      {
        key: 'ta',
        title: 'Artículos en inventario',
        value: total || '—',
        detail: chartsOk.resumen ? 'Total registrado en el sistema' : 'Sin datos de resumen',
        percent: chartsOk.resumen ? Math.min(100, pct + 15) : 0,
        tone: 'total',
      },
      {
        key: 'dis',
        title: 'Disponibles',
        value: chartsOk.resumen ? disp : '—',
        detail: chartsOk.resumen ? `${pct}% del inventario activo` : '—',
        percent: chartsOk.resumen ? pct : 0,
        tone: 'success',
      },
      {
        key: 'pre',
        title: 'En préstamo',
        value: chartsOk.resumen ? pick(resumen, 'articulosPrestados', 'ArticulosPrestados') ?? 0 : '—',
        detail: 'Unidades fuera del almacén',
        percent: chartsOk.resumen && total > 0
          ? Math.min(100, Math.round(((Number(pick(resumen, 'articulosPrestados', 'ArticulosPrestados')) || 0) / total) * 100) + 20)
          : 0,
        tone: 'info',
      },
      {
        key: 'man',
        title: 'En mantenimiento',
        value: chartsOk.resumen ? pick(resumen, 'articulosEnMantenimiento', 'ArticulosEnMantenimiento') ?? 0 : '—',
        detail: 'Bajo orden de trabajo',
        percent: chartsOk.resumen && total > 0
          ? Math.min(100, Math.round(((Number(pick(resumen, 'articulosEnMantenimiento', 'ArticulosEnMantenimiento')) || 0) / total) * 100) + 25)
          : 0,
        tone: 'warning',
      },
      {
        key: 'p1',
        title: 'Préstamos activos',
        value: chartsOk.resumen ? pick(resumen, 'prestamosActivos', 'PrestamosActivos') ?? 0 : '—',
        detail: 'Circulación actual',
        percent: 55,
        tone: 'info',
      },
      {
        key: 'p2',
        title: 'Préstamos pendientes',
        value: chartsOk.resumen ? pick(resumen, 'prestamosPendientes', 'PrestamosPendientes') ?? 0 : '—',
        detail: 'Por aprobar o entregar',
        percent: 40,
        tone: 'danger',
      },
    ]
  }, [resumen, chartsOk.resumen])

  const applyFilters = () => {
    setAuditPage(1)
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const limitText = (value, max = 92) => {
    const text = String(value ?? '')
    return text.length > max ? `${text.slice(0, max - 3)}...` : text
  }

  const exportReportPDF = () => {
    if (!filteredLog || filteredLog.length === 0) {
      alert('No hay registros para exportar.')
      return
    }

    try {
      const pdf = new jsPDF('p', 'pt', 'a4')
      const marginX = 36
      const marginY = 36
      const pageHeight = pdf.internal.pageSize.getHeight()
      let y = marginY

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(15)
      pdf.text('Reporte de Auditoría', marginX, y)
      y += 20

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      pdf.text(`Generado: ${new Date().toLocaleString()}`, marginX, y)
      y += 14
      pdf.text(`Registros exportados: ${filteredLog.length}`, marginX, y)
      y += 18

      filteredLog.forEach((item, index) => {
        if (y > pageHeight - 80) {
          pdf.addPage()
          y = marginY
        }

        const id = pick(item, 'idAuditoria', 'IdAuditoria') ?? item.id ?? '-'
        const tipo = pick(item, 'accion', 'Accion') ?? item.tipo ?? '-'
        const fecha = formatAuditDate(pick(item, 'fechaAccion', 'FechaAccion') ?? item.fecha)
        const usuario = pick(item, 'usuario', 'Usuario') ?? item.generadoPor ?? 'Sistema'
        const tabla = pick(item, 'tablaAfectada', 'TablaAfectada') ?? '-'
        const detalle = limitText(pick(item, 'detallesCambio', 'DetallesCambio') ?? 'Sin detalles', 170)

        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(11)
        pdf.text(`#${String(id).padStart(5, '0')} - ${tipo}`, marginX, y)
        y += 14

        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(10)
        pdf.text(`Fecha: ${fecha}`, marginX, y)
        y += 12
        pdf.text(`Usuario: ${usuario}`, marginX, y)
        y += 12
        pdf.text(`Tabla: ${tabla}`, marginX, y)
        y += 12

        const wrapped = pdf.splitTextToSize(`Detalle: ${detalle}`, 520)
        pdf.text(wrapped, marginX, y)
        y += wrapped.length * 12 + 8

        pdf.setDrawColor(220)
        pdf.line(marginX, y, 560, y)
        y += 12

        if (index === filteredLog.length - 1) {
          y += 2
        }
      })

      const filename = `reporte_auditoria_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(filename)
    } catch (err) {
      console.error(err)
      alert('Ocurrió un error al generar el PDF.')
    }
  }

  const exportDetailPDF = (item) => {
    if (!item) return

    try {
      const pdf = new jsPDF('p', 'pt', 'a4')
      const marginX = 40
      let y = 44

      const id = pick(item, 'idAuditoria', 'IdAuditoria') ?? item.id ?? '-'
      const tipo = pick(item, 'accion', 'Accion') ?? item.tipo ?? '-'
      const fecha = formatAuditDate(pick(item, 'fechaAccion', 'FechaAccion') ?? item.fecha)
      const usuario = pick(item, 'usuario', 'Usuario') ?? item.generadoPor ?? 'Sistema'
      const tabla = pick(item, 'tablaAfectada', 'TablaAfectada') ?? '-'
      const detalles = String(pick(item, 'detallesCambio', 'DetallesCambio') ?? 'Sin detalles')

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(16)
      pdf.text('Detalle de Auditoría', marginX, y)
      y += 24

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(11)
      pdf.text(`ID: ${id}`, marginX, y)
      y += 16
      pdf.text(`Tipo: ${tipo}`, marginX, y)
      y += 16
      pdf.text(`Fecha: ${fecha}`, marginX, y)
      y += 16
      pdf.text(`Usuario: ${usuario}`, marginX, y)
      y += 16
      pdf.text(`Tabla: ${tabla}`, marginX, y)
      y += 24

      pdf.setFont('helvetica', 'bold')
      pdf.text('Detalles del cambio:', marginX, y)
      y += 14

      pdf.setFont('helvetica', 'normal')
      const wrapped = pdf.splitTextToSize(detalles, 510)
      pdf.text(wrapped, marginX, y)

      const filename = `detalle_auditoria_${String(id).replace(/[^a-zA-Z0-9_-]/g, '') || 'registro'}.pdf`
      pdf.save(filename)
    } catch (err) {
      console.error(err)
      alert('No se pudo generar el PDF del detalle.')
    }
  }

  const openModal = (item) => {
    setModalItem(item)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setModalItem(null)
  }

  const chartTooltipStyle = {
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    fontSize: 12,
  }

  return (
    <>
      <ModulePageShell
        title="Informes y Auditoría"
        description="Indicadores del API de reportes, gráficos de inventario y préstamos, y bitácora completa de auditoría."
      >
        <div className="reports-layout">
          {loadError ? <p className="feedback-error">{loadError}</p> : null}

          <div className="reports-filters-card">
            <div className="reports-filters-grid">
              <div>
                <label className="reports-filter-label" htmlFor="rep-filter-tipo">Acción</label>
                <select
                  id="rep-filter-tipo"
                  className="reports-filter-select"
                  name="tipo"
                  value={filters.tipo}
                  onChange={handleFilterChange}
                >
                  <option>Todos</option>
                  <option>INSERT</option>
                  <option>UPDATE</option>
                  <option>DELETE</option>
                </select>
              </div>
              <div>
                <label className="reports-filter-label" htmlFor="rep-filter-tabla">Tabla afectada</label>
                <input
                  id="rep-filter-tabla"
                  className="reports-filter-input"
                  name="tabla"
                  value={filters.tabla}
                  onChange={handleFilterChange}
                  placeholder="Ej: ARTICULOS, MOVIMIENTOS…"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="reports-filter-label" htmlFor="rep-filter-busq">Buscar en bitácora</label>
                <input
                  id="rep-filter-busq"
                  className="reports-filter-input"
                  name="busqueda"
                  value={filters.busqueda}
                  onChange={handleFilterChange}
                  placeholder="Usuario, detalle o ID…"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="reports-filter-label" htmlFor="rep-filter-ini">Fecha inicio</label>
                <input
                  id="rep-filter-ini"
                  className="reports-filter-input"
                  type="date"
                  name="fechaInicio"
                  value={filters.fechaInicio}
                  onChange={handleFilterChange}
                />
              </div>
              <div>
                <label className="reports-filter-label" htmlFor="rep-filter-fin">Fecha fin</label>
                <input
                  id="rep-filter-fin"
                  className="reports-filter-input"
                  type="date"
                  name="fechaFin"
                  value={filters.fechaFin}
                  onChange={handleFilterChange}
                />
              </div>
            </div>

            <div className="reports-filter-actions">
              <button type="button" className="btn btn-primary" onClick={applyFilters} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Search size={16} aria-hidden="true" />
                Aplicar filtros
              </button>
              <button
                type="button"
                className="btn"
                onClick={exportReportPDF}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#475569',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 14px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                <Download size={16} aria-hidden="true" />
                Exportar PDF
              </button>
              <button
                type="button"
                className="btn"
                onClick={loadData}
                disabled={loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#64748b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 14px',
                  cursor: loading ? 'wait' : 'pointer',
                  fontWeight: 500,
                }}
              >
                <RotateCw size={16} aria-hidden="true" />
                Actualizar datos
              </button>
            </div>
          </div>

          <section className="dashboard-kpi-row">
            {kpiCards.map((card) => (
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

          <section>
            <div className="reports-section-heading">
              <h2>Gráficos desde ReportesController</h2>
              <p>Inventario por categoría y ubicación, préstamos, mantenimientos y artículos con más movimientos.</p>
            </div>

            <div className="reports-charts-grid" style={{ marginTop: 14 }}>
              <div className="reports-chart-card">
                <h3>Inventario por categoría</h3>
                <p className="reports-chart-sub">Distribución de artículos según categoría académica.</p>
                <div className="reports-chart-body">
                  {!chartsOk.categoria ? (
                    <p className="reports-chart-empty">No se pudo cargar inventario por categoría.</p>
                  ) : pieCategoria.length === 0 ? (
                    <p className="reports-chart-empty">Sin datos de categorías.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={pieCategoria}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={58}
                          outerRadius={96}
                          paddingAngle={2}
                        >
                          {pieCategoria.map((slice, i) => (
                            <Cell key={`${slice.name}-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`${v} u.`, 'Total']} />
                        <Legend layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="reports-chart-card">
                <h3>Top ubicaciones por cantidad</h3>
                <p className="reports-chart-sub">Hasta 10 espacios con más equipos (departamento · sala).</p>
                <div className="reports-chart-body">
                  {!chartsOk.ubicacion ? (
                    <p className="reports-chart-empty">No se pudo cargar inventario por ubicación.</p>
                  ) : barUbicaciones.length === 0 ? (
                    <p className="reports-chart-empty">Sin datos de ubicación.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart layout="vertical" data={barUbicaciones} margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={118}
                          tick={{ fontSize: 10 }}
                          interval={0}
                        />
                        <Tooltip
                          contentStyle={chartTooltipStyle}
                          formatter={(v) => [`${v} artículos`, 'Total']}
                          labelFormatter={(_, p) => (p?.[0]?.payload?.fullName ? String(p[0].payload.fullName) : '')}
                        />
                        <Bar dataKey="total" fill="#2563eb" radius={[0, 6, 6, 0]} maxBarSize={22} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="reports-chart-card">
                <h3>Préstamos por estado</h3>
                <p className="reports-chart-sub">Conteo agrupado por estado del flujo de préstamo.</p>
                <div className="reports-chart-body">
                  {!chartsOk.prestamos ? (
                    <p className="reports-chart-empty">No se pudo cargar préstamos por estado.</p>
                  ) : barPrestamos.length === 0 ? (
                    <p className="reports-chart-empty">No hay préstamos registrados.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={barPrestamos} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={barPrestamos.length > 4 ? -18 : 0} textAnchor={barPrestamos.length > 4 ? 'end' : 'middle'} height={barPrestamos.length > 4 ? 52 : 28} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Bar dataKey="total" fill="#0d9488" radius={[6, 6, 0, 0]} maxBarSize={48} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="reports-chart-card">
                <h3>Mantenimientos por estado</h3>
                <p className="reports-chart-sub">Órdenes de mantenimiento según su situación.</p>
                <div className="reports-chart-body">
                  {!chartsOk.mantenimientos ? (
                    <p className="reports-chart-empty">No se pudo cargar mantenimientos por estado.</p>
                  ) : barMantenimientos.length === 0 ? (
                    <p className="reports-chart-empty">No hay mantenimientos registrados.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={barMantenimientos} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Bar dataKey="total" fill="#dc2626" radius={[6, 6, 0, 0]} maxBarSize={48} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="reports-chart-card">
                <h3>Artículos más movidos</h3>
                <p className="reports-chart-sub">Top por número de registros en MOVIMIENTOS.</p>
                <div className="reports-chart-body">
                  {!chartsOk.top ? (
                    <p className="reports-chart-empty">No se pudo cargar el ranking de movimientos.</p>
                  ) : barTopMovidos.length === 0 ? (
                    <p className="reports-chart-empty">No hay movimientos registrados.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart layout="vertical" data={barTopMovidos} margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} interval={0} />
                        <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`${v}`, 'Movimientos']} />
                        <Bar dataKey="total" fill="#7c3aed" radius={[0, 6, 6, 0]} maxBarSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="reports-vencidos-card">
                <h3>Préstamos vencidos</h3>
                <p>Préstamos activos con fecha prevista de devolución ya superada.</p>
                {!chartsOk.vencidos ? (
                  <p className="reports-chart-empty">No se pudo cargar la lista de vencidos.</p>
                ) : prestamosVencidos.length === 0 ? (
                  <p className="reports-chart-empty" style={{ color: '#059669', fontWeight: 600 }}>
                    No hay préstamos vencidos.
                  </p>
                ) : (
                  <div className="reports-mini-table-wrap">
                    <table className="reports-mini-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Usuario</th>
                          <th>Salida</th>
                          <th>Prevista</th>
                          <th>Días retraso</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prestamosVencidos.map((row, idx) => (
                          <tr key={pick(row, 'idPrestamo', 'IdPrestamo') ?? idx}>
                            <td>{pick(row, 'idPrestamo', 'IdPrestamo') ?? '-'}</td>
                            <td>{pick(row, 'usuario', 'Usuario') ?? '-'}</td>
                            <td>{formatAuditDate(pick(row, 'fechaSalida', 'FechaSalida'))}</td>
                            <td>{formatAuditDate(pick(row, 'fechaPrevista', 'FechaPrevista'))}</td>
                            <td>{pick(row, 'diasRetraso', 'DiasRetraso') ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="reports-audit-card">
            <div className="reports-audit-toolbar">
              <div>
                <h3>Bitácora de auditoría</h3>
                <p>
                  {loading ? 'Cargando…' : `${filteredLog.length} evento(s) · Fuente: AuditoriaController`}
                  {filteredLog.length > AUDIT_PAGE_SIZE
                    ? ` · Página ${auditPageSafe} de ${totalAuditPages}`
                    : null}
                </p>
              </div>
              <div className="reports-audit-pagination">
                <button
                  type="button"
                  className="dashboard-page-button"
                  disabled={auditPageSafe <= 1}
                  onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </button>
                <span>
                  {filteredLog.length === 0
                    ? '—'
                    : `${auditSliceStart + 1}–${Math.min(auditSliceStart + AUDIT_PAGE_SIZE, filteredLog.length)} de ${filteredLog.length}`}
                </span>
                <button
                  type="button"
                  className="dashboard-page-button"
                  disabled={auditPageSafe >= totalAuditPages}
                  onClick={() => setAuditPage((p) => Math.min(totalAuditPages, p + 1))}
                >
                  Siguiente
                </button>
              </div>
            </div>

            <div className="reports-audit-table-wrap">
              {loading ? (
                <p className="users-empty" style={{ padding: 24 }}>Cargando auditoría…</p>
              ) : filteredLog.length === 0 ? (
                <p className="users-empty" style={{ padding: 24 }}>No hay registros que coincidan con los filtros.</p>
              ) : (
                <table className="reports-audit-table">
                  <thead>
                    <tr>
                      <th className="reports-col-id">ID</th>
                      <th className="reports-col-accion">Acción</th>
                      <th className="reports-col-fecha">Fecha</th>
                      <th className="reports-col-usuario">Usuario</th>
                      <th className="reports-col-tabla">Tabla afectada</th>
                      <th className="reports-col-actions">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAudit.map((item, idx) => {
                      const id = pick(item, 'idAuditoria', 'IdAuditoria') ?? idx
                      const accion = pick(item, 'accion', 'Accion') ?? '—'
                      const fecha = pick(item, 'fechaAccion', 'FechaAccion') ?? item.fecha
                      const usuario = pick(item, 'usuario', 'Usuario') ?? item.generadoPor ?? 'Sistema'
                      const tabla = pick(item, 'tablaAfectada', 'TablaAfectada') ?? '—'
                      return (
                        <tr key={id} onClick={() => openModal(item)}>
                          <td className="reports-col-id">#{String(id).padStart(4, '0')}</td>
                          <td className="reports-col-accion">
                            <span className={`reports-accion-badge ${accionBadgeClass(accion)}`}>{accion}</span>
                          </td>
                          <td className="reports-col-fecha">{formatAuditDate(fecha)}</td>
                          <td className="reports-col-usuario">{usuario}</td>
                          <td className="reports-col-tabla">{tabla}</td>
                          <td className="reports-col-actions">
                            <button
                              type="button"
                              className="inventory-icon-button inventory-icon-button-view"
                              title="Ver detalles"
                              aria-label="Ver detalles"
                              onClick={(e) => {
                                e.stopPropagation()
                                openModal(item)
                              }}
                            >
                              <Eye size={16} aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </ModulePageShell>

      {showModal && modalItem ? (
        <div className="modal-backdrop" style={{ zIndex: 99999, background: 'rgba(15, 23, 42, 0.66)', position: 'fixed', inset: 0 }} role="presentation" onClick={closeModal}>
          <section className="modal-card" style={{ maxWidth: 880 }} role="dialog" aria-modal="true" aria-labelledby="rep-modal-title" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, background: '#eff6ff', color: '#1d4ed8', fontWeight: 700 }}>AU</span>
                <div>
                  <h2 id="rep-modal-title" style={{ margin: 0 }}>Detalle de auditoría</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>Registro completo de la acción seleccionada</p>
                </div>
              </div>
              <button type="button" className="icon-button" onClick={closeModal} aria-label="Cerrar">
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            <div className="articulo-modal-body" style={{ padding: 24, background: '#fff' }}>
              <div className="reports-modal-grid">
                <div style={{ display: 'grid', gap: 10 }}>
                  <div className="reports-modal-field"><strong>ID:</strong> {pick(modalItem, 'idAuditoria', 'IdAuditoria') ?? modalItem.id ?? '-'}</div>
                  <div className="reports-modal-field"><strong>Acción:</strong> {pick(modalItem, 'accion', 'Accion') ?? '-'}</div>
                  <div className="reports-modal-field"><strong>Fecha:</strong> {formatAuditDate(pick(modalItem, 'fechaAccion', 'FechaAccion') ?? modalItem.fecha)}</div>
                  <div className="reports-modal-field"><strong>Usuario:</strong> {pick(modalItem, 'usuario', 'Usuario') ?? modalItem.generadoPor ?? 'Sistema'}</div>
                  <div className="reports-modal-field" style={{ wordBreak: 'break-word' }}>
                    <strong>Tabla afectada:</strong>{' '}
                    {pick(modalItem, 'tablaAfectada', 'TablaAfectada') ?? '—'}
                  </div>
                </div>
                <div>
                  <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#1e293b' }}>Detalles del cambio</p>
                  <div className="reports-modal-detalles">
                    {String(pick(modalItem, 'detallesCambio', 'DetallesCambio') ?? 'Sin detalles')}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn" onClick={closeModal}>Cerrar</button>
                <button type="button" className="btn btn-primary" onClick={() => exportDetailPDF(modalItem)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Download size={14} aria-hidden="true" />
                  Descargar PDF
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}

export default ReportsPage
