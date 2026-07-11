import { useParams } from 'react-router-dom'
import { useActivo, useMovimientos } from '../../hooks/useActivos'
import { Badge } from '../../components/Badge'
import { Spinner } from '../../components/Spinner'
import { money } from '../../lib/money'
import { fmtDate } from '../../lib/date'
import styles from './ActivoDetailDrawer.module.css'

export function ActivoDetailDrawer({ onClose }) {
  const { num } = useParams()
  const { data: activo, isLoading } = useActivo(num)
  const { data: movimientos } = useMovimientos(num)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {isLoading || !activo ? (
          <Spinner size={24} />
        ) : (
          <>
            <div>
              <div className="mono">{activo.num}</div>
              <div style={{ fontSize: 17, fontWeight: 600 }}>{activo.nombre}</div>
              <div style={{ marginTop: 10 }}><Badge label={activo.estado} /></div>
            </div>
            <div className={styles.values}>
              <div><div className={styles.label}>Costo original</div><div className="mono">{money(activo.costo)}</div></div>
              <div><div className={styles.label}>Valor en libros</div><div className="mono">{money(activo.libros)}</div></div>
              <div><div className={styles.label}>Dep. acumulada</div><div className="mono">{money(activo.dep)}</div></div>
            </div>
            <div className={styles.ficha}>
              <div><div className={styles.label}>Área</div><div>{activo.area}</div></div>
              <div><div className={styles.label}>Categoría</div><div>{activo.tipo}</div></div>
              <div><div className={styles.label}>F. adquisición</div><div className="mono">{fmtDate(activo.fechaAdq)}</div></div>
              <div><div className={styles.label}>Inicio de uso</div><div className="mono">{fmtDate(activo.fechaUso)}</div></div>
            </div>
            <div>
              <div className={styles.label}>Historial de movimientos</div>
              {(movimientos || []).map((h, i) => (
                <div key={i} className={styles.histItem}>
                  <div className={styles.histTop}>
                    <span>{h.tipo}</span>
                    <span className="mono">{fmtDate(h.fecha)}</span>
                  </div>
                  <div className={styles.histDesc}>{h.desc}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
