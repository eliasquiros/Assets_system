import { useTheme } from '../context/ThemeContext'
import styles from './ThemeToggle.module.css'

function IconoSol({ size = 15 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.4M12 19.1v2.4M4.64 4.64l1.7 1.7M17.66 17.66l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.64 19.36l1.7-1.7M17.66 6.34l1.7-1.7" />
    </svg>
  )
}

function IconoLuna({ size = 15 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  )
}

// Sol = modo claro activo (clic para pasar a oscuro); luna = modo oscuro
// activo (clic para volver a claro). El icono es el estado, no una accion
// ambigua: no hace falta leer la etiqueta para saber que hace.
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const esOscuro = theme === 'dark'
  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={esOscuro ? 'Modo claro' : 'Modo oscuro'}
    >
      {esOscuro ? <IconoLuna /> : <IconoSol />}
    </button>
  )
}
