import { Link } from 'react-router-dom'
import { Badge } from '../../components/Badge'
import { useToast } from '../../context/ToastContext'
import { useEnlaceArchivo } from '../../hooks/useBajas'
import { fmtDate, fmtRemaining } from '../../lib/date'
import styles from './BajaCard.module.css'

export function BajaCard({ baja, now }) {
  const isRevertida = baja.estado === 'Revertida'
  // El backend solo pasa una baja a Definitiva cuando corre la tarea diaria
  // (pg_cron); entre que vence la gracia y esa corrida, el registro sigue
  // "Pendiente" pero ya no es revertible (el backend responde 409 si se
  // intenta). Sin este chequeo por reloj, el link seguía ahí clicable con el
  // contador ya en "expirado".
  const vencida = baja.venceTs != null && baja.venceTs - now <= 0
  const isPendiente = baja.estado === 'Pendiente' && !vencida
  const estadoLabel = baja.estado === 'Definitiva' ? 'Baja definitiva' : baja.estado
  const remaining = baja.venceTs ? fmtRemaining(baja.venceTs - now) : ''
  const { showToast } = useToast()
  const enlace = useEnlaceArchivo()

  async function verComprobante() {
    // La pestaña se abre YA, dentro del gesto del usuario: hacerlo después del
    // await la convierte en un popup y el navegador la bloquea. Con 'noopener'
    // el navegador NUNCA devuelve una referencia utilizable (siempre null en
    // Chrome/Firefox/Safari), así que no podemos guardarla ni navegarla ni
    // cerrarla después — solo podemos volver a apuntar al mismo target por
    // nombre, que el navegador resuelve contra la pestaña ya abierta.
    const target = `comprobante-${baja.id}`
    window.open('', target, 'noopener')
    try {
      const { url } = await enlace.mutateAsync(baja.id)
      window.open(url, target, 'noopener')
    } catch {
      showToast('No se pudo abrir el comprobante.', 'error')
    }
  }

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
          {/* El comprobante es obligatorio (RN-002.2), así que siempre hay uno
              que consultar; el enlace se pide al pulsar porque caduca. */}
          {baja.archivoNombre && (
            <div>
              <div className={styles.gridLabel}>Comprobante</div>
              <button
                type="button"
                className={styles.comprobante}
                onClick={verComprobante}
                disabled={enlace.isPending}
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 3v5h5" />
                  <path d="M19 8v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7Z" />
                </svg>
                {enlace.isPending ? 'Abriendo…' : 'Ver documento'}
              </button>
            </div>
          )}
        </div>
        {isPendiente && (
          <div className={styles.pending}>
            <span>Periodo de gracia · Vence en {remaining}</span>
            <Link to={`/historial/${baja.id}/revertir`}>↺ Revertir baja</Link>
          </div>
        )}
        {baja.estado === 'Pendiente' && vencida && (
          <div className={styles.reverted}>
            El período de gracia venció y ya no puede revertirse. Pasará a definitiva en la próxima actualización.
          </div>
        )}
        {isRevertida && (
          <div className={styles.reverted}>Baja revertida — el activo fue reincorporado al inventario vigente.</div>
        )}
      </div>
    </div>
  )
}
