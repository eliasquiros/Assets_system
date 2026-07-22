import { describe, expect, it } from 'vitest'
import { resolveApiBase } from './apiBase'

describe('resolveApiBase', () => {
  it('en localhost usa /api relativo (proxy de Vite, mismo origen)', () => {
    expect(resolveApiBase('localhost')).toBe('/api')
    expect(resolveApiBase('127.0.0.1')).toBe('/api')
    expect(resolveApiBase('demo.localhost')).toBe('/api')
  })

  it('en un dominio real inserta "api" como segundo label', () => {
    expect(resolveApiBase('demo.sistema.com')).toBe('https://demo.api.sistema.com/api')
    expect(resolveApiBase('empresa-uno.miapp.io')).toBe('https://empresa-uno.api.miapp.io/api')
  })

  it('una URL explícita (env) siempre gana', () => {
    expect(resolveApiBase('demo.sistema.com', 'http://localhost:8000/api')).toBe('http://localhost:8000/api')
  })

  it('sin hostname cae a /api', () => {
    expect(resolveApiBase('')).toBe('/api')
  })
})
