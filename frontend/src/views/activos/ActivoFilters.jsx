import styles from './ActivoFilters.module.css'

export function ActivoFilters({ search, area, tipo, areas, tipos, onSearchChange, onAreaChange, onTipoChange, onClear }) {
  const hasFilters = !!(search || area || tipo)
  return (
    <div className={styles.bar}>
      <div className={styles.searchWrap}>
        <svg className={styles.searchIcon} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          className={styles.search}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por número o nombre…"
        />
      </div>
      <select className={styles.select} value={area} onChange={(e) => onAreaChange(e.target.value)}>
        <option value="">Todas las áreas</option>
        {areas.map((a) => <option key={a} value={a}>{a}</option>)}
      </select>
      <select className={styles.select} value={tipo} onChange={(e) => onTipoChange(e.target.value)}>
        <option value="">Todas las categorías</option>
        {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      {hasFilters && (
        <button type="button" className={styles.clear} onClick={onClear}>✕ Limpiar filtros</button>
      )}
    </div>
  )
}
