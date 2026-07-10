import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RetiroModal } from './RetiroModal'
import { useActivos } from '../../hooks/useActivos'
import { useRegistrarBaja } from '../../hooks/useBajas'
import { useToast } from '../../context/ToastContext'

vi.mock('../../hooks/useActivos')
vi.mock('../../hooks/useBajas')
vi.mock('../../context/ToastContext')

describe('RetiroModal', () => {
  it('shows validation errors and does not submit when required fields are blank', async () => {
    const mutateAsync = vi.fn()
    const showToast = vi.fn()
    useActivos.mockReturnValue({ data: [{ num: 'AF-0001', nombre: 'Laptop Dell' }] })
    useRegistrarBaja.mockReturnValue({ mutateAsync })
    useToast.mockReturnValue({ showToast })

    render(<RetiroModal onClose={vi.fn()} />)
    await userEvent.click(screen.getByText('Registrar baja'))

    expect(mutateAsync).not.toHaveBeenCalled()
    expect(showToast).toHaveBeenCalledWith('Completa los campos requeridos', 'error')
    expect(screen.getByText('Selecciona un activo')).toBeInTheDocument()
  })

  it('submits the retiro and closes the modal on success', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 'BJ-2026-019' })
    const showToast = vi.fn()
    const onClose = vi.fn()
    useActivos.mockReturnValue({ data: [{ num: 'AF-0001', nombre: 'Laptop Dell' }] })
    useRegistrarBaja.mockReturnValue({ mutateAsync })
    useToast.mockReturnValue({ showToast })

    render(<RetiroModal onClose={onClose} />)
    await userEvent.selectOptions(screen.getByLabelText(/Activo a retirar/), 'AF-0001')
    await userEvent.selectOptions(screen.getByLabelText(/Motivo/), 'Venta')
    await userEvent.type(screen.getByRole('textbox', { name: /Descripción/ }), 'Venta a colaborador')
    await userEvent.click(screen.getByText('Registrar baja'))

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ activoNum: 'AF-0001', motivo: 'Venta', desc: 'Venta a colaborador' }))
    expect(showToast).toHaveBeenCalledWith('Retiro BJ-2026-019 registrado — pendiente en periodo de gracia', 'success')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
