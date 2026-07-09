// toLocaleString('es-CR') groups thousands with a non-breaking space in this
// Node/ICU build, not a period — grouping is done manually to match the '.' the spec requires.
export function money(n) {
  const value = Math.round(Number(n) || 0)
  return '₡ ' + String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}
