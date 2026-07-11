import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CrearActivoModal } from './CrearActivoModal'
import { useCrearActivo } from '../../hooks/useActivos'
import { useToast } from '../../context/ToastContext'

vi.mock('../../hooks/useActivos')
vi.mock('../../context/ToastContext')

describe('CrearActivoModal', () => {
  it('shows validation errors and does not submit when required fields are blank', async () => {
    const mutateAsync = vi.fn()
    const showToast = vi.fn()
    useCrearActivo.mockReturnValue({ mutateAsync })
    useToast.mockReturnValue({ showToast })

    render(<CrearActivoModal onClose={vi.fn()} />)
    await userEvent.click(screen.getByText('Guardar activo'))

    expect(mutateAsync).not.toHaveBeenCalled()
    expect(showToast).toHaveBeenCalledWith('Faltan campos obligatorios', 'error')
    expect(screen.getAllByText('Campo obligatorio').length).toBeGreaterThan(0)
  })

  it('submits the form and closes the modal when all fields are valid', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ num: 'AF-0019' })
    const showToast = vi.fn()
    const onClose = vi.fn()
    useCrearActivo.mockReturnValue({ mutateAsync })
    useToast.mockReturnValue({ showToast })

    render(<CrearActivoModal onClose={onClose} />)
    await userEvent.type(screen.getByPlaceholderText('AF-0000'), 'AF-0019')
    await userEvent.type(screen.getByPlaceholderText('Ej. Computadora portátil…'), 'Monitor 27"')
    await userEvent.type(screen.getByPlaceholderText('0'), '250000')
    await userEvent.type(screen.getByPlaceholderText('5'), '5')
    await userEvent.type(screen.getByPlaceholderText('Compra local'), 'Compra local')
    await userEvent.type(screen.getByPlaceholderText('Nombre del proveedor'), 'PC Store')
    await userEvent.type(screen.getByPlaceholderText('Bodega Central'), 'Bodega Central')
    await userEvent.type(screen.getByPlaceholderText('Equipo de cómputo'), 'Equipo de cómputo')
    await userEvent.type(screen.getByPlaceholderText('N.º de serie'), 'S1')
    await userEvent.type(screen.getByPlaceholderText('Modelo'), 'M1')
    await userEvent.type(screen.getByPlaceholderText('Marca'), 'Dell')
    await userEvent.type(screen.getByPlaceholderText('F-0000'), 'F-1')
    const [fechaAdq, fechaUso] = screen.getAllByDisplayValue('')
    await userEvent.type(fechaAdq, '2026-01-01')
    await userEvent.type(fechaUso, '2026-01-05')

    await userEvent.click(screen.getByText('Guardar activo'))

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ num: 'AF-0019', costo: 250000, vidaUtil: 5 }))
    expect(showToast).toHaveBeenCalledWith('Activo AF-0019 registrado correctamente', 'success')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('blocks submission and shows a "mayor a cero" error when costo is not positive', async () => {
    const mutateAsync = vi.fn()
    const showToast = vi.fn()
    const onClose = vi.fn()
    useCrearActivo.mockReturnValue({ mutateAsync })
    useToast.mockReturnValue({ showToast })

    render(<CrearActivoModal onClose={onClose} />)
    await userEvent.type(screen.getByPlaceholderText('AF-0000'), 'AF-0019')
    await userEvent.type(screen.getByPlaceholderText('Ej. Computadora portátil…'), 'Monitor 27"')
    await userEvent.type(screen.getByPlaceholderText('0'), '0')
    await userEvent.type(screen.getByPlaceholderText('5'), '5')
    await userEvent.type(screen.getByPlaceholderText('Compra local'), 'Compra local')
    await userEvent.type(screen.getByPlaceholderText('Nombre del proveedor'), 'PC Store')
    await userEvent.type(screen.getByPlaceholderText('Bodega Central'), 'Bodega Central')
    await userEvent.type(screen.getByPlaceholderText('Equipo de cómputo'), 'Equipo de cómputo')
    await userEvent.type(screen.getByPlaceholderText('N.º de serie'), 'S1')
    await userEvent.type(screen.getByPlaceholderText('Modelo'), 'M1')
    await userEvent.type(screen.getByPlaceholderText('Marca'), 'Dell')
    await userEvent.type(screen.getByPlaceholderText('F-0000'), 'F-1')
    const [fechaAdq, fechaUso] = screen.getAllByDisplayValue('')
    await userEvent.type(fechaAdq, '2026-01-01')
    await userEvent.type(fechaUso, '2026-01-05')

    await userEvent.click(screen.getByText('Guardar activo'))

    expect(mutateAsync).not.toHaveBeenCalled()
    expect(showToast).toHaveBeenCalledWith('Faltan campos obligatorios', 'error')
    expect(screen.getByText('Debe ser mayor a cero')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('blocks submission and shows a date-order error when fechaUso is before fechaAdq', async () => {
    const mutateAsync = vi.fn()
    const showToast = vi.fn()
    const onClose = vi.fn()
    useCrearActivo.mockReturnValue({ mutateAsync })
    useToast.mockReturnValue({ showToast })

    render(<CrearActivoModal onClose={onClose} />)
    await userEvent.type(screen.getByPlaceholderText('AF-0000'), 'AF-0019')
    await userEvent.type(screen.getByPlaceholderText('Ej. Computadora portátil…'), 'Monitor 27"')
    await userEvent.type(screen.getByPlaceholderText('0'), '250000')
    await userEvent.type(screen.getByPlaceholderText('5'), '5')
    await userEvent.type(screen.getByPlaceholderText('Compra local'), 'Compra local')
    await userEvent.type(screen.getByPlaceholderText('Nombre del proveedor'), 'PC Store')
    await userEvent.type(screen.getByPlaceholderText('Bodega Central'), 'Bodega Central')
    await userEvent.type(screen.getByPlaceholderText('Equipo de cómputo'), 'Equipo de cómputo')
    await userEvent.type(screen.getByPlaceholderText('N.º de serie'), 'S1')
    await userEvent.type(screen.getByPlaceholderText('Modelo'), 'M1')
    await userEvent.type(screen.getByPlaceholderText('Marca'), 'Dell')
    await userEvent.type(screen.getByPlaceholderText('F-0000'), 'F-1')
    const [fechaAdq, fechaUso] = screen.getAllByDisplayValue('')
    await userEvent.type(fechaAdq, '2026-01-10')
    await userEvent.type(fechaUso, '2026-01-05')

    await userEvent.click(screen.getByText('Guardar activo'))

    expect(mutateAsync).not.toHaveBeenCalled()
    expect(showToast).toHaveBeenCalledWith('Faltan campos obligatorios', 'error')
    expect(screen.getByText('No puede ser anterior a la fecha de adquisición')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })
})
