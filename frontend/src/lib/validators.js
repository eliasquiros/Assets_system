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

export function validateRetiro(values) {
  const errors = {}
  if (!values.activoNum) errors.activoNum = 'Selecciona un activo'
  if (!values.motivo) errors.motivo = 'Selecciona un motivo'
  if (!String(values.desc || '').trim()) errors.desc = 'Ingresa una descripción'
  return errors
}
