import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'acticr-theme'

function leerTemaGuardado() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

// Dark mode vive solo dentro del area autenticada: este provider se monta y
// desmonta junto con AppLayout (ver App.jsx), asi que login/landing nunca ven
// el atributo [data-theme="dark"] en <html>, sin importar la preferencia
// guardada.
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(leerTemaGuardado)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Cuota agotada o almacenamiento bloqueado: el toggle sigue funcionando
      // dentro de la sesion, solo no persiste a la proxima visita.
    }
    // Al desmontar (logout, navegar fuera del sistema) se quita el atributo
    // para que el login/landing, que no tienen ThemeProvider, queden siempre
    // en el tema claro de base.
    return () => document.documentElement.removeAttribute('data-theme')
  }, [theme])

  function toggleTheme() {
    setTheme((actual) => (actual === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider')
  return ctx
}
