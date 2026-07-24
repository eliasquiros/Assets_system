import { Link } from 'react-router-dom'
import { Badge } from '../../components/Badge'
import { Spinner } from '../../components/Spinner'
import { EmptyState } from '../../components/EmptyState'
import { money } from '../../lib/money'
import { fmtDate } from '../../lib/date'
import styles from './ActivoTable.module.css'

export function ActivoTable({ isLoading, isError, activos }) {
  if (isLoading) return <div className={styles.loading}><Spinner size={24} /></div>
  if (isError) return <EmptyState message="No se pudo conectar con el servidor." />
  if (activos.length === 0) return <EmptyState message="No se encontraron activos con los filtros actuales." />

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>N.º Activo</th><th>Descripción</th><th>Área</th><th>Categoría</th>
            <th>Costo original</th><th>Valor en libros</th><th>Dep. acumulada</th>
            <th>Estado</th><th>F. adquisición</th><th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {activos.map((a) => (
            <tr key={a.num}>
              <td className="mono">{a.num}</td>
              <td>{a.nombre}</td>
              <td>{a.area}</td>
              <td>{a.tipo}</td>
              <td className="mono">{money(a.costo)}</td>
              <td className="mono">{money(a.libros)}</td>
              <td className="mono">{money(a.dep)}</td>
              <td><Badge label={a.estado} /></td>
              <td className="mono">{fmtDate(a.fechaAdq)}</td>
              <td>
                <div className={styles.actions}>
                  <Link className={`${styles.btn} ${styles.btnPrimary}`} to={`/activos/${a.num}`}>Ver más</Link>
                  <Link className={styles.btn} to={`/activos/${a.num}/editar`}>Editar</Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
