import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

function Consumer() {
  const { token, empresa, usuario } = useAuth()
  return <div>{token} · {empresa} · {usuario.nombre}</div>
}

describe('AuthContext', () => {
  it('provides the dev session to consumers', () => {
    render(<AuthProvider><Consumer /></AuthProvider>)
    expect(screen.getByText('dev-token · Comercial Rivera S.A. · Marcela Rivera S.')).toBeInTheDocument()
  })

  it('throws when useAuth is called outside the provider', () => {
    function Broken() {
      useAuth()
      return null
    }
    expect(() => render(<Broken />)).toThrow('useAuth debe usarse dentro de AuthProvider')
  })
})
