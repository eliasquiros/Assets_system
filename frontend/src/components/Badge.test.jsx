import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'
import styles from './Badge.module.css'

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
