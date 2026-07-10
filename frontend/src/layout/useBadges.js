import { useActivos } from '../hooks/useActivos'
import { useBajas } from '../hooks/useBajas'

export function useBadges() {
  const { data: activos } = useActivos()
  const { data: bajas } = useBajas()
  const pendientes = (bajas || []).filter((b) => b.estado === 'Pendiente').length
  return {
    '/activos': activos && activos.length ? String(activos.length) : null,
    '/historial': pendientes > 0 ? String(pendientes) : null,
  }
}
