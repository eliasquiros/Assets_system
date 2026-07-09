export function money(n) {
  const value = Math.round(Number(n) || 0)
  return '₡ ' + String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}
