import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/Button'
import styles from './LoginView.module.css'

export function LoginView() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Si ya hay sesion (p.ej. se recargo la pagina o se navego a /login estando
  // dentro), no mostramos el formulario: directo a la app.
  if (isAuthenticated) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    if (!usuario.trim() || !password.trim()) {
      setError('Ingresa tu usuario y contraseña')
      return
    }
    setError('')
    setIsSubmitting(true)
    try {
      await login(usuario.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.accent} />
        <div className={styles.brand}>
          <div className={styles.logo}>AF</div>
          <div>
            <div className={styles.title}>Sistema de Activos Fijos</div>
            <div className={styles.subtitle}>Gestión contable · Costa Rica</div>
          </div>
        </div>

        {/* Cada empresa tiene su propio subdominio (DA16); mostrarlo aquí deja
            que el usuario confirme, antes de escribir su contraseña, que está
            en la URL de su propia empresa y no en la de otra. */}
        <p className={styles.tenantHint}>
          Ingresando en <strong>{window.location.host}</strong>
        </p>

        <input
          className={styles.input}
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          autoComplete="username"
          placeholder="Usuario"
          aria-label="Usuario"
        />
        <div className={styles.passwordField}>
          <input
            className={styles.input}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="Contraseña"
            aria-label="Contraseña"
          />
          <button
            type="button"
            className={styles.togglePassword}
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={showPassword}
            tabIndex={-1}
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
                <line x1="3" y1="21" x2="21" y2="3" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        {error && (
          <div className={styles.error}>
            <p className={styles.errorMessage}>{error}</p>
            <p className={styles.errorHint}>¿Seguro que es la dirección de tu empresa? Verifica la URL.</p>
          </div>
        )}

        <Button type="submit" className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>
    </div>
  )
}
