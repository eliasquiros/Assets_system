import { apiFetch } from './client'

// Rutas de los catalogos que alimentan los desplegables del registro de activos.
const PATHS = {
  proveedores: '/catalogos/proveedores/',
  categorias: '/catalogos/categorias/',
  localizaciones: '/catalogos/localizaciones/',
  marcas: '/catalogos/marcas/',
  modelos: '/catalogos/modelos/',
  origenes: '/catalogos/origenes/',
}

export function listarCatalogo(tipo, params = {}) {
  const filtrados = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined),
  )
  const qs = new URLSearchParams(filtrados).toString()
  return apiFetch(`${PATHS[tipo]}${qs ? `?${qs}` : ''}`)
}

export function crearCatalogo(tipo, datos) {
  return apiFetch(PATHS[tipo], { method: 'POST', body: datos })
}

export function siguienteNumero(categoriaId) {
  return apiFetch(`/activos/siguiente-numero/?categoria=${categoriaId}`)
}
