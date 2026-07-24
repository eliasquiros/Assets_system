import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/Button'
import styles from './LoginView.module.css'

/* Marca de la app: capas apiladas = inventario de activos. */
function Marca({ size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 3 7.5l9 4.5 9-4.5L12 3Z" />
      <path d="m3 12.5 9 4.5 9-4.5" />
      <path d="m3 17 9 4.5 9-4.5" />
    </svg>
  )
}

/* Lo que se destaca aca describe capacidades que el sistema realmente tiene
   (aislamiento por empresa, calculo automatico, datos en vivo); no son
   reclamos de marketing. Solo el titulo — sin bajada — asi que cada icono
   tiene que comunicar la idea por si solo. */
const GARANTIAS = [
  {
    titulo: 'Datos aislados por empresa',
    // Escudo con check: aislamiento / integridad de los datos.
    icono: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
  },
  {
    titulo: 'Cálculo de depreciación automática',
    // Linea en descenso: el valor en libros que baja con el tiempo.
    icono: <><path d="m3 7 6.5 6.5 4-4L21 17" /><path d="M15 17h6v-6" /></>,
  },
  {
    titulo: 'Gestión de activos fijos en tiempo real',
    // Pulso de actividad: datos que se actualizan al momento.
    icono: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  },
  {
    titulo: 'Conforme a los requerimientos de Hacienda y listo para auditorías',
    // Documento con check: mismo icono que "Reporte de auditoría" en Reportes.
    icono: <><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-5-5Z" /><path d="M14 2v5h5" /><path d="m9.5 14.5 1.75 1.75L15 12.5" /></>,
  },
]

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
      {/* Panel de marca. Decorativo: se oculta en pantallas angostas y no
          contiene ningun control. */}
      <aside className={styles.aside} aria-hidden="true">
        <div className={styles.asideInner}>
          <div className={styles.asideBrand}>
            <span className={styles.asideMark}><Marca size={20} /></span>
            <span className={styles.asideName}>Acticr</span>
          </div>
          <p className={styles.asideLead}>
            Sistema de gestión de activos fijos
          </p>
          <ul className={styles.garantias}>
            {GARANTIAS.map((g) => (
              <li key={g.titulo} className={styles.garantia}>
                <span className={styles.garantiaIcono}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    {g.icono}
                  </svg>
                </span>
                <span className={styles.garantiaTitulo}>{g.titulo}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className={styles.formCol}>
        <form className={styles.card} onSubmit={handleSubmit}>
          <div className={styles.brand}>
            <div className={styles.logo}><Marca size={22} /></div>
            <div>
              <div className={styles.title}>Acticr</div>
              <div className={styles.subtitle}>Sistema de Gestión de Activos</div>
            </div>
          </div>

          {/* Cada empresa tiene su propio subdominio (DA16); mostrarlo aquí deja
              que el usuario confirme, antes de escribir su contraseña, que está
              en la URL de su propia empresa y no en la de otra. */}
          <p className={styles.tenantHint}>
            <svg className={styles.lock} viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect width="15" height="10" x="4.5" y="11" rx="2.5" />
              <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
            </svg>
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
                <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                  <line x1="3" y1="21" x2="21" y2="3" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
      </main>
    </div>
  )
}
