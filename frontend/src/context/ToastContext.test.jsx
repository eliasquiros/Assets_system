import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast } from './ToastContext'
import { Toast } from '../components/Toast'

function Trigger() {
  const { showToast } = useToast()
  return <button onClick={() => showToast('Activo AF-0001 registrado correctamente', 'success')}>disparar</button>
}

describe('ToastContext + Toast', () => {
  it('shows a toast after showToast is called and hides it after 3.6s', async () => {
    render(<ToastProvider><Trigger /><Toast /></ToastProvider>)

    expect(screen.queryByText('Activo AF-0001 registrado correctamente')).not.toBeInTheDocument()
    await userEvent.click(screen.getByText('disparar'))
    expect(screen.getByText('Activo AF-0001 registrado correctamente')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText('Activo AF-0001 registrado correctamente')).not.toBeInTheDocument()
    }, { timeout: 5000 })
  })
})
