import DashboardPage from '@/features/dashboard/pages/DashboardPage'
import InventoryPage from '@/features/inventory/pages/InventoryPage'
import InventoryDetailPage from '@/features/inventory/pages/InventoryDetailPage'
import LoansPage from '@/features/loans/pages/LoansPage'
import MaintenancePage from '@/features/maintenance/pages/MaintenancePage'
import ReportsPage from '@/features/reports/pages/ReportsPage'
import UsersPage from '@/features/users/pages/UsersPage'
import {
  Boxes,
  ClipboardCheck,
  Gauge,
  ShieldCheck,
  UserCog,
  Wrench,
} from 'lucide-react'

export const appRoutes = [
  {
    path: '/dashboard',
    title: 'Panel de Control',
    component: DashboardPage,
    icon: Gauge,
    description: 'Resumen general y acceso rapido a los modulos habilitados.',
    roles: ['administrador', 'docente', 'estudiante'],
  },
  {
    path: '/inventario',
    title: 'Gestion de Inventario',
    component: InventoryPage,
    icon: Boxes,
    description: 'Consulta, administra y da seguimiento a los articulos.',
    roles: ['administrador', 'docente', 'estudiante'],
  },
  {
    path: '/inventario/detalle/:idArticulo',
    title: 'Detalle de Inventario',
    component: InventoryDetailPage,
    icon: Boxes,
    description: 'Vista detallada de un articulo individual.',
    roles: ['administrador', 'docente', 'estudiante'],
    showInMenu: false,
  },
  {
    path: '/prestamos',
    title: 'Modulo de Prestamos',
    component: LoansPage,
    icon: ClipboardCheck,
    description: 'Solicitudes, aprobaciones y devoluciones de equipos.',
    roles: ['administrador', 'docente', 'estudiante'],
  },
  {
    path: '/mantenimiento',
    title: 'Mantenimiento',
    component: MaintenancePage,
    icon: Wrench,
    description: 'Seguimiento tecnico de incidencias y mantenimientos.',
    roles: ['administrador', 'docente'],
  },
  {
    path: '/reportes-auditoria',
    title: 'Informes y Auditoria',
    component: ReportsPage,
    icon: ShieldCheck,
    description: 'Reportes, trazabilidad y bitacora de cambios.',
    roles: ['administrador'],
  },
  {
    path: '/usuarios',
    title: 'Gestion de Usuarios',
    component: UsersPage,
    icon: UserCog,
    description: 'Administracion de cuentas, roles y estados.',
    roles: ['administrador'],
  },
]
