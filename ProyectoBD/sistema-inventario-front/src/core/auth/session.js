import { toCanonicalRole } from '@/core/auth/roles'

const SESSION_KEY = 'auth_session'

export function getStoredSession() {
  const rawValue = localStorage.getItem(SESSION_KEY)
  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue)

    if (!parsed?.token) {
      return null
    }

    if (parsed.expiresAt && Date.now() >= parsed.expiresAt) {
      clearSession()
      return null
    }

    return parsed
  } catch {
    clearSession()
    return null
  }
}

export function saveSession(authResponse) {
  const canonicalRole = toCanonicalRole(authResponse?.rol)
  const expiresInSeconds = Number(authResponse?.expiresIn ?? 0)

  const session = {
    token: authResponse?.token ?? '',
    userId: authResponse?.idUsuario ?? null,
    userName: authResponse?.nombre ?? 'Usuario',
    role: canonicalRole,
    expiresAt:
      expiresInSeconds > 0 ? Date.now() + expiresInSeconds * 1000 : undefined,
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  localStorage.setItem('access_token', session.token)
  localStorage.setItem('user_role', session.role)

  return session
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem('access_token')
  localStorage.removeItem('user_role')
}
