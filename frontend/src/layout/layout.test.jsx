// App shell wiring: nav active-state/badges and the badge-count hook that
// feeds it — grouped as one "layout" category file.
import { describe, expect, it, vi } from 'vitest'
import { render, screen, renderHook, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppNav } from './AppNav'
import styles from './AppNav.module.css'
import { useBadges } from './useBadges'
import { useActivos } from '../hooks/useActivos'
import { useBajas } from '../hooks/useBajas'

vi.mock('../hooks/useActivos')
vi.mock('../hooks/useBajas')

describe('AppNav', () => {
  it('marks the current tab as active', () => {
    render(
      <MemoryRouter initialEntries={['/activos']}>
        <AppNav badges={{}} />
      </MemoryRouter>
    )
    expect(screen.getByText('Activos').closest('a')).toHaveClass(styles.active)
    expect(screen.getByText('Reportes').closest('a')).not.toHaveClass(styles.active)
  })

  it('renders a badge only for tabs with a non-null value', () => {
    render(
      <MemoryRouter initialEntries={['/activos']}>
        <AppNav badges={{ '/activos': '18', '/historial': null }} />
      </MemoryRouter>
    )
    expect(screen.getByText('18')).toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })
})

describe('useBadges', () => {
  it('shows the activos count and the pending-baja count', async () => {
    useActivos.mockReturnValue({ data: [{ num: 'AF-0001' }, { num: 'AF-0002' }] })
    useBajas.mockReturnValue({ data: [{ estado: 'Pendiente' }, { estado: 'Definitiva' }, { estado: 'Pendiente' }] })

    const { result } = renderHook(() => useBadges())
    await waitFor(() => {
      expect(result.current['/activos']).toBe('2')
      expect(result.current['/historial']).toBe('2')
    })
  })

  it('shows null for historial when there are no pending bajas', () => {
    useActivos.mockReturnValue({ data: [] })
    useBajas.mockReturnValue({ data: [{ estado: 'Definitiva' }] })

    const { result } = renderHook(() => useBadges())
    expect(result.current['/historial']).toBeNull()
  })

  it('shows null for activos when the list is empty, instead of "0"', () => {
    useActivos.mockReturnValue({ data: [] })
    useBajas.mockReturnValue({ data: [] })

    const { result } = renderHook(() => useBadges())
    expect(result.current['/activos']).toBeNull()
  })
})
