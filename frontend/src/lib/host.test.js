import { describe, expect, it } from 'vitest'
import { esHostDeMarca } from './host'

describe('esHostDeMarca', () => {
  it('el dominio raiz y www son de marca: ahi vive la landing', () => {
    expect(esHostDeMarca('acticr.com')).toBe(true)
    expect(esHostDeMarca('www.acticr.com')).toBe(true)
  })

  it('el subdominio de una empresa NO es de marca: ahi vive la app', () => {
    expect(esHostDeMarca('demo.acticr.com')).toBe(false)
    expect(esHostDeMarca('empresa-uno.acticr.com')).toBe(false)
    expect(esHostDeMarca('demo.localhost')).toBe(false)
  })

  it('en dev, localhost pelado muestra la landing', () => {
    // Permite previsualizarla sin montar un subdominio falso.
    expect(esHostDeMarca('localhost')).toBe(true)
    expect(esHostDeMarca('127.0.0.1')).toBe(true)
    expect(esHostDeMarca('')).toBe(true)
  })

  it('no confunde una empresa cuyo nombre empieza con www', () => {
    expect(esHostDeMarca('wwwtf.acticr.com')).toBe(false)
  })
})
