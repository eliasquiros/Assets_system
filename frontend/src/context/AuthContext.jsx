import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { login as loginRequest, logout as logoutRequest, me as meRequest } from '../api/auth'
import { sesionPerteneceAlHost } from '../lib/apiBase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)   // { username, empresa } | null
  const [loading, setLoading] = useState(true)

  // La fuente de verdad es la cookie httpOnly (no legible por JS). Al montar
  // preguntamos a /me si esa cookie es válida y recuperamos el perfil.
  useEffect(() => {
    let active = true
    meRequest()
      .then((data) => {
        if (!active) return
        // La cookie de la API es comun a todos los subdominios del frontend: una
        // sesion de otra empresa no se acepta aqui, se muestra el login.
        const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
        setSession(sesionPerteneceAlHost(hostname, data.subdominio) ? data : null)
      })
      .catch(() => { if (active) setSession(null) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  // Si el refresh transparente de apiFetch también falla (refresh cookie
  // vencida o revocada), client.js dispara este evento para que dejemos de
  // mostrar al usuario como autenticado aunque el estado local aún lo diga.
  useEffect(() => {
    function handleExpired() { setSession(null) }
    window.addEventListener('auth:expired', handleExpired)
    return () => window.removeEventListener('auth:expired', handleExpired)
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
