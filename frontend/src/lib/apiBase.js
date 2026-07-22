// Deriva la base de la API desde el hostname del navegador, de forma agnóstica
// al dominio (Opción B): el frontend en `demo.sistema.com` habla con el backend
// en `demo.api.sistema.com`. En localhost se usa `/api` relativo (mismo origen
// vía el proxy de Vite). Una URL explícita en VITE_API_URL siempre tiene
// prioridad (dev alterno, previews).
export function resolveApiBase(hostname, envUrl) {
  if (envUrl) return envUrl
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost')) {
    return '/api'
  }
  const parts = hostname.split('.')
  parts.splice(1, 0, 'api')
  return `https://${parts.join('.')}/api`
}
