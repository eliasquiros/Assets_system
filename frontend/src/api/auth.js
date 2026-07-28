import { apiFetch } from './client'
import { resolveEmpresaSlug } from '../lib/apiBase'

// Siembra la cookie csrftoken. Los endpoints de auth exigen CSRF, y quien aún
// no inició sesión no tiene la cookie todavía: sin este GET previo el primer
// POST a /login/ se rechazaría con 403.
export function semillaCsrf() {
  return apiFetch('/auth/csrf/')
}

export async function login(usuario, password) {
  // El slug de empresa se deriva del subdominio y viaja como HINT NO
  // autoritativo: el backend valida credenciales contra ese schema y emite un
  // token firmado. La seguridad no depende de este valor (RS-002).
  const empresa = resolveEmpresaSlug(
    typeof window !== 'undefined' ? window.location.hostname : '',
  )
  // Sin cookie csrftoken el POST se rechaza; se pide solo si falta, para no
  // gastar un viaje extra en cada reintento de login.
  if (!document.cookie.includes('csrftoken=')) {
    await semillaCsrf()
  }
  return apiFetch('/auth/login/', { method: 'POST', body: { usuario, password, empresa } })
}

export function me() {
  return apiFetch('/auth/me/')
}

export function logout() {
  return apiFetch('/auth/logout/', { method: 'POST' })
}
