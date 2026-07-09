import { describe, expect, it, vi } from 'vitest'
import { apiFetch } from './client'
import { crearActivo, editarActivo, listarActivos, obtenerActivo, obtenerMovimientos } from './activos'

vi.mock('./client')

describe('api/activos', () => {
  it('listarActivos builds the query string from active filters and forwards the token', async () => {
    apiFetch.mockResolvedValue([])
    await listarActivos({ search: 'dell', area: 'Bodega Central', tipo: '', token: 't1' })
    expect(apiFetch).toHaveBeenCalledWith('/activos/?search=dell&area=Bodega+Central', { token: 't1' })
  })

  it('listarActivos omits the query string when there are no filters', async () => {
    apiFetch.mockResolvedValue([])
    await listarActivos({ token: 't1' })
    expect(apiFetch).toHaveBeenCalledWith('/activos/', { token: 't1' })
  })

  it('crearActivo POSTs to /activos/', async () => {
    apiFetch.mockResolvedValue({ num: 'AF-0001' })
    await crearActivo({ num: 'AF-0001' }, { token: 't1' })
    expect(apiFetch).toHaveBeenCalledWith('/activos/', { method: 'POST', body: { num: 'AF-0001' }, token: 't1' })
  })

  it('editarActivo PATCHes /activos/{num}/', async () => {
    apiFetch.mockResolvedValue({ num: 'AF-0001' })
    await editarActivo('AF-0001', { nombre: 'x' }, { token: 't1' })
    expect(apiFetch).toHaveBeenCalledWith('/activos/AF-0001/', { method: 'PATCH', body: { nombre: 'x' }, token: 't1' })
  })

  it('obtenerActivo and obtenerMovimientos fetch the expected paths', async () => {
    apiFetch.mockResolvedValue({})
    await obtenerActivo('AF-0001', { token: 't1' })
    await obtenerMovimientos('AF-0001', { token: 't1' })
    expect(apiFetch).toHaveBeenCalledWith('/activos/AF-0001/', { token: 't1' })
    expect(apiFetch).toHaveBeenCalledWith('/activos/AF-0001/movimientos/', { token: 't1' })
  })
})
