import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useBadges } from './useBadges'
import { useActivos } from '../hooks/useActivos'
import { useBajas } from '../hooks/useBajas'

vi.mock('../hooks/useActivos')
vi.mock('../hooks/useBajas')

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
