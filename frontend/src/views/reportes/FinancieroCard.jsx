import { useState } from 'react'
import { useGenerarFinanciero } from '../../hooks/useReportes'
import { useToast } from '../../context/ToastContext'
import { Button } from '../../components/Button'
import { Spinner } from '../../components/Spinner'
import { money } from '../../lib/money'
import styles from './ReporteCard.module.css'

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

  return (
    <div className={styles.card}>
      <h3>Reporte financiero</h3>
      <p>Valor en libros y depreciación acumulada de los activos vigentes a un mes de corte.</p>
      <div className={styles.cutoffRow}>
        <select value={cutoff} onChange={(e) => setCutoff(e.target.value)}>
          {FISCAL_MONTHS.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
        <Button onClick={() => financiero.mutate(cutoff)} disabled={financiero.isPending}>
          {financiero.isPending ? <Spinner size={14} /> : 'Generar'}
        </Button>
      </div>
      {financiero.isError && <p className={styles.error}>No se pudo generar el reporte.</p>}
      {financiero.isSuccess && (
        <div className={styles.result}>
          <p>Generado — corte al {monthLabel(financiero.data.corte)}</p>
          <table>
            <tbody>
              {financiero.data.activos.map((a) => (
                <tr key={a.num}><td>{a.num} {a.nombre}</td><td>{money(a.libros)}</td><td>{money(a.dep)}</td></tr>
              ))}
              <tr>
                <td>TOTAL VIGENTES ({financiero.data.activos.length})</td>
                <td>{money(financiero.data.totalLibros)}</td>
                <td>{money(financiero.data.totalDep)}</td>
              </tr>
            </tbody>
          </table>
          <Button variant="secondary" onClick={() => showToast('Exportado: reporte_financiero.xlsx', 'success')}>
            ↓ Exportar reporte_financiero.xlsx
          </Button>
        </div>
      )}
    </div>
  )
}
