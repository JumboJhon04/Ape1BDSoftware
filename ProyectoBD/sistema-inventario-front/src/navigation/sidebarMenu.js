import { USER_ROLES } from '@/core/auth/roles'

export function getSidebarNavEntries(role, allowedRoutes) {
  const paths = new Set(allowedRoutes.map((r) => r.path))
  const routeByPath = Object.fromEntries(allowedRoutes.map((r) => [r.path, r]))

  const pushPath = (entries, path, title, matchFn) => {
    if (!paths.has(path)) return
    const r = routeByPath[path]
    entries.push({ to: path, match: matchFn, title, icon: r.icon })
  }

  if (role === USER_ROLES.DOCENTE) {
    const entries = []

    pushPath(entries, '/dashboard', 'Panel de Control', (loc) => loc.pathname === '/dashboard')

    if (paths.has('/inventario')) {
      const r = routeByPath['/inventario']
      entries.push({
        to: '/inventario',
        match: (loc) =>
          loc.pathname.startsWith('/inventario') && !loc.search.includes('misEquipos=1'),
        title: 'Catálogo de artículos',
        icon: r.icon,
      })
    }

    pushPath(entries, '/prestamos', 'Mis préstamos', (loc) => loc.pathname.startsWith('/prestamos'))

    if (paths.has('/inventario')) {
      const r = routeByPath['/inventario']
      entries.push({
        to: '/inventario?misEquipos=1',
        match: (loc) =>
          loc.pathname.startsWith('/inventario') && loc.search.includes('misEquipos=1'),
        title: 'Equipos a mi cargo',
        icon: r.icon,
      })
    }

    return entries
  }

  if (role === USER_ROLES.ESTUDIANTE) {
    const entries = []

    pushPath(entries, '/dashboard', 'Panel de Control', (loc) => loc.pathname === '/dashboard')

    if (paths.has('/inventario')) {
      const r = routeByPath['/inventario']
      entries.push({
        to: '/inventario',
        match: (loc) =>
          loc.pathname.startsWith('/inventario') && !loc.search.includes('misEquipos=1'),
        title: 'Catálogo de artículos',
        icon: r.icon,
      })
    }

    pushPath(entries, '/prestamos', 'Mis préstamos', (loc) => loc.pathname.startsWith('/prestamos'))

    return entries
  }

  // Admin y otros roles
  return allowedRoutes
    .filter((r) => r.showInMenu !== false)
    .map((r) => ({
      to: r.path,
      match: (loc) =>
        loc.pathname === r.path ||
        (r.path !== '/' && loc.pathname.startsWith(`${r.path}/`)),
      title: r.menuTitleByRole?.[role] ?? r.title,
      icon: r.icon,
    }))
}