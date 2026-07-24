import { useAuth } from '../context/AuthContext'
import styles from './AppHeader.module.css'

export function AppHeader() {
  const { empresa, username, logout } = useAuth()
  const iniciales = (username || '?').slice(0, 2).toUpperCase()
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        {/* Marca: capas apiladas = inventario de activos. SVG inline en vez de
            las iniciales "AF" en una caja — pesa lo mismo y escala nitido. */}
        <div className={styles.logo} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3 3 7.5l9 4.5 9-4.5L12 3Z" />
            <path d="m3 12.5 9 4.5 9-4.5" />
            <path d="m3 17 9 4.5 9-4.5" />
          </svg>
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
