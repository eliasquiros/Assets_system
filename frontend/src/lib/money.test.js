import { describe, expect, it } from 'vitest'
import { money } from './money'

describe('money', () => {
  it('formats a positive integer with the colón symbol and thousands separator', () => {
    expect(money(850000)).toBe('₡ 850.000')
  })

  it('rounds decimals', () => {
    expect(money(1234.6)).toBe('₡ 1.235')
  })

  it('treats null, undefined and NaN as zero', () => {
    expect(money(null)).toBe('₡ 0')
    expect(money(undefined)).toBe('₡ 0')
    expect(money(Number('x'))).toBe('₡ 0')
  })
})
