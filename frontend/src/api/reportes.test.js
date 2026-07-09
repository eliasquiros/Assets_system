import { describe, expect, it, vi } from 'vitest'
import { apiFetch } from './client'
import { generarReporteAuditoria, generarReporteFinanciero } from './reportes'

vi.mock('./client')

describe('api/reportes', () => {
  it('generarReporteAuditoria fetches /reportes/auditoria/', async () => {
    apiFetch.mockResolvedValue({ activos: [], total: 0 })
    await generarReporteAuditoria({ token: 't1' })
    expect(apiFetch).toHaveBeenCalledWith('/reportes/auditoria/', { token: 't1' })
  })

  it('generarReporteFinanciero fetches /reportes/financiero/ with the cutoff month', async () => {
    apiFetch.mockResolvedValue({ corte: '2026-06', activos: [], totalLibros: 0, totalDep: 0 })
    await generarReporteFinanciero('2026-06', { token: 't1' })
    expect(apiFetch).toHaveBeenCalledWith('/reportes/financiero/?corte=2026-06', { token: 't1' })
  })
})
