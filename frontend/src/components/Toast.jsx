import { useToast } from '../context/ToastContext'
import styles from './Toast.module.css'

export function Toast() {
  const { toast } = useToast()
  if (!toast) return null
  const isError = toast.type === 'error'
  return (
    <div className={styles.wrap}>
      <div className={`${styles.toast} ${isError ? styles.error : styles.success}`}>
        <span className={styles.icon}>{isError ? '!' : '✓'}</span>
        <span className={styles.msg}>{toast.msg}</span>
      </div>
    </div>
  )
}
