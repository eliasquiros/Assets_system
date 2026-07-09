import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from '../test/queryClient'
import { AuthProvider } from '../context/AuthContext'
import * as bajasApi from '../api/bajas'
import { useBajas, useRegistrarBaja, useRevertirBaja } from './useBajas'

vi.mock('../api/bajas')

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

describe('useBajas', () => {
  it('calls listarBajas with the dev token', async () => {
    bajasApi.listarBajas.mockResolvedValue([{ id: 'BJ-2026-018' }])
    const { result } = renderHook(() => useBajas(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(bajasApi.listarBajas).toHaveBeenCalledWith({ token: 'dev-token' })
    expect(result.current.data).toEqual([{ id: 'BJ-2026-018' }])
  })
})

describe('useRegistrarBaja', () => {
  it('calls registrarBaja with the submitted form', async () => {
    bajasApi.registrarBaja.mockResolvedValue({ id: 'BJ-2026-019' })
    const { result } = renderHook(() => useRegistrarBaja(), { wrapper })
    const datos = { activoNum: 'AF-0001', motivo: 'Venta', desc: 'x' }
    await result.current.mutateAsync(datos)
    expect(bajasApi.registrarBaja).toHaveBeenCalledWith(datos, { token: 'dev-token' })
  })
})

describe('useRevertirBaja', () => {
  it('calls revertirBaja with the given id', async () => {
    bajasApi.revertirBaja.mockResolvedValue(null)
    const { result } = renderHook(() => useRevertirBaja(), { wrapper })
    await result.current.mutateAsync('BJ-2026-018')
    expect(bajasApi.revertirBaja).toHaveBeenCalledWith('BJ-2026-018', { token: 'dev-token' })
  })
})
