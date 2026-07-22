import { resolveApiBase } from '../lib/apiBase'

const BASE_URL = resolveApiBase(
  typeof window !== 'undefined' ? window.location.hostname : '',
  import.meta.env.VITE_API_URL,
)

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function getCookie(name) {
  const match = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')
  return match ? decodeURIComponent(match.pop()) : null
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
// Estas rutas nunca disparan un refresh silencioso: login es el propio
// bootstrap (su 401 significa credenciales invalidas, no sesion vencida),
// y refresh/logout no deben reintentarse contra si mismos.
const NO_REFRESH_RETRY = new Set(['/auth/login/', '/auth/refresh/', '/auth/logout/'])

let refreshPromise = null

function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'X-CSRFToken': getCookie('csrftoken') || '' },
      credentials: 'include',
    })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

export async function apiFetch(path, { method = 'GET', body, headers, _retry = true } = {}) {
  const finalHeaders = { 'Content-Type': 'application/json', ...(headers || {}) }

  // En métodos que cambian estado, reenviamos el token CSRF legible. El JWT
  // viaja solo en cookies httpOnly (no accesibles desde aquí) vía credentials.
  if (!SAFE_METHODS.has(method.toUpperCase())) {
    const csrf = getCookie('csrftoken')
    if (csrf) finalHeaders['X-CSRFToken'] = csrf
  }

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('No se pudo conectar con el servidor', 0)
  }

  if (!response.ok) {
    // El access token vive solo 15 min; si expiro, intentamos refrescarlo
    // una vez de forma transparente antes de rendirnos (el refresh cookie
    // dura 7 dias). Nunca se reintenta para login/refresh/logout mismos.
    if (response.status === 401 && _retry && !NO_REFRESH_RETRY.has(path)) {
      const refreshed = await refreshSession()
      if (refreshed) {
        return apiFetch(path, { method, body, headers, _retry: false })
      }
    }

    let message = `Error ${response.status}`
    try {
      const errorBody = await response.json()
      if (errorBody && errorBody.detail) {
        message = errorBody.detail
      } else if (errorBody && typeof errorBody === 'object') {
        // Errores de validacion por campo ({campo: ["mensaje"]}): tomamos el
        // primer mensaje legible en vez de un "Error 400" generico.
        const primero = Object.values(errorBody)[0]
        if (Array.isArray(primero) && primero.length) message = String(primero[0])
        else if (typeof primero === 'string') message = primero
      }
    } catch {
      // sin cuerpo JSON: se mantiene el mensaje genérico
    }
    if (response.status === 401 && !NO_REFRESH_RETRY.has(path)) {
      window.dispatchEvent(new Event('auth:expired'))
    }
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) return null
  return response.json()
}
