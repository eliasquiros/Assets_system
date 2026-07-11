import { useMutation } from '@tanstack/react-query'
import { generarReporteAuditoria, generarReporteFinanciero } from '../api/reportes'
import { useAuth } from '../context/AuthContext'

export function useGenerarAuditoria() {
  const { token } = useAuth()
  return useMutation({ mutationFn: () => generarReporteAuditoria({ token }) })
}

export function useGenerarFinanciero() {
  const { token } = useAuth()
  return useMutation({ mutationFn: (corte) => generarReporteFinanciero(corte, { token }) })
}
