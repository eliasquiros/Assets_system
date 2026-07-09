import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast } from './ToastContext'
import { Toast } from '../components/Toast'

function Trigger() {
  const { showToast } = useToast()
  return <button onClick={() => showToast('Activo AF-0001 registrado correctamente', 'success')}>disparar</button>
}

describe('ToastContext + Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a toast after showToast is called and hides it after 3.6s', async () => {
    const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime })

    render(<ToastProvider><Trigger /><Toast /></ToastProvider>)

    expect(screen.queryByText('Activo AF-0001 registrado correctamente')).not.toBeInTheDocument()
    await user.click(screen.getByText('disparar'))
    expect(screen.getByText('Activo AF-0001 registrado correctamente')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(3600)
    })
    expect(screen.queryByText('Activo AF-0001 registrado correctamente')).not.toBeInTheDocument()
  })
})
