export function fmtDate(iso) {
  if (!iso) return '—'
  const parts = String(iso).split('-')
  if (parts.length < 3) return iso
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

export function fmtRemaining(ms) {
  if (ms <= 0) return 'expirado'
  const totalMin = Math.floor(ms / 60000)
  const d = Math.floor(totalMin / 1440)
  const h = Math.floor((totalMin % 1440) / 60)
  const m = totalMin % 60
  if (d > 0) return `${d} día${d > 1 ? 's' : ''} ${h} h`
  if (h > 0) return `${h} h ${m} min`
  return `${m} min`
}
