import { Link } from 'react-router-dom'
import { useMetaPagina } from '../../hooks/useMetaPagina'
import s from './LegalLayout.module.css'

/* Armazon compartido por los 3 documentos legales (privacidad, terminos,
   cookies). Vive fuera de la app autenticada: se monta tanto en el host de
   marca (www) como en el subdominio de cualquier empresa, sin sesion. */
export function LegalLayout({ titulo, tituloMeta, descripcion, actualizado, children }) {
  // El mismo documento se sirve desde todos los subdominios; el canonical del
  // hook lo consolida en la direccion de www para que los buscadores no lo
  // cuenten como contenido duplicado.
  useMetaPagina({ titulo: `${tituloMeta ?? titulo} — Acticr`, descripcion })

  return (
    <div className={s.page}>
      <header className={s.nav}>
        <div className={s.navInner}>
          <Link className={s.brand} to="/">
            <span className={s.brandName}>Acticr</span>
          </Link>
          <nav className={s.navLinks} aria-label="Documentos legales">
            <Link className={s.navLink} to="/privacidad">Privacidad</Link>
            <Link className={s.navLink} to="/terminos">Términos</Link>
            <Link className={s.navLink} to="/cookies">Cookies</Link>
          </nav>
        </div>
      </header>

      <main className={s.main}>
        <article className={s.article}>
          <p className={s.eyebrow}>Documento legal</p>
          <h1 className={s.h1}>{titulo}</h1>
          <p className={s.updated}>Última actualización: {actualizado}</p>
          <div className={s.prose}>{children}</div>
        </article>
      </main>

      <footer className={s.footer}>
        <div className={s.footerInner}>
          <span className={s.footerNote}>
            © {new Date().getFullYear()} Despacho Álvarez Corella · Acticr
          </span>
          <div className={s.footerLinks}>
            <Link className={s.footerLink} to="/privacidad">Privacidad</Link>
            <Link className={s.footerLink} to="/terminos">Términos y Condiciones</Link>
            <Link className={s.footerLink} to="/cookies">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
