import { useCallback, useEffect, useState } from 'react'
import { useReveal } from '../../hooks/useReveal'
import { AccesoModal } from './AccesoModal'
import { ArteAuditoria, ArteDepreciacion, ArteEscudo, ArteRegistro, ArteReportes } from './LandingArt'
import {
  IconoCandado, IconoCapas, IconoCheck, IconoCubo, IconoDocumento, IconoEscudo,
  IconoFlecha, IconoGrafico, IconoHuella, IconoLlave, IconoMarca, IconoRayo, IconoReloj,
} from './LandingIcons'
import s from './LandingView.module.css'

const FUNCIONALIDADES = [
  {
    icono: IconoCubo,
    titulo: 'Inventario que se ordena solo',
    texto: 'Cada activo se numera automáticamente según su categoría y queda enlazado a su área, proveedor, marca y modelo. Sin hojas de cálculo paralelas ni códigos duplicados.',
  },
  {
    icono: IconoRayo,
    titulo: 'Depreciación sin intervención',
    texto: 'El valor en libros se recalcula solo, mes a mes, con precisión de días exactos desde el inicio de uso. Nadie tiene que acordarse de correr nada.',
  },
  {
    icono: IconoDocumento,
    titulo: 'Bajas con respaldo obligatorio',
    texto: 'Todo retiro exige su comprobante y pasa por un período de gracia antes de volverse definitivo. Lo que sale del inventario deja evidencia.',
  },
  {
    icono: IconoGrafico,
    titulo: 'Reportes listos para contabilidad',
    texto: 'Reporte financiero y de auditoría exportables a Excel, con los saldos ya cuadrados. Se acabó el armado manual de cierre.',
  },
  {
    icono: IconoReloj,
    titulo: 'Historial que no se puede alterar',
    texto: 'Cada alta, edición, recálculo y retiro queda sellado con su fecha y su responsable. La trazabilidad no depende de la memoria de nadie.',
  },
  {
    icono: IconoCapas,
    titulo: 'Catálogos a tu medida',
    texto: 'Áreas, categorías, marcas y proveedores se adaptan a cómo opera tu empresa, no al revés. Se crean sobre la marcha, sin pedirle nada a soporte.',
  },
]

const SLIDES = [
  {
    paso: '01',
    titulo: 'Registra una vez, olvídate del resto',
    texto: 'Das de alta el activo con los datos que ya tienes a mano. El sistema asigna el número, calcula la depreciación inicial y abre su historial en el mismo movimiento.',
    puntos: ['Numeración automática por categoría', 'Catálogos que se crean al vuelo', 'Cálculo inmediato del valor en libros'],
    Arte: ArteRegistro,
  },
  {
    paso: '02',
    titulo: 'El valor se actualiza sin que nadie lo toque',
    texto: 'Una tarea programada recalcula la depreciación de todos los activos el primer día de cada mes. Tus cifras están al día aunque nadie haya abierto el sistema.',
    puntos: ['Línea recta con precisión por días', 'Recálculo mensual automático', 'Cierre sin trabajo manual acumulado'],
    Arte: ArteDepreciacion,
  },
  {
    paso: '03',
    titulo: 'Cada movimiento deja huella',
    texto: 'Altas, cambios, retiros y recálculos se guardan como eventos sellados que no se pueden editar ni borrar. Cuando llegue la auditoría, la historia ya está escrita.',
    puntos: ['Registro inmutable por activo', 'Autor y fecha en cada evento', 'Respaldo documental en los retiros'],
    Arte: ArteAuditoria,
  },
  {
    paso: '04',
    titulo: 'La información sale como la necesitas',
    texto: 'Genera el reporte financiero o el de auditoría del período y descárgalo en Excel. Los activos dados de baja se excluyen solos: los números llegan cuadrados.',
    puntos: ['Exportación directa a XLSX', 'Filtros por área, categoría y período', 'Saldos consistentes con el historial'],
    Arte: ArteReportes,
  },
]

const BENEFICIOS = [
  {
    icono: IconoRayo,
    titulo: 'Horas de cierre que recuperas',
    texto: 'El trabajo que hoy consume días de conciliación manual pasa a ejecutarse solo. Tu equipo deja de capturar datos y vuelve a analizarlos.',
  },
  {
    icono: IconoEscudo,
    titulo: 'Errores que dejan de ocurrir',
    texto: 'Las reglas contables viven dentro del sistema, no en la costumbre de quien lo opera. Un cálculo mal hecho deja de ser una posibilidad.',
  },
  {
    icono: IconoHuella,
    titulo: 'Auditorías sin sobresaltos',
    texto: 'Cuando pidan el detalle de un activo de hace tres años, la respuesta está a un clic, con su respaldo y su responsable.',
  },
  {
    icono: IconoCapas,
    titulo: 'Crece contigo, no contra ti',
    texto: 'Sumar áreas, categorías o cientos de activos no cambia tu forma de trabajar ni exige configuración nueva.',
  },
]

const SEGURIDAD = [
  {
    icono: IconoCandado,
    titulo: 'Datos aislados por empresa',
    texto: 'La información de cada empresa vive en un espacio separado dentro de la base de datos. No es un filtro que alguien pueda saltarse: son compartimentos distintos.',
  },
  {
    icono: IconoLlave,
    titulo: 'Sesiones firmadas, nunca expuestas',
    texto: 'La credencial de acceso viaja en una cookie que el navegador no deja leer a ningún script, y va firmada con la empresa a la que pertenece.',
  },
  {
    icono: IconoEscudo,
    titulo: 'Acceso protegido contra intentos masivos',
    texto: 'El sistema limita los intentos de inicio de sesión de forma centralizada, así que probar contraseñas a la fuerza deja de ser viable.',
  },
  {
    icono: IconoHuella,
    titulo: 'Cifrado de extremo a extremo en tránsito',
    texto: 'Todo el tráfico viaja cifrado con HTTPS obligatorio. Ninguna petición sale de tu navegador en texto plano.',
  },
]

const METRICAS = [
  { valor: '100%', etiqueta: 'De los cálculos, automáticos' },
  { valor: '0', etiqueta: 'Hojas de cálculo paralelas' },
  { valor: '24/7', etiqueta: 'Disponible desde cualquier navegador' },
  { valor: '∞', etiqueta: 'Historial completo, sin caducidad' },
]

export function LandingView() {
  const contenedor = useReveal()
  const [slide, setSlide] = useState(0)
  const [modalAbierto, setModalAbierto] = useState(false)

  const irA = useCallback((i) => setSlide((i + SLIDES.length) % SLIDES.length), [])

  // Avance automático: se detiene en cuanto el usuario toma el control o pide
  // menos movimiento, para no pelear con su intención ni marear a nadie.
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const t = setTimeout(() => irA(slide + 1), 7000)
    return () => clearTimeout(t)
  }, [slide, irA])

  const actual = SLIDES[slide]

  return (
    <div className={s.page} ref={contenedor}>
      <a className={s.skip} href="#contenido">Saltar al contenido</a>

      {/* ============================== NAV ============================== */}
      <header className={s.nav}>
        <div className={`${s.wrap} ${s.navInner}`}>
          <a className={s.brand} href="/">
            <span className={s.brandMark}><IconoMarca /></span>
            <span className={s.brandName}><b>Acticr</b></span>
          </a>

          <nav className={s.navLinks} aria-label="Secciones">
            <a className={s.navLink} href="#funcionalidades">Funcionalidades</a>
            <a className={s.navLink} href="#como-funciona">Cómo funciona</a>
            <a className={s.navLink} href="#beneficios">Beneficios</a>
            <a className={s.navLink} href="#seguridad">Seguridad</a>
          </nav>

          <div className={s.navActions}>
            <button type="button" className={`${s.btn} ${s.btnGhost}`}>Contáctanos</button>
            <button
              type="button"
              className={`${s.btn} ${s.btnPrimary}`}
              onClick={() => setModalAbierto(true)}
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      </header>

      <main id="contenido">
        {/* ============================= HERO ============================= */}
        <section className={s.hero}>
          <div className={s.heroGrid} />
          <div className={`${s.wrap} ${s.heroInner}`}>
            <div className={s.heroLayout}>
              <div data-reveal>
                <span className={s.eyebrow}>
                  <span className={s.eyebrowDot} />
                  Automatización contable para empresas
                </span>

                <h1 className={s.h1}>
                  Tus activos, <em>bajo control</em> sin que nadie los persiga
                </h1>

                <p className={s.lead}>
                  Acticr convierte el control de activos fijos en un proceso que
                  se ejecuta solo: calcula, registra y respalda cada movimiento
                  mientras tu equipo se dedica a decidir, no a capturar datos.
                </p>

                <div className={s.heroCtas}>
                  <button
                    type="button"
                    className={`${s.btn} ${s.btnLg} ${s.btnLight}`}
                    onClick={() => setModalAbierto(true)}
                  >
                    Iniciar sesión
                    <IconoFlecha size={18} />
                  </button>
                  <button type="button" className={`${s.btn} ${s.btnLg} ${s.btnGhost}`}>
                    Contáctanos
                  </button>
                </div>

                <div className={s.heroNotes}>
                  <span className={s.heroNote}><IconoCheck size={15} /> Sin instalar nada</span>
                  <span className={s.heroNote}><IconoCheck size={15} /> Datos aislados por empresa</span>
                  <span className={s.heroNote}><IconoCheck size={15} /> Listo para auditoría</span>
                </div>
              </div>

              {/* Mockup del panel */}
              <div data-reveal style={{ '--d': '120ms' }}>
                <div className={s.mock}>
                  <div className={s.mockBar}>
                    <span className={s.mockDot} /><span className={s.mockDot} /><span className={s.mockDot} />
                    <span className={s.mockUrl}>tuempresa.acticr.com</span>
                  </div>
                  <div className={s.mockBody}>
                    <div className={s.mockKpis}>
                      <div className={s.mockKpi}>
                        <div className={s.mockKpiLabel}>Activos</div>
                        <div className={s.mockKpiValue}>1.284</div>
                      </div>
                      <div className={s.mockKpi}>
                        <div className={s.mockKpiLabel}>Valor libros</div>
                        <div className={s.mockKpiValue}>₡ 45,7M</div>
                      </div>
                      <div className={s.mockKpi}>
                        <div className={s.mockKpiLabel}>Depreciación</div>
                        <div className={s.mockKpiValue}>Al día<span>auto</span></div>
                      </div>
                    </div>
                    <div className={s.mockRows}>
                      {[
                        ['COM-0042', 'Depreciando', 68],
                        ['MAQ-0117', 'Depreciando', 84],
                        ['VEH-0009', 'Al día', 52],
                        ['MOB-0231', 'Depreciando', 76],
                      ].map(([codigo, estado, ancho]) => (
                        <div className={s.mockRow} key={codigo}>
                          <span className={s.mockCode}>{codigo}</span>
                          <span className={s.mockLine} style={{ width: `${ancho}%` }} />
                          <span className={s.mockChip}>{estado}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================ MÉTRICAS ========================== */}
        <section className={s.stats}>
          <div className={s.wrap}>
            <div className={s.statsGrid}>
              {METRICAS.map((m, i) => (
                <div key={m.etiqueta} data-reveal style={{ '--d': `${i * 70}ms` }}>
                  <div className={s.statValue}>{m.valor}</div>
                  <div className={s.statLabel}>{m.etiqueta}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================= FUNCIONALIDADES ====================== */}
        <section className={s.section} id="funcionalidades">
          <div className={s.wrap}>
            <div className={`${s.sectionHead} ${s.sectionHeadCenter}`} data-reveal>
              <span className={s.kicker}>Funcionalidades</span>
              <h2 className={s.h2}>Todo lo que hoy haces a mano, resuelto</h2>
              <p className={s.sectionLead}>
                Cada función existe para eliminar un trabajo repetitivo, no para
                agregar otro paso al proceso.
              </p>
            </div>

            <div className={s.features}>
              {FUNCIONALIDADES.map(({ icono: Icono, titulo, texto }, i) => (
                <article className={s.feature} key={titulo} data-reveal style={{ '--d': `${(i % 3) * 90}ms` }}>
                  <div className={s.featureIcon}><Icono /></div>
                  <h3 className={s.h3}>{titulo}</h3>
                  <p className={s.featureText}>{texto}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* =========================== SLIDES ============================= */}
        <section className={`${s.section} ${s.sectionAlt}`} id="como-funciona">
          <div className={s.wrap}>
            <div className={`${s.sectionHead} ${s.sectionHeadCenter}`} data-reveal>
              <span className={s.kicker}>Cómo funciona</span>
              <h2 className={s.h2}>Cuatro pasos, y el sistema sigue solo</h2>
              <p className={s.sectionLead}>
                Desde que registras un activo hasta que entregas el reporte de
                cierre, sin trabajo manual en el medio.
              </p>
            </div>

            <div className={s.slides} data-reveal>
              <div
                className={s.slideStage}
                role="region"
                aria-roledescription="carrusel"
                aria-label="Cómo funciona Acticr"
              >
                <div className={s.slide} key={slide}>
                  <div>
                    <span className={s.slideStep}>{actual.paso}</span>
                    <h3 className={s.slideTitle}>{actual.titulo}</h3>
                    <p className={s.slideText}>{actual.texto}</p>
                    <ul className={s.slideList}>
                      {actual.puntos.map((p) => (
                        <li key={p}><IconoCheck size={17} /><span>{p}</span></li>
                      ))}
                    </ul>
                  </div>
                  <div className={s.slideArt}><actual.Arte /></div>
                </div>
              </div>

              <div className={s.slideNav}>
                <div className={s.dots} role="tablist" aria-label="Elegir paso">
                  {SLIDES.map((sl, i) => (
                    <button
                      key={sl.paso}
                      type="button"
                      role="tab"
                      aria-selected={i === slide}
                      aria-label={`Paso ${sl.paso}: ${sl.titulo}`}
                      className={`${s.dot} ${i === slide ? s.dotActive : ''}`}
                      onClick={() => irA(i)}
                    />
                  ))}
                </div>
                <button type="button" className={s.arrow} onClick={() => irA(slide - 1)} aria-label="Paso anterior">
                  <IconoFlecha dir="left" />
                </button>
                <button type="button" className={s.arrow} onClick={() => irA(slide + 1)} aria-label="Paso siguiente">
                  <IconoFlecha />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ========================== BENEFICIOS ========================== */}
        <section className={`${s.section} ${s.sectionNight}`} id="beneficios">
          <div className={s.wrap}>
            <div className={`${s.sectionHead} ${s.sectionHeadCenter}`} data-reveal>
              <span className={s.kicker}>Beneficios</span>
              <h2 className={s.h2}>Lo que cambia en tu operación</h2>
              <p className={s.sectionLead}>
                No se trata de tener otro sistema, sino de dejar de hacer el
                trabajo que un sistema debería estar haciendo por ti.
              </p>
            </div>

            <div className={s.benefits}>
              {BENEFICIOS.map(({ icono: Icono, titulo, texto }, i) => (
                <article className={s.benefit} key={titulo} data-reveal style={{ '--d': `${(i % 2) * 100}ms` }}>
                  <div className={s.benefitIcon}><Icono /></div>
                  <div>
                    <h3 className={s.benefitTitle}>{titulo}</h3>
                    <p className={s.benefitText}>{texto}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* =========================== SEGURIDAD ========================== */}
        <section className={s.section} id="seguridad">
          <div className={s.wrap}>
            <div className={s.securityLayout}>
              <div data-reveal>
                <span className={s.kicker}>Seguridad</span>
                <h2 className={s.h2}>La confianza no se promete, se construye</h2>
                <p className={s.sectionLead} style={{ marginBottom: 30 }}>
                  La información de tu empresa está separada de la de cualquier
                  otra por diseño, no por configuración.
                </p>

                <ul className={s.securityList}>
                  {SEGURIDAD.map(({ icono: Icono, titulo, texto }) => (
                    <li className={s.securityItem} key={titulo}>
                      <span className={s.securityIcon}><Icono size={19} /></span>
                      <div>
                        <h3 className={s.securityTitle}>{titulo}</h3>
                        <p className={s.securityText}>{texto}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={s.shieldArt} data-reveal style={{ '--d': '140ms' }}>
                <ArteEscudo />
              </div>
            </div>
          </div>
        </section>

        {/* ============================= CTA ============================== */}
        <section className={`${s.section} ${s.sectionAlt}`}>
          <div className={s.wrap}>
            <div className={s.cta} data-reveal>
              <h2 className={s.ctaTitle}>Deja de perseguir tus activos</h2>
              <p className={s.ctaText}>
                Empieza a trabajar con cifras que se actualizan solas, historial
                que nadie puede alterar y reportes que salen listos.
              </p>
              <div className={s.ctaBtns}>
                <button
                  type="button"
                  className={`${s.btn} ${s.btnLg} ${s.btnLight}`}
                  onClick={() => setModalAbierto(true)}
                >
                  Iniciar sesión
                  <IconoFlecha size={18} />
                </button>
                <button type="button" className={`${s.btn} ${s.btnLg} ${s.btnGhost}`}>
                  Contáctanos
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ============================ FOOTER ============================= */}
      <footer className={s.footer}>
        <div className={`${s.wrap} ${s.footerInner}`}>
          <span className={s.footerBrand}>
            <IconoMarca size={24} /> Acticr
          </span>
          <span className={s.footerNote}>
            © {new Date().getFullYear()} Acticr · Gestión de activos fijos
          </span>
        </div>
      </footer>

      {modalAbierto && <AccesoModal onCerrar={() => setModalAbierto(false)} />}
    </div>
  )
}
