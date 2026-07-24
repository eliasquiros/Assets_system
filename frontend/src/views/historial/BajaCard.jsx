import { Link } from 'react-router-dom'
import { Badge } from '../../components/Badge'
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
        <div className={styles.identidad}>
          <div className={`mono ${styles.id}`}>{baja.id}</div>
          <div>
            <div className={styles.nombre}>{baja.activoNombre}</div>
            <div className={`mono ${styles.num}`}>{baja.activoNum}</div>
          </div>
        </div>
        {/* Motivo como texto plano (por qué se retira) vs. estado como badge
            de color (en qué punto del ciclo va): antes ambos eran <span>
            idénticos y se confundían. */}
        <div className={styles.etiquetas}>
          <span className={styles.motivo}>{baja.motivo}</span>
          <Badge label={estadoLabel} />
        </div>
      </div>
      <div className={styles.body}>
        <p className={styles.desc}>{baja.desc}</p>
        <div className={styles.grid}>
          <div><div className={styles.gridLabel}>Fecha efectiva</div><div className={`mono ${styles.gridValue}`}>{fmtDate(baja.fechaEfectiva)}</div></div>
          <div><div className={styles.gridLabel}>Registrada</div><div className={`mono ${styles.gridValue}`}>{fmtDate(baja.fechaRegistro)}</div></div>
          <div><div className={styles.gridLabel}>Responsable</div><div className={styles.gridValue}>{baja.user}</div></div>
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
