import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Spinner } from './Spinner'
import { EmptyState } from './EmptyState'
import { Button } from './Button'

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
