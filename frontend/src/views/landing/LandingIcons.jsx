/* Iconografía de la landing: SVG de trazo, 1.6px, heredan currentColor.
   Nunca emojis — no escalan, no heredan color y se ven distintos por sistema. */

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
}

export function IconoMarca({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden focusable="false">
      <rect width="32" height="32" rx="7.5" fill="currentColor" opacity=".16" />
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 7.5 8 11.5l8 4 8-4-8-4Z" />
        <path d="m8 16 8 4 8-4" />
        <path d="m8 20.5 8 4 8-4" />
      </g>
    </svg>
  )
}

export function IconoRayo({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" /></svg>
}

export function IconoEscudo({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M12 2.5 4.5 5.6v5.7c0 4.6 3.1 8.9 7.5 10.2 4.4-1.3 7.5-5.6 7.5-10.2V5.6L12 2.5Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </svg>
  )
}

export function IconoCheck({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
}

export function IconoCubo({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M12 2.8 3.8 7v10L12 21.2 20.2 17V7L12 2.8Z" />
      <path d="M3.8 7 12 11.2 20.2 7M12 11.2v10" />
    </svg>
  )
}

export function IconoGrafico({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M3.5 20.5h17M6.5 17V10M11 17V4.5M15.5 17v-4M20 17V8" />
    </svg>
  )
}

export function IconoReloj({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...base}><circle cx="12" cy="12" r="9" /><path d="M12 7v5.2l3.4 2" /></svg>
}

export function IconoDocumento({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M14 2.8H7a2 2 0 0 0-2 2v14.4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.8L14 2.8Z" />
      <path d="M13.8 3v5h5M8.6 13h6.8M8.6 16.6h4.6" />
    </svg>
  )
}

export function IconoCapas({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="m12 3 8.4 4.2L12 11.4 3.6 7.2 12 3Z" />
      <path d="m3.6 12 8.4 4.2 8.4-4.2M3.6 16.6 12 20.8l8.4-4.2" />
    </svg>
  )
}

export function IconoLlave({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="8" cy="8" r="4.2" />
      <path d="m11.2 11.2 8 8M17 17l2-2M14.4 14.4l1.6-1.6" />
    </svg>
  )
}

export function IconoHuella({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M4.6 10.4a7.6 7.6 0 0 1 14.8 2.4M6.8 19.4A9.4 9.4 0 0 0 9 13.6a3 3 0 0 1 6 0c0 1.4-.2 2.8-.6 4.1" />
      <path d="M12 13.6v1.8M17.4 18.4c.4-1.6.6-3.2.6-4.8" />
    </svg>
  )
}

export function IconoFlecha({ size = 20, dir = 'right' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}
      style={{ transform: dir === 'left' ? 'rotate(180deg)' : undefined }}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export function IconoCandado({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="4.6" y="10.4" width="14.8" height="10.2" rx="2.2" />
      <path d="M8.2 10.4V7.6a3.8 3.8 0 0 1 7.6 0v2.8M12 14.6v2.2" />
    </svg>
  )
}
