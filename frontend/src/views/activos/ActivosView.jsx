import { useState } from 'react'
import { Route, Routes, useNavigate } from 'react-router-dom'
import { useActivos } from '../../hooks/useActivos'
import { useCatalogo } from '../../hooks/useCatalogos'
import { ActivoFilters } from './ActivoFilters'
import { ActivoSummaryBar } from './ActivoSummaryBar'
import { ActivoTable } from './ActivoTable'
import { CrearActivoModal } from './CrearActivoModal'
import { EditarActivoModal } from './EditarActivoModal'
import { ActivoDetailDrawer } from './ActivoDetailDrawer'
import { Button } from '../../components/Button'

export function ActivosView() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [area, setArea] = useState('')
  const [tipo, setTipo] = useState('')
  const { data, isLoading, isError } = useActivos({ search, area, tipo })
  const activos = data || []

  // Las opciones de los filtros salen de los catálogos de la BD (mismas queries
  // que el alta inline del modal), así un área o categoría recién creada aparece
  // aquí sin recargar. El backend filtra por nombre, así que ese es el value.
  const { data: localizaciones } = useCatalogo('localizaciones')
  const { data: categorias } = useCatalogo('categorias')
  const areas = (localizaciones || []).map((l) => l.nombre)
  const tipos = (categorias || []).map((c) => c.nombre)
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
        search={search} area={area} tipo={tipo} areas={areas} tipos={tipos}
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
