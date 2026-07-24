import { apiFetch } from './client'
import { resolveEmpresaSlug } from '../lib/apiBase'

export function login(usuario, password) {
  // El slug de empresa se deriva del subdominio y viaja como HINT NO
  // autoritativo: el backend valida credenciales contra ese schema y emite un
  // token firmado. La seguridad no depende de este valor (RS-002).
  const empresa = resolveEmpresaSlug(
    typeof window !== 'undefined' ? window.location.hostname : '',
  )
  return apiFetch('/auth/login/', { method: 'POST', body: { usuario, password, empresa } })
}

export function me() {
  return apiFetch('/auth/me/')
}

export function logout() {
  return apiFetch('/auth/logout/', { method: 'POST' })
}
