import { useGenerarAuditoria } from '../../hooks/useReportes'
import { useToast } from '../../context/ToastContext'
import { Button } from '../../components/Button'
import { Spinner } from '../../components/Spinner'
import { money } from '../../lib/money'
import styles from './ReporteCard.module.css'

export function AuditoriaCard() {
  const auditoria = useGenerarAuditoria()
  const { showToast } = useToast()

  return (
    <div className={styles.card}>
      <h3>Reporte de auditoría</h3>
      <p>Listado completo de activos con su historial de movimientos.</p>
      <Button onClick={() => auditoria.mutate()} disabled={auditoria.isPending}>
        {auditoria.isPending ? <Spinner size={14} /> : 'Generar y exportar'}
      </Button>
      {auditoria.isError && <p className={styles.error}>No se pudo generar el reporte.</p>}
      {auditoria.isSuccess && (
        <div className={styles.result}>
          <p>Reporte generado — {auditoria.data.activos.length} activos incluidos</p>
          <table>
            <tbody>
              {auditoria.data.activos.slice(0, 5).map((a) => (
                <tr key={a.num}><td>{a.num}</td><td>{a.nombre}</td><td>{money(a.libros)}</td></tr>
              ))}
            </tbody>
          </table>
          <Button variant="secondary" onClick={() => showToast('Exportado: reporte_auditoria.xlsx', 'success')}>
            ↓ Exportar reporte_auditoria.xlsx
          </Button>
        </div>
      )}
    </div>
  )
}
