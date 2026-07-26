import { useEffect, useRef, useState } from 'react'
import s from './LandingView.module.css'

// Cada empresa entra por su propio subdominio (DA16), asi que desde el sitio
// publico no existe un /login unico al que mandar a la gente: hay que saber a
// QUE empresa entra. Este paso pide ese dato y redirige al login real.
export function AccesoModal({ onCerrar }) {
  const [slug, setSlug] = useState('')
  const input = useRef(null)
  const dialogo = useRef(null)

  useEffect(() => {
    input.current?.focus()
    function onTecla(e) { if (e.key === 'Escape') onCerrar() }
    document.addEventListener('keydown', onTecla)
    // Evita que la pagina de atras se desplace mientras el modal esta abierto.
    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onTecla)
      document.body.style.overflow = overflowPrevio
    }
  }, [onCerrar])

  // El dominio sale del host actual (www.acticr.com -> acticr.com) para que esto
  // funcione igual en produccion y en dev, sin escribirlo a mano en ningun lado.
  const partes = window.location.hostname.split('.')
  const dominioBase = partes.length > 2 ? partes.slice(1).join('.') : window.location.hostname

  function entrar(e) {
    e.preventDefault()
    const limpio = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (!limpio) return
    const puerto = window.location.port ? `:${window.location.port}` : ''
    window.location.href = `${window.location.protocol}//${limpio}.${dominioBase}${puerto}/login`
  }

  return (
    <div
      className={s.modalOverlay}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCerrar() }}
    >
      <div
        ref={dialogo}
        className={s.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="acceso-titulo"
      >
        <h2 id="acceso-titulo" className={s.modalTitle}>Entrar a tu empresa</h2>
        <p className={s.modalText}>
          Cada empresa tiene su propia dirección. Escribe la de la tuya y te
          llevamos a su inicio de sesión.
        </p>

        <form onSubmit={entrar}>
          <label className={s.field} htmlFor="acceso-slug">Nombre de tu empresa</label>
          <div className={s.inputWrap}>
            <input
              ref={input}
              id="acceso-slug"
              className={s.input}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="mi-empresa"
              autoComplete="organization"
              spellCheck="false"
            />
            <span className={s.suffix}>.{dominioBase}</span>
          </div>
          <p className={s.modalHint}>
            ¿No la recuerdas? Está en el correo de bienvenida que enviamos al
            activar tu cuenta.
          </p>

          <div className={s.modalActions}>
            <button type="button" className={`${s.btn} ${s.btnQuiet}`} onClick={onCerrar}>
              Cancelar
            </button>
            <button type="submit" className={`${s.btn} ${s.btnDark}`}>
              Continuar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
