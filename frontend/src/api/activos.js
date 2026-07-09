import { apiFetch } from './client'

export function listarActivos({ search = '', area = '', tipo = '', token } = {}) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (area) params.set('area', area)
  if (tipo) params.set('tipo', tipo)
  const qs = params.toString()
  return apiFetch(`/activos/${qs ? `?${qs}` : ''}`, { token })
}

export function obtenerActivo(num, { token } = {}) {
  return apiFetch(`/activos/${num}/`, { token })
}

export function crearActivo(datos, { token } = {}) {
  return apiFetch('/activos/', { method: 'POST', body: datos, token })
}

export function editarActivo(num, datos, { token } = {}) {
  return apiFetch(`/activos/${num}/`, { method: 'PATCH', body: datos, token })
}

export function obtenerMovimientos(num, { token } = {}) {
  return apiFetch(`/activos/${num}/movimientos/`, { token })
}
