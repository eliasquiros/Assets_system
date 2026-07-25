# Frontend — Acticr (Sistema de Gestión de Activos)

React + Vite (JavaScript, sin TypeScript). Consume una API DRF separada (no incluida en esta carpeta) en `/api` (configurable con `VITE_API_URL`, pero debe quedarse relativa — ver la sección de subdominios más abajo).

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
- **`context/`** — `AuthContext` (login real contra `POST /auth/login/`, sesión persistida en `localStorage`) y `ToastContext` (notificaciones tipo toast).
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

## Enrutamiento multi-empresa por subdominio (DA16)

Cada empresa cliente vive en su propio schema de PostgreSQL y se identifica por su propio subdominio (ej. `acme.sistema.com`), resuelto por `django-tenants` a partir del header `Host` de cada petición — **antes** de que la petición llegue a cualquier vista, incluido el login. El frontend no elige ni envía ningún identificador de empresa: el subdominio ya lo implica todo.

Esto tiene dos consecuencias directas en este código:

- **`VITE_API_URL` debe quedarse relativa** (`/api`, el valor por defecto). Una URL absoluta fija mandaría las peticiones de *todas* las empresas al mismo host, sin importar desde qué subdominio se sirvió el frontend, rompiendo el enrutamiento. Ver el comentario en `.env.example`.
- `LoginView` muestra el `Host` actual (`window.location.host`) antes del formulario, para que el usuario pueda confirmar que está en la URL de su propia empresa antes de escribir su contraseña — si escribe usuario/contraseña correctos pero está en el subdominio de otra empresa, el sistema responde "usuario o contraseña incorrectos" sin distinción (RS-002: nunca se revela en qué empresa existe una cuenta).

**Para probar subdominios en desarrollo local:** los navegadores modernos ya resuelven cualquier `*.localhost` a `127.0.0.1` sin configuración adicional. `vite.config.js` declara `server.allowedHosts: ['.localhost']` para que el dev server acepte esos hosts (Vite rechaza por defecto cualquier `Host` no reconocido). Basta con abrir `http://acme.localhost:5173` en vez de `http://localhost:5173`.

## Sistema de diseño

`styles/tokens.css` es la única fuente de verdad visual. Los tokens con nombre corto (`--ink`, `--canvas`, `--accent`, `--line`, `--r-md`, `--sh-2`, `--dur-2`…) son los actuales; los `--color-*` que quedan al final del archivo son **alias de compatibilidad** para los módulos que aún los referencian — no agregar usos nuevos.

Reglas del sistema:

- **Color contenido.** Casi todo es neutro (piedra cálida). El color se reserva para tres cosas: estado (badges, avisos), foco, y la pestaña/enlace activo. La acción primaria es tinta (`--ink`), no un azul saturado: así no compite con los badges de estado.
- **Tipografía: Geist / Geist Mono** (Google Fonts, cargadas en `index.html`). Todo dato numérico —montos, fechas, números de activo, contadores— va con la clase global `.mono`, que además aplica `tabular-nums` para que las columnas de la tabla alineen dígito a dígito.
- **Elevación antes que bordes duros.** Superficies con `--sh-1`/`--sh-2` y una línea `--line`, no bordes marcados.
- **Movimiento entre 120 y 260ms** (`--dur-*` + `--ease`), siempre bajo `prefers-reduced-motion` (ya cubierto globalmente en `global.css`).
- **Iconos SVG en línea**, con trazo, nunca emojis ni fuentes de iconos.

Los controles de formulario (`input`, `select`, `textarea`) ya vienen estilizados desde `global.css`, incluido el anillo de foco y el chevron propio de los `<select>`. Un módulo solo debería ajustar tamaño y radio, no repetir el borde ni el foco.

> Cuidado al tocar el JSX de `Badge`, `Button`, `ActivoFilters` (botón "✕ Limpiar filtros") y `BajaCard` (enlace "↺ Revertir baja"): hay pruebas que localizan esos nodos de texto completos o que verifican la clase del elemento que contiene el texto directamente. Envolver ese texto en otro elemento rompe los tests aunque la vista se siga viendo igual.

## Convenciones a mantener

- Todo archivo que renderiza JSX usa `.jsx`; lógica pura usa `.js`.
- Estilos con CSS Modules (`Componente.module.css`) + variables de `styles/tokens.css`. No usar colores hardcodeados si ya existe un token.
- Ningún componente llama `fetch` directo ni importa `api/` sin pasar por un hook de `hooks/`.
- El formato de dinero y fechas siempre pasa por `lib/money.js` / `lib/date.js` — no reimplementar el formato en un componente.
- `VITE_API_URL` siempre relativa — ver la sección de subdominios arriba.

## Pendientes conocidos (no bloqueantes)

- Las listas de opciones de filtro (área/tipo en Activos) están hardcodeadas; si el backend agrega valores nuevos hay que actualizarlas a mano o cambiarlas para que se deriven de los datos.
- El dropdown de "activo a retirar" en `RetiroModal` no filtra activos ya dados de baja.
- No hay debounce en el buscador de activos (dispara una petición por cada tecla).
