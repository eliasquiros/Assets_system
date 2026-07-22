import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CatalogSelect } from './CatalogSelect'
import { useCatalogo, useCrearCatalogo } from '../hooks/useCatalogos'
import { useToast } from '../context/ToastContext'

vi.mock('../hooks/useCatalogos')
vi.mock('../context/ToastContext')

beforeEach(() => {
  vi.clearAllMocks()
  useCatalogo.mockReturnValue({ data: [{ id: 1, nombre: 'Dell' }], isLoading: false })
  useToast.mockReturnValue({ showToast: vi.fn() })
})

describe('CatalogSelect', () => {
  it('lista las opciones del catálogo', () => {
    useCrearCatalogo.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
    render(<CatalogSelect tipo="marcas" label="Marca" value="" onChange={vi.fn()} />)
    expect(screen.getByRole('option', { name: 'Dell' })).toBeInTheDocument()
  })

  it('crea una opción con "+ Nuevo" y la autoselecciona', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 9, nombre: 'Nueva' })
    useCrearCatalogo.mockReturnValue({ mutateAsync, isPending: false })
    const onChange = vi.fn()
    render(
      <CatalogSelect tipo="marcas" label="Marca" value="" onChange={onChange}
        camposNuevo={[{ key: 'nombre', label: 'Nombre' }]} payloadExtra={{ activa: true }} />
    )

    await userEvent.click(screen.getByText('+ Nuevo marca'))
    await userEvent.type(screen.getByPlaceholderText('Nombre'), 'Nueva')
    await userEvent.click(screen.getByText('Guardar'))

    expect(mutateAsync).toHaveBeenCalledWith({ nombre: 'Nueva', activa: true })
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('9'))
  })

  it('no ofrece "+ Nuevo" cuando no se pasan camposNuevo (catálogo fijo)', () => {
    useCrearCatalogo.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
    render(<CatalogSelect tipo="origenes" label="Origen" value="" onChange={vi.fn()} />)
    expect(screen.queryByText(/\+ Nuevo/)).not.toBeInTheDocument()
  })
})
