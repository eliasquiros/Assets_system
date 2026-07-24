// TanStack Query wiring over api/* — each hook just forwards filters/args to
// its matching endpoint function (auth now travels via httpOnly cookies, not
// a token param), so these are grouped as wiring tests. The endpoint
// functions themselves are covered in api/endpoints.test.js.
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from '../test/queryClient'
import { AuthProvider } from '../context/AuthContext'
import { me as meRequest } from '../api/auth'
import * as activosApi from '../api/activos'
import * as bajasApi from '../api/bajas'
import * as reportesApi from '../api/reportes'
import { useActivo, useActivos, useCrearActivo, useEditarActivo, useMovimientos } from './useActivos'
import { useBajas, useRegistrarBaja, useRevertirBaja } from './useBajas'
import { useGenerarAuditoria, useGenerarFinanciero } from './useReportes'

vi.mock('../api/auth')
vi.mock('../api/activos')
vi.mock('../api/bajas')
vi.mock('../api/reportes')

beforeEach(() => {
  vi.clearAllMocks()
  meRequest.mockResolvedValue({ username: 'ana', empresa: 'Demo' })
})

function wrapper({ children }) {
  const client = createTestQueryClient()
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}

describe('useActivos', () => {
  it('calls listarActivos with the current filters', async () => {
    activosApi.listarActivos.mockResolvedValue([{ num: 'AF-0001' }])
    const { result } = renderHook(() => useActivos({ search: 'dell', area: '', tipo: '' }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(activosApi.listarActivos).toHaveBeenCalledWith({ search: 'dell', area: '', tipo: '' })
    expect(result.current.data).toEqual([{ num: 'AF-0001' }])
  })
})

describe('useActivo', () => {
  it('calls obtenerActivo only when num is truthy', async () => {
    activosApi.obtenerActivo.mockResolvedValue({ num: 'AF-0001' })
    const { result } = renderHook(() => useActivo('AF-0001'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(activosApi.obtenerActivo).toHaveBeenCalledWith('AF-0001', {})
  })

  it('does not call the API when num is null', () => {
    renderHook(() => useActivo(null), { wrapper })
    expect(activosApi.obtenerActivo).not.toHaveBeenCalled()
  })
})

describe('useMovimientos', () => {
  it('calls obtenerMovimientos for the given num', async () => {
    activosApi.obtenerMovimientos.mockResolvedValue([])
    const { result } = renderHook(() => useMovimientos('AF-0001'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(activosApi.obtenerMovimientos).toHaveBeenCalledWith('AF-0001', {})
  })
})

describe('useCrearActivo', () => {
  it('calls crearActivo with the submitted data', async () => {
    activosApi.crearActivo.mockResolvedValue({ num: 'AF-0019' })
    const { result } = renderHook(() => useCrearActivo(), { wrapper })
    await result.current.mutateAsync({ num: 'AF-0019' })
    expect(activosApi.crearActivo).toHaveBeenCalledWith({ num: 'AF-0019' }, {})
  })
})

describe('useEditarActivo', () => {
  it('calls editarActivo with the num and the updated data', async () => {
    activosApi.editarActivo.mockResolvedValue({ num: 'AF-0001' })
    const { result } = renderHook(() => useEditarActivo(), { wrapper })
    await result.current.mutateAsync({ num: 'AF-0001', datos: { nombre: 'x' } })
    expect(activosApi.editarActivo).toHaveBeenCalledWith('AF-0001', { nombre: 'x' }, {})
  })
})

describe('useBajas', () => {
  it('calls listarBajas', async () => {
    bajasApi.listarBajas.mockResolvedValue([{ id: 'BJ-2026-018' }])
    const { result } = renderHook(() => useBajas(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(bajasApi.listarBajas).toHaveBeenCalledWith({})
    expect(result.current.data).toEqual([{ id: 'BJ-2026-018' }])
  })
})

describe('useRegistrarBaja', () => {
  it('calls registrarBaja with the submitted form', async () => {
    bajasApi.registrarBaja.mockResolvedValue({ id: 'BJ-2026-019' })
    const { result } = renderHook(() => useRegistrarBaja(), { wrapper })
    const datos = { activoNum: 'AF-0001', motivo: 'Venta', desc: 'x' }
    await result.current.mutateAsync(datos)
    expect(bajasApi.registrarBaja).toHaveBeenCalledWith(datos, {})
  })
})

describe('useRevertirBaja', () => {
  it('calls revertirBaja with the given id', async () => {
    bajasApi.revertirBaja.mockResolvedValue(null)
    const { result } = renderHook(() => useRevertirBaja(), { wrapper })
    await result.current.mutateAsync('BJ-2026-018')
    expect(bajasApi.revertirBaja).toHaveBeenCalledWith('BJ-2026-018', {})
  })
})

describe('useGenerarAuditoria', () => {
  it('calls descargarReporteAuditoria with the chosen year', async () => {
    reportesApi.descargarReporteAuditoria.mockResolvedValue(undefined)
    const { result } = renderHook(() => useGenerarAuditoria(), { wrapper })
    await result.current.mutateAsync(2024)
    expect(reportesApi.descargarReporteAuditoria).toHaveBeenCalledWith(2024)
  })
})

describe('useGenerarFinanciero', () => {
  it('calls descargarReporteFinanciero with the chosen cutoff month', async () => {
    reportesApi.descargarReporteFinanciero.mockResolvedValue(undefined)
    const { result } = renderHook(() => useGenerarFinanciero(), { wrapper })
    await result.current.mutateAsync('2026-06')
    expect(reportesApi.descargarReporteFinanciero).toHaveBeenCalledWith('2026-06')
  })
})
