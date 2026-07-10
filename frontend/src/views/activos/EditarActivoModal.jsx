import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useActivo, useEditarActivo } from '../../hooks/useActivos'
import { useToast } from '../../context/ToastContext'
import { validateActivo } from '../../lib/validators'
import { FormField } from '../../components/FormField'
import { Button } from '../../components/Button'
import { ACTIVO_FIELD_DEFS } from './fieldDefs'
import styles from './ActivoModal.module.css'

export function EditarActivoModal({ onClose }) {
  const { num } = useParams()
  const { data: activo } = useActivo(num)
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})
  const editar = useEditarActivo()
  const { showToast } = useToast()

  useEffect(() => {
    if (activo) setForm(activo)
  }, [activo])

  if (!form) return null

  function handleChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validateActivo(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      showToast('Revisa los campos marcados', 'error')
      return
    }
    try {
      const datos = ACTIVO_FIELD_DEFS.reduce((acc, f) => ({ ...acc, [f.key]: form[f.key] }), {})
      datos.costo = Number(datos.costo)
      datos.vidaUtil = Number(datos.vidaUtil)
      await editar.mutateAsync({ num, datos })
      showToast(`Activo ${form.num} actualizado correctamente`, 'success')
      onClose()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Editar activo</h2>
        <div className={styles.grid}>
          {ACTIVO_FIELD_DEFS.map((f) => (
            <FormField key={f.key} label={f.label} error={errors[f.key]}>
              <input
                type={f.type}
                value={form[f.key] ?? ''}
                onChange={(e) => handleChange(f.key, e.target.value)}
              />
            </FormField>
          ))}
        </div>
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Guardar cambios</Button>
        </div>
      </form>
    </div>
  )
}
