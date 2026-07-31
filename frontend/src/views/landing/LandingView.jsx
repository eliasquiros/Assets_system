import { useState } from 'react'
import { MarcaActicr } from '../../components/MarcaActicr'
import { useMetaPagina } from '../../hooks/useMetaPagina'
import { useReveal } from '../../hooks/useReveal'
import { AccesoModal } from './AccesoModal'
import s from './LandingView.module.css'

const WHATSAPP = '+506 7064 0040'
const CORREO = 'eliasquial24@gmail.com'
const MENSAJE = 'Hola, quisiera información sobre Acticr para la gestión de activos fijos de mi empresa.'

const WA_URL = `https://wa.me/${WHATSAPP.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(MENSAJE)}`
const MAIL_URL = `mailto:${CORREO}`

const MOVIMIENTOS = [
  {
    numeral: '01',
    titulo: <>Gestión completa de sus activos, con depreciación <i>automática</i>.</>,
    texto: 'Cada activo de su empresa con su costo, su fecha, su ubicación y su responsable en un solo expediente. El sistema corre la depreciación por usted, periodo tras periodo, sin fórmulas manuales ni versiones paralelas del archivo.',
    puntos: [
      'Expediente único por activo',
      'Depreciación calculada sin intervención',
      'Valor actual disponible en todo momento',
    ],
  },
  {
    numeral: '02',
    titulo: <>Reportes de auditoría y financieros, <i>listos</i>.</>,
    texto: 'El reporte de auditoría incluye todos los requisitos de Tributación, de modo que ante cualquier revisión usted entrega en lugar de buscar. El reporte financiero le da la información actualizada de sus activos en formato Excel, cuando la necesita y sin pedirle nada a nadie.',
    puntos: [
      'Requisitos de Tributación incluidos',
      'Exportación a Excel en un clic',
      'Información al día, sin esperar cierres',
    ],
  },
  {
    numeral: '03',
    titulo: <>Inmutabilidad: nada se cambia <i>en silencio</i>.</>,
    texto: 'Cada activo guarda su propia bitácora: qué se modificó, cuándo y quién lo hizo. Los retiros y bajas quedan registrados con su respaldo, así que la historia de su patrimonio es completa y verificable, no una reconstrucción de memoria.',
    puntos: [
      'Registro de cambios por activo',
      'Retiros y bajas documentados',
      'Historia verificable de principio a fin',
    ],
  },
]

const PILARES = [
  { titulo: 'Alto valor', texto: 'Su equipo en labores gerenciales, no en digitación.' },
  { titulo: 'Servicio', texto: 'Acompañamiento real, en su idioma y su horario.' },
  { titulo: 'Seguridad', texto: 'Accesos, respaldos y trazabilidad de cada cambio.' },
]

function IconoWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.347-.347.52-.52.174-.174.232-.298.347-.497.116-.198.058-.372-.014-.52-.072-.148-.658-1.583-.902-2.166-.24-.579-.482-.5-.66-.51-.174-.008-.372-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export function LandingView() {
  const contenedor = useReveal()
  const [modalAbierto, setModalAbierto] = useState(false)

  useMetaPagina({
    titulo: 'Acticr — Gestión de activos fijos en Costa Rica',
    descripcion: 'Registro, depreciación automática y reportes de auditoría de los activos fijos de su empresa, con los requisitos que Tributación exige. Software costarricense.',
  })

  return (
    <div className={s.page} ref={contenedor}>
      <a className={s.skip} href="#top">Saltar al contenido</a>

      {/* ============================== NAV ============================== */}
      <header className={s.nav}>
        <a className={s.brand} href="/">
          <span className={s.brandMark}><MarcaActicr /></span>
          <span className={s.brandName}>Acticr</span>
        </a>
        <nav className={s.navActions} aria-label="Acciones">
          <button type="button" className={s.btn} onClick={() => setModalAbierto(true)}>
            Iniciar sesión
          </button>
          <a className={`${s.btn} ${s.btnSolid}`} href="#contacto">Contacto</a>
        </nav>
      </header>

      <main>
        {/* ============================= HERO ============================= */}
        <section id="top" className={s.hero}>
          <div aria-hidden="true" className={s.heroGlow} />
          <div className={s.heroInner}>
            <p className={s.eyebrow}>
              <span className={s.eyebrowLine} />
              Gestión de activos fijos · Costa Rica
            </p>
            <h1 className={s.h1}>
              <span><span>Todos tus activos</span></span>
              <span><span>en un mismo</span></span>
              <span><span>lugar<em>.</em></span></span>
            </h1>
            <p className={s.heroLead}>
              Registro, depreciación y respaldo de cada activo de su empresa, con
              el detalle que Tributación exige y la precisión que su gerencia
              merece.
            </p>
          </div>
        </section>

        <div className={s.divider} />

        {/* ============================ LA MARCA ========================== */}
        <section id="marca" className={s.marca}>
          <div className={s.split}>
            <div data-reveal>
              <p className={s.kicker}>La marca</p>
              <p className={s.marcaNota}>
                Acticr es una marca costarricense. Construimos para empresas de
                aquí, con la normativa de aquí y el trato cercano que eso implica.
              </p>
            </div>

            <div data-reveal>
              <h2 className={s.h2}>
                Su tiempo vale más tomando decisiones que <i>actualizando registros manualmente</i>.
              </h2>
              <p className={s.parrafo}>
                Existimos para devolverle las horas que hoy se van en tareas
                operativas. Mientras Acticr sostiene el detalle, es decir cada
                cálculo, cada respaldo y cada movimiento, usted se dedica a lo que
                solo usted puede hacer: decidir. Eso viene acompañado de un
                servicio excelente y seguro, porque la información de sus activos
                es patrimonio, y se cuida como tal.
              </p>
              <div className={s.pilares}>
                {PILARES.map(({ titulo, texto }) => (
                  <div className={s.pilar} key={titulo}>
                    <p className={s.pilarTitulo}>{titulo}</p>
                    <p className={s.pilarTexto}>{texto}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =========================== EL SISTEMA ========================= */}
        <section className={s.sistema}>
          <div className={s.sistemaHead}>
            <p className={s.kicker} data-reveal>El sistema, en tres movimientos</p>
            <div className={s.rule} data-reveal />
          </div>

          {MOVIMIENTOS.map(({ numeral, titulo, texto, puntos }, i) => (
            <div key={numeral}>
              {i > 0 && (
                <div className={s.movimientoRule}>
                  <div className={s.rule} data-reveal />
                </div>
              )}
              <article className={s.movimiento}>
                <p className={s.numeral} data-reveal>{numeral}</p>
                <div>
                  <h3 className={s.h3} data-reveal>{titulo}</h3>
                  <p className={s.movimientoTexto} data-reveal>{texto}</p>
                  <ul className={s.puntos} data-reveal>
                    {puntos.map((p) => <li key={p}>{p}</li>)}
                  </ul>
                </div>
              </article>
            </div>
          ))}
        </section>

        {/* ============================ CONTACTO ========================== */}
        <section id="contacto" className={s.contacto}>
          <div aria-hidden="true" className={s.contactoGlow} />
          <MarcaActicr className={s.contactoMarca} width="100%" height="auto" />
          <div className={s.contactoInner} data-reveal>
            <p className={s.kicker}>Hablemos</p>
            <h2 className={s.ctaTitulo}>
              Ordenar sus activos empieza con <i>una conversación</i>.
            </h2>
            <p className={s.ctaTexto}>
              Cuéntenos cuántos activos maneja hoy y le mostramos exactamente cómo
              se verían dentro de Acticr. Sin compromiso.
            </p>
            <div className={s.ctaBtns}>
              <a className={`${s.btn} ${s.btnSolid}`} href={WA_URL} target="_blank" rel="noopener noreferrer">
                Escribir por WhatsApp
              </a>
              <a className={s.btn} href={MAIL_URL}>Enviar un correo</a>
            </div>
            <p className={s.ctaDatos}>{WHATSAPP} · {CORREO}</p>
          </div>
        </section>
      </main>

      {/* ============================= FOOTER ============================ */}
      <footer className={s.footer}>
        <span className={s.footerBrand}>
          <MarcaActicr width={19} />
          <span>Acticr</span>
        </span>

        <nav className={s.footerLegal} aria-label="Legal">
          <a href="/privacidad">Privacidad</a>
          <a href="/terminos">Términos</a>
          <a href="/cookies">Cookies</a>
        </nav>

        <span className={s.footerOrigen}>
          Hecho en Costa Rica
          <svg viewBox="0 0 30 18" width="24" height="14.4" role="img" aria-label="Bandera de Costa Rica" className={s.bandera}>
            <rect width="30" height="18" fill="#002b7f" />
            <rect y="3" width="30" height="12" fill="#f1f3f6" />
            <rect y="6" width="30" height="6" fill="#ce1126" />
          </svg>
        </span>
      </footer>

      <a
        className={s.whatsapp}
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escribir a Acticr por WhatsApp"
      >
        <IconoWhatsApp />
      </a>

      {modalAbierto && <AccesoModal onCerrar={() => setModalAbierto(false)} />}
    </div>
  )
}
