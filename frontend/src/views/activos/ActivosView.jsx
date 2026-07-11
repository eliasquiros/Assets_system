import { useState } from 'react'
import { Route, Routes, useNavigate } from 'react-router-dom'
import { useActivos } from '../../hooks/useActivos'
import { ActivoFilters } from './ActivoFilters'
import { ActivoSummaryBar } from './ActivoSummaryBar'
import { ActivoTable } from './ActivoTable'
import { CrearActivoModal } from './CrearActivoModal'
import { EditarActivoModal } from './EditarActivoModal'
import { ActivoDetailDrawer } from './ActivoDetailDrawer'
import { Button } from '../../components/Button'

const AREAS = ['Bodega Central', 'Oficinas Administrativas', 'Planta de Producción', 'Sucursal San Pedro', 'Departamento de Transporte']
const TIPOS = ['Equipo de cómputo', 'Mobiliario y enseres', 'Maquinaria industrial', 'Vehículos', 'Equipo de oficina']

export function ActivosView() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [area, setArea] = useState('')
  const [tipo, setTipo] = useState('')
  const { data, isLoading, isError } = useActivos({ search, area, tipo })
  const activos = data || []
  const label = area || tipo
    ? [area, tipo].filter(Boolean).join(' · ')
    : (search ? 'Resultados de búsqueda' : 'Todos los activos')

  return (
    <div>
      <div className="page-head">
        <h1>Activos fijos</h1>
        <Button onClick={() => navigate('/activos/nuevo')}>+ Registrar activo</Button>
      </div>
      <ActivoFilters
        search={search} area={area} tipo={tipo} areas={AREAS} tipos={TIPOS}
        onSearchChange={setSearch} onAreaChange={setArea} onTipoChange={setTipo}
        onClear={() => { setSearch(''); setArea(''); setTipo('') }}
      />
      <ActivoSummaryBar label={label} activos={activos} />
      <ActivoTable isLoading={isLoading} isError={isError} activos={activos} />
      <Routes>
        <Route path="nuevo" element={<CrearActivoModal onClose={() => navigate('/activos')} />} />
        <Route path=":num" element={<ActivoDetailDrawer onClose={() => navigate('/activos')} />} />
        <Route path=":num/editar" element={<EditarActivoModal onClose={() => navigate('/activos')} />} />
      </Routes>
    </div>
  )
}
