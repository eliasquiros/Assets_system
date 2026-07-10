import { describe, expect, it, vi } from 'vitest'
import { apiFetch } from './client'
import { login } from './auth'

vi.mock('./client')

describe('api/auth', () => {
  it('login POSTs credentials to /auth/login/', async () => {
    apiFetch.mockResolvedValue({
      token: 't1', empresa: 'Comercial Rivera S.A.',
      usuario: { nombre: 'Marcela Rivera S.', cargo: 'Contadora general', iniciales: 'MR' },
    })

    await login('mrivera', 'secreta123')

    expect(apiFetch).toHaveBeenCalledWith('/auth/login/', {
      method: 'POST',
      body: { usuario: 'mrivera', password: 'secreta123' },
    })
  })
})
