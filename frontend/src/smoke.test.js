import { describe, expect, it } from 'vitest'

describe('tooling smoke test', () => {
  it('runs vitest with jsdom and globals', () => {
    expect(typeof document).toBe('object')
    expect(1 + 1).toBe(2)
  })
})
