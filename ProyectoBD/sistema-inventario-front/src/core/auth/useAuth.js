import { useContext } from 'react'
import AuthContext from '@/core/auth/auth-context'

function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }

  return context
}

export default useAuth
