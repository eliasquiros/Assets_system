import { useState } from 'react'
import { useCatalogo, useCrearCatalogo } from '../hooks/useCatalogos'
import { useToast } from '../context/ToastContext'
import { Button } from './Button'
import styles from './CatalogSelect.module.css'

/**
 * Desplegable poblado desde un catalogo de la BD, con alta inline opcional.
 *
 * - `tipo`: clave del catalogo (proveedores, categorias, marcas, modelos, …).
 * - `camposNuevo`: si se pasa, muestra "+ Nuevo …" y un panel para crear la
 *   opcion sin salir del formulario. Omitirlo (ej. Origen) deja el select fijo.
 * - `payloadExtra`: datos extra al crear (ej. { marca } para un modelo).
 */
export function CatalogSelect({
  tipo, label, value, onChange, error, required = true,
  params = {}, disabled = false, camposNuevo = null, payloadExtra = {}, placeholder,
}) {
  const { data, isLoading } = useCatalogo(tipo, params, { enabled: !disabled })
  const crear = useCrearCatalogo(tipo)
  const { showToast } = useToast()
  const [abierto, setAbierto] = useState(false)
  const [nuevo, setNuevo] = useState({})
  const [errNuevo, setErrNuevo] = useState('')
  const opciones = data || []

  function cerrar() {
    setAbierto(false); setNuevo({}); setErrNuevo('')
  }

  async function guardarNuevo() {
    for (const c of camposNuevo) {
      if (!String(nuevo[c.key] || '').trim()) { setErrNuevo('Completa los campos.'); return }
    }
    try {
      const creado = await crear.mutateAsync({ ...nuevo, ...payloadExtra })
      onChange(String(creado.id))
      cerrar()
      showToast(`${label} agregado`, 'success')
    } catch (e) {
      setErrNuevo(e.message)
    }
  }

  return (
    <div className={styles.field}>
      <span className={styles.label}>
        {label} {required && <span className={styles.req}>*</span>}
      </span>
      <select
        className={styles.select}
        value={value || ''}
        disabled={disabled || isLoading}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      >
        <option value="">{placeholder || `Seleccionar ${label.toLowerCase()}…`}</option>
        {opciones.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
      </select>

      {camposNuevo && !disabled && (abierto ? (
        <div className={styles.panel}>
          {camposNuevo.map((c) => (
            <input
              key={c.key}
              className={styles.input}
              placeholder={c.placeholder || c.label}
              maxLength={c.maxLength}
              value={nuevo[c.key] || ''}
              onChange={(e) => setNuevo((p) => ({ ...p, [c.key]: e.target.value }))}
            />
          ))}
          {errNuevo && <span className={styles.err}>{errNuevo}</span>}
          <div className={styles.panelActions}>
            <Button type="button" variant="secondary" onClick={cerrar}>Cancelar</Button>
            <Button type="button" onClick={guardarNuevo} disabled={crear.isPending}>Guardar</Button>
          </div>
        </div>
      ) : (
        <button type="button" className={styles.nuevoBtn} onClick={() => setAbierto(true)}>
          + Nuevo {label.toLowerCase()}
        </button>
      ))}

      {error && <span className={styles.err}>{error}</span>}
    </div>
  )
}
