import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { EditarActivoModal } from './EditarActivoModal'
import { useActivo, useEditarActivo } from '../../hooks/useActivos'
import { useCatalogo, useCrearCatalogo } from '../../hooks/useCatalogos'
import { useToast } from '../../context/ToastContext'

vi.mock('../../hooks/useActivos')
vi.mock('../../hooks/useCatalogos')
vi.mock('../../context/ToastContext')

const ACTIVO = {
  num: 'AF-0001', nombre: 'Laptop Dell', costo: 850000, dep: 595000, libros: 255000,
  estado: 'Depreciando', area: 'Oficinas', tipo: 'Cómputo',
  fechaAdq: '2022-03-15', fechaUso: '2022-04-01', vidaUtil: 5,
  origen: 'Compra local', proveedor: 'Dell CR', serie: 'S1', modelo: '', marca: '', factura: 'F-1',
  detalle: 'Oficina de gerencia, a cargo de Juan Pérez',
  version: 2, categoriaId: 1, localizacionId: 1, proveedorId: 1,
  marcaId: null, modeloId: null, origenId: 1,
}

beforeEach(() => {
  useCatalogo.mockReturnValue({
    data: [{ id: 1, nombre: 'Cómputo' }, { id: 2, nombre: 'Mobiliario' }],
    isLoading: false,
  })
  useCrearCatalogo.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
})

function renderModal(onClose = vi.fn()) {
  return render(
    <MemoryRouter initialEntries={['/activos/AF-0001/editar']}>
      <Routes>
        <Route path="/activos/:num/editar" element={<EditarActivoModal onClose={onClose} />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('EditarActivoModal', () => {
  it('precarga el formulario con el activo obtenido', () => {
    useActivo.mockReturnValue({ data: ACTIVO })
    useEditarActivo.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
    useToast.mockReturnValue({ showToast: vi.fn() })
    renderModal()
    expect(screen.getByDisplayValue('Laptop Dell')).toBeInTheDocument()
    expect(screen.getByDisplayValue('850000')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Oficina de gerencia, a cargo de Juan Pérez')).toBeInTheDocument()
  })

  it('envía IDs de catálogo + version y no reenvía dep/libros/estado', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(ACTIVO)
    const onClose = vi.fn()
    useActivo.mockReturnValue({ data: ACTIVO })
    useEditarActivo.mockReturnValue({ mutateAsync, isPending: false })
    useToast.mockReturnValue({ showToast: vi.fn() })
    renderModal(onClose)
    await userEvent.click(screen.getByText('Guardar cambios'))
    const [{ num, datos }] = mutateAsync.mock.calls[0]
    expect(num).toBe('AF-0001')
    expect(datos).toMatchObject({
      nombre: 'Laptop Dell', version: 2, categoria: 1,
      detalle: 'Oficina de gerencia, a cargo de Juan Pérez',
    })
    expect(datos).not.toHaveProperty('libros')
    expect(datos).not.toHaveProperty('dep')
    expect(datos).not.toHaveProperty('estado')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('permite vaciar el detalle adicional: se envía como null', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(ACTIVO)
    useActivo.mockReturnValue({ data: ACTIVO })
    useEditarActivo.mockReturnValue({ mutateAsync, isPending: false })
    useToast.mockReturnValue({ showToast: vi.fn() })
    renderModal()
    await userEvent.clear(screen.getByDisplayValue('Oficina de gerencia, a cargo de Juan Pérez'))
    await userEvent.click(screen.getByText('Guardar cambios'))
    const [{ datos }] = mutateAsync.mock.calls[0]
    expect(datos.detalle).toBeNull()
  })

  it('muestra el mensaje de conflicto (409) y no cierra', async () => {
    const err = Object.assign(new Error('El activo fue modificado por otra persona.'), { status: 409 })
    const mutateAsync = vi.fn().mockRejectedValue(err)
    const showToast = vi.fn()
    const onClose = vi.fn()
    useActivo.mockReturnValue({ data: ACTIVO })
    useEditarActivo.mockReturnValue({ mutateAsync, isPending: false })
    useToast.mockReturnValue({ showToast })
    renderModal(onClose)
    await userEvent.click(screen.getByText('Guardar cambios'))
    expect(showToast).toHaveBeenCalledWith(err.message, 'error')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('bloquea el guardado y marca error cuando se vacía un campo obligatorio', async () => {
    const mutateAsync = vi.fn()
    useActivo.mockReturnValue({ data: ACTIVO })
    useEditarActivo.mockReturnValue({ mutateAsync, isPending: false })
    useToast.mockReturnValue({ showToast: vi.fn() })
    renderModal()
    await userEvent.clear(screen.getByDisplayValue('Laptop Dell'))
    await userEvent.click(screen.getByText('Guardar cambios'))
    expect(mutateAsync).not.toHaveBeenCalled()
    expect(screen.getByText('Campo obligatorio')).toBeInTheDocument()
  })
})
