import { describe, expect, it, vi } from 'vitest'
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

describe('App', () => {
  it('redirects "/" to the Activos tab by default', () => {
    window.history.pushState({}, '', '/')
    render(<App />)
    expect(screen.getByText('Activos fijos')).toBeInTheDocument()
  })

  it('renders the header with the session from AuthContext', () => {
    window.history.pushState({}, '', '/')
    render(<App />)
    expect(screen.getByText('Sistema de Activos Fijos')).toBeInTheDocument()
    expect(screen.getByText('Marcela Rivera S.')).toBeInTheDocument()
  })

  it('navigates to the Reportes view', () => {
    window.history.pushState({}, '', '/reportes')
    render(<App />)
    expect(screen.getByText('Reporte de auditoría')).toBeInTheDocument()
  })
})
