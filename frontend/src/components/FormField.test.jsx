import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FormField } from './FormField'

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
