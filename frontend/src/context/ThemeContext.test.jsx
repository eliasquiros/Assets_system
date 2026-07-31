import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from './ThemeContext'
import { ThemeToggle } from '../components/ThemeToggle'

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme')
  })

  it('arranca en claro cuando no hay preferencia guardada', () => {
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(screen.getByRole('button', { name: 'Cambiar a modo oscuro' })).toBeInTheDocument()
  })

  it('respeta la preferencia guardada en localStorage', () => {
    localStorage.setItem('acticr-theme', 'dark')
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(screen.getByRole('button', { name: 'Cambiar a modo claro' })).toBeInTheDocument()
  })

  it('el boton alterna el tema, actualiza <html> y persiste la eleccion', async () => {
    const user = userEvent.setup()
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>)

    await user.click(screen.getByRole('button', { name: 'Cambiar a modo oscuro' }))
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('acticr-theme')).toBe('dark')
    expect(screen.getByRole('button', { name: 'Cambiar a modo claro' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cambiar a modo claro' }))
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(localStorage.getItem('acticr-theme')).toBe('light')
  })

  it('quita el atributo de <html> al desmontar, para que login/landing no hereden el oscuro', () => {
    localStorage.setItem('acticr-theme', 'dark')
    const { unmount } = render(<ThemeProvider><ThemeToggle /></ThemeProvider>)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

    unmount()
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })
})
