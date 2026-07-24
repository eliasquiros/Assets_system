import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { App } from './App'
import { me as meRequest } from './api/auth'

vi.mock('./api/auth')

vi.mock('./hooks/useActivos', () => ({
  useActivos: () => ({ data: [], isLoading: false, isError: false }),
  useActivo: () => ({ data: undefined, isLoading: false }),
  useMovimientos: () => ({ data: [] }),
  useCrearActivo: () => ({ mutateAsync: vi.fn() }),
  useEditarActivo: () => ({ mutateAsync: vi.fn() }),
}))
vi.mock('./hooks/useBajas', () => ({
  useBajas: () => ({ data: [], isLoading: false, isError: false }),
  useRegistrarBaja: () => ({ mutateAsync: vi.fn() }),
  useRevertirBaja: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))
vi.mock('./hooks/useReportes', () => ({
  useGenerarAuditoria: () => ({ mutate: vi.fn(), isPending: false, isError: false, isSuccess: false }),
  useGenerarFinanciero: () => ({ mutate: vi.fn(), isPending: false, isError: false, isSuccess: false }),
}))

const SESSION = { username: 'ana', empresa: 'Demo' }

describe('App', () => {
  it('redirects to /login when there is no session', async () => {
    meRequest.mockRejectedValue(new Error('401'))
    window.history.pushState({}, '', '/')
    render(<App />)
    expect(await screen.findByText('Ingresar')).toBeInTheDocument()
  })

  it('redirects "/" to the Activos tab once authenticated', async () => {
    meRequest.mockResolvedValue(SESSION)
    window.history.pushState({}, '', '/')
    render(<App />)
    expect(await screen.findByText('Activos fijos')).toBeInTheDocument()
  })

  it('renders the header with the session from AuthContext', async () => {
    meRequest.mockResolvedValue(SESSION)
    window.history.pushState({}, '', '/')
    render(<App />)
    expect(await screen.findByText('Acticr')).toBeInTheDocument()
    expect(screen.getByText('ana')).toBeInTheDocument()
  })

  it('navigates to the Reportes view', async () => {
    meRequest.mockResolvedValue(SESSION)
    window.history.pushState({}, '', '/reportes')
    render(<App />)
    expect(await screen.findByText('Reporte de auditoría')).toBeInTheDocument()
  })
})
