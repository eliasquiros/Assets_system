// Espejo en cliente del calculo del backend (assets/depreciacion.py) solo para
// la vista previa del formulario de registro; el valor que se guarda siempre
// lo calcula el servidor (RN-001: linea recta, año de 365 dias, corte al
// primer dia del mes en que se registra el activo).
const DIAS_POR_ANIO = 365

export function calcularDepreciacionPreview(costo, vidaUtilAnios, fechaInicio) {
  const costoNum = Number(costo)
  const vidaUtil = Number(vidaUtilAnios)
  // vidaUtil 0 es valido (activo ya totalmente depreciado); solo negativo o
  // no numerico invalida la vista previa.
  if (!costoNum || costoNum <= 0 || Number.isNaN(vidaUtil) || vidaUtil < 0
      || vidaUtilAnios === '' || !fechaInicio) return null

  const inicio = new Date(`${fechaInicio}T00:00:00`)
  if (Number.isNaN(inicio.getTime())) return null
  const hoy = new Date()
  const corte = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const diasTranscurridos = Math.max(Math.round((corte - inicio) / 86400000), 0)
  const diasVidaUtil = vidaUtil * DIAS_POR_ANIO

  if (diasTranscurridos >= diasVidaUtil) {
    return { dep: costoNum, libros: 0, estado: 'Totalmente depreciado' }
  }
  const depDiaria = costoNum / diasVidaUtil
  const dep = Math.min(Math.round(depDiaria * diasTranscurridos * 100) / 100, costoNum)
  return { dep, libros: costoNum - dep, estado: 'Depreciando' }
}
