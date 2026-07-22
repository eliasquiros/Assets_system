import { apiFetch, descargarArchivo } from './client'

// El reporte de auditoria es una descarga binaria (.xlsx), no JSON: se baja el
// blob con la sesion (cookie httpOnly) y se dispara la descarga en el navegador.
export function descargarReporteAuditoria(anio) {
  return descargarArchivo(
    `/reportes/auditoria/?anio=${encodeURIComponent(anio)}`,
    `reporte_auditoria_${anio}.xlsx`,
  )
}

export function generarReporteFinanciero(corte, { token } = {}) {
  return apiFetch(`/reportes/financiero/?corte=${encodeURIComponent(corte)}`, { token })
}
