/**
 * La landing solo se sirve en el host publico de la marca.
 *
 * @vitest-environment-options { "url": "https://www.acticr.com/" }
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../../App'
import { LandingView } from './LandingView'

vi.mock('../../api/auth')

describe('LandingView en el host de marca', () => {
  it('App sirve la landing —no el login— cuando el host es www', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/bajo control/i)
    // El login vive en el subdominio de cada empresa, no aqui.
    expect(screen.queryByPlaceholderText('Usuario')).not.toBeInTheDocument()
  })

  it('muestra las funcionalidades, los beneficios y la seguridad', () => {
    render(<LandingView />)
    expect(screen.getByText('Depreciación sin intervención')).toBeInTheDocument()
    expect(screen.getByText('Auditorías sin sobresaltos')).toBeInTheDocument()
    // Como encabezado, no como la nota suelta del hero que repite la frase.
    expect(
      screen.getByRole('heading', { name: 'Datos aislados por empresa' }),
    ).toBeInTheDocument()
  })

  it('el carrusel cambia de paso al elegir otro punto', async () => {
    render(<LandingView />)
    expect(screen.getByText(/Registra una vez/i)).toBeInTheDocument()

    const tabs = screen.getAllByRole('tab')
    await userEvent.click(tabs[2])

    expect(screen.getByText(/Cada movimiento deja huella/i)).toBeInTheDocument()
    expect(tabs[2]).toHaveAttribute('aria-selected', 'true')
  })

  it('"Iniciar sesión" abre el paso que pregunta por la empresa', async () => {
    render(<LandingView />)

    const nav = screen.getByRole('banner')
    await userEvent.click(within(nav).getByRole('button', { name: 'Iniciar sesión' }))

    const dialogo = await screen.findByRole('dialog')
    expect(within(dialogo).getByLabelText('Nombre de tu empresa')).toBeInTheDocument()
  })

  it('el paso de acceso redirige al login del subdominio de la empresa', async () => {
    // El destino se arma desde el host actual, sin dominio escrito a mano.
    const asignada = vi.fn()
    vi.stubGlobal('location', {
      hostname: 'www.acticr.com',
      protocol: 'https:',
      port: '',
      set href(v) { asignada(v) },
    })

    render(<LandingView />)
    const nav = screen.getByRole('banner')
    await userEvent.click(within(nav).getByRole('button', { name: 'Iniciar sesión' }))

    const dialogo = await screen.findByRole('dialog')
    await userEvent.type(within(dialogo).getByLabelText('Nombre de tu empresa'), 'Mi Empresa')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Continuar' }))

    // El slug se normaliza: minusculas y sin espacios.
    expect(asignada).toHaveBeenCalledWith('https://miempresa.acticr.com/login')
    vi.unstubAllGlobals()
  })
})
