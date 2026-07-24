import { describe, expect, it } from 'vitest'
import { resolveApiBase, resolveEmpresaSlug } from './apiBase'

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
