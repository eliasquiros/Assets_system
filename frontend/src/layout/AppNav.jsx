import { NavLink } from 'react-router-dom'
import styles from './AppNav.module.css'

/* Iconos en linea (trazo, estilo Lucide). Van como decoracion: el nombre de la
   pestaña sigue siendo texto, asi que no hacen falta etiquetas accesibles. */
const ICONS = {
  '/activos': (
    <>
      <path d="M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </>
  ),
  '/reportes': (
    <>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="M7 16v-5" />
      <path d="M12 16V8" />
      <path d="M17 16v-3" />
    </>
  ),
  '/historial': (
    <>
      <rect width="20" height="5" x="2" y="3" rx="1.5" />
      <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
      <path d="M10 12h4" />
    </>
  ),
}

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
          <svg
            className={styles.icon} viewBox="0 0 24 24" width="16" height="16"
            fill="none" stroke="currentColor" strokeWidth="1.7"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          >
            {ICONS[tab.to]}
          </svg>
          <span>{tab.label}</span>
          {badges[tab.to] ? <span className={styles.badge}>{badges[tab.to]}</span> : null}
        </NavLink>
      ))}
    </nav>
  )
}
