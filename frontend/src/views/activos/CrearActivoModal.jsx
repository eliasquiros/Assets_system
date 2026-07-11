import { useState } from 'react'
import { useCrearActivo } from '../../hooks/useActivos'
import { useToast } from '../../context/ToastContext'
import { validateActivo } from '../../lib/validators'
import { FormField } from '../../components/FormField'
import { Button } from '../../components/Button'
import { ACTIVO_FIELD_DEFS, BLANK_ACTIVO_FORM } from './fieldDefs'
import styles from './ActivoModal.module.css'

export function CrearActivoModal({ onClose }) {
  const [form, setForm] = useState(BLANK_ACTIVO_FORM)
  const [errors, setErrors] = useState({})
  const crear = useCrearActivo()
  const { showToast } = useToast()

  function handleChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validateActivo(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      showToast('Faltan campos obligatorios', 'error')
      return
    }
    try {
      const datos = { ...form, costo: Number(form.costo), vidaUtil: Number(form.vidaUtil) }
      await crear.mutateAsync(datos)
      showToast(`Activo ${form.num} registrado correctamente`, 'success')
      onClose()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Registrar nuevo activo</h2>
        <div className={styles.grid}>
          {ACTIVO_FIELD_DEFS.map((f) => (
            <FormField key={f.key} label={f.label} error={errors[f.key]}>
              <input
                type={f.type}
                value={form[f.key]}
                placeholder={f.placeholder}
                onChange={(e) => handleChange(f.key, e.target.value)}
              />
            </FormField>
          ))}
        </div>
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Guardar activo</Button>
        </div>
      </form>
    </div>
  )
}
