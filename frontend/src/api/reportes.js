import { descargarArchivo } from './client'

// El reporte de auditoria es una descarga binaria (.xlsx), no JSON: se baja el
// blob con la sesion (cookie httpOnly) y se dispara la descarga en el navegador.
export function descargarReporteAuditoria(anio) {
  return descargarArchivo(
    `/reportes/auditoria/?anio=${encodeURIComponent(anio)}`,
    `reporte_auditoria_${anio}.xlsx`,
  )
}

// El reporte financiero tambien es una descarga binaria (.xlsx): el mes de
// corte llega como 'YYYY-MM' y el backend genera el corte al ultimo dia del mes.
export function descargarReporteFinanciero(corte) {
  return descargarArchivo(
    `/reportes/financiero/?corte=${encodeURIComponent(corte)}`,
    `reporte_financiero_${corte}.xlsx`,
  )
}
