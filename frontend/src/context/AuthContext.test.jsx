import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './AuthContext'
import { login as loginRequest } from '../api/auth'

vi.mock('../api/auth')

const SESSION = {
  token: 't1', empresa: 'Comercial Rivera S.A.',
  usuario: { nombre: 'Marcela Rivera S.', cargo: 'Contadora general', iniciales: 'MR' },
}

function Consumer() {
  const { isAuthenticated, token, empresa, usuario, login, logout } = useAuth()
  if (!isAuthenticated) {
    return <button onClick={() => login('mrivera', 'secreta123')}>entrar</button>
  }
  return (
    <div>
      <span>{token} · {empresa} · {usuario.nombre}</span>
      <button onClick={logout}>salir</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.clearAllMocks())

  it('starts unauthenticated when there is no stored session', () => {
    render(<AuthProvider><Consumer /></AuthProvider>)
    expect(screen.getByText('entrar')).toBeInTheDocument()
  })

  it('provides the session returned by login and persists it', async () => {
    loginRequest.mockResolvedValue(SESSION)
    render(<AuthProvider><Consumer /></AuthProvider>)

    await userEvent.click(screen.getByText('entrar'))

    expect(await screen.findByText('t1 · Comercial Rivera S.A. · Marcela Rivera S.')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('af_session'))).toEqual(SESSION)
  })

  it('restores a previously stored session on mount', () => {
    localStorage.setItem('af_session', JSON.stringify(SESSION))
    render(<AuthProvider><Consumer /></AuthProvider>)
    expect(screen.getByText('t1 · Comercial Rivera S.A. · Marcela Rivera S.')).toBeInTheDocument()
  })

  it('logout clears the session and storage', async () => {
    localStorage.setItem('af_session', JSON.stringify(SESSION))
    render(<AuthProvider><Consumer /></AuthProvider>)

    await userEvent.click(screen.getByText('salir'))

    expect(screen.getByText('entrar')).toBeInTheDocument()
    expect(localStorage.getItem('af_session')).toBeNull()
  })

  it('throws when useAuth is called outside the provider', () => {
    function Broken() {
      useAuth()
      return null
    }
    expect(() => render(<Broken />)).toThrow('useAuth debe usarse dentro de AuthProvider')
  })
})
