import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { App } from './App'

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

const SESSION = {
  token: 't1', empresa: 'Comercial Rivera S.A.',
  usuario: { nombre: 'Marcela Rivera S.', cargo: 'Contadora general', iniciales: 'MR' },
}

describe('App', () => {
  beforeEach(() => localStorage.clear())

  it('redirects to /login when there is no session', () => {
    window.history.pushState({}, '', '/')
    render(<App />)
    expect(screen.getByText('Ingresar')).toBeInTheDocument()
  })

  it('redirects "/" to the Activos tab once authenticated', () => {
    localStorage.setItem('af_session', JSON.stringify(SESSION))
    window.history.pushState({}, '', '/')
    render(<App />)
    expect(screen.getByText('Activos fijos')).toBeInTheDocument()
  })

  it('renders the header with the session from AuthContext', () => {
    localStorage.setItem('af_session', JSON.stringify(SESSION))
    window.history.pushState({}, '', '/')
    render(<App />)
    expect(screen.getByText('Sistema de Activos Fijos')).toBeInTheDocument()
    expect(screen.getByText('Marcela Rivera S.')).toBeInTheDocument()
  })

  it('navigates to the Reportes view', () => {
    localStorage.setItem('af_session', JSON.stringify(SESSION))
    window.history.pushState({}, '', '/reportes')
    render(<App />)
    expect(screen.getByText('Reporte de auditoría')).toBeInTheDocument()
  })
})
