import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useActivo, useEditarActivo } from '../../hooks/useActivos'
import { useToast } from '../../context/ToastContext'
import { validateActivoNuevo } from '../../lib/validators'
import { calcularDepreciacionPreview } from '../../lib/depreciacion'
import { money, formatMontoInput, parseMonto } from '../../lib/money'
import { FormField } from '../../components/FormField'
import { CatalogSelect } from '../../components/CatalogSelect'
import { Button } from '../../components/Button'
import styles from './ActivoModal.module.css'

// El detalle trae los catalogos por nombre (para el drawer) y ademas sus IDs
// (categoriaId, …) + version, que son los que el formulario de edicion necesita.
function formDesde(a) {
  return {
    num: a.num,
    nombre: a.nombre ?? '',
    costo: String(a.costo ?? ''),
    fechaAdq: a.fechaAdq ?? '',
    fechaUso: a.fechaUso ?? '',
    vidaUtil: String(a.vidaUtil ?? ''),
    serie: a.serie ?? '',
    factura: a.factura ?? '',
    detalle: a.detalle ?? '',
    categoria: a.categoriaId ? String(a.categoriaId) : '',
    localizacion: a.localizacionId ? String(a.localizacionId) : '',
    proveedor: a.proveedorId ? String(a.proveedorId) : '',
    marca: a.marcaId ? String(a.marcaId) : '',
    modelo: a.modeloId ? String(a.modeloId) : '',
    origen: a.origenId ? String(a.origenId) : '',
    motivo: '',
  }
}

export function EditarActivoModal({ onClose }) {
  const { num } = useParams()
  const { data: activo } = useActivo(num)
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})
  const editar = useEditarActivo()
  const { showToast } = useToast()

  useEffect(() => { if (activo) setForm(formDesde(activo)) }, [activo])
  if (!form) return null

  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }))
  // El modelo depende de la marca: al cambiarla, se limpia el modelo elegido.
  const cambiarMarca = (id) => setForm((prev) => ({ ...prev, marca: id, modelo: '' }))

  // Vista previa: el valor real que se guarda lo recalcula el servidor (RN-001).
  const preview = calcularDepreciacionPreview(parseMonto(form.costo), form.vidaUtil, form.fechaUso)

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validateActivoNuevo(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      showToast('Revisa los campos obligatorios', 'error')
      return
    }
    try {
      const datos = {
        nombre: form.nombre.trim(), costo: parseMonto(form.costo),
        fechaAdq: form.fechaAdq, fechaUso: form.fechaUso, vidaUtil: Number(form.vidaUtil),
        serie: form.serie.trim() || null, factura: form.factura.trim(),
        detalle: form.detalle.trim() || null,
        categoria: Number(form.categoria), localizacion: Number(form.localizacion),
        proveedor: Number(form.proveedor), marca: form.marca ? Number(form.marca) : null,
        modelo: form.modelo ? Number(form.modelo) : null, origen: Number(form.origen),
        // version viaja para el bloqueo optimista; motivo queda en el historial.
        version: activo.version, motivo: form.motivo.trim(),
      }
      await editar.mutateAsync({ num, datos })
      showToast(`Activo ${num} actualizado correctamente`, 'success')
      onClose()
    } catch (err) {
      // Incluye el 409 de conflicto de version (err.message ya trae el detalle).
      showToast(err.message, 'error')
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Editar activo</h2>
        <div className={styles.grid}>
          <FormField label="Número de activo">
            <input type="text" value={form.num} readOnly className="mono" />
          </FormField>
          <FormField label="Nombre / descripción" error={errors.nombre}>
            <input type="text" value={form.nombre} onChange={(e) => set('nombre')(e.target.value)} />
          </FormField>
          <FormField label="Costo original (₡)" error={errors.costo}>
            <input type="text" inputMode="decimal" value={form.costo}
              onChange={(e) => set('costo')(formatMontoInput(e.target.value))} />
          </FormField>
          <FormField label="Fecha de adquisición" error={errors.fechaAdq}>
            <input type="date" value={form.fechaAdq} onChange={(e) => set('fechaAdq')(e.target.value)} />
          </FormField>
          <FormField label="Fecha de inicio de uso" error={errors.fechaUso}>
            <input type="date" value={form.fechaUso} onChange={(e) => set('fechaUso')(e.target.value)} />
          </FormField>
          <FormField label="Vida útil (años)" error={errors.vidaUtil}>
            <input type="number" value={form.vidaUtil} onChange={(e) => set('vidaUtil')(e.target.value)} />
          </FormField>

          <CatalogSelect tipo="categorias" label="Categoría" value={form.categoria}
            onChange={set('categoria')} error={errors.categoria}
            camposNuevo={[{ key: 'nombre', label: 'Nombre' },
              { key: 'prefijo', label: 'Prefijo', placeholder: 'Ej. SOF', maxLength: 8 }]} />
          <CatalogSelect tipo="localizaciones" label="Área" value={form.localizacion}
            onChange={set('localizacion')} error={errors.localizacion}
            camposNuevo={[{ key: 'nombre', label: 'Nombre' }]} />
          <CatalogSelect tipo="marcas" label="Marca" value={form.marca} required={false}
            onChange={cambiarMarca} error={errors.marca}
            hint="Opcional. Si se deja vacío, se guarda sin especificar."
            camposNuevo={[{ key: 'nombre', label: 'Nombre' }]} />
          <CatalogSelect tipo="modelos" label="Modelo" value={form.modelo} required={false}
            onChange={set('modelo')} error={errors.modelo}
            params={{ marca: form.marca }} disabled={!form.marca}
            placeholder={form.marca ? 'Seleccionar modelo…' : 'Elegí una marca primero'}
            hint="Opcional. Si se deja vacío, se guarda sin especificar."
            camposNuevo={[{ key: 'nombre', label: 'Nombre' }]} payloadExtra={{ marca: form.marca }} />
          <CatalogSelect tipo="proveedores" label="Proveedor" value={form.proveedor}
            onChange={set('proveedor')} error={errors.proveedor}
            camposNuevo={[{ key: 'nombre', label: 'Nombre' }]} />
          <CatalogSelect tipo="origenes" label="Origen" value={form.origen}
            onChange={set('origen')} error={errors.origen} />

          <FormField label="Serie" required={false} error={errors.serie}
            hint="Opcional. Si se deja vacío, se guarda sin especificar.">
            <input type="text" value={form.serie} onChange={(e) => set('serie')(e.target.value)} />
          </FormField>
          <FormField label="N.º de factura" error={errors.factura}>
            <input type="text" value={form.factura} onChange={(e) => set('factura')(e.target.value)} />
          </FormField>
          <FormField label="Detalle adicional" error={errors.detalle} required={false}
            hint="Opcional. Quién lo tiene o dónde está exactamente, si aplica."
            className={styles.fieldFull}>
            <textarea value={form.detalle} placeholder="Ej. Oficina de gerencia, a cargo de…"
              rows={3} onChange={(e) => set('detalle')(e.target.value)} />
          </FormField>
          <FormField label="Motivo del cambio" required={false}
            hint="Opcional. Queda registrado en el historial del activo.">
            <input type="text" value={form.motivo} placeholder="Ej. corrección de costo"
              onChange={(e) => set('motivo')(e.target.value)} />
          </FormField>
        </div>

        <div className={styles.calculo}>
          <div className={styles.calculoTitle}>Depreciación (recalculada, línea recta por días)</div>
          {preview ? (
            <div className={styles.calculoValues}>
              <div><span className={styles.calculoLabel}>Valor en libros</span><span className="mono">{money(preview.libros)}</span></div>
              <div><span className={styles.calculoLabel}>Dep. acumulada</span><span className="mono">{money(preview.dep)}</span></div>
              <div><span className={styles.calculoLabel}>Estado</span><span>{preview.estado}</span></div>
            </div>
          ) : (
            <div className={styles.calculoHint}>Completá costo, vida útil y fecha de inicio de uso.</div>
          )}
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={editar.isPending}>Guardar cambios</Button>
        </div>
      </form>
    </div>
  )
}
