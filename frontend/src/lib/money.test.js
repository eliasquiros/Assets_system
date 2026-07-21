import { describe, expect, it } from 'vitest'
import { money, formatMontoInput, parseMonto } from './money'

describe('money', () => {
  it('agrupa miles con puntos', () => {
    expect(money(500000)).toBe('₡ 500.000')
    expect(money(1234567)).toBe('₡ 1.234.567')
  })
})

describe('formatMontoInput', () => {
  it('agrupa miles mientras se escribe', () => {
    expect(formatMontoInput('500000')).toBe('500.000')
    expect(formatMontoInput('1234567')).toBe('1.234.567')
  })

  it('permite decimales con coma, maximo 2 digitos', () => {
    expect(formatMontoInput('500000,5')).toBe('500.000,5')
    expect(formatMontoInput('500000,56')).toBe('500.000,56')
    expect(formatMontoInput('500000,567')).toBe('500.000,56')
  })

  it('ignora caracteres que no sean digitos o coma', () => {
    expect(formatMontoInput('₡500.000abc')).toBe('500.000')
  })

  it('quita ceros a la izquierda', () => {
    expect(formatMontoInput('0500000')).toBe('500.000')
  })

  it('devuelve vacio si no hay digitos', () => {
    expect(formatMontoInput('')).toBe('')
    expect(formatMontoInput('abc')).toBe('')
  })
})

describe('parseMonto', () => {
  it('convierte un monto formateado a numero', () => {
    expect(parseMonto('500.000')).toBe(500000)
    expect(parseMonto('1.234.567,89')).toBeCloseTo(1234567.89)
  })

  it('devuelve NaN para vacio', () => {
    expect(Number.isNaN(parseMonto(''))).toBe(true)
    expect(Number.isNaN(parseMonto(undefined))).toBe(true)
  })
})
