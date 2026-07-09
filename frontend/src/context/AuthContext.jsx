import { createContext, useContext } from 'react'

const AuthContext = createContext(null)

const DEV_SESSION = {
  token: import.meta.env.VITE_DEV_TOKEN || 'dev-token',
  empresa: 'Comercial Rivera S.A.',
  usuario: { nombre: 'Marcela Rivera S.', cargo: 'Contadora general', iniciales: 'MR' },
}

export function AuthProvider({ children }) {
  return <AuthContext.Provider value={DEV_SESSION}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
