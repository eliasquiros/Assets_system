import { useToast } from '../context/ToastContext'
import styles from './Toast.module.css'

export function Toast() {
  const { toast } = useToast()
  const isError = toast?.type === 'error'
  return (
    /* La region viva se monta siempre, aunque este vacia: un aria-live que
       aparece junto con su contenido no llega a anunciarse en lectores de
       pantalla. El aviso en si sigue siendo condicional. */
    <div className={styles.wrap} aria-live="polite" aria-atomic="true">
      {toast && (
        <div className={`${styles.toast} ${isError ? styles.error : styles.success}`}>
          <span className={styles.icon} aria-hidden="true">
            {isError ? (
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8v5" />
                <path d="M12 16.5h.01" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12.5 4.5 4.5L19 7.5" />
              </svg>
            )}
          </span>
          <span className={styles.msg}>{toast.msg}</span>
        </div>
      )}
    </div>
  )
}
