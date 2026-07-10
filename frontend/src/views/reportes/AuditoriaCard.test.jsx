import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuditoriaCard } from './AuditoriaCard'
import { useGenerarAuditoria } from '../../hooks/useReportes'
import { useToast } from '../../context/ToastContext'

vi.mock('../../hooks/useReportes')
vi.mock('../../context/ToastContext')

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
