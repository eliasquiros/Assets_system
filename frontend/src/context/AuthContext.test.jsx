import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './AuthContext'
import { login as loginRequest, me as meRequest, logout as logoutRequest } from '../api/auth'

vi.mock('../api/auth')

function Consumer() {
  const { isAuthenticated, loading, username, empresa, login, logout } = useAuth()
  if (loading) return <span>cargando</span>
  if (!isAuthenticated) return <button onClick={() => login('ana', 'secreta123')}>entrar</button>
  return (
    <div>
      <span>{username} · {empresa}</span>
      <button onClick={logout}>salir</button>
    </div>
  )
}

describe('AuthContext', () => {
  afterEach(() => vi.clearAllMocks())

  it('arranca sin sesión cuando /me responde 401', async () => {
    meRequest.mockRejectedValue(new Error('401'))
    render(<AuthProvider><Consumer /></AuthProvider>)
    expect(await screen.findByText('entrar')).toBeInTheDocument()
  })

  it('restaura la sesión desde /me al montar', async () => {
    meRequest.mockResolvedValue({ username: 'ana', empresa: 'Demo' })
    render(<AuthProvider><Consumer /></AuthProvider>)
    expect(await screen.findByText('ana · Demo')).toBeInTheDocument()
  })

  it('login guarda la sesión devuelta por la API (sin token en cliente)', async () => {
    meRequest.mockRejectedValue(new Error('401'))
    loginRequest.mockResolvedValue({ username: 'ana', empresa: 'Demo' })
    render(<AuthProvider><Consumer /></AuthProvider>)

    await userEvent.click(await screen.findByText('entrar'))

    expect(await screen.findByText('ana · Demo')).toBeInTheDocument()
  })

  it('logout limpia la sesión', async () => {
    meRequest.mockResolvedValue({ username: 'ana', empresa: 'Demo' })
    logoutRequest.mockResolvedValue(null)
    render(<AuthProvider><Consumer /></AuthProvider>)

    await userEvent.click(await screen.findByText('salir'))
    await waitFor(() => expect(screen.getByText('entrar')).toBeInTheDocument())
  })

  it('lanza si useAuth se usa fuera del provider', () => {
    function Broken() { useAuth(); return null }
    expect(() => render(<Broken />)).toThrow('useAuth debe usarse dentro de AuthProvider')
  })

  it('el evento auth:expired limpia la sesión aunque no se haya llamado a logout', async () => {
    meRequest.mockResolvedValue({ username: 'ana', empresa: 'Demo' })
    render(<AuthProvider><Consumer /></AuthProvider>)
    expect(await screen.findByText('ana · Demo')).toBeInTheDocument()

    window.dispatchEvent(new Event('auth:expired'))

    await waitFor(() => expect(screen.getByText('entrar')).toBeInTheDocument())
  })
})
