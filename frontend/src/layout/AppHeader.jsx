import { MarcaActicr } from '../components/MarcaActicr'
import { useAuth } from '../context/AuthContext'
import styles from './AppHeader.module.css'

export function AppHeader() {
  const { empresa, username, logout } = useAuth()
  const iniciales = (username || '?').slice(0, 2).toUpperCase()
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.logo} aria-hidden="true">
          <MarcaActicr width={20} />
        </div>
        <div>
          <div className={styles.title}>Acticr</div>
          <div className={styles.subtitle}>Sistema de Gestión de Activos</div>
        </div>
      </div>
      {/* Div, no button: es solo informativo (no hay accion detras todavia), asi
          que no debe leerse como algo clickeable. Se destaca con una franja de
          acento a la izquierda en vez de un fondo/hover que sugiera boton. */}
      <div className={styles.company}>
        <span className={styles.companyLabel}>Empresa</span>
        <span className={styles.companyName}>{empresa}</span>
      </div>
      <div className={styles.session}>
        <div className={styles.user}>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{username}</div>
          </div>
          <div className={styles.avatar}>{iniciales}</div>
        </div>
        <button type="button" className={styles.logout} onClick={logout}>Salir</button>
      </div>
    </header>
  )
}
