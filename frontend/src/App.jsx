import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { AppLayout } from './layout/AppLayout'
import { ActivosView } from './views/activos/ActivosView'
import { ReportesView } from './views/reportes/ReportesView'
import { HistorialView } from './views/historial/HistorialView'

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AppLayout />}>
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
