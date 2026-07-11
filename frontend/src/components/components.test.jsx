// Presentational primitives with no business logic of their own (Badge,
// FormField, Spinner, EmptyState, Button) plus the Toast notification
// system — grouped here as one smoke-level file per the "UI primitives"
// category.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Badge } from './Badge'
import styles from './Badge.module.css'
import { FormField } from './FormField'
import { Spinner } from './Spinner'
import { EmptyState } from './EmptyState'
import { Button } from './Button'
import { ToastProvider, useToast } from '../context/ToastContext'
import { Toast } from './Toast'

describe('Badge', () => {
  it('renders the label text', () => {
    render(<Badge label="Depreciando" />)
    expect(screen.getByText('Depreciando')).toBeInTheDocument()
  })

  it('applies the success class for "Depreciando"', () => {
    render(<Badge label="Depreciando" />)
    expect(screen.getByText('Depreciando').closest('span')).toHaveClass(styles.success)
  })

  it('applies the warning class for "Pendiente de baja"', () => {
    render(<Badge label="Pendiente de baja" />)
    expect(screen.getByText('Pendiente de baja').closest('span')).toHaveClass(styles.warning)
  })

  it('falls back to the neutral class for an unknown label', () => {
    render(<Badge label="Totalmente depreciado" />)
    expect(screen.getByText('Totalmente depreciado').closest('span')).toHaveClass(styles.neutral)
  })
})

describe('FormField', () => {
  it('renders the label, the required marker and its children', () => {
    render(<FormField label="Costo original"><input aria-label="costo" /></FormField>)
    expect(screen.getByText('Costo original')).toBeInTheDocument()
    expect(screen.getByText('*')).toBeInTheDocument()
    expect(screen.getByLabelText('costo')).toBeInTheDocument()
  })

  it('shows the error message when provided', () => {
    render(<FormField label="Costo original" error="Debe ser mayor a cero"><input /></FormField>)
    expect(screen.getByText('Debe ser mayor a cero')).toBeInTheDocument()
  })

  it('hides the required marker when required is false', () => {
    render(<FormField label="Opcional" required={false}><input /></FormField>)
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })
})

describe('Spinner', () => {
  it('renders a status role for accessibility', () => {
    render(<Spinner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})

describe('EmptyState', () => {
  it('renders the given message', () => {
    render(<EmptyState message="No se encontraron activos con los filtros actuales." />)
    expect(screen.getByText('No se encontraron activos con los filtros actuales.')).toBeInTheDocument()
  })
})

describe('Button', () => {
  it('renders children and forwards onClick', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Registrar activo</Button>)
    await userEvent.click(screen.getByText('Registrar activo'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('applies the secondary variant class', () => {
    render(<Button variant="secondary">Cancelar</Button>)
    expect(screen.getByText('Cancelar').className).toContain('secondary')
  })
})

describe('ToastContext + Toast', () => {
  function Trigger() {
    const { showToast } = useToast()
    return <button onClick={() => showToast('Activo AF-0001 registrado correctamente', 'success')}>disparar</button>
  }

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
