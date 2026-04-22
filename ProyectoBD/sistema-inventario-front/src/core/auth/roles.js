export const USER_ROLES = {
  ADMIN: 'administrador',
  DOCENTE: 'docente',
  ESTUDIANTE: 'estudiante',
}

const DEFAULT_ROLE = USER_ROLES.ADMIN

function normalizeRole(role) {
  return role
    ?.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function toCanonicalRole(role) {
  const normalizedRole = normalizeRole(role)

  if (normalizedRole?.startsWith('admin')) return USER_ROLES.ADMIN
  if (normalizedRole?.startsWith('doc')) return USER_ROLES.DOCENTE
  if (normalizedRole?.startsWith('estu')) return USER_ROLES.ESTUDIANTE

  return DEFAULT_ROLE
}

export function getCurrentRole() {
  const storedRole = localStorage.getItem('user_role')
  return toCanonicalRole(storedRole)
}

export function setCurrentRole(role) {
  const canonicalRole = toCanonicalRole(role)
  localStorage.setItem('user_role', canonicalRole)
  return canonicalRole
}

export function getRoutesByRole(routes, role) {
  return routes.filter((route) => route.roles.includes(role))
}

export function toRoleLabel(role) {
  if (role === USER_ROLES.ADMIN) return 'Administrador'
  if (role === USER_ROLES.DOCENTE) return 'Docente'
  if (role === USER_ROLES.ESTUDIANTE) return 'Estudiante'
  return 'Administrador'
}
