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

// Decide si una sesion viva puede usarse en el host que se esta visitando.
//
// El JWT vive en una cookie de la API (api.sistema.com), asi que viaja igual
// desde CUALQUIER subdominio del frontend, y el backend resuelve la empresa por
// el claim firmado del token, nunca por el host (RS-002). Sin esta comprobacion,
// abrir otra.sistema.com con la sesion de demo entra directo a la app mostrando
// los datos de DEMO bajo la URL de otra empresa: no filtra datos ajenos —el
// aislamiento lo garantiza el token— pero invita a editar la empresa equivocada
// creyendo que se esta en otra.
//
// No valida (devuelve true) cuando el host no lleva empresa —localhost de dev,
// dominio apex— ni cuando la sesion no trae slug: esto acota la CONFUSION de
// empresa en la UI, no es la frontera de seguridad.
export function sesionPerteneceAlHost(hostname, subdominioSesion) {
  const slugHost = resolveEmpresaSlug(hostname)
  if (!slugHost || !subdominioSesion) return true
  return slugHost === subdominioSesion
}

function esLocal(hostname) {
  return (
    !hostname ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.localhost')
  )
}
