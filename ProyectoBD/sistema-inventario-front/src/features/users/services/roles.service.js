import httpClient from '@/core/api/httpClient'

export async function getRoles() {
  const response = await httpClient.get('/Roles')
  return response.data
}
