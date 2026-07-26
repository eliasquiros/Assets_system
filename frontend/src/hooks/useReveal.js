import { useEffect, useRef } from 'react'

// Revela elementos al entrar en pantalla. Se usa IntersectionObserver y una
// clase CSS en vez de una libreria de animacion: la landing no justifica ~50 kB
// extra, y asi el estado "visible" es solo una clase que el CSS puede ignorar
// por completo cuando el usuario pide menos movimiento.
//
// Los elementos a revelar se marcan con [data-reveal] dentro del contenedor.
export function useReveal() {
  const contenedor = useRef(null)

  useEffect(() => {
    const raiz = contenedor.current
    if (!raiz) return

    const objetivos = raiz.querySelectorAll('[data-reveal]')

    // Sin soporte o con movimiento reducido: se muestran ya, sin animar. Nunca
    // se deja contenido invisible dependiendo de que una animacion corra.
    const sinMovimiento = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (sinMovimiento || typeof IntersectionObserver === 'undefined') {
      objetivos.forEach((el) => el.setAttribute('data-visible', 'true'))
      return
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return
          entrada.target.setAttribute('data-visible', 'true')
          observador.unobserve(entrada.target)   // se revela una sola vez
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    )

    objetivos.forEach((el) => observador.observe(el))
    return () => observador.disconnect()
  }, [])

  return contenedor
}
