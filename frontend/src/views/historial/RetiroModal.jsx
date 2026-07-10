import { useState } from 'react'
import { useActivos } from '../../hooks/useActivos'
import { useRegistrarBaja } from '../../hooks/useBajas'
import { useToast } from '../../context/ToastContext'
import { validateRetiro } from '../../lib/validators'
import { FormField } from '../../components/FormField'
import { Button } from '../../components/Button'
import styles from './RetiroModal.module.css'

const MOTIVOS = ['Venta', 'Desecho u obsolescencia', 'Robo o pérdida']

export function RetiroModal({ onClose }) {
  const { data: activos } = useActivos()
  const [form, setForm] = useState({ activoNum: '', motivo: '', desc: '' })
  const [errors, setErrors] = useState({})
  const registrar = useRegistrarBaja()
  const { showToast } = useToast()

  function handleChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validateRetiro(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      showToast('Completa los campos requeridos', 'error')
      return
    }
    try {
      const baja = await registrar.mutateAsync(form)
      showToast(`Retiro ${baja.id} registrado — pendiente en periodo de gracia`, 'success')
      onClose()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Registrar retiro / baja de activo</h2>
        <FormField label="Activo a retirar" error={errors.activoNum}>
          <select aria-label="Activo a retirar" value={form.activoNum} onChange={(e) => handleChange('activoNum', e.target.value)}>
            <option value="">Selecciona un activo…</option>
            {(activos || []).map((a) => <option key={a.num} value={a.num}>{a.num} — {a.nombre}</option>)}
          </select>
        </FormField>
        <FormField label="Motivo" error={errors.motivo}>
          <select aria-label="Motivo" value={form.motivo} onChange={(e) => handleChange('motivo', e.target.value)}>
            <option value="">Selecciona un motivo…</option>
            {MOTIVOS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </FormField>
        <FormField label="Descripción" error={errors.desc}>
          <textarea aria-label="Descripción" value={form.desc} onChange={(e) => handleChange('desc', e.target.value)} rows={3} />
        </FormField>
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Registrar baja</Button>
        </div>
      </form>
    </div>
  )
}
