import { useAuth } from '../context/AuthContext'
import styles from './AppHeader.module.css'

export function AppHeader() {
  const { empresa, username, logout } = useAuth()
  const iniciales = (username || '?').slice(0, 2).toUpperCase()
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.logo}>AF</div>
        <div>
          <div className={styles.title}>Sistema de Activos Fijos</div>
          <div className={styles.subtitle}>Gestión contable · Costa Rica</div>
        </div>
      </div>
      <button type="button" className={styles.company}>
        <span>
          <span className={styles.companyLabel}>Empresa</span>
          <span className={styles.companyName}>{empresa}</span>
        </span>
        <span aria-hidden="true">▾</span>
      </button>
      <div className={styles.session}>
        <span className={styles.secure}>Conexión cifrada · HTTPS</span>
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
