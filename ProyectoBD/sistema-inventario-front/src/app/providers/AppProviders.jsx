import { AuthProvider } from '@/core/auth/AuthContext'

function AppProviders({ children }) {
  return <AuthProvider>{children}</AuthProvider>
}

export default AppProviders
