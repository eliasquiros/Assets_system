import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { FormField } from '../../components/FormField'
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

        <FormField label="Usuario">
          <input
            className={styles.input}
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoComplete="username"
            aria-label="Usuario"
          />
        </FormField>
        <FormField label="Contraseña">
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            aria-label="Contraseña"
          />
        </FormField>

        {error && <p className={styles.error}>{error}</p>}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Ingresando…' : 'Ingresar'}
        </Button>

        <p className={styles.secure}>Conexión cifrada · HTTPS</p>
      </form>
    </div>
  )
}
