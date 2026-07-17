import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/Button'
import styles from './LoginView.module.css'

export function LoginView() {
  const { login } = useAuth()
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        <input
          className={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="Contraseña"
          aria-label="Contraseña"
        />

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
