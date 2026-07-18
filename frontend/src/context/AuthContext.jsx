import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { login as loginRequest, logout as logoutRequest, me as meRequest } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)   // { username, empresa } | null
  const [loading, setLoading] = useState(true)

  // La fuente de verdad es la cookie httpOnly (no legible por JS). Al montar
  // preguntamos a /me si esa cookie es válida y recuperamos el perfil.
  useEffect(() => {
    let active = true
    meRequest()
      .then((data) => { if (active) setSession(data) })
      .catch(() => { if (active) setSession(null) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const login = useCallback(async (usuario, password) => {
    const data = await loginRequest(usuario, password)
    setSession(data)
    return data
  }, [])

  const logout = useCallback(async () => {
    try { await logoutRequest() } finally { setSession(null) }
  }, [])

  const value = { ...session, isAuthenticated: !!session, loading, login, logout }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
