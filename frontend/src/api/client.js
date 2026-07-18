const BASE_URL = import.meta.env.VITE_API_URL || '/api'

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

export async function apiFetch(path, { method = 'GET', body, headers } = {}) {
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
    let message = `Error ${response.status}`
    try {
      const errorBody = await response.json()
      if (errorBody && errorBody.detail) message = errorBody.detail
    } catch {
      // sin cuerpo JSON: se mantiene el mensaje genérico
    }
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) return null
  return response.json()
}
