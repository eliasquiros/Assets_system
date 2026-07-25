import { describe, expect, it } from 'vitest'
import { resolveApiBase, resolveEmpresaSlug, sesionPerteneceAlHost } from './apiBase'

describe('resolveApiBase', () => {
  it('en localhost usa /api relativo (proxy de Vite, mismo origen)', () => {
    expect(resolveApiBase('localhost')).toBe('/api')
    expect(resolveApiBase('127.0.0.1')).toBe('/api')
    expect(resolveApiBase('demo.localhost')).toBe('/api')
  })

  it('en un dominio real apunta al backend unico api.<dominio>', () => {
    expect(resolveApiBase('demo.sistema.com')).toBe('https://api.sistema.com/api')
    expect(resolveApiBase('empresa-uno.miapp.io')).toBe('https://api.miapp.io/api')
  })

  it('una URL explícita (env) siempre gana', () => {
    expect(resolveApiBase('demo.sistema.com', 'http://localhost:8000/api')).toBe('http://localhost:8000/api')
  })

  it('sin hostname cae a /api', () => {
    expect(resolveApiBase('')).toBe('/api')
  })
})

describe('resolveEmpresaSlug', () => {
  it('deriva el slug del subdominio', () => {
    expect(resolveEmpresaSlug('demo.sistema.com')).toBe('demo')
    expect(resolveEmpresaSlug('empresa-uno.miapp.io')).toBe('empresa-uno')
    expect(resolveEmpresaSlug('demo.localhost')).toBe('demo')
  })

  it('sin subdominio de empresa devuelve cadena vacía', () => {
    expect(resolveEmpresaSlug('localhost')).toBe('')
    expect(resolveEmpresaSlug('127.0.0.1')).toBe('')
    expect(resolveEmpresaSlug('')).toBe('')
  })
})

describe('sesionPerteneceAlHost', () => {
  it('acepta cuando el host es el subdominio de la empresa de la sesión', () => {
    expect(sesionPerteneceAlHost('demo.sistema.com', 'demo')).toBe(true)
    expect(sesionPerteneceAlHost('demo.localhost', 'demo')).toBe(true)
  })

  it('rechaza el subdominio de otra empresa y el que no es de ninguna', () => {
    expect(sesionPerteneceAlHost('otra.sistema.com', 'demo')).toBe(false)
    expect(sesionPerteneceAlHost('www.sistema.com', 'demo')).toBe(false)
  })

  it('no valida cuando el host no lleva empresa (localhost de dev)', () => {
    expect(sesionPerteneceAlHost('localhost', 'demo')).toBe(true)
    expect(sesionPerteneceAlHost('127.0.0.1', 'demo')).toBe(true)
  })

  it('no valida si la sesión no trae slug', () => {
    // Fail-open a proposito: esta comprobacion evita CONFUSION de empresa en la
    // UI, no es la frontera de seguridad (esa es el claim firmado del token, que
    // el backend valida en cada request). Si el backend aun no manda el slug
    // —ventana de despliegue con el frontend nuevo y el backend viejo— cerrar
    // sesion a todo el mundo seria peor que no comprobar.
    expect(sesionPerteneceAlHost('demo.sistema.com', '')).toBe(true)
    expect(sesionPerteneceAlHost('demo.sistema.com', undefined)).toBe(true)
  })
})
