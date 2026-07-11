import { NavLink } from 'react-router-dom'
import styles from './AppNav.module.css'

const TABS = [
  { to: '/activos', label: 'Activos' },
  { to: '/reportes', label: 'Reportes' },
  { to: '/historial', label: 'Historial de baja' },
]

export function AppNav({ badges = {} }) {
  return (
    <nav className={styles.nav}>
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`.trim()}
        >
          <span>{tab.label}</span>
          {badges[tab.to] ? <span className={styles.badge}>{badges[tab.to]}</span> : null}
        </NavLink>
      ))}
    </nav>
  )
}
