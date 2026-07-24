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
  it('descarga el reporte del año seleccionado', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    const showToast = vi.fn()
    useToast.mockReturnValue({ showToast })
    useGenerarAuditoria.mockReturnValue({ mutateAsync, isPending: false, isError: false })

    render(<AuditoriaCard />)
    const anioActual = new Date().getFullYear()
    await userEvent.selectOptions(screen.getByLabelText('Año del reporte'), String(anioActual - 1))
    await userEvent.click(screen.getByText('Generar y descargar'))

    expect(mutateAsync).toHaveBeenCalledWith(anioActual - 1)
    expect(showToast).toHaveBeenCalledWith(`Reporte de auditoría ${anioActual - 1} descargado`, 'success')
  })
})

describe('FinancieroCard', () => {
  it('descarga el reporte del mes de corte seleccionado', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    const showToast = vi.fn()
    useToast.mockReturnValue({ showToast })
    useGenerarFinanciero.mockReturnValue({ mutateAsync, isPending: false, isError: false })

    render(<FinancieroCard />)
    await userEvent.selectOptions(screen.getByLabelText('Mes de corte'), '2026-03')
    await userEvent.click(screen.getByText('Generar y descargar'))

    expect(mutateAsync).toHaveBeenCalledWith('2026-03')
    expect(showToast).toHaveBeenCalledWith('Reporte financiero — marzo 2026 descargado', 'success')
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
