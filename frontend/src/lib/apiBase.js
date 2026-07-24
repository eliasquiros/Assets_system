// Topologia de API unica: todas las empresas hablan con un unico backend
// (api.sistema.com). El frontend en `demo.sistema.com` -> API en
// `api.sistema.com`. En localhost se usa `/api` relativo (mismo origen via el
// proxy de Vite). Una URL explicita en VITE_API_URL siempre tiene prioridad.
export function resolveApiBase(hostname, envUrl) {
  if (envUrl) return envUrl
  if (esLocal(hostname)) return '/api'
  // Dominio unico de API: se reemplaza la etiqueta de empresa por "api".
  // demo.sistema.com -> api.sistema.com
  const parts = hostname.split('.')
  const base = parts.length > 2 ? parts.slice(1) : parts
  return `https://api.${base.join('.')}/api`
}

// Slug de la empresa derivado del subdominio, para mandarlo como HINT NO
// autoritativo en el login (el backend valida credenciales contra ese schema y
// emite un token firmado; la seguridad no depende de este valor). Vacio cuando
// no hay subdominio de empresa (ej. `localhost` pelado).
export function resolveEmpresaSlug(hostname) {
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') return ''
  const [primera, ...resto] = hostname.split('.')
  // Debe haber al menos un segmento mas (demo.localhost, demo.sistema.com);
  // un host de una sola etiqueta no lleva empresa.
  return resto.length ? primera : ''
}

function esLocal(hostname) {
  return (
    !hostname ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.localhost')
  )
}
