import { useMutation } from '@tanstack/react-query'
import { descargarReporteAuditoria, generarReporteFinanciero } from '../api/reportes'
import { useAuth } from '../context/AuthContext'

export function useGenerarAuditoria() {
  return useMutation({ mutationFn: (anio) => descargarReporteAuditoria(anio) })
}

export function useGenerarFinanciero() {
  const { token } = useAuth()
  return useMutation({ mutationFn: (corte) => generarReporteFinanciero(corte, { token }) })
}
