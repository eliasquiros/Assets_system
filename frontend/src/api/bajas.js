import { apiFetch } from './client'

export function listarBajas({ token } = {}) {
  return apiFetch('/bajas/', { token })
}

export function registrarBaja(datos, { token } = {}) {
  return apiFetch('/bajas/', { method: 'POST', body: datos, token })
}

export function revertirBaja(id, { token } = {}) {
  return apiFetch(`/bajas/${id}/revertir/`, { method: 'POST', token })
}
