import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { NumeroAnimado } from './NumeroAnimado'

describe('NumeroAnimado', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('termina en el valor final, con su formato', async () => {
    render(<NumeroAnimado valor={1284} />)
    await waitFor(() => expect(screen.getByText('1.284')).toBeInTheDocument())
  })

  it('respeta prefijo y sufijo', async () => {
    render(<NumeroAnimado valor={45.7} decimales={1} prefijo="₡ " sufijo="M" />)
    await waitFor(() => expect(screen.getByText('₡ 45,7M')).toBeInTheDocument())
  })

  it('con movimiento reducido muestra el valor final de una vez, sin contar', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }))
    render(<NumeroAnimado valor={1284} />)
    // Sin esperar: ya esta el valor final, nunca se ve un numero intermedio.
    expect(screen.getByText('1.284')).toBeInTheDocument()
  })

  it('expone el valor final a lectores de pantalla desde el inicio', () => {
    // El conteo es decorativo: quien usa lector de pantalla debe oir la cifra,
    // no una secuencia de numeros cambiando.
    const { container } = render(<NumeroAnimado valor={1284} />)
    expect(container.firstChild).toHaveAttribute('aria-label', '1.284')
  })
})
