import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CrearActivoModal } from './CrearActivoModal'
import { useCrearActivo } from '../../hooks/useActivos'
import { useToast } from '../../context/ToastContext'
import { useCatalogo, useCrearCatalogo } from '../../hooks/useCatalogos'
import { siguienteNumero } from '../../api/catalogos'

vi.mock('../../hooks/useActivos')
vi.mock('../../context/ToastContext')
vi.mock('../../hooks/useCatalogos')
vi.mock('../../api/catalogos')

const CATALOGOS = {
  categorias: [{ id: 1, nombre: 'Software' }],
  localizaciones: [{ id: 2, nombre: 'Centro de datos' }],
  marcas: [{ id: 3, nombre: 'Dell' }],
  modelos: [{ id: 4, nombre: 'Latitude 5540' }],
  proveedores: [{ id: 5, nombre: 'Proveedor X' }],
  origenes: [{ id: 6, nombre: 'Dentro de inversión' }],
}

let mutateAsync, showToast

beforeEach(() => {
  vi.clearAllMocks()
  mutateAsync = vi.fn().mockResolvedValue({ num: 'SOF-0001' })
  showToast = vi.fn()
  useCrearActivo.mockReturnValue({ mutateAsync, isPending: false })
  useToast.mockReturnValue({ showToast })
  useCatalogo.mockImplementation((tipo) => ({ data: CATALOGOS[tipo] || [], isLoading: false }))
  useCrearCatalogo.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
  siguienteNumero.mockResolvedValue({ numero: 'SOF-0001' })
})

async function llenarActivo() {
  await userEvent.selectOptions(screen.getByLabelText('Categoría'), '1')
  await waitFor(() => expect(screen.getByPlaceholderText('Se genera al elegir categoría')).toHaveValue('SOF-0001'))
  await userEvent.type(screen.getByPlaceholderText('Ej. Computadora portátil…'), 'Servidor')
  await userEvent.type(screen.getByLabelText(/Costo original/), '500000')
  await userEvent.type(screen.getByLabelText(/Fecha de adquisición/), '2024-01-10')
  await userEvent.type(screen.getByLabelText(/Fecha de inicio de uso/), '2024-01-15')
  await userEvent.type(screen.getByPlaceholderText('N.º de serie'), 'SN-1')
  await userEvent.type(screen.getByPlaceholderText('F-0000'), 'F-1')
  await userEvent.selectOptions(screen.getByLabelText('Área'), '2')
  await userEvent.selectOptions(screen.getByLabelText('Marca'), '3')
  await userEvent.selectOptions(screen.getByLabelText('Modelo'), '4')
  await userEvent.selectOptions(screen.getByLabelText('Proveedor'), '5')
  await userEvent.selectOptions(screen.getByLabelText('Origen'), '6')
}

describe('CrearActivoModal', () => {
  it('no envía y muestra errores cuando faltan campos obligatorios', async () => {
    render(<CrearActivoModal onClose={vi.fn()} />)
    await userEvent.click(screen.getByText('Guardar activo'))

    expect(mutateAsync).not.toHaveBeenCalled()
    expect(showToast).toHaveBeenCalledWith('Revisa los campos obligatorios', 'error')
    expect(screen.getAllByText('Campo obligatorio').length).toBeGreaterThan(0)
  })

  it('precarga el número sugerido al elegir categoría y avisa si se cambia', async () => {
    render(<CrearActivoModal onClose={vi.fn()} />)
    await userEvent.selectOptions(screen.getByLabelText('Categoría'), '1')

    const numInput = screen.getByPlaceholderText('Se genera al elegir categoría')
    await waitFor(() => expect(numInput).toHaveValue('SOF-0001'))
    expect(screen.queryByText(/número distinto al sugerido/)).not.toBeInTheDocument()

    await userEvent.clear(numInput)
    await userEvent.type(numInput, 'SOF-9999')
    expect(screen.getByText(/número distinto al sugerido/)).toBeInTheDocument()
  })

  it('deshabilita Modelo hasta elegir Marca y lo pide filtrado por esa marca', async () => {
    render(<CrearActivoModal onClose={vi.fn()} />)
    expect(screen.getByLabelText('Modelo')).toBeDisabled()

    await userEvent.selectOptions(screen.getByLabelText('Marca'), '3')
    expect(screen.getByLabelText('Modelo')).toBeEnabled()
    expect(useCatalogo).toHaveBeenCalledWith('modelos', { marca: '3' }, expect.anything())
  })

  it('envía el activo mapeando los IDs de catálogo y cierra', async () => {
    const onClose = vi.fn()
    render(<CrearActivoModal onClose={onClose} />)
    await llenarActivo()
    await userEvent.click(screen.getByText('Guardar activo'))

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      num: 'SOF-0001', nombre: 'Servidor', costo: 500000,
      categoria: 1, localizacion: 2, marca: 3, modelo: 4,
      proveedor: 5, origen: 6,
    }))
    // libros/dep/estado ya no los pone el formulario: los calcula el backend.
    const enviado = mutateAsync.mock.calls[0][0]
    expect(enviado).not.toHaveProperty('libros')
    expect(enviado).not.toHaveProperty('dep')
    expect(enviado).not.toHaveProperty('estado')
    expect(showToast).toHaveBeenCalledWith('Activo SOF-0001 registrado correctamente', 'success')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('permite guardar sin marca, modelo ni serie: se envían como null', async () => {
    render(<CrearActivoModal onClose={vi.fn()} />)
    await userEvent.selectOptions(screen.getByLabelText('Categoría'), '1')
    await waitFor(() => expect(screen.getByPlaceholderText('Se genera al elegir categoría')).toHaveValue('SOF-0001'))
    await userEvent.type(screen.getByPlaceholderText('Ej. Computadora portátil…'), 'Servidor')
    await userEvent.type(screen.getByLabelText(/Costo original/), '500000')
    await userEvent.type(screen.getByLabelText(/Fecha de adquisición/), '2024-01-10')
    await userEvent.type(screen.getByLabelText(/Fecha de inicio de uso/), '2024-01-15')
    await userEvent.type(screen.getByPlaceholderText('F-0000'), 'F-1')
    await userEvent.selectOptions(screen.getByLabelText('Área'), '2')
    await userEvent.selectOptions(screen.getByLabelText('Proveedor'), '5')
    await userEvent.selectOptions(screen.getByLabelText('Origen'), '6')

    await userEvent.click(screen.getByText('Guardar activo'))

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      marca: null, modelo: null, serie: null,
    }))
  })

  it('marca, modelo y serie muestran una nota de campo opcional', () => {
    render(<CrearActivoModal onClose={vi.fn()} />)
    expect(screen.getAllByText('Opcional. Si se deja vacío, se guarda sin especificar.').length).toBe(3)
  })

  it('no pide valor en libros, dep. acumulada ni estado: se calculan solos', () => {
    render(<CrearActivoModal onClose={vi.fn()} />)
    expect(screen.queryByText('Valor en libros (₡)')).not.toBeInTheDocument()
    expect(screen.queryByText('Dep. acumulada (₡)')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Estado')).not.toBeInTheDocument()
    expect(screen.getByText(/Depreciación \(calculada automáticamente/)).toBeInTheDocument()
  })

  it('muestra el estimado de depreciación una vez completados costo, vida útil y fecha de uso', async () => {
    render(<CrearActivoModal onClose={vi.fn()} />)
    expect(screen.getByText(/Completá costo, vida útil y fecha de inicio de uso/)).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText(/Costo original/), '500000')
    await userEvent.type(screen.getByLabelText(/Fecha de inicio de uso/), '2024-01-15')

    expect(screen.queryByText(/Completá costo, vida útil y fecha de inicio de uso/)).not.toBeInTheDocument()
    expect(screen.getByText('Valor en libros')).toBeInTheDocument()
    expect(screen.getByText('Dep. acumulada')).toBeInTheDocument()
  })
})
