const BASE_URL = import.meta.env.VITE_API_URL || '/api'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch(path, { method = 'GET', body, token, headers } = {}) {
  const finalHeaders = { 'Content-Type': 'application/json', ...(headers || {}) }
  if (token) finalHeaders.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
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
      // response had no JSON body — keep the generic message
    }
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) return null
  return response.json()
}
