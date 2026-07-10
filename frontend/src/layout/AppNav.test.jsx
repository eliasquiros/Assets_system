import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppNav } from './AppNav'
import styles from './AppNav.module.css'

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
