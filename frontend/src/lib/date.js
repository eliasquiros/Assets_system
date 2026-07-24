export function fmtDate(iso) {
  if (!iso) return '—'
  // Acepta tanto fechas puras ("2026-07-23") como datetimes ISO completos
  // ("2026-07-23T17:45:00+00:00"): se descarta la hora antes de partir por
  // guiones, para no arrastrar el "T17:45..." dentro del día.
  const soloFecha = String(iso).split('T')[0]
  const parts = soloFecha.split('-')
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
