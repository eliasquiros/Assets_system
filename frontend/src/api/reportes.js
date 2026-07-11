import { apiFetch } from './client'

export function generarReporteAuditoria({ token } = {}) {
  return apiFetch('/reportes/auditoria/', { token })
}

export function generarReporteFinanciero(corte, { token } = {}) {
  return apiFetch(`/reportes/financiero/?corte=${encodeURIComponent(corte)}`, { token })
}
