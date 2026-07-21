export const ACTIVO_REQUIRED_FIELDS = [
  'num', 'nombre', 'costo', 'fechaAdq', 'fechaUso', 'vidaUtil',
  'origen', 'proveedor', 'area', 'tipo', 'serie', 'modelo', 'marca', 'factura',
]

export function validateActivo(values) {
  const errors = {}
  ACTIVO_REQUIRED_FIELDS.forEach((key) => {
    const value = values[key]
    if (value === null || value === undefined || String(value).trim() === '') {
      errors[key] = 'Campo obligatorio'
    }
  })
  if (values.costo && Number(values.costo) <= 0) {
    errors.costo = 'Debe ser mayor a cero'
  }
  if (values.vidaUtil && Number(values.vidaUtil) <= 0) {
    errors.vidaUtil = 'Debe ser mayor a cero'
  }
  if (values.fechaAdq && values.fechaUso && values.fechaUso < values.fechaAdq) {
    errors.fechaUso = 'No puede ser anterior a la fecha de adquisición'
  }
  return errors
}

// Registro de activo con catalogos por ID (formulario nuevo). Distinto de
// ACTIVO_REQUIRED_FIELDS (texto libre) que sigue usando el modal de edicion.
export const ACTIVO_NUEVO_REQUIRED = [
  'num', 'nombre', 'costo', 'fechaAdq', 'fechaUso', 'vidaUtil', 'estado',
  'libros', 'dep', 'serie', 'factura', 'categoria', 'localizacion',
  'proveedor', 'marca', 'modelo', 'origen',
]

export function validateActivoNuevo(values) {
  const errors = {}
  ACTIVO_NUEVO_REQUIRED.forEach((key) => {
    const value = values[key]
    if (value === null || value === undefined || String(value).trim() === '') {
      errors[key] = 'Campo obligatorio'
    }
  })
  if (values.costo && Number(values.costo) <= 0) errors.costo = 'Debe ser mayor a cero'
  if (values.vidaUtil && Number(values.vidaUtil) <= 0) errors.vidaUtil = 'Debe ser mayor a cero'
  if (values.libros !== '' && Number(values.libros) < 0) errors.libros = 'No puede ser negativo'
  if (values.dep !== '' && Number(values.dep) < 0) errors.dep = 'No puede ser negativo'
  if (values.costo && values.dep !== '' && Number(values.dep) > Number(values.costo)) {
    errors.dep = 'No puede superar el costo'
  }
  if (values.fechaAdq && values.fechaUso && values.fechaUso < values.fechaAdq) {
    errors.fechaUso = 'No puede ser anterior a la fecha de adquisición'
  }
  return errors
}

export function validateRetiro(values) {
  const errors = {}
  if (!values.activoNum) errors.activoNum = 'Selecciona un activo'
  if (!values.motivo) errors.motivo = 'Selecciona un motivo'
  if (!String(values.desc || '').trim()) errors.desc = 'Ingresa una descripción'
  return errors
}
