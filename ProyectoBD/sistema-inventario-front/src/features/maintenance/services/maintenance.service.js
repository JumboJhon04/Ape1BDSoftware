import httpClient from '@/core/api/httpClient'

export async function getActiveMaintenances() {
  const response = await httpClient.get('/Mantenimientos/activos')
  return Array.isArray(response.data) ? response.data : []
}

export async function getAllMaintenances() {
  const response = await httpClient.get('/Mantenimientos')
  return Array.isArray(response.data) ? response.data : []
}

export async function startMaintenance(payload) {
  const response = await httpClient.post('/Mantenimientos/iniciar', payload)
  return response.data
}

export async function acceptMaintenance(idMantenimiento) {
  const response = await httpClient.put(`/Mantenimientos/aceptar/${idMantenimiento}`)
  return response.data
}

export async function rejectMaintenance(idMantenimiento) {
  const response = await httpClient.put(`/Mantenimientos/rechazar/${idMantenimiento}`)
  return response.data
}

export async function finishMaintenance(payload) {
  const response = await httpClient.put('/Mantenimientos/finalizar', payload)
  return response.data
}
