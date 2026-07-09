import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from '../test/queryClient'
import { AuthProvider } from '../context/AuthContext'
import * as reportesApi from '../api/reportes'
import { useGenerarAuditoria, useGenerarFinanciero } from './useReportes'

vi.mock('../api/reportes')

beforeEach(() => {
  vi.clearAllMocks()
})

function wrapper({ children }) {
  const client = createTestQueryClient()
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}

describe('useGenerarAuditoria', () => {
  it('calls generarReporteAuditoria with the dev token', async () => {
    reportesApi.generarReporteAuditoria.mockResolvedValue({ activos: [], total: 0 })
    const { result } = renderHook(() => useGenerarAuditoria(), { wrapper })
    await result.current.mutateAsync()
    expect(reportesApi.generarReporteAuditoria).toHaveBeenCalledWith({ token: 'dev-token' })
  })
})

describe('useGenerarFinanciero', () => {
  it('calls generarReporteFinanciero with the chosen cutoff month', async () => {
    reportesApi.generarReporteFinanciero.mockResolvedValue({ corte: '2026-06', activos: [], totalLibros: 0, totalDep: 0 })
    const { result } = renderHook(() => useGenerarFinanciero(), { wrapper })
    await result.current.mutateAsync('2026-06')
    expect(reportesApi.generarReporteFinanciero).toHaveBeenCalledWith('2026-06', { token: 'dev-token' })
  })
})
