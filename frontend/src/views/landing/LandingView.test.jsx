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
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/en un mismo/i)
    // El login vive en el subdominio de cada empresa, no aqui.
    expect(screen.queryByPlaceholderText('Usuario')).not.toBeInTheDocument()
  })

  it('presenta la marca y los tres movimientos del sistema', () => {
    render(<LandingView />)
    expect(screen.getByText(/Acticr es una marca costarricense/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /depreciación automática/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Reportes de auditoría/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /nada se cambia en silencio/i })).toBeInTheDocument()
  })

  it('se presenta a los buscadores como la pagina de inicio de la marca', () => {
    render(<LandingView />)

    expect(document.title).toMatch(/Gestión de activos fijos en Costa Rica/i)
    expect(document.head.querySelector('meta[name="description"]'))
      .toHaveAttribute('content', expect.stringContaining('depreciación automática'))
    // El canonical apunta al host de marca, no al host desde el que se sirve.
    expect(document.head.querySelector('link[rel="canonical"]'))
      .toHaveAttribute('href', 'https://www.acticr.com/')
    expect(document.head.querySelector('meta[property="og:url"]'))
      .toHaveAttribute('content', 'https://www.acticr.com/')
  })

  it('el contacto abre WhatsApp con el mensaje ya escrito', () => {
    render(<LandingView />)
    const wa = screen.getByRole('link', { name: 'Escribir por WhatsApp' })
    expect(wa).toHaveAttribute('href', expect.stringContaining('https://wa.me/50670640040'))
    expect(wa).toHaveAttribute('target', '_blank')
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
      pathname: '/',
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
