import httpClient from '@/core/api/httpClient'

export async function getResumenGeneral() {
  const response = await httpClient.get('/Reportes/resumen-general')
  return response.data
}

export async function getInventarioPorCategoria() {
  const response = await httpClient.get('/Reportes/inventario-por-categoria')
  return response.data
}

export async function getInventarioPorUbicacion() {
  const response = await httpClient.get('/Reportes/inventario-por-ubicacion')
  return response.data
}

export async function getPrestamosPorEstado() {
  const response = await httpClient.get('/Reportes/prestamos-por-estado')
  return response.data
}

export async function getPrestamosVencidos(fechaCorte) {
  const params = fechaCorte ? { fechaCorte: fechaCorte.toISOString() } : {}
  const response = await httpClient.get('/Reportes/prestamos-vencidos', { params })
  return response.data
}

export async function getMantenimientosPorEstado() {
  const response = await httpClient.get('/Reportes/mantenimientos-por-estado')
  return response.data
}

export async function getTopArticulosMovidos(top = 5) {
  const response = await httpClient.get('/Reportes/top-articulos-movidos', { params: { top } })
  return response.data
}

export async function getAuditoriaLog() {
  const response = await httpClient.get('/Auditoria/log')
  return Array.isArray(response.data) ? response.data : []
}
