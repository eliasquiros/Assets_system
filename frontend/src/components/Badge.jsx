import styles from './Badge.module.css'

const VARIANTS = {
  depreciando: styles.success,
  'pendiente de baja': styles.warning,
  pendiente: styles.warning,
  definitiva: styles.dark,
  revertida: styles.neutral,
}

export function Badge({ label }) {
  const className = VARIANTS[(label || '').toLowerCase()] || styles.neutral
  return (
    <span className={`${styles.badge} ${className}`}>
      <span className={styles.dot} />
      {label}
    </span>
  )
}
