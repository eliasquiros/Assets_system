import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FinancieroCard } from './FinancieroCard'
import { useGenerarFinanciero } from '../../hooks/useReportes'
import { useToast } from '../../context/ToastContext'

vi.mock('../../hooks/useReportes')
vi.mock('../../context/ToastContext')

describe('FinancieroCard', () => {
  it('generates the report for the selected cutoff month', async () => {
    const mutate = vi.fn()
    useToast.mockReturnValue({ showToast: vi.fn() })
    useGenerarFinanciero.mockReturnValue({ mutate, isPending: false, isError: false, isSuccess: false })

    render(<FinancieroCard />)
    await userEvent.click(screen.getByText('Generar'))

    expect(mutate).toHaveBeenCalledWith('2026-06')
  })

  it('shows the totals row once the report is generated', () => {
    useToast.mockReturnValue({ showToast: vi.fn() })
    useGenerarFinanciero.mockReturnValue({
      mutate: vi.fn(), isPending: false, isError: false, isSuccess: true,
      data: { corte: '2026-06', activos: [{ num: 'AF-0001', nombre: 'Laptop Dell', libros: 255000, dep: 595000 }], totalLibros: 255000, totalDep: 595000 },
    })

    render(<FinancieroCard />)
    expect(screen.getByText('TOTAL VIGENTES (1)')).toBeInTheDocument()
    // libros and totalLibros are equal in this fixture, so the formatted amount appears twice (row + total).
    expect(screen.getAllByText('₡ 255.000')).toHaveLength(2)
  })
})
