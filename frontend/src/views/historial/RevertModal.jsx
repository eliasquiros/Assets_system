import { useParams } from 'react-router-dom'
import { useBajas, useRevertirBaja } from '../../hooks/useBajas'
import { useToast } from '../../context/ToastContext'
import { Button } from '../../components/Button'
import styles from './RevertModal.module.css'

export function RevertModal({ onClose }) {
  const { id } = useParams()
  const { data: bajas } = useBajas()
  // El id del backend es numérico; el de la URL es string. Comparar como texto.
  const baja = (bajas || []).find((b) => String(b.id) === id)
  const revertir = useRevertirBaja()
  const { showToast } = useToast()

  async function handleConfirm() {
    try {
      await revertir.mutateAsync(id)
      showToast(`Baja ${id} revertida — activo reincorporado`, 'success')
      onClose()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  if (!baja) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Icono de "deshacer": identifica el tipo de confirmación de un vistazo
            y evita que este diálogo se confunda con uno destructivo. */}
        <span className={styles.icon} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 4v5h5" />
          </svg>
        </span>
        <h2>Revertir baja del activo</h2>
        <p>Se reincorporará <strong>{baja.activoNombre}</strong> ({baja.activoNum}) al inventario vigente.</p>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={revertir.isPending}>Confirmar reversión</Button>
        </div>
      </div>
    </div>
  )
}
