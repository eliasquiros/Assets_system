import { money } from '../../lib/money'
import styles from './ActivoSummaryBar.module.css'

export function ActivoSummaryBar({ label, activos }) {
  const count = activos.length
  const costoTotal = activos.reduce((sum, a) => sum + a.costo, 0)
  const librosTotal = activos.reduce((sum, a) => sum + a.libros, 0)
  return (
    <div className={styles.bar}>
      <div className={styles.cell}>
        <div className={styles.label}>Contexto del filtro</div>
        <div className={styles.value}>{label}</div>
      </div>
      <div className={styles.cell}>
        <div className={styles.label}>Activos</div>
        <div className="mono">{count}</div>
      </div>
      <div className={styles.cell}>
        <div className={styles.label}>Costo original total</div>
        <div className="mono">{money(costoTotal)}</div>
      </div>
      <div className={`${styles.cell} ${styles.highlight}`}>
        <div className={styles.label}>Valor en libros total</div>
        <div className="mono">{money(librosTotal)}</div>
      </div>
    </div>
  )
}
