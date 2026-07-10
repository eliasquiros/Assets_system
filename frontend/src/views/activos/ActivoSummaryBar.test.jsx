import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActivoSummaryBar } from './ActivoSummaryBar'

const ACTIVOS = [
  { num: 'AF-0001', costo: 850000, libros: 255000 },
  { num: 'AF-0002', costo: 415000, libros: 277000 },
]

describe('ActivoSummaryBar', () => {
  it('shows the count and the summed totals for the given activos', () => {
    render(<ActivoSummaryBar label="Todos los activos" activos={ACTIVOS} />)
    expect(screen.getByText('Todos los activos')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('₡ 1.265.000')).toBeInTheDocument()
    expect(screen.getByText('₡ 532.000')).toBeInTheDocument()
  })
})
