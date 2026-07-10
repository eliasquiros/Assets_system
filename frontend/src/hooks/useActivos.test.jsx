import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from '../test/queryClient'
import { AuthProvider } from '../context/AuthContext'
import * as activosApi from '../api/activos'
import { useActivo, useActivos, useCrearActivo, useEditarActivo, useMovimientos } from './useActivos'

vi.mock('../api/activos')

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.setItem('af_session', JSON.stringify({ token: 'dev-token', empresa: 'x', usuario: {} }))
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
  it('calls listarActivos with the current filters and the dev token', async () => {
    activosApi.listarActivos.mockResolvedValue([{ num: 'AF-0001' }])
    const { result } = renderHook(() => useActivos({ search: 'dell', area: '', tipo: '' }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(activosApi.listarActivos).toHaveBeenCalledWith({ search: 'dell', area: '', tipo: '', token: 'dev-token' })
    expect(result.current.data).toEqual([{ num: 'AF-0001' }])
  })
})

describe('useActivo', () => {
  it('calls obtenerActivo only when num is truthy', async () => {
    activosApi.obtenerActivo.mockResolvedValue({ num: 'AF-0001' })
    const { result } = renderHook(() => useActivo('AF-0001'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(activosApi.obtenerActivo).toHaveBeenCalledWith('AF-0001', { token: 'dev-token' })
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
    expect(activosApi.obtenerMovimientos).toHaveBeenCalledWith('AF-0001', { token: 'dev-token' })
  })
})

describe('useCrearActivo', () => {
  it('calls crearActivo with the submitted data', async () => {
    activosApi.crearActivo.mockResolvedValue({ num: 'AF-0019' })
    const { result } = renderHook(() => useCrearActivo(), { wrapper })
    await result.current.mutateAsync({ num: 'AF-0019' })
    expect(activosApi.crearActivo).toHaveBeenCalledWith({ num: 'AF-0019' }, { token: 'dev-token' })
  })
})

describe('useEditarActivo', () => {
  it('calls editarActivo with the num and the updated data', async () => {
    activosApi.editarActivo.mockResolvedValue({ num: 'AF-0001' })
    const { result } = renderHook(() => useEditarActivo(), { wrapper })
    await result.current.mutateAsync({ num: 'AF-0001', datos: { nombre: 'x' } })
    expect(activosApi.editarActivo).toHaveBeenCalledWith('AF-0001', { nombre: 'x' }, { token: 'dev-token' })
  })
})
