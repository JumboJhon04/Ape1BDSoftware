import useAuth from '@/core/auth/useAuth'
import { USER_ROLES } from '@/core/auth/roles'
import AdminInventoryPage from '@/features/inventory/pages/AdminInventoryPage'
import DocenteInventoryPage from '@/features/inventory/pages/DocenteInventoryPage'

/**
 * Punto único de ruta `/inventario`: delega en la vista correspondiente al rol.
 */
function InventoryPage() {
  const { role } = useAuth()

  if (role === USER_ROLES.DOCENTE) {
    return <DocenteInventoryPage />
  }

  return <AdminInventoryPage />
}

export default InventoryPage
