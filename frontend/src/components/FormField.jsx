import styles from './FormField.module.css'

export function FormField({ label, error, required = true, hint, children }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>
        {label} {required && <span className={styles.required}>*</span>}
      </span>
      {children}
      {error && <span className={styles.error}>{error}</span>}
      {!error && hint && <span className={styles.hint}>{hint}</span>}
    </label>
  )
}
