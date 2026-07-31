// Isotipo de Acticr (la "A"): unica fuente de verdad para el logo, compartida
// entre el landing, el login y el header de la app para que sea el mismo
// signo en todas partes.
export function MarcaActicr({ width = 27, height = width * 0.6, ...props }) {
  return (
    <svg viewBox="0 0 100 60" width={width} height={height} fill="currentColor" aria-hidden="true" {...props}>
      <path fillRule="evenodd" d="M12 1H46L27 59H12A11 11 0 0 1 1 48V12A11 11 0 0 1 12 1ZM15 24a6 6 0 1 0 0 12 6 6 0 1 0 0-12Z" />
      <path d="M44 1H52L71 59H63Z" />
      <path d="M34 36H52L57 48H29Z" />
      <path d="M59 5H93a5.5 5.5 0 0 1 0 11H62Z" />
      <path d="M66 24H93a5.5 5.5 0 0 1 0 11H69Z" />
      <path d="M73 43H93a5.5 5.5 0 0 1 0 11H76Z" />
    </svg>
  )
}
