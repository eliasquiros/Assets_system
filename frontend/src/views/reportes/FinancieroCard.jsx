import { useState } from 'react'
import { useGenerarFinanciero } from '../../hooks/useReportes'
import { useToast } from '../../context/ToastContext'
import { Button } from '../../components/Button'
import { Spinner } from '../../components/Spinner'
import styles from './ReporteCard.module.css'

// Meses de corte seleccionables (año fiscal en curso). El reporte se genera al
// último día del mes elegido.
const FISCAL_MONTHS = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09']
const MES_LABEL = { '01': 'enero', '02': 'febrero', '03': 'marzo', '04': 'abril', '05': 'mayo', '06': 'junio', '07': 'julio', '08': 'agosto', '09': 'setiembre', '10': 'octubre', '11': 'noviembre', '12': 'diciembre' }

function monthLabel(value) {
  const [year, month] = value.split('-')
  return `${MES_LABEL[month]} ${year}`
}

export function FinancieroCard() {
  const [cutoff, setCutoff] = useState('2026-06')
  const financiero = useGenerarFinanciero()
  const { showToast } = useToast()

  async function generar() {
    try {
      await financiero.mutateAsync(cutoff)
      showToast(`Reporte financiero — ${monthLabel(cutoff)} descargado`, 'success')
    } catch (err) {
      showToast(err.message || 'No se pudo generar el reporte.', 'error')
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <span className={styles.icon} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v16a2 2 0 0 0 2 2h16" />
            <path d="M7 16v-5" />
            <path d="M12 16V8" />
            <path d="M17 16v-3" />
          </svg>
        </span>
        <h3>Reporte financiero</h3>
      </div>
      <p>Valoración del inventario de activos fijos: valor original, depreciación acumulada y valor en libros al último día del mes de corte, agrupados por categoría.</p>
      <div className={styles.cutoffRow}>
        <select value={cutoff} onChange={(e) => setCutoff(e.target.value)} aria-label="Mes de corte">
          {FISCAL_MONTHS.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
        <Button onClick={generar} disabled={financiero.isPending}>
          {financiero.isPending ? <Spinner size={14} /> : 'Generar y descargar'}
        </Button>
      </div>
      {financiero.isError && <p className={styles.error}>No se pudo generar el reporte.</p>}
    </div>
  )
}
