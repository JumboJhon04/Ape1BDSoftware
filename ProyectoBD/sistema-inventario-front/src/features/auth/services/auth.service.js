import httpClient from '@/core/api/httpClient'

export async function loginRequest({ correo, password }) {
  const response = await httpClient.post('/Auth/login', {
    correo,
    password,
  })

  return response.data
}
