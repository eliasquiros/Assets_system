import { Link } from 'react-router-dom'
import { fmtDate, fmtRemaining } from '../../lib/date'
import styles from './BajaCard.module.css'

export function BajaCard({ baja, now }) {
  const isPendiente = baja.estado === 'Pendiente'
  const isRevertida = baja.estado === 'Revertida'
  const estadoLabel = baja.estado === 'Definitiva' ? 'Baja definitiva' : baja.estado
  const remaining = baja.venceTs ? fmtRemaining(baja.venceTs - now) : ''

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <div className="mono">{baja.id}</div>
          <div>
            <div style={{ fontWeight: 600 }}>{baja.activoNombre}</div>
            <div className="mono">{baja.activoNum}</div>
          </div>
        </div>
        <div>
          <span>{baja.motivo}</span>
          <span style={{ marginLeft: 8 }}>{estadoLabel}</span>
        </div>
      </div>
      <div className={styles.body}>
        <p>{baja.desc}</p>
        <div className={styles.grid}>
          <div><div>Fecha efectiva</div><div className="mono">{fmtDate(baja.fechaEfectiva)}</div></div>
          <div><div>Registrada</div><div className="mono">{fmtDate(baja.fechaRegistro)}</div></div>
          <div><div>Responsable</div><div>{baja.user}</div></div>
        </div>
        {isPendiente && (
          <div className={styles.pending}>
            <span>Periodo de gracia · Vence en {remaining}</span>
            <Link to={`/historial/${baja.id}/revertir`}>↺ Revertir baja</Link>
          </div>
        )}
        {isRevertida && (
          <div className={styles.reverted}>Baja revertida — el activo fue reincorporado al inventario vigente.</div>
        )}
      </div>
    </div>
  )
}
