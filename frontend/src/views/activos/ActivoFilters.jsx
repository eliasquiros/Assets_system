import styles from './ActivoFilters.module.css'

export function ActivoFilters({ search, area, tipo, areas, tipos, onSearchChange, onAreaChange, onTipoChange, onClear }) {
  const hasFilters = !!(search || area || tipo)
  return (
    <div className={styles.bar}>
      <input
        className={styles.search}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Buscar por número o nombre…"
      />
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
