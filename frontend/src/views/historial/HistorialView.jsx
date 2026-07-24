import { Route, Routes, useNavigate } from 'react-router-dom'
import { useBajas } from '../../hooks/useBajas'
import { BajaCard } from './BajaCard'
import { RetiroModal } from './RetiroModal'
import { RevertModal } from './RevertModal'
import { Button } from '../../components/Button'
import { Spinner } from '../../components/Spinner'
import { EmptyState } from '../../components/EmptyState'
import styles from './HistorialView.module.css'

export function HistorialView() {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useBajas()
  const now = Date.now()

  return (
    <div>
      <div className="page-head">
        <h1>Historial de retiro / baja</h1>
        <Button onClick={() => navigate('/historial/nueva')}>+ Registrar retiro</Button>
      </div>
      <div className={styles.info}>
        <svg className={styles.infoIcon} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <path d="M12 7.75h.01" />
        </svg>
        <span>
          Una baja queda "pendiente" durante 2 días y puede revertirse en ese período. Una vez que se vuelve <strong>definitiva</strong>, ya no puede revertirse ni editarse.
        </span>
      </div>
      {isLoading && <div className={styles.loading}><Spinner size={24} /></div>}
      {isError && <EmptyState message="No se pudo conectar con el servidor." />}
      {!isLoading && !isError && (data || []).length === 0 && (
        <EmptyState message="No hay retiros o bajas registrados." />
      )}
      {!isLoading && !isError && (data || []).length > 0 && (
        <div className={styles.list}>
          {(data || []).map((baja) => <BajaCard key={baja.id} baja={baja} now={now} />)}
        </div>
      )}
      <Routes>
        <Route path="nueva" element={<RetiroModal onClose={() => navigate('/historial')} />} />
        <Route path=":id/revertir" element={<RevertModal onClose={() => navigate('/historial')} />} />
      </Routes>
    </div>
  )
}
