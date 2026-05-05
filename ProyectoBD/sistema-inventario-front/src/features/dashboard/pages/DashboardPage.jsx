import useAuth from '@/core/auth/useAuth'
import { USER_ROLES } from '@/core/auth/roles'
import AdminDashboardPage from '@/features/dashboard/pages/AdminDashboardPage'
import DocenteDashboardPage from '@/features/dashboard/pages/DocenteDashboardPage'

/**
 * Punto único de ruta `/dashboard`: delega en la vista correspondiente al rol.
 */
function DashboardPage() {
  const { role } = useAuth()

  if (role === USER_ROLES.DOCENTE) {
    return <DocenteDashboardPage />
  }

  return <AdminDashboardPage />
}

export default DashboardPage
