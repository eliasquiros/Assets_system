import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ActivosView } from './ActivosView'
import { useActivos } from '../../hooks/useActivos'

vi.mock('../../hooks/useActivos')
vi.mock('../../context/ToastContext', () => ({ useToast: () => ({ showToast: vi.fn() }) }))

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/activos/*" element={<ActivosView />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ActivosView', () => {
  it('shows the table in a loading state while the query is pending', () => {
    useActivos.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    renderAt('/activos')
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows a connection error when the query fails', () => {
    useActivos.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    renderAt('/activos')
    expect(screen.getByText('No se pudo conectar con el servidor.')).toBeInTheDocument()
  })

  it('renders the fetched activos once the query succeeds', () => {
    useActivos.mockReturnValue({
      data: [{ num: 'AF-0001', nombre: 'Laptop Dell', area: 'Oficinas', tipo: 'Cómputo', costo: 850000, libros: 255000, dep: 595000, estado: 'Depreciando', fechaAdq: '2022-03-15' }],
      isLoading: false, isError: false,
    })
    renderAt('/activos')
    expect(screen.getByText('AF-0001')).toBeInTheDocument()
    expect(screen.getByText('Todos los activos')).toBeInTheDocument()
  })

  it('opens the CrearActivoModal at /activos/nuevo', () => {
    useActivos.mockReturnValue({ data: [], isLoading: false, isError: false })
    renderAt('/activos/nuevo')
    expect(screen.getByText('Registrar nuevo activo')).toBeInTheDocument()
  })
})
