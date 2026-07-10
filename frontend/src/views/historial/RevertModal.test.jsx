import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RevertModal } from './RevertModal'
import { useBajas, useRevertirBaja } from '../../hooks/useBajas'
import { useToast } from '../../context/ToastContext'

vi.mock('../../hooks/useBajas')
vi.mock('../../context/ToastContext')

const BAJA = { id: 'BJ-2026-018', activoNum: 'AF-0031', activoNombre: 'Laptop HP', estado: 'Pendiente' }

function renderModal(onClose = vi.fn()) {
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

    renderModal()
    expect(screen.getByText('Laptop HP')).toBeInTheDocument()
  })

  it('confirms the reversion and closes the modal', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(null)
    const showToast = vi.fn()
    const onClose = vi.fn()
    useBajas.mockReturnValue({ data: [BAJA] })
    useRevertirBaja.mockReturnValue({ mutateAsync, isPending: false })
    useToast.mockReturnValue({ showToast })

    renderModal(onClose)
    await userEvent.click(screen.getByText('Confirmar reversión'))

    expect(mutateAsync).toHaveBeenCalledWith('BJ-2026-018')
    expect(showToast).toHaveBeenCalledWith('Baja BJ-2026-018 revertida — activo reincorporado', 'success')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
