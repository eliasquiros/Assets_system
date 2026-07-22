// Presentational pieces of the Activos feature (filters, summary bar, table,
// detail drawer) — grouped here since the deep coverage for this feature
// (form validation, loading/error state) already lives in
// CrearActivoModal.test.jsx, EditarActivoModal.test.jsx and
// ActivosView.test.jsx.
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ActivoFilters } from './ActivoFilters'
import { ActivoSummaryBar } from './ActivoSummaryBar'
import { ActivoTable } from './ActivoTable'
import { ActivoDetailDrawer } from './ActivoDetailDrawer'
import { useActivo, useMovimientos } from '../../hooks/useActivos'

vi.mock('../../hooks/useActivos')

const FILTERS_BASE_PROPS = {
  search: '', area: '', tipo: '', areas: ['Bodega Central'], tipos: ['Equipo de cómputo'],
  onSearchChange: vi.fn(), onAreaChange: vi.fn(), onTipoChange: vi.fn(), onClear: vi.fn(),
}

describe('ActivoFilters', () => {
  it('calls onSearchChange as the user types', async () => {
    const onSearchChange = vi.fn()
    render(<ActivoFilters {...FILTERS_BASE_PROPS} onSearchChange={onSearchChange} />)
    await userEvent.type(screen.getByPlaceholderText('Buscar por número o nombre…'), 'dell')
    expect(onSearchChange).toHaveBeenCalledWith('d')
  })

  it('does not show the clear button when no filters are active', () => {
    render(<ActivoFilters {...FILTERS_BASE_PROPS} />)
    expect(screen.queryByText('✕ Limpiar filtros')).not.toBeInTheDocument()
  })

  it('shows and wires the clear button when a filter is active', async () => {
    const onClear = vi.fn()
    render(<ActivoFilters {...FILTERS_BASE_PROPS} search="dell" onClear={onClear} />)
    await userEvent.click(screen.getByText('✕ Limpiar filtros'))
    expect(onClear).toHaveBeenCalledTimes(1)
  })
})

describe('ActivoSummaryBar', () => {
  it('shows the count and the summed totals for the given activos', () => {
    const activos = [
      { num: 'AF-0001', costo: 850000, libros: 255000 },
      { num: 'AF-0002', costo: 415000, libros: 277000 },
    ]
    render(<ActivoSummaryBar label="Todos los activos" activos={activos} />)
    expect(screen.getByText('Todos los activos')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('₡ 1.265.000')).toBeInTheDocument()
    expect(screen.getByText('₡ 532.000')).toBeInTheDocument()
  })
})

describe('ActivoTable', () => {
  const ACTIVOS = [
    { num: 'AF-0001', nombre: 'Laptop Dell', area: 'Oficinas', tipo: 'Cómputo', costo: 850000, libros: 255000, dep: 595000, estado: 'Depreciando', fechaAdq: '2022-03-15' },
  ]

  function renderTable(props) {
    return render(<MemoryRouter><ActivoTable isLoading={false} isError={false} activos={[]} {...props} /></MemoryRouter>)
  }

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

describe('ActivoDetailDrawer', () => {
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
    // El monto en el drawer trae espacio no separable (money) y zero-width
    // spaces tras cada punto (moneyWrap): se ignoran al comparar el texto.
    const limpio = (t) => t.replace(/[ ​]/g, (c) => (c === ' ' ? ' ' : ''))
    expect(screen.getByText((content) => limpio(content) === '₡ 255.000')).toBeInTheDocument()
    expect(screen.getByText('Alta / Registro inicial')).toBeInTheDocument()
    expect(screen.getByText('Registro inicial del activo')).toBeInTheDocument()
  })
})
