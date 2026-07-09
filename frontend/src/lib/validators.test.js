import { describe, expect, it } from 'vitest'
import { validateActivo, validateRetiro } from './validators'

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

  it('rejects a vida util of zero or less', () => {
    const errors = validateActivo({ ...VALID_ACTIVO, vidaUtil: '-1' })
    expect(errors.vidaUtil).toBe('Debe ser mayor a cero')
  })

  it('rejects a start-of-use date earlier than the acquisition date', () => {
    const errors = validateActivo({ ...VALID_ACTIVO, fechaAdq: '2022-04-01', fechaUso: '2022-03-15' })
    expect(errors.fechaUso).toBe('No puede ser anterior a la fecha de adquisición')
  })
})

describe('validateRetiro', () => {
  it('returns no errors for a fully valid retiro', () => {
    expect(validateRetiro({ activoNum: 'AF-0001', motivo: 'Venta', desc: 'detalle' })).toEqual({})
  })

  it('requires activoNum, motivo and a non-blank desc', () => {
    const errors = validateRetiro({ activoNum: '', motivo: '', desc: '   ' })
    expect(errors).toEqual({
      activoNum: 'Selecciona un activo',
      motivo: 'Selecciona un motivo',
      desc: 'Ingresa una descripción',
    })
  })
})
