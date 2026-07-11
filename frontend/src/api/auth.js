import { apiFetch } from './client'

export function login(usuario, password) {
  return apiFetch('/auth/login/', { method: 'POST', body: { usuario, password } })
}
