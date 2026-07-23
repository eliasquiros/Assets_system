// Thin pass-through wrappers around apiFetch (activos, bajas, reportes, auth
// endpoints) — grouped here since each just asserts the path/method/body it
// forwards, with no logic of its own. apiFetch's own behavior (headers,
// error normalization) is covered separately in client.test.js.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, descargarArchivo } from './client'
import { crearActivo, editarActivo, listarActivos, obtenerActivo, obtenerMovimientos } from './activos'
import { listarBajas, registrarBaja, revertirBaja } from './bajas'
import { descargarReporteAuditoria, descargarReporteFinanciero } from './reportes'
import { login } from './auth'

vi.mock('./client')

beforeEach(() => {
  vi.clearAllMocks()
})

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

  it('crearActivo POSTs to /activos/crear/', async () => {
    apiFetch.mockResolvedValue({ num: 'AF-0001' })
    await crearActivo({ num: 'AF-0001' }, { token: 't1' })
    expect(apiFetch).toHaveBeenCalledWith('/activos/crear/', { method: 'POST', body: { num: 'AF-0001' }, token: 't1' })
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

describe('api/reportes', () => {
  it('descargarReporteAuditoria descarga el xlsx del año', async () => {
    descargarArchivo.mockResolvedValue(undefined)
    await descargarReporteAuditoria(2024)
    expect(descargarArchivo).toHaveBeenCalledWith(
      '/reportes/auditoria/?anio=2024', 'reporte_auditoria_2024.xlsx')
  })

  it('descargarReporteFinanciero descarga el xlsx del mes de corte', async () => {
    descargarArchivo.mockResolvedValue(undefined)
    await descargarReporteFinanciero('2026-06')
    expect(descargarArchivo).toHaveBeenCalledWith(
      '/reportes/financiero/?corte=2026-06', 'reporte_financiero_2026-06.xlsx')
  })
})

describe('api/auth', () => {
  it('login POSTs credentials to /auth/login/', async () => {
    apiFetch.mockResolvedValue({ username: 'mrivera', empresa: 'Comercial Rivera S.A.' })

    await login('mrivera', 'secreta123')

    expect(apiFetch).toHaveBeenCalledWith('/auth/login/', {
      method: 'POST',
      body: { usuario: 'mrivera', password: 'secreta123' },
    })
  })
})
