import { useNavigate, useParams } from 'react-router-dom'
import { useActivo, useMovimientos } from '../../hooks/useActivos'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Spinner } from '../../components/Spinner'
import { money } from '../../lib/money'
import { fmtDate } from '../../lib/date'
import styles from './ActivoDetailDrawer.module.css'

// Zero-width space despues de cada punto de miles: deja que el navegador
// corte montos muy largos entre grupos de digitos en vez de aislar el "₡"
// o desbordar la tarjeta (el espacio entre "₡" y el numero no se corta).
function moneyWrap(n) {
  return money(n).replace(/\./g, '.​')
}

function Dato({ label, children, full = false }) {
  return (
    <div className={`${styles.dato} ${full ? styles.datoFull : ''}`}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{children}</div>
    </div>
  )
}

export function ActivoDetailDrawer({ onClose }) {
  const { num } = useParams()
  const navigate = useNavigate()
  const { data: activo, isLoading } = useActivo(num)
  const { data: movimientos } = useMovimientos(num)
  const historial = movimientos || []

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {isLoading || !activo ? (
          <div className={styles.loading}><Spinner size={24} /></div>
        ) : (
          <>
            <header className={styles.header}>
              <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6 18 18M18 6 6 18" />
                </svg>
              </button>
              <div className={`mono ${styles.num}`}>{activo.num}</div>
              <h2 className={styles.name}>{activo.nombre}</h2>
              <div className={styles.headMeta}>
                <Badge label={activo.estado} />
                <Button
                  variant="secondary"
                  className={styles.editBtn}
                  onClick={() => navigate(`/activos/${activo.num}/editar`)}
                >
                  Editar activo
                </Button>
              </div>
            </header>

            <div className={styles.body}>
              <section className={styles.values}>
                <div className={styles.valueItem}>
                  <div className={styles.label}>Costo original</div>
                  <div className={`mono ${styles.valueBig}`}>{moneyWrap(activo.costo)}</div>
                </div>
                <div className={styles.valueItem}>
                  <div className={styles.label}>Valor en libros</div>
                  <div className={`mono ${styles.valueBig}`}>{moneyWrap(activo.libros)}</div>
                </div>
                <div className={styles.valueItem}>
                  <div className={styles.label}>Dep. acumulada</div>
                  <div className={`mono ${styles.valueBig}`}>{moneyWrap(activo.dep)}</div>
                </div>
              </section>

              <section className={styles.card}>
                <div className={styles.cardTitle}>Ficha del activo</div>
                <div className={styles.ficha}>
                  <Dato label="Área">{activo.area}</Dato>
                  <Dato label="Categoría">{activo.tipo}</Dato>
                  <Dato label="Proveedor">{activo.proveedor || '—'}</Dato>
                  <Dato label="Marca">{activo.marca || '—'}</Dato>
                  <Dato label="Modelo">{activo.modelo || '—'}</Dato>
                  <Dato label="Origen">{activo.origen || '—'}</Dato>
                  <Dato label="Vida útil">{activo.vidaUtil} años</Dato>
                  <Dato label="N.º de serie"><span className="mono">{activo.serie || '—'}</span></Dato>
                  <Dato label="Factura"><span className="mono">{activo.factura || '—'}</span></Dato>
                  <Dato label="F. adquisición"><span className="mono">{fmtDate(activo.fechaAdq)}</span></Dato>
                  <Dato label="Inicio de uso"><span className="mono">{fmtDate(activo.fechaUso)}</span></Dato>
                  <Dato label="Detalle adicional" full>{activo.detalle || '—'}</Dato>
                </div>
              </section>

              <section className={styles.history}>
                <div className={styles.historyHead}>
                  <h3 className={styles.historyTitle}>Historial de movimientos</h3>
                  <span className={styles.count}>{historial.length}</span>
                </div>
                {historial.length === 0 ? (
                  <div className={styles.empty}>Sin movimientos registrados.</div>
                ) : (
                  <ol className={styles.timeline}>
                    {historial.map((h, i) => (
                      <li key={i} className={styles.histItem}>
                        <div className={styles.dot} />
                        <div className={styles.histBody}>
                          <div className={styles.histTop}>
                            <span className={styles.histType}>{h.tipo}</span>
                            <span className={`mono ${styles.histDate}`}>{fmtDate(h.fecha)}</span>
                          </div>
                          <div className={styles.histDesc}>{h.desc}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
