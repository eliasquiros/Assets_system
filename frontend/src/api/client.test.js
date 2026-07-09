import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, ApiError } from './client'

describe('apiFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('GETs with the auth header and returns parsed JSON', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => ({ ok: true }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const data = await apiFetch('/activos/', { token: 't1' })

    expect(data).toEqual({ ok: true })
    expect(mockFetch).toHaveBeenCalledWith('/api/activos/', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer t1' },
      body: undefined,
    })
  })

  it('serializes the body and sets the method for a POST', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ num: 'AF-0001' }) })
    vi.stubGlobal('fetch', mockFetch)

    await apiFetch('/activos/', { method: 'POST', body: { num: 'AF-0001' }, token: 't1' })

    expect(mockFetch).toHaveBeenCalledWith('/api/activos/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer t1' },
      body: JSON.stringify({ num: 'AF-0001' }),
    })
  })

  it('returns null for a 204 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204 }))
    const data = await apiFetch('/bajas/1/revertir/', { method: 'POST' })
    expect(data).toBeNull()
  })

  it('throws ApiError with the server detail message on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 400, json: async () => ({ detail: 'Costo debe ser mayor a cero' }),
    }))
    await expect(apiFetch('/activos/')).rejects.toThrow('Costo debe ser mayor a cero')
  })

  it('throws a connection ApiError when fetch itself rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const error = await apiFetch('/activos/').catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.message).toBe('No se pudo conectar con el servidor')
    expect(error.status).toBe(0)
  })
})
