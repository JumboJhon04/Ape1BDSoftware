import httpClient from '@/core/api/httpClient'

export async function getUsers() {
  const response = await httpClient.get('/Usuarios')
  return response.data
}

export async function createUser(payload) {
  const response = await httpClient.post('/Usuarios', payload)
  return response.data
}

export async function updateUser(id, payload) {
  const response = await httpClient.put(`/Usuarios/${id}`, payload)
  return response.data
}

export async function deactivateUser(id) {
  const response = await httpClient.patch(`/Usuarios/${id}/desactivar`)
  return response.data
}
