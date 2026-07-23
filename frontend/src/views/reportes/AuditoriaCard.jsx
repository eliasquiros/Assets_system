import { useState } from 'react'
import { useGenerarAuditoria } from '../../hooks/useReportes'
import { useToast } from '../../context/ToastContext'
import { Button } from '../../components/Button'
import { Spinner } from '../../components/Spinner'
import styles from './ReporteCard.module.css'

// Anios seleccionables: el actual y los 5 anteriores. El corte de cada reporte
// es el 30 de septiembre del anio elegido.
const ANIO_ACTUAL = new Date().getFullYear()
const ANIOS = Array.from({ length: 6 }, (_, i) => ANIO_ACTUAL - i)

export function AuditoriaCard() {
  const [anio, setAnio] = useState(ANIO_ACTUAL)
  const auditoria = useGenerarAuditoria()
  const { showToast } = useToast()

  async function generar() {
    try {
      await auditoria.mutateAsync(anio)
      showToast(`Reporte de auditoría ${anio} descargado`, 'success')
    } catch (err) {
      showToast(err.message || 'No se pudo generar el reporte.', 'error')
    }
  }

  return (
    <div className={styles.card}>
      <h3>Reporte de auditoría</h3>
      <p>Activos con dep. acumulada, valor en libros y estado al 30 de septiembre del año elegido, agrupados por categoría (una hoja por categoría).</p>
      <div className={styles.cutoffRow}>
        <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} aria-label="Año del reporte">
          {ANIOS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <Button onClick={generar} disabled={auditoria.isPending}>
          {auditoria.isPending ? <Spinner size={14} /> : 'Generar y descargar'}
        </Button>
      </div>
      {auditoria.isError && <p className={styles.error}>No se pudo generar el reporte.</p>}
    </div>
  )
}
