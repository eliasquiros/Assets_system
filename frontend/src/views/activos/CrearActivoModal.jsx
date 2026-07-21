import { useState } from 'react'
import { useCrearActivo } from '../../hooks/useActivos'
import { useToast } from '../../context/ToastContext'
import { siguienteNumero } from '../../api/catalogos'
import { validateActivoNuevo } from '../../lib/validators'
import { calcularDepreciacionPreview } from '../../lib/depreciacion'
import { money, formatMontoInput, parseMonto } from '../../lib/money'
import { FormField } from '../../components/FormField'
import { CatalogSelect } from '../../components/CatalogSelect'
import { Button } from '../../components/Button'
import styles from './ActivoModal.module.css'

const FORM_INICIAL = {
  num: '', nombre: '', costo: '', fechaAdq: '', fechaUso: '', vidaUtil: '5',
  serie: '', factura: '',
  categoria: '', localizacion: '', proveedor: '', marca: '', modelo: '', origen: '',
}

export function CrearActivoModal({ onClose }) {
  const [form, setForm] = useState(FORM_INICIAL)
  const [errors, setErrors] = useState({})
  const [sugerido, setSugerido] = useState('')
  const crear = useCrearActivo()
  const { showToast } = useToast()

  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }))

  // Al cambiar la categoria, precargamos el siguiente numero correlativo.
  async function cambiarCategoria(id) {
    setForm((prev) => ({ ...prev, categoria: id }))
    if (!id) { setSugerido(''); return }
    try {
      const { numero } = await siguienteNumero(id)
      setSugerido(numero)
      setForm((prev) => ({ ...prev, num: numero }))
    } catch {
      // si falla la sugerencia, el usuario puede escribir el numero a mano
    }
  }

  // El modelo depende de la marca: al cambiarla, se limpia el modelo elegido.
  function cambiarMarca(id) {
    setForm((prev) => ({ ...prev, marca: id, modelo: '' }))
  }

  const avisoNumero = form.num && sugerido && form.num !== sugerido
    ? `Estás usando un número distinto al sugerido (${sugerido}).`
    : ''

  // Vista previa: el valor real que se guarda lo calcula el servidor (RN-001).
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
        num: form.num.trim(), nombre: form.nombre.trim(),
        costo: parseMonto(form.costo), fechaAdq: form.fechaAdq, fechaUso: form.fechaUso,
        vidaUtil: Number(form.vidaUtil),
        serie: form.serie.trim() || null, factura: form.factura.trim(),
        categoria: Number(form.categoria), localizacion: Number(form.localizacion),
        proveedor: Number(form.proveedor), marca: form.marca ? Number(form.marca) : null,
        modelo: form.modelo ? Number(form.modelo) : null, origen: Number(form.origen),
      }
      await crear.mutateAsync(datos)
      showToast(`Activo ${datos.num} registrado correctamente`, 'success')
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
          <CatalogSelect
            tipo="categorias" label="Categoría" value={form.categoria}
            onChange={cambiarCategoria} error={errors.categoria}
            camposNuevo={[
              { key: 'nombre', label: 'Nombre' },
              { key: 'prefijo', label: 'Prefijo', placeholder: 'Ej. SOF', maxLength: 8 },
            ]}
          />
          <FormField label="Número de activo" error={errors.num}>
            <input
              type="text" value={form.num} placeholder="Se genera al elegir categoría"
              onChange={(e) => set('num')(e.target.value)}
            />
            {avisoNumero && <span className={styles.aviso}>{avisoNumero}</span>}
          </FormField>

          <FormField label="Nombre / descripción" error={errors.nombre}>
            <input type="text" value={form.nombre} placeholder="Ej. Computadora portátil…"
              onChange={(e) => set('nombre')(e.target.value)} />
          </FormField>
          <FormField label="Costo original (₡)" error={errors.costo}>
            <input type="text" inputMode="decimal" value={form.costo} placeholder="0"
              onChange={(e) => set('costo')(formatMontoInput(e.target.value))} />
          </FormField>

          <FormField label="Fecha de adquisición" error={errors.fechaAdq}>
            <input type="date" value={form.fechaAdq} onChange={(e) => set('fechaAdq')(e.target.value)} />
          </FormField>
          <FormField label="Fecha de inicio de uso" error={errors.fechaUso}>
            <input type="date" value={form.fechaUso} onChange={(e) => set('fechaUso')(e.target.value)} />
          </FormField>
          <FormField label="Vida útil (años)" error={errors.vidaUtil}>
            <input type="number" value={form.vidaUtil} placeholder="5"
              onChange={(e) => set('vidaUtil')(e.target.value)} />
          </FormField>

          <CatalogSelect
            tipo="localizaciones" label="Área" value={form.localizacion}
            onChange={set('localizacion')} error={errors.localizacion}
            camposNuevo={[{ key: 'nombre', label: 'Nombre' }]}
          />
          <CatalogSelect
            tipo="marcas" label="Marca" value={form.marca} required={false}
            onChange={cambiarMarca} error={errors.marca}
            hint="Opcional. Si se deja vacío, se guarda sin especificar."
            camposNuevo={[{ key: 'nombre', label: 'Nombre' }]}
          />
          <CatalogSelect
            tipo="modelos" label="Modelo" value={form.modelo} required={false}
            onChange={set('modelo')} error={errors.modelo}
            params={{ marca: form.marca }} disabled={!form.marca}
            placeholder={form.marca ? 'Seleccionar modelo…' : 'Elegí una marca primero'}
            hint="Opcional. Si se deja vacío, se guarda sin especificar."
            camposNuevo={[{ key: 'nombre', label: 'Nombre' }]}
            payloadExtra={{ marca: form.marca }}
          />
          <CatalogSelect
            tipo="proveedores" label="Proveedor" value={form.proveedor}
            onChange={set('proveedor')} error={errors.proveedor}
            camposNuevo={[{ key: 'nombre', label: 'Nombre' }]}
          />
          <CatalogSelect
            tipo="origenes" label="Origen" value={form.origen}
            onChange={set('origen')} error={errors.origen}
          />

          <FormField label="Serie" error={errors.serie} required={false}
            hint="Opcional. Si se deja vacío, se guarda sin especificar.">
            <input type="text" value={form.serie} placeholder="N.º de serie"
              onChange={(e) => set('serie')(e.target.value)} />
          </FormField>
          <FormField label="N.º de factura" error={errors.factura}>
            <input type="text" value={form.factura} placeholder="F-0000"
              onChange={(e) => set('factura')(e.target.value)} />
          </FormField>
        </div>

        <div className={styles.calculo}>
          <div className={styles.calculoTitle}>
            Depreciación (calculada automáticamente, línea recta por días)
          </div>
          {preview ? (
            <div className={styles.calculoValues}>
              <div><span className={styles.calculoLabel}>Valor en libros</span><span className="mono">{money(preview.libros)}</span></div>
              <div><span className={styles.calculoLabel}>Dep. acumulada</span><span className="mono">{money(preview.dep)}</span></div>
              <div><span className={styles.calculoLabel}>Estado</span><span>{preview.estado}</span></div>
            </div>
          ) : (
            <div className={styles.calculoHint}>
              Completá costo, vida útil y fecha de inicio de uso para ver el estimado.
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={crear.isPending}>Guardar activo</Button>
        </div>
      </form>
    </div>
  )
}
