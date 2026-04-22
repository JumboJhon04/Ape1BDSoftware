import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '@/core/auth/useAuth'
import { loginRequest } from '@/features/auth/services/auth.service'

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setErrorMessage('')

    try {
      const authResponse = await loginRequest({ correo, password })
      login(authResponse)
      navigate('/', { replace: true })
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ??
          'No se pudo iniciar sesion. Verifica tus credenciales.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-screen-splitview">
      <section className="auth-section-brand">
        <div className="auth-brand-content">
          <h1 className="auth-brand-title">Sistema de Gestion de Inventario de Equipos Tecnologicos</h1>
          <p className="auth-brand-description">
            Optimice el control de sus equipos, gestione prestamos y mantenimientos de forma
            eficiente. Acceso rapido y seguro para administradores, profesores y estudiantes.
          </p>
        </div>
      </section>

      <section className="auth-section-form">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2 className="auth-form-title">Iniciar Sesion</h2>

          <label>
            <span className="form-label-text">Correo Electronico</span>
            <input
              type="email"
              value={correo}
              onChange={(event) => setCorreo(event.target.value)}
              placeholder="su.correo@example.com"
              autoComplete="email"
            />
          </label>

          <label>
            <span className="form-label-text">Contrasena</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="********"
              autoComplete="current-password"
            />
          </label>

          {errorMessage ? <p className="feedback-error">{errorMessage}</p> : null}

          <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default LoginPage
