import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, ApiError } from './client'

describe('apiFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    document.cookie = 'csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  })

  it('GET envía las cookies y no manda Authorization', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) })
    vi.stubGlobal('fetch', mockFetch)

    const data = await apiFetch('/auth/me/')

    expect(data).toEqual({ ok: true })
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/me/', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: undefined,
    })
  })

  it('POST adjunta X-CSRFToken desde la cookie y envía credenciales', async () => {
    document.cookie = 'csrftoken=abc123'
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ username: 'ana' }) })
    vi.stubGlobal('fetch', mockFetch)

    await apiFetch('/auth/login/', { method: 'POST', body: { usuario: 'ana', password: 'x' } })

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': 'abc123' },
      credentials: 'include',
      body: JSON.stringify({ usuario: 'ana', password: 'x' }),
    })
  })

  it('devuelve null en un 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204 }))
    expect(await apiFetch('/auth/logout/', { method: 'POST' })).toBeNull()
  })

  it('lanza ApiError con el detail del servidor en respuesta no-ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 401, json: async () => ({ detail: 'Usuario o contraseña incorrectos' }),
    }))
    await expect(apiFetch('/auth/login/', { method: 'POST' })).rejects.toThrow('Usuario o contraseña incorrectos')
  })

  it('lanza ApiError de conexión cuando fetch rechaza', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const error = await apiFetch('/auth/me/').catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(0)
  })
})
