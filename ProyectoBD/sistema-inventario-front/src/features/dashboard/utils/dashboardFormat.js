export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function formatDate(value) {
  if (!value) return '-'

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return '-'

  return parsedDate.toLocaleDateString('es-EC')
}

/** Fecha en formato YYYY-MM-DD (útil para tablas tipo reporte). */
export function formatDateISO(value) {
  if (!value) return '-'
  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return '-'
  return parsedDate.toISOString().slice(0, 10)
}

export function getPercentage(value, total) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

export function getPrestamoStatusClass(status) {
  const normalizedStatus = normalizeText(status)

  if (normalizedStatus === 'activo') return 'dashboard-status-chip-info'
  if (normalizedStatus === 'pendiente') return 'dashboard-status-chip-warning'
  if (normalizedStatus === 'finalizado') return 'dashboard-status-chip-success'
  if (normalizedStatus === 'vencido') return 'dashboard-status-chip-danger'

  return 'dashboard-status-chip-neutral'
}

export function getPageNumbers(totalPages) {
  return Array.from({ length: totalPages }, (_, index) => index + 1)
}

export function pick(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return undefined
  for (const k of keys) {
    if (obj[k] != null && obj[k] !== '') return obj[k]
  }
  return undefined
}

export function sameId(a, b) {
  if (a == null || b == null) return false
  return Number(a) === Number(b)
}
