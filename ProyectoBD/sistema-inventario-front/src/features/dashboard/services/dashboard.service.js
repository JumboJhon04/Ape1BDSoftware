import httpClient from '@/core/api/httpClient'

function toArray(data) {
  return Array.isArray(data) ? data : []
}

async function getCatalogoArticulos() {
  const response = await httpClient.get('/Articulos/catalogo')
  return toArray(response.data)
}

async function getPrestamos() {
  const response = await httpClient.get('/Prestamos')
  return toArray(response.data)
}

async function getMantenimientosActivos() {
  const response = await httpClient.get('/Mantenimientos/activos')
  return toArray(response.data)
}

async function getMantenimientosTodos() {
  const response = await httpClient.get('/Mantenimientos')
  return toArray(response.data)
}

export async function getDashboardData(role) {
  const articulosPromise = getCatalogoArticulos()

  const canReadOperationalData = role === 'administrador' || role === 'docente'

  if (!canReadOperationalData) {
    const articulos = await articulosPromise

    return {
      articulos,
      prestamos: [],
      mantenimientos: [],
      mantenimientosTodos: [],
      warnings: [
        'Tu perfil no tiene acceso al listado global de prestamos y mantenimientos.',
      ],
    }
  }

  const settled = await Promise.allSettled([
    articulosPromise,
    getPrestamos(),
    getMantenimientosActivos(),
    role === 'docente' ? getMantenimientosTodos() : Promise.resolve([]),
  ])

  const [articulosResult, prestamosResult, mantenimientosResult, mantTodosResult] = settled

  const warnings = []

  if (articulosResult.status === 'rejected') {
    throw articulosResult.reason
  }

  if (prestamosResult.status === 'rejected') {
    warnings.push('No se pudo cargar la tabla de prestamos desde el backend.')
  }

  if (mantenimientosResult.status === 'rejected') {
    warnings.push('No se pudo cargar la tabla de mantenimientos activos desde el backend.')
  }

  if (role === 'docente' && mantTodosResult.status === 'rejected') {
    warnings.push('No se pudo cargar el detalle de mantenimientos para alertas.')
  }

  return {
    articulos: articulosResult.value,
    prestamos: prestamosResult.status === 'fulfilled' ? prestamosResult.value : [],
    mantenimientos:
      mantenimientosResult.status === 'fulfilled' ? mantenimientosResult.value : [],
    mantenimientosTodos:
      role === 'docente' && mantTodosResult.status === 'fulfilled' ? mantTodosResult.value : [],
    warnings,
  }
}
