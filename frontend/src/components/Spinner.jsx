import styles from './Spinner.module.css'

export function Spinner({ size = 14 }) {
  return (
    <span
      className={styles.spinner}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Cargando"
    />
  )
}
