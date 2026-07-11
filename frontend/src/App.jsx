import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { AppLayout } from './layout/AppLayout'
import { LoginView } from './views/auth/LoginView'
import { ActivosView } from './views/activos/ActivosView'
import { ReportesView } from './views/reportes/ReportesView'
import { HistorialView } from './views/historial/HistorialView'

const queryClient = new QueryClient()

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginView />} />
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
