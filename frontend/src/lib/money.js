// toLocaleString('es-CR') groups thousands with a non-breaking space in this
// Node/ICU build, not a period — grouping is done manually to match the '.' the spec requires.
export function money(n) {
  const value = Math.round(Number(n) || 0)
  return '₡ ' + String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// Formatea un monto mientras el usuario escribe: '.' agrupa miles, ',' separa
// decimales (maximo 2). Los puntos que el usuario ya ve se vuelven a calcular
// en cada tecla, asi que basta con quitar todo lo que no sea digito o coma.
export function formatMontoInput(raw) {
  const cleaned = String(raw ?? '').replace(/[^\d,]/g, '')
  if (!cleaned) return ''
  const [enteroCrudo, ...decimales] = cleaned.split(',')
  const entero = (enteroCrudo || '0').replace(/^0+(?=\d)/, '')
  const enteroFmt = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  if (!cleaned.includes(',')) return enteroFmt
  return `${enteroFmt},${decimales.join('').slice(0, 2)}`
}

// Convierte un monto con formato '1.234.567,89' de vuelta a un numero JS.
export function parseMonto(str) {
  const cleaned = String(str ?? '').trim()
  if (!cleaned) return NaN
  return Number(cleaned.replace(/\./g, '').replace(',', '.'))
}
