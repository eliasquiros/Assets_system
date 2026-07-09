import styles from './FormField.module.css'

export function FormField({ label, error, required = true, children }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>
        {label} {required && <span className={styles.required}>*</span>}
      </span>
      {children}
      {error && <span className={styles.error}>{error}</span>}
    </label>
  )
}
