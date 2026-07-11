// Reportes feature: two report cards plus the view that composes them —
// grouped as one category file since none of these carry validation or
// state-machine logic beyond triggering a mutation and rendering its result.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuditoriaCard } from './AuditoriaCard'
import { FinancieroCard } from './FinancieroCard'
import { ReportesView } from './ReportesView'
import { useGenerarAuditoria, useGenerarFinanciero } from '../../hooks/useReportes'
import { useToast } from '../../context/ToastContext'

vi.mock('../../hooks/useReportes')
vi.mock('../../context/ToastContext')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AuditoriaCard', () => {
  it('generates the report and shows the resulting preview', async () => {
    const mutate = vi.fn()
    useToast.mockReturnValue({ showToast: vi.fn() })
    useGenerarAuditoria.mockReturnValue({
      mutate, isPending: false, isError: false,
      isSuccess: true, data: { activos: [{ num: 'AF-0001', nombre: 'Laptop Dell', libros: 255000 }], total: 1 },
    })

    render(<AuditoriaCard />)
    await userEvent.click(screen.getByText('Generar y exportar'))

    expect(mutate).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Reporte generado — 1 activos incluidos')).toBeInTheDocument()
    expect(screen.getByText('AF-0001')).toBeInTheDocument()
  })

  it('calls showToast when the export button is clicked', async () => {
    const showToast = vi.fn()
    useToast.mockReturnValue({ showToast })
    useGenerarAuditoria.mockReturnValue({
      mutate: vi.fn(), isPending: false, isError: false,
      isSuccess: true, data: { activos: [], total: 0 },
    })

    render(<AuditoriaCard />)
    await userEvent.click(screen.getByText('↓ Exportar reporte_auditoria.xlsx'))
    expect(showToast).toHaveBeenCalledWith('Exportado: reporte_auditoria.xlsx', 'success')
  })
})

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

describe('ReportesView', () => {
  it('renders both report cards', () => {
    useToast.mockReturnValue({ showToast: vi.fn() })
    useGenerarAuditoria.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false, isSuccess: false })
    useGenerarFinanciero.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false, isSuccess: false })

    render(<ReportesView />)
    expect(screen.getByText('Reporte de auditoría')).toBeInTheDocument()
    expect(screen.getByText('Reporte financiero')).toBeInTheDocument()
  })
})
