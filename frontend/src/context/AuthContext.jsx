import { createContext, useCallback, useContext, useState } from 'react'
import { login as loginRequest } from '../api/auth'

const AuthContext = createContext(null)
const STORAGE_KEY = 'af_session'

function readStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession)

  const login = useCallback(async (usuario, password) => {
    const data = await loginRequest(usuario, password)
    setSession(data)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return data
  }, [])

  const logout = useCallback(() => {
    setSession(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const value = { ...session, isAuthenticated: !!session, login, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
