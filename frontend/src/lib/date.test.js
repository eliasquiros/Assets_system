import { describe, expect, it } from 'vitest'
import { fmtDate, fmtRemaining } from './date'

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
