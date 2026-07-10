import { AuditoriaCard } from './AuditoriaCard'
import { FinancieroCard } from './FinancieroCard'
import styles from './ReportesView.module.css'

export function ReportesView() {
  return (
    <div>
      <h1>Reportes</h1>
      <div className={styles.grid}>
        <AuditoriaCard />
        <FinancieroCard />
      </div>
    </div>
  )
}
