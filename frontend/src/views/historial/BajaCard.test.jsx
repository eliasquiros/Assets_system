import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BajaCard } from './BajaCard'

const NOW = Date.parse('2026-07-09T12:00:00Z')

function renderCard(baja) {
  return render(<MemoryRouter><BajaCard baja={baja} now={NOW} /></MemoryRouter>)
}

describe('BajaCard', () => {
  it('shows the grace-period countdown and a revert link when pending', () => {
    renderCard({
      id: 'BJ-2026-018', activoNum: 'AF-0031', activoNombre: 'Laptop HP', motivo: 'Desecho u obsolescencia',
      desc: 'Equipo dañado', fechaEfectiva: '2026-07-09', fechaRegistro: '2026-07-09', user: 'J. Mora',
      estado: 'Pendiente', venceTs: NOW + (28 * 3600000),
    })
    expect(screen.getByText('Periodo de gracia · Vence en 1 día 4 h')).toBeInTheDocument()
    expect(screen.getByText('↺ Revertir baja')).toBeInTheDocument()
  })

  it('shows the reincorporation message when the baja was reverted', () => {
    renderCard({
      id: 'BJ-2026-009', activoNum: 'AF-0020', activoNombre: 'Escritorio', motivo: 'Desecho u obsolescencia',
      desc: 'Reasignado', fechaEfectiva: '2026-04-15', fechaRegistro: '2026-04-15', user: 'J. Mora',
      estado: 'Revertida', venceTs: null,
    })
    expect(screen.getByText('Baja revertida — el activo fue reincorporado al inventario vigente.')).toBeInTheDocument()
    expect(screen.queryByText('↺ Revertir baja')).not.toBeInTheDocument()
  })

  it('labels a definitiva baja without the countdown or revert link', () => {
    renderCard({
      id: 'BJ-2026-015', activoNum: 'AF-0024', activoNombre: 'Vehículo', motivo: 'Venta',
      desc: 'Vendido', fechaEfectiva: '2026-06-30', fechaRegistro: '2026-06-30', user: 'M. Rivera',
      estado: 'Definitiva', venceTs: null,
    })
    expect(screen.getByText('Baja definitiva')).toBeInTheDocument()
    expect(screen.queryByText('↺ Revertir baja')).not.toBeInTheDocument()
  })
})
