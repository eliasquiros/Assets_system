import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ActivoTable } from './ActivoTable'

const ACTIVOS = [
  { num: 'AF-0001', nombre: 'Laptop Dell', area: 'Oficinas', tipo: 'Cómputo', costo: 850000, libros: 255000, dep: 595000, estado: 'Depreciando', fechaAdq: '2022-03-15' },
]

function renderTable(props) {
  return render(<MemoryRouter><ActivoTable isLoading={false} isError={false} activos={[]} {...props} /></MemoryRouter>)
}

describe('ActivoTable', () => {
  it('shows a spinner while loading', () => {
    renderTable({ isLoading: true })
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows a connection error message on error', () => {
    renderTable({ isError: true })
    expect(screen.getByText('No se pudo conectar con el servidor.')).toBeInTheDocument()
  })

  it('shows an empty state when there are no activos', () => {
    renderTable({ activos: [] })
    expect(screen.getByText('No se encontraron activos con los filtros actuales.')).toBeInTheDocument()
  })

  it('renders a row per activo with formatted values', () => {
    renderTable({ activos: ACTIVOS })
    expect(screen.getByText('AF-0001')).toBeInTheDocument()
    expect(screen.getByText('Laptop Dell')).toBeInTheDocument()
    expect(screen.getByText('₡ 850.000')).toBeInTheDocument()
    expect(screen.getByText('15/03/2022')).toBeInTheDocument()
    expect(screen.getByText('Depreciando')).toBeInTheDocument()
  })
})
