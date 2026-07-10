import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReportesView } from './ReportesView'
import { useGenerarAuditoria, useGenerarFinanciero } from '../../hooks/useReportes'

vi.mock('../../hooks/useReportes')
vi.mock('../../context/ToastContext', () => ({ useToast: () => ({ showToast: vi.fn() }) }))

describe('ReportesView', () => {
  it('renders both report cards', () => {
    useGenerarAuditoria.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false, isSuccess: false })
    useGenerarFinanciero.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false, isSuccess: false })

    render(<ReportesView />)
    expect(screen.getByText('Reporte de auditoría')).toBeInTheDocument()
    expect(screen.getByText('Reporte financiero')).toBeInTheDocument()
  })
})
