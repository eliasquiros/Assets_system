import { useRef, useState } from 'react'
import { useCrearActivo } from '../../hooks/useActivos'
import { useToast } from '../../context/ToastContext'
import { siguienteNumero } from '../../api/catalogos'
import { validateActivoNuevo } from '../../lib/validators'
import { FormField } from '../../components/FormField'
import { CatalogSelect } from '../../components/CatalogSelect'
import { Button } from '../../components/Button'
import styles from './ActivoModal.module.css'

const FORM_INICIAL = {
  num: '', nombre: '', costo: '', fechaAdq: '', fechaUso: '', vidaUtil: '5',
  estado: 'DEPRECIANDO', libros: '', dep: '0', serie: '', factura: '',
  categoria: '', localizacion: '', proveedor: '', marca: '', modelo: '', origen: '',
}

export function CrearActivoModal({ onClose }) {
  const [form, setForm] = useState(FORM_INICIAL)
  const [errors, setErrors] = useState({})
  const [sugerido, setSugerido] = useState('')
  const librosEditado = useRef(false)
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

  // El valor en libros refleja el costo mientras el usuario no lo edite a mano.
  function cambiarCosto(value) {
    setForm((prev) => ({ ...prev, costo: value, ...(librosEditado.current ? {} : { libros: value }) }))
  }

  function cambiarLibros(value) {
    librosEditado.current = true
    setForm((prev) => ({ ...prev, libros: value }))
  }

  const avisoNumero = form.num && sugerido && form.num !== sugerido
    ? `Estás usando un número distinto al sugerido (${sugerido}).`
    : ''

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
        costo: Number(form.costo), fechaAdq: form.fechaAdq, fechaUso: form.fechaUso,
        vidaUtil: Number(form.vidaUtil), estado: form.estado,
        libros: Number(form.libros), dep: Number(form.dep),
        serie: form.serie.trim(), factura: form.factura.trim(),
        categoria: Number(form.categoria), localizacion: Number(form.localizacion),
        proveedor: Number(form.proveedor), marca: Number(form.marca),
        modelo: Number(form.modelo), origen: Number(form.origen),
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
            <input type="number" value={form.costo} placeholder="0"
              onChange={(e) => cambiarCosto(e.target.value)} />
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
            tipo="marcas" label="Marca" value={form.marca}
            onChange={cambiarMarca} error={errors.marca}
            camposNuevo={[{ key: 'nombre', label: 'Nombre' }]}
          />
          <CatalogSelect
            tipo="modelos" label="Modelo" value={form.modelo}
            onChange={set('modelo')} error={errors.modelo}
            params={{ marca: form.marca }} disabled={!form.marca}
            placeholder={form.marca ? 'Seleccionar modelo…' : 'Elegí una marca primero'}
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

          <FormField label="Serie" error={errors.serie}>
            <input type="text" value={form.serie} placeholder="N.º de serie"
              onChange={(e) => set('serie')(e.target.value)} />
          </FormField>
          <FormField label="N.º de factura" error={errors.factura}>
            <input type="text" value={form.factura} placeholder="F-0000"
              onChange={(e) => set('factura')(e.target.value)} />
          </FormField>

          <FormField label="Estado" error={errors.estado}>
            <select value={form.estado} onChange={(e) => set('estado')(e.target.value)}>
              <option value="DEPRECIANDO">Depreciando</option>
              <option value="TOTALMENTE_DEPRECIADO">Totalmente depreciado</option>
            </select>
          </FormField>
          <FormField label="Valor en libros (₡)" error={errors.libros}>
            <input type="number" value={form.libros} placeholder="0"
              onChange={(e) => cambiarLibros(e.target.value)} />
          </FormField>
          <FormField label="Dep. acumulada (₡)" error={errors.dep}>
            <input type="number" value={form.dep} placeholder="0"
              onChange={(e) => set('dep')(e.target.value)} />
          </FormField>
        </div>
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={crear.isPending}>Guardar activo</Button>
        </div>
      </form>
    </div>
  )
}
