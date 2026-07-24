// Smaller pieces of the Historial feature (the read-only card and the two
// action modals) — grouped here since the list/loading/error/empty-state
// coverage for this feature already lives in HistorialView.test.jsx.
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { BajaCard } from './BajaCard'
import { RetiroModal } from './RetiroModal'
import { RevertModal } from './RevertModal'
import { useActivos } from '../../hooks/useActivos'
import { useBajas, useRegistrarBaja, useRevertirBaja } from '../../hooks/useBajas'
import { useToast } from '../../context/ToastContext'

vi.mock('../../hooks/useActivos')
vi.mock('../../hooks/useBajas')
vi.mock('../../context/ToastContext')

const NOW = Date.parse('2026-07-09T12:00:00Z')

function renderCard(baja) {
  return render(<MemoryRouter><BajaCard baja={baja} now={NOW} /></MemoryRouter>)
}

describe('BajaCard', () => {
  it('shows the grace-period countdown and a revert link when pending', () => {
    renderCard({
      id: 'BJ-2026-018', activoNum: 'AF-0031', activoNombre: 'Laptop HP', motivo: 'Desecho u obsolescencia',
      desc: 'Equipo dañado', fechaEfectiva: '2026-07-09', fechaRegistro: '2026-07-09', user: 'J. Mora',
      estado: 'Pendiente', venceTs: NOW + (28 * 3600000),
    })
    expect(screen.getByText('Periodo de gracia · Vence en 1 día 4 h')).toBeInTheDocument()
    expect(screen.getByText('↺ Revertir baja')).toBeInTheDocument()
  })

  it('shows the reincorporation message when the baja was reverted', () => {
    renderCard({
      id: 'BJ-2026-009', activoNum: 'AF-0020', activoNombre: 'Escritorio', motivo: 'Desecho u obsolescencia',
      desc: 'Reasignado', fechaEfectiva: '2026-04-15', fechaRegistro: '2026-04-15', user: 'J. Mora',
      estado: 'Revertida', venceTs: null,
    })
    expect(screen.getByText('Baja revertida — el activo fue reincorporado al inventario vigente.')).toBeInTheDocument()
    expect(screen.queryByText('↺ Revertir baja')).not.toBeInTheDocument()
  })

  it('labels a definitiva baja without the countdown or revert link', () => {
    renderCard({
      id: 'BJ-2026-015', activoNum: 'AF-0024', activoNombre: 'Vehículo', motivo: 'Venta',
      desc: 'Vendido', fechaEfectiva: '2026-06-30', fechaRegistro: '2026-06-30', user: 'M. Rivera',
      estado: 'Definitiva', venceTs: null,
    })
    expect(screen.getByText('Baja definitiva')).toBeInTheDocument()
    expect(screen.queryByText('↺ Revertir baja')).not.toBeInTheDocument()
  })
})

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
    // RN-002.2: la fecha efectiva y el archivo de respaldo también son obligatorios.
    expect(screen.getByText('Ingresa la fecha efectiva')).toBeInTheDocument()
    expect(screen.getByText('Adjunta un archivo de respaldo')).toBeInTheDocument()
  })

  it('submits the retiro and closes the modal on success', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 'BJ-2026-019' })
    const showToast = vi.fn()
    const onClose = vi.fn()
    useActivos.mockReturnValue({ data: [{ num: 'AF-0001', nombre: 'Laptop Dell' }] })
    useRegistrarBaja.mockReturnValue({ mutateAsync })
    useToast.mockReturnValue({ showToast })

    const archivo = new File(['x'], 'comprobante.pdf', { type: 'application/pdf' })
    render(<RetiroModal onClose={onClose} />)
    await userEvent.selectOptions(screen.getByLabelText(/Activo a retirar/), 'AF-0001')
    await userEvent.selectOptions(screen.getByLabelText(/Motivo/), 'Venta')
    await userEvent.type(screen.getByRole('textbox', { name: /Descripción/ }), 'Venta a colaborador')
    fireEvent.change(screen.getByLabelText('Fecha efectiva'), { target: { value: '2026-07-09' } })
    await userEvent.upload(screen.getByLabelText('Archivo de respaldo'), archivo)
    await userEvent.click(screen.getByText('Registrar baja'))

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      activoNum: 'AF-0001', motivo: 'Venta', desc: 'Venta a colaborador',
      fechaEfectiva: '2026-07-09', archivo,
    }))
    expect(showToast).toHaveBeenCalledWith('Retiro BJ-2026-019 registrado — pendiente en periodo de gracia', 'success')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

const BAJA = { id: 'BJ-2026-018', activoNum: 'AF-0031', activoNombre: 'Laptop HP', estado: 'Pendiente' }

function renderRevertModal(onClose = vi.fn()) {
  return render(
    <MemoryRouter initialEntries={['/historial/BJ-2026-018/revertir']}>
      <Routes>
        <Route path="/historial/:id/revertir" element={<RevertModal onClose={onClose} />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('RevertModal', () => {
  it('shows the activo that will be reincorporated', () => {
    useBajas.mockReturnValue({ data: [BAJA] })
    useRevertirBaja.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
    useToast.mockReturnValue({ showToast: vi.fn() })

    renderRevertModal()
    expect(screen.getByText('Laptop HP')).toBeInTheDocument()
  })

  it('confirms the reversion and closes the modal', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(null)
    const showToast = vi.fn()
    const onClose = vi.fn()
    useBajas.mockReturnValue({ data: [BAJA] })
    useRevertirBaja.mockReturnValue({ mutateAsync, isPending: false })
    useToast.mockReturnValue({ showToast })

    renderRevertModal(onClose)
    await userEvent.click(screen.getByText('Confirmar reversión'))

    expect(mutateAsync).toHaveBeenCalledWith('BJ-2026-018')
    expect(showToast).toHaveBeenCalledWith('Baja BJ-2026-018 revertida — activo reincorporado', 'success')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
