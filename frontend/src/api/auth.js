import { apiFetch } from './client'

export function login(usuario, password) {
  return apiFetch('/auth/login/', { method: 'POST', body: { usuario, password } })
}

export function me() {
  return apiFetch('/auth/me/')
}

export function logout() {
  return apiFetch('/auth/logout/', { method: 'POST' })
}
