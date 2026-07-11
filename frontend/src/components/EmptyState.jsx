import styles from './EmptyState.module.css'

export function EmptyState({ message }) {
  return <div className={styles.empty}>{message}</div>
}
