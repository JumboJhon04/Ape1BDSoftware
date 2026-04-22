import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from '@/shared/layout/DashboardLayout'
import { appRoutes } from './routes'
import { getRoutesByRole } from '@/core/auth/roles'
import useAuth from '@/core/auth/useAuth'
import LoginPage from '@/features/auth/pages/LoginPage'

function AppRouter() {
  const { role: currentRole, isAuthenticated } = useAuth()
  const allowedRoutes = getRoutesByRole(appRoutes, currentRole)
  const homePath = allowedRoutes[0]?.path ?? '/dashboard'

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to={homePath} replace /> : <LoginPage />
          }
        />

        <Route
          element={
            isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" replace />
          }
        >
          <Route path="/" element={<Navigate to={homePath} replace />} />
          {allowedRoutes.map((route) => {
            const PageComponent = route.component

            return (
              <Route
                key={route.path}
                path={route.path}
                element={<PageComponent />}
              />
            )
          })}
          <Route path="*" element={<Navigate to={homePath} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
