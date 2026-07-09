import { describe, expect, it, vi } from 'vitest'
import { apiFetch } from './client'
import { listarBajas, registrarBaja, revertirBaja } from './bajas'

vi.mock('./client')

describe('api/bajas', () => {
  it('listarBajas fetches /bajas/', async () => {
    apiFetch.mockResolvedValue([])
    await listarBajas({ token: 't1' })
    expect(apiFetch).toHaveBeenCalledWith('/bajas/', { token: 't1' })
  })

  it('registrarBaja POSTs the form data', async () => {
    const datos = { activoNum: 'AF-0001', motivo: 'Venta', desc: 'detalle' }
    apiFetch.mockResolvedValue({ id: 'BJ-2026-019' })
    await registrarBaja(datos, { token: 't1' })
    expect(apiFetch).toHaveBeenCalledWith('/bajas/', { method: 'POST', body: datos, token: 't1' })
  })

  it('revertirBaja POSTs to /bajas/{id}/revertir/', async () => {
    apiFetch.mockResolvedValue(null)
    await revertirBaja('BJ-2026-018', { token: 't1' })
    expect(apiFetch).toHaveBeenCalledWith('/bajas/BJ-2026-018/revertir/', { method: 'POST', token: 't1' })
  })
})
