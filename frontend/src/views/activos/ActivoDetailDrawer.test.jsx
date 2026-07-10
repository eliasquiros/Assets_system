import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ActivoDetailDrawer } from './ActivoDetailDrawer'
import { useActivo, useMovimientos } from '../../hooks/useActivos'

vi.mock('../../hooks/useActivos')

const ACTIVO = {
  num: 'AF-0001', nombre: 'Laptop Dell', estado: 'Depreciando', costo: 850000, libros: 255000, dep: 595000,
  area: 'Oficinas', tipo: 'Cómputo', fechaAdq: '2022-03-15', fechaUso: '2022-04-01',
}
const MOVIMIENTOS = [{ tipo: 'Alta / Registro inicial', fecha: '2022-03-15', desc: 'Registro inicial del activo', prev: '—', next: '₡ 850.000', user: 'C. Jiménez' }]

function renderDrawer() {
  return render(
    <MemoryRouter initialEntries={['/activos/AF-0001']}>
      <Routes>
        <Route path="/activos/:num" element={<ActivoDetailDrawer onClose={vi.fn()} />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ActivoDetailDrawer', () => {
  it('shows a spinner while the activo is loading', () => {
    useActivo.mockReturnValue({ data: undefined, isLoading: true })
    useMovimientos.mockReturnValue({ data: undefined })
    renderDrawer()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows the activo values and its movement history once loaded', () => {
    useActivo.mockReturnValue({ data: ACTIVO, isLoading: false })
    useMovimientos.mockReturnValue({ data: MOVIMIENTOS })
    renderDrawer()
    expect(screen.getByText('Laptop Dell')).toBeInTheDocument()
    expect(screen.getByText('₡ 255.000')).toBeInTheDocument()
    expect(screen.getByText('Alta / Registro inicial')).toBeInTheDocument()
    expect(screen.getByText('Registro inicial del activo')).toBeInTheDocument()
  })
})
