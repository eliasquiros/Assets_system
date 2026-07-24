import { describe, expect, it } from 'vitest'
import { fmtDate, fmtRemaining } from './date'
import { calcularDepreciacionPreview } from './depreciacion'
import { money } from './money'
import { validateActivo, validateRetiro } from './validators'

describe('fmtDate', () => {
  it('converts an ISO date to dd/mm/yyyy', () => {
    expect(fmtDate('2022-03-15')).toBe('15/03/2022')
  })

  it('returns an em dash for empty input', () => {
    expect(fmtDate('')).toBe('—')
    expect(fmtDate(null)).toBe('—')
  })
})

describe('fmtRemaining', () => {
  it('formats days and hours when more than a day remains', () => {
    expect(fmtRemaining(2 * 86400000 + 3 * 3600000)).toBe('2 días 3 h')
  })

  it('formats a single day without pluralizing', () => {
    expect(fmtRemaining(1 * 86400000 + 1 * 3600000)).toBe('1 día 1 h')
  })

  it('formats hours and minutes when less than a day remains', () => {
    expect(fmtRemaining(5 * 3600000 + 30 * 60000)).toBe('5 h 30 min')
  })

  it('formats minutes only when less than an hour remains', () => {
    expect(fmtRemaining(15 * 60000)).toBe('15 min')
  })

  it('returns "expirado" when time is up', () => {
    expect(fmtRemaining(0)).toBe('expirado')
    expect(fmtRemaining(-1000)).toBe('expirado')
  })
})

describe('money', () => {
  // money() usa un espacio NO separable ( ) entre el ₡ y el número para que
  // el signo no quede solo al saltar de línea; se normaliza a espacio al comparar.
  const fmt = (n) => money(n).replace(/ /g, ' ')

  it('formats a positive integer with the colón symbol and thousands separator', () => {
    expect(fmt(850000)).toBe('₡ 850.000')
  })

  it('rounds decimals', () => {
    expect(fmt(1234.6)).toBe('₡ 1.235')
  })

  it('treats null, undefined and NaN as zero', () => {
    expect(fmt(null)).toBe('₡ 0')
    expect(fmt(undefined)).toBe('₡ 0')
    expect(fmt(Number('x'))).toBe('₡ 0')
  })
})

const VALID_ACTIVO = {
  num: 'AF-0001', nombre: 'Laptop', costo: '850000', fechaAdq: '2022-03-15',
  fechaUso: '2022-04-01', vidaUtil: '5', origen: 'Compra local', proveedor: 'Dell',
  area: 'Oficinas', tipo: 'Cómputo', serie: 'X1', modelo: 'M1', marca: 'Dell', factura: 'F-1',
}

describe('validateActivo', () => {
  it('returns no errors for a fully valid activo', () => {
    expect(validateActivo(VALID_ACTIVO)).toEqual({})
  })

  it('flags every missing required field', () => {
    const errors = validateActivo({})
    expect(errors.num).toBe('Campo obligatorio')
    expect(errors.nombre).toBe('Campo obligatorio')
    expect(Object.keys(errors)).toHaveLength(14)
  })

  it('rejects a cost of zero or less', () => {
    const errors = validateActivo({ ...VALID_ACTIVO, costo: '0' })
    expect(errors.costo).toBe('Debe ser mayor a cero')
  })

  it('rejects a negative vida util', () => {
    const errors = validateActivo({ ...VALID_ACTIVO, vidaUtil: '-1' })
    expect(errors.vidaUtil).toBe('No puede ser negativa')
  })

  it('accepts a vida util of zero (activo ya totalmente depreciado)', () => {
    const errors = validateActivo({ ...VALID_ACTIVO, vidaUtil: '0' })
    expect(errors.vidaUtil).toBeUndefined()
  })

  it('rejects a start-of-use date earlier than the acquisition date', () => {
    const errors = validateActivo({ ...VALID_ACTIVO, fechaAdq: '2022-04-01', fechaUso: '2022-03-15' })
    expect(errors.fechaUso).toBe('No puede ser anterior a la fecha de adquisición')
  })
})

describe('calcularDepreciacionPreview', () => {
  it('treats vida util 0 as already fully depreciated', () => {
    const preview = calcularDepreciacionPreview(850000, 0, '2022-04-01')
    expect(preview).toEqual({ dep: 850000, libros: 0, estado: 'Totalmente depreciado' })
  })

  it('returns null for a negative vida util', () => {
    expect(calcularDepreciacionPreview(850000, -1, '2022-04-01')).toBeNull()
  })
})

describe('validateRetiro', () => {
  it('returns no errors for a fully valid retiro', () => {
    const archivo = new File(['x'], 'c.pdf', { type: 'application/pdf' })
    expect(validateRetiro({
      activoNum: 'AF-0001', motivo: 'Venta', desc: 'detalle',
      fechaEfectiva: '2026-07-09', archivo,
    })).toEqual({})
  })

  it('requires activoNum, motivo, desc, fecha efectiva and a backup file', () => {
    const errors = validateRetiro({ activoNum: '', motivo: '', desc: '   ' })
    expect(errors).toEqual({
      activoNum: 'Selecciona un activo',
      motivo: 'Selecciona un motivo',
      desc: 'Ingresa una descripción',
      fechaEfectiva: 'Ingresa la fecha efectiva',
      archivo: 'Adjunta un archivo de respaldo',
    })
  })
})
