import httpClient from '@/core/api/httpClient'

export async function getNotifications() {
  const response = await httpClient.get('/Notificaciones/pendientes')
  return Array.isArray(response.data) ? response.data : []
}
