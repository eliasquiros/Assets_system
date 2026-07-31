import { useEffect } from 'react'

// El sitio es una SPA: un unico index.html sirve la landing, las paginas
// legales y la aplicacion de cada empresa. Sin esto, todas las URLs comparten
// el mismo <title> y la misma descripcion, y los buscadores las ven como la
// misma pagina repetida.
//
// El canonical siempre apunta al host de marca aunque la pagina se este viendo
// desde el subdominio de una empresa: las paginas legales son identicas en
// todos los subdominios y deben consolidarse en una sola direccion.
export const ORIGEN_CANONICO = 'https://www.acticr.com'

function fijarMeta(selector, crear, valor) {
  let etiqueta = document.head.querySelector(selector)
  if (!etiqueta) {
    etiqueta = crear()
    document.head.appendChild(etiqueta)
  }
  etiqueta.setAttribute(etiqueta.tagName === 'LINK' ? 'href' : 'content', valor)
}

export function useMetaPagina({ titulo, descripcion }) {
  useEffect(() => {
    document.title = titulo

    // Sin barra final salvo en la raiz: dos formas de la misma URL se cuentan
    // como paginas distintas si el canonical no las unifica.
    const ruta = window.location.pathname.replace(/\/+$/, '')
    const canonical = `${ORIGEN_CANONICO}${ruta || '/'}`

    fijarMeta('meta[name="description"]', () => {
      const el = document.createElement('meta')
      el.setAttribute('name', 'description')
      return el
    }, descripcion)

    fijarMeta('link[rel="canonical"]', () => {
      const el = document.createElement('link')
      el.setAttribute('rel', 'canonical')
      return el
    }, canonical)

    // Open Graph: lo que se ve al compartir el enlace en WhatsApp o LinkedIn,
    // que es por donde llega la mayoria del trafico de una marca local.
    const og = { 'og:title': titulo, 'og:description': descripcion, 'og:url': canonical }
    Object.entries(og).forEach(([propiedad, valor]) => {
      fijarMeta(`meta[property="${propiedad}"]`, () => {
        const el = document.createElement('meta')
        el.setAttribute('property', propiedad)
        return el
      }, valor)
    })
  }, [titulo, descripcion])
}
