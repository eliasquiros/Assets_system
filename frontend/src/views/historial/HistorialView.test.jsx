import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { HistorialView } from './HistorialView'
import { useBajas } from '../../hooks/useBajas'

vi.mock('../../hooks/useBajas')
vi.mock('../../hooks/useActivos', () => ({ useActivos: () => ({ data: [] }) }))
vi.mock('../../context/ToastContext', () => ({ useToast: () => ({ showToast: vi.fn() }) }))

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/historial/*" element={<HistorialView />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('HistorialView', () => {
  it('shows the list in a loading state while the query is pending', () => {
    useBajas.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    renderAt('/historial')
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows a connection error when the query fails', () => {
    useBajas.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    renderAt('/historial')
    expect(screen.getByText('No se pudo conectar con el servidor.')).toBeInTheDocument()
  })

  it('renders one BajaCard per baja', () => {
    useBajas.mockReturnValue({
      data: [
        { id: 'BJ-2026-018', activoNum: 'AF-0031', activoNombre: 'Laptop HP', motivo: 'Desecho u obsolescencia', desc: 'x', fechaEfectiva: '2026-07-09', fechaRegistro: '2026-07-09', user: 'J. Mora', estado: 'Pendiente', venceTs: Date.now() + 3600000 },
      ],
      isLoading: false, isError: false,
    })
    renderAt('/historial')
    expect(screen.getByText('Laptop HP')).toBeInTheDocument()
  })

  it('shows an empty state when there are no bajas registered', () => {
    useBajas.mockReturnValue({ data: [], isLoading: false, isError: false })
    renderAt('/historial')
    expect(screen.getByText('No hay retiros o bajas registrados.')).toBeInTheDocument()
  })

  it('opens the RetiroModal at /historial/nueva', () => {
    useBajas.mockReturnValue({ data: [], isLoading: false, isError: false })
    renderAt('/historial/nueva')
    expect(screen.getByText('Registrar retiro / baja de activo')).toBeInTheDocument()
  })
})
