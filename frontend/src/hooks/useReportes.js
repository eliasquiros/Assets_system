import { useMutation } from '@tanstack/react-query'
import { descargarReporteAuditoria, descargarReporteFinanciero } from '../api/reportes'

export function useGenerarAuditoria() {
  return useMutation({ mutationFn: (anio) => descargarReporteAuditoria(anio) })
}

export function useGenerarFinanciero() {
  return useMutation({ mutationFn: (corte) => descargarReporteFinanciero(corte) })
}
