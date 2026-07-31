import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { AppLayout } from './layout/AppLayout'
import { esHostDeMarca } from './lib/host'
import { LandingView } from './views/landing/LandingView'
import { LoginView } from './views/auth/LoginView'
import { ActivosView } from './views/activos/ActivosView'
import { ReportesView } from './views/reportes/ReportesView'
import { HistorialView } from './views/historial/HistorialView'
import { PoliticaPrivacidadView } from './views/legal/PoliticaPrivacidadView'
import { TerminosServicioView } from './views/legal/TerminosServicioView'
import { PoliticaCookiesView } from './views/legal/PoliticaCookiesView'

const queryClient = new QueryClient()

function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export function App() {
  // El mismo despliegue sirve el sitio publico y la app de cada empresa: en
  // www.acticr.com (o el dominio raiz) va la landing; en el subdominio de una
  // empresa, el login y la aplicacion. No se monta nada de sesion ni de datos
  // en la landing — no hay a que empresa consultarle.
  if (esHostDeMarca(window.location.hostname)) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingView />} />
          <Route path="/privacidad" element={<PoliticaPrivacidadView />} />
          <Route path="/terminos" element={<TerminosServicioView />} />
          <Route path="/cookies" element={<PoliticaCookiesView />} />
          {/* Sin esto una URL inventada devuelve 200 con la pagina en blanco, y
              los buscadores acaban indexando direcciones vacias del dominio. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginView />} />
              {/* Publicas: consultables sin sesion desde el pie de la landing o del login. */}
              <Route path="/privacidad" element={<PoliticaPrivacidadView />} />
              <Route path="/terminos" element={<TerminosServicioView />} />
              <Route path="/cookies" element={<PoliticaCookiesView />} />
              <Route path="/" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<Navigate to="/activos" replace />} />
                <Route path="activos/*" element={<ActivosView />} />
                <Route path="reportes" element={<ReportesView />} />
                <Route path="historial/*" element={<HistorialView />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
