import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActivoFilters } from './ActivoFilters'

const BASE_PROPS = {
  search: '', area: '', tipo: '', areas: ['Bodega Central'], tipos: ['Equipo de cómputo'],
  onSearchChange: vi.fn(), onAreaChange: vi.fn(), onTipoChange: vi.fn(), onClear: vi.fn(),
}

describe('ActivoFilters', () => {
  it('calls onSearchChange as the user types', async () => {
    const onSearchChange = vi.fn()
    render(<ActivoFilters {...BASE_PROPS} onSearchChange={onSearchChange} />)
    await userEvent.type(screen.getByPlaceholderText('Buscar por número o nombre…'), 'dell')
    expect(onSearchChange).toHaveBeenCalledWith('d')
  })

  it('does not show the clear button when no filters are active', () => {
    render(<ActivoFilters {...BASE_PROPS} />)
    expect(screen.queryByText('✕ Limpiar filtros')).not.toBeInTheDocument()
  })

  it('shows and wires the clear button when a filter is active', async () => {
    const onClear = vi.fn()
    render(<ActivoFilters {...BASE_PROPS} search="dell" onClear={onClear} />)
    await userEvent.click(screen.getByText('✕ Limpiar filtros'))
    expect(onClear).toHaveBeenCalledTimes(1)
  })
})
