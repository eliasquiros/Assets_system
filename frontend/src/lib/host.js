import { resolveEmpresaSlug } from './apiBase'

// Etiquetas que nunca son una empresa. `www` es el host publico de la marca.
const ETIQUETAS_DE_MARCA = new Set(['www'])

// Un mismo despliegue de Vercel sirve el comodin *.acticr.com y el host de
// marca, asi que el hostname es lo unico que distingue "sitio publico" de
// "aplicacion de una empresa": www.acticr.com muestra la landing,
// demo.acticr.com muestra el login y la app (DA16).
export function esHostDeMarca(hostname) {
  const slug = resolveEmpresaSlug(hostname)
  if (!slug) return true                          // localhost pelado
  if (ETIQUETAS_DE_MARCA.has(slug)) return true   // www.acticr.com

  // El dominio raiz (acticr.com) tiene dos etiquetas y ninguna es la empresa,
  // pero resolveEmpresaSlug no puede saberlo —para el, la primera etiqueta
  // siempre es candidata a empresa—. En dev pasa lo contrario: demo.localhost
  // tambien son dos etiquetas y ahi la primera SI es la empresa.
  const etiquetas = hostname.split('.')
  const esDominioDeDev = hostname.endsWith('.localhost')
  return etiquetas.length <= 2 && !esDominioDeDev
}
