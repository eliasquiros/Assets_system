/* Ilustraciones de los slides. SVG inline en vez de imágenes: pesan poco, se
   ven nítidas en cualquier pantalla y heredan los tokens de color de la marca. */

export function ArteRegistro() {
  return (
    <svg viewBox="0 0 420 260" role="img" aria-label="Formulario de registro de activo con número generado automáticamente">
      <rect x="20" y="24" width="380" height="212" rx="14" fill="var(--surface)" stroke="var(--line)" />
      <rect x="44" y="52" width="120" height="9" rx="4.5" fill="var(--ink-4)" opacity=".45" />
      <rect x="44" y="76" width="332" height="42" rx="9" fill="var(--accent-soft)" stroke="var(--accent-line)" />
      <text x="60" y="102" fill="var(--accent)" fontSize="15" fontFamily="var(--font-mono)" fontWeight="600">COM-0042</text>
      <rect x="286" y="88" width="74" height="20" rx="10" fill="var(--accent)" opacity=".14" />
      <text x="298" y="102" fill="var(--accent)" fontSize="10" fontWeight="600">Automático</text>
      <rect x="44" y="134" width="158" height="34" rx="8" fill="var(--surface-sunk)" stroke="var(--line-soft)" />
      <rect x="58" y="147" width="72" height="8" rx="4" fill="var(--ink-4)" opacity=".4" />
      <rect x="218" y="134" width="158" height="34" rx="8" fill="var(--surface-sunk)" stroke="var(--line-soft)" />
      <rect x="232" y="147" width="94" height="8" rx="4" fill="var(--ink-4)" opacity=".4" />
      <rect x="44" y="184" width="332" height="34" rx="8" fill="var(--surface-sunk)" stroke="var(--line-soft)" />
      <rect x="58" y="197" width="126" height="8" rx="4" fill="var(--ink-4)" opacity=".4" />
    </svg>
  )
}

export function ArteDepreciacion() {
  return (
    <svg viewBox="0 0 420 260" role="img" aria-label="Curva de depreciación descendente calculada mes a mes">
      <line x1="52" y1="212" x2="392" y2="212" stroke="var(--line-strong)" />
      <line x1="52" y1="36" x2="52" y2="212" stroke="var(--line-strong)" />
      <defs>
        <linearGradient id="gradDep" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity=".26" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M52 58 L392 190 L392 212 L52 212 Z" fill="url(#gradDep)" />
      <path d="M52 58 L392 190" stroke="var(--accent)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <circle cx={52 + i * 68} cy={58 + i * 26.4} r="4.5" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2.2" />
        </g>
      ))}
      <rect x="256" y="72" width="126" height="46" rx="9" fill="var(--surface)" stroke="var(--accent-line)" />
      <text x="270" y="91" fill="var(--ink-3)" fontSize="9" fontWeight="600" letterSpacing=".08em">VALOR EN LIBROS</text>
      <text x="270" y="109" fill="var(--ink)" fontSize="15" fontWeight="700" fontFamily="var(--font-mono)">₡ 255.000</text>
      {['Ene', 'Mar', 'May', 'Jul', 'Sep', 'Nov'].map((m, i) => (
        <text key={m} x={52 + i * 68} y="230" fill="var(--ink-4)" fontSize="9.5" textAnchor="middle">{m}</text>
      ))}
    </svg>
  )
}

export function ArteAuditoria() {
  return (
    <svg viewBox="0 0 420 260" role="img" aria-label="Línea de tiempo de movimientos registrados de forma inmutable">
      <line x1="76" y1="42" x2="76" y2="218" stroke="var(--line-strong)" strokeDasharray="4 5" />
      {[
        { y: 52, t: 'Alta', c: 'var(--ok-fg)', b: 'var(--ok-bg)', l: 'var(--ok-line)' },
        { y: 104, t: 'Cambio de fechas', c: 'var(--accent)', b: 'var(--accent-soft)', l: 'var(--accent-line)' },
        { y: 156, t: 'Depreciación', c: 'var(--mute-fg)', b: 'var(--mute-bg)', l: 'var(--mute-line)' },
        { y: 208, t: 'Retiro', c: 'var(--warn-fg)', b: 'var(--warn-bg)', l: 'var(--warn-line)' },
      ].map((e) => (
        <g key={e.t}>
          <circle cx="76" cy={e.y} r="7.5" fill={e.b} stroke={e.c} strokeWidth="2.2" />
          <rect x="104" y={e.y - 19} width="288" height="38" rx="9" fill="var(--surface)" stroke={e.l} />
          <text x="122" y={e.y - 2} fill="var(--ink)" fontSize="11.5" fontWeight="600">{e.t}</text>
          <rect x="122" y={e.y + 6} width="104" height="6" rx="3" fill="var(--ink-4)" opacity=".32" />
          <rect x="320" y={e.y - 9} width="56" height="18" rx="9" fill={e.b} />
          <text x="331" y={e.y + 4} fill={e.c} fontSize="9" fontWeight="600" fontFamily="var(--font-mono)">sellado</text>
        </g>
      ))}
    </svg>
  )
}

export function ArteReportes() {
  return (
    <svg viewBox="0 0 420 260" role="img" aria-label="Reporte financiero exportable a hoja de cálculo">
      <rect x="34" y="30" width="352" height="200" rx="12" fill="var(--surface)" stroke="var(--line)" />
      <rect x="34" y="30" width="352" height="40" rx="12" fill="var(--surface-sunk)" />
      <path d="M34 70h352" stroke="var(--line)" />
      <text x="56" y="55" fill="var(--ink)" fontSize="12" fontWeight="650">Reporte financiero</text>
      <rect x="292" y="41" width="72" height="20" rx="10" fill="var(--ok-bg)" stroke="var(--ok-line)" />
      <text x="304" y="55" fill="var(--ok-fg)" fontSize="9.5" fontWeight="650">XLSX</text>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <path d={`M34 ${100 + i * 33}h352`} stroke="var(--line-soft)" />
          <rect x="56" y={84 + i * 33} width="96" height="7" rx="3.5" fill="var(--ink-4)" opacity=".36" />
          <rect x="188" y={84 + i * 33} width="58" height="7" rx="3.5" fill="var(--ink-4)" opacity=".26" />
          <rect x="286" y={84 + i * 33} width="78" height="7" rx="3.5" fill="var(--accent)" opacity=".42" />
        </g>
      ))}
    </svg>
  )
}

export function ArteEscudo() {
  return (
    <svg viewBox="0 0 300 300" role="img" aria-label="Escudo con datos de cada empresa aislados en compartimentos separados">
      <defs>
        <linearGradient id="gradEsc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity=".13" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity=".02" />
        </linearGradient>
      </defs>
      <path d="M150 26 46 68v82c0 63 43 122 104 140 61-18 104-77 104-140V68L150 26Z"
        fill="url(#gradEsc)" stroke="var(--accent)" strokeWidth="2.2" strokeLinejoin="round" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="86" y={96 + i * 46} width="128" height="34" rx="8"
            fill="var(--surface)" stroke="var(--accent-line)" />
          <circle cx="106" cy={113 + i * 46} r="6" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1.6" />
          <rect x="122" y={109 + i * 46} width="72" height="7" rx="3.5" fill="var(--ink-4)" opacity=".38" />
        </g>
      ))}
      <path d="M132 236h36" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" opacity=".5" />
    </svg>
  )
}
