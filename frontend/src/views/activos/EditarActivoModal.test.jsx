import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { EditarActivoModal } from './EditarActivoModal'
import { useActivo, useEditarActivo } from '../../hooks/useActivos'
import { useToast } from '../../context/ToastContext'

vi.mock('../../hooks/useActivos')
vi.mock('../../context/ToastContext')

const ACTIVO = {
  num: 'AF-0001', nombre: 'Laptop Dell', costo: 850000, dep: 595000, area: 'Oficinas',
  tipo: 'Cómputo', fechaAdq: '2022-03-15', fechaUso: '2022-04-01', vidaUtil: 5,
  origen: 'Compra local', proveedor: 'Dell CR', serie: 'S1', modelo: 'M1', marca: 'Dell', factura: 'F-1',
}

function renderModal(onClose = vi.fn()) {
  return render(
    <MemoryRouter initialEntries={['/activos/AF-0001/editar']}>
      <Routes>
        <Route path="/activos/:num/editar" element={<EditarActivoModal onClose={onClose} />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('EditarActivoModal', () => {
  it('pre-fills the form with the fetched activo', () => {
    useActivo.mockReturnValue({ data: ACTIVO })
    useEditarActivo.mockReturnValue({ mutateAsync: vi.fn() })
    useToast.mockReturnValue({ showToast: vi.fn() })

    renderModal()
    expect(screen.getByDisplayValue('Laptop Dell')).toBeInTheDocument()
    expect(screen.getByDisplayValue('850000')).toBeInTheDocument()
  })

  it('submits the edited data and closes on success', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(ACTIVO)
    const showToast = vi.fn()
    const onClose = vi.fn()
    useActivo.mockReturnValue({ data: ACTIVO })
    useEditarActivo.mockReturnValue({ mutateAsync })
    useToast.mockReturnValue({ showToast })

    renderModal(onClose)
    await userEvent.click(screen.getByText('Guardar cambios'))

    expect(mutateAsync).toHaveBeenCalledWith({ num: 'AF-0001', datos: expect.objectContaining({ nombre: 'Laptop Dell' }) })
    expect(showToast).toHaveBeenCalledWith('Activo AF-0001 actualizado correctamente', 'success')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('blocks submission and shows a required-field error when a field is cleared', async () => {
    const mutateAsync = vi.fn()
    const showToast = vi.fn()
    const onClose = vi.fn()
    useActivo.mockReturnValue({ data: ACTIVO })
    useEditarActivo.mockReturnValue({ mutateAsync })
    useToast.mockReturnValue({ showToast })

    renderModal(onClose)
    await userEvent.clear(screen.getByDisplayValue('Laptop Dell'))
    await userEvent.click(screen.getByText('Guardar cambios'))

    expect(mutateAsync).not.toHaveBeenCalled()
    expect(showToast).toHaveBeenCalledWith('Revisa los campos marcados', 'error')
    expect(screen.getByText('Campo obligatorio')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('blocks submission and shows a "mayor a cero" error when costo is set to an invalid value', async () => {
    const mutateAsync = vi.fn()
    const showToast = vi.fn()
    const onClose = vi.fn()
    useActivo.mockReturnValue({ data: ACTIVO })
    useEditarActivo.mockReturnValue({ mutateAsync })
    useToast.mockReturnValue({ showToast })

    renderModal(onClose)
    const costoInput = screen.getByDisplayValue('850000')
    await userEvent.clear(costoInput)
    await userEvent.type(costoInput, '0')
    await userEvent.click(screen.getByText('Guardar cambios'))

    expect(mutateAsync).not.toHaveBeenCalled()
    expect(showToast).toHaveBeenCalledWith('Revisa los campos marcados', 'error')
    expect(screen.getByText('Debe ser mayor a cero')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })
})
