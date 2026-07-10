# Frontend — Sistema de Activos Fijos

React + Vite (JavaScript, sin TypeScript). Consume una API DRF separada (no incluida en esta carpeta) en `/api` (configurable con `VITE_API_URL`).

## Cómo correrlo

```bash
npm install
npm run dev     # servidor de desarrollo
npm test        # corre todos los tests (vitest)
npm run build   # build de producción
```

Sin backend corriendo, las vistas van a mostrar "No se pudo conectar con el servidor." — es el comportamiento esperado, no un bug.

## Estructura de carpetas

- **`lib/`** — funciones puras, sin dependencias de React. `money.js` (formato ₡), `date.js` (fechas y countdown de periodo de gracia), `validators.js` (validación de formularios).
- **`api/`** — toda la comunicación con el backend pasa por `client.js` (fetch wrapper: agrega el token, normaliza errores). `activos.js`, `bajas.js`, `reportes.js` son funciones específicas por endpoint que usan `client.js`.
- **`hooks/`** — capa de TanStack Query sobre `api/`. `useActivos.js`, `useBajas.js`, `useReportes.js`. Las vistas nunca llaman a `api/` directamente, siempre pasan por un hook.
- **`context/`** — `AuthContext` (sesión de desarrollo simulada, sin login todavía) y `ToastContext` (notificaciones tipo toast).
- **`components/`** — piezas reutilizables sin lógica de negocio: `Badge`, `FormField`, `Button`, `Spinner`, `EmptyState`, `Toast`.
- **`layout/`** — armazón de la app: `AppHeader`, `AppNav`, `AppLayout` (usa `<Outlet/>` de react-router), `useBadges` (contadores en la navegación).
- **`views/`** — una carpeta por feature, cada una con su propia vista raíz:
  - `views/activos/` — listado, filtros, crear/editar activo (modal), detalle con historial de movimientos (drawer). Vista raíz: `ActivosView.jsx`.
  - `views/reportes/` — reporte de auditoría y reporte financiero (por mes de corte). Vista raíz: `ReportesView.jsx`.
  - `views/historial/` — listado de retiros/bajas con countdown de periodo de gracia, modal para registrar un retiro y modal para revertirlo. Vista raíz: `HistorialView.jsx`.

## Cómo se arma todo (`App.jsx`)

```
QueryClientProvider → AuthProvider → ToastProvider → BrowserRouter
  /            → redirige a /activos
  /activos/*   → ActivosView (se auto-rutea: /nuevo, /:num, /:num/editar)
  /reportes    → ReportesView
  /historial/* → HistorialView (se auto-rutea: /nueva, /:id/revertir)
```

Los modales y el drawer son rutas anidadas, no estado local — por eso cada vista de feature (`ActivosView`, `HistorialView`) tiene su propio `<Routes>` interno.

## Convenciones a mantener

- Todo archivo que renderiza JSX usa `.jsx`; lógica pura usa `.js`.
- Estilos con CSS Modules (`Componente.module.css`) + variables de `styles/tokens.css`. No usar colores hardcodeados si ya existe un token.
- Ningún componente llama `fetch` directo ni importa `api/` sin pasar por un hook de `hooks/`.
- El formato de dinero y fechas siempre pasa por `lib/money.js` / `lib/date.js` — no reimplementar el formato en un componente.
- El token de auth (`VITE_DEV_TOKEN`) solo se lee dentro de `AuthContext`.

## Pendientes conocidos (no bloqueantes)

- Login real (`RF-006`) — por ahora `AuthProvider` siempre entrega una sesión fija de desarrollo.
- Las listas de opciones de filtro (área/tipo en Activos) están hardcodeadas; si el backend agrega valores nuevos hay que actualizarlas a mano o cambiarlas para que se deriven de los datos.
- El dropdown de "activo a retirar" en `RetiroModal` no filtra activos ya dados de baja.
- No hay debounce en el buscador de activos (dispara una petición por cada tecla).
