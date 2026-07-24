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
        Una baja queda "pendiente" durante 2 días y puede revertirse en ese período. Una vez que se vuelve <strong>definitiva</strong>, ya no puede revertirse ni editarse.
      </div>
      {isLoading && <Spinner size={24} />}
      {isError && <EmptyState message="No se pudo conectar con el servidor." />}
      {!isLoading && !isError && (data || []).length === 0 && (
        <EmptyState message="No hay retiros o bajas registrados." />
      )}
      {!isLoading && !isError && (data || []).map((baja) => <BajaCard key={baja.id} baja={baja} now={now} />)}
      <Routes>
        <Route path="nueva" element={<RetiroModal onClose={() => navigate('/historial')} />} />
        <Route path=":id/revertir" element={<RevertModal onClose={() => navigate('/historial')} />} />
      </Routes>
    </div>
  )
}
