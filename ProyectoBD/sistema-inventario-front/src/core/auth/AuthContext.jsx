import { useMemo, useState } from 'react'
import { clearSession, getStoredSession, saveSession } from '@/core/auth/session'
import AuthContext from '@/core/auth/auth-context'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getStoredSession)

  const login = (authResponse) => {
    const nextSession = saveSession(authResponse)
    setSession(nextSession)
  }

  const logout = () => {
    clearSession()
    setSession(null)
  }

  const authValue = useMemo(
    () => ({
      session,
      role: session?.role ?? null,
      userName: session?.userName ?? '',
      token: session?.token ?? '',
      isAuthenticated: Boolean(session?.token),
      login,
      logout,
    }),
    [session],
  )

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
}
