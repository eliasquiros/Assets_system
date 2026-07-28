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

  it('en un 401 intenta refrescar la sesión y reintenta la petición original', async () => {
    document.cookie = 'csrftoken=abc123'   // sesión ya iniciada: la cookie existe
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ detail: 'expirado' }) })
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ items: [] }) })
    vi.stubGlobal('fetch', mockFetch)

    const data = await apiFetch('/activos/')

    expect(data).toEqual({ items: [] })
    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(mockFetch.mock.calls[1][0]).toBe('/api/auth/refresh/')
  })

  it('si el refresh también falla, propaga el ApiError original y dispara auth:expired', async () => {
    document.cookie = 'csrftoken=abc123'   // sesión ya iniciada: la cookie existe
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ detail: 'Sesión expirada' }) })
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
    vi.stubGlobal('fetch', mockFetch)
    const onExpired = vi.fn()
    window.addEventListener('auth:expired', onExpired)

    await expect(apiFetch('/activos/')).rejects.toThrow('Sesión expirada')
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(onExpired).toHaveBeenCalledTimes(1)

    window.removeEventListener('auth:expired', onExpired)
  })

  it('resiembra el csrftoken antes de refrescar si la cookie se perdió', async () => {
    // /auth/refresh/ exige CSRF. Si la cookie caducó mientras el refresh
    // httpOnly sigue vivo, sin resembrarla el POST daría 403 y cerraría la
    // sesión sin necesidad.
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ detail: 'expirado' }) })
      .mockResolvedValueOnce({ ok: true, status: 204 })   // GET /auth/csrf/
      .mockResolvedValueOnce({ ok: true, status: 200 })   // POST /auth/refresh/
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ items: [] }) })
    vi.stubGlobal('fetch', mockFetch)

    await apiFetch('/activos/')

    expect(mockFetch.mock.calls[1][0]).toBe('/api/auth/csrf/')
    expect(mockFetch.mock.calls[2][0]).toBe('/api/auth/refresh/')
  })

  it('un 401 en /auth/login/ no intenta refrescar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 401, json: async () => ({ detail: 'Usuario o contraseña incorrectos' }),
    }))
    await expect(apiFetch('/auth/login/', { method: 'POST' })).rejects.toThrow('Usuario o contraseña incorrectos')
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
