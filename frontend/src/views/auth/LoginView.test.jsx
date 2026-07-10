import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginView } from './LoginView'
import { useAuth } from '../../context/AuthContext'

vi.mock('../../context/AuthContext')

describe('LoginView', () => {
  it('shows a validation error when submitting with empty fields', async () => {
    useAuth.mockReturnValue({ login: vi.fn() })
    render(<LoginView />)

    await userEvent.click(screen.getByText('Ingresar'))

    expect(screen.getByText('Ingresa tu usuario y contraseña')).toBeInTheDocument()
  })

  it('calls login with the entered credentials', async () => {
    const login = vi.fn().mockResolvedValue({})
    useAuth.mockReturnValue({ login })
    render(<LoginView />)

    await userEvent.type(screen.getByLabelText('Usuario'), 'mrivera')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secreta123')
    await userEvent.click(screen.getByText('Ingresar'))

    expect(login).toHaveBeenCalledWith('mrivera', 'secreta123')
  })

  it('shows the server error message when login fails', async () => {
    const login = vi.fn().mockRejectedValue(new Error('Usuario o contraseña incorrectos'))
    useAuth.mockReturnValue({ login })
    render(<LoginView />)

    await userEvent.type(screen.getByLabelText('Usuario'), 'mrivera')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'mala')
    await userEvent.click(screen.getByText('Ingresar'))

    expect(await screen.findByText('Usuario o contraseña incorrectos')).toBeInTheDocument()
  })
})
