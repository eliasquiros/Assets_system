export const ACTIVO_FIELD_DEFS = [
  { key: 'num', label: 'Número de activo', type: 'text', placeholder: 'AF-0000', mono: true },
  { key: 'nombre', label: 'Nombre / descripción', type: 'text', placeholder: 'Ej. Computadora portátil…' },
  { key: 'costo', label: 'Costo original (₡)', type: 'number', placeholder: '0', mono: true },
  { key: 'fechaAdq', label: 'Fecha de adquisición', type: 'date', placeholder: '' },
  { key: 'fechaUso', label: 'Fecha de inicio de uso', type: 'date', placeholder: '' },
  { key: 'vidaUtil', label: 'Vida útil (años)', type: 'number', placeholder: '5', mono: true },
  { key: 'origen', label: 'Origen', type: 'text', placeholder: 'Compra local' },
  { key: 'proveedor', label: 'Proveedor', type: 'text', placeholder: 'Nombre del proveedor' },
  { key: 'area', label: 'Área', type: 'text', placeholder: 'Bodega Central' },
  { key: 'tipo', label: 'Tipo / categoría', type: 'text', placeholder: 'Equipo de cómputo' },
  { key: 'serie', label: 'Serie', type: 'text', placeholder: 'N.º de serie', mono: true },
  { key: 'modelo', label: 'Modelo', type: 'text', placeholder: 'Modelo' },
  { key: 'marca', label: 'Marca', type: 'text', placeholder: 'Marca' },
  { key: 'factura', label: 'N.º de factura', type: 'text', placeholder: 'F-0000', mono: true },
]

export const BLANK_ACTIVO_FORM = ACTIVO_FIELD_DEFS.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {})
