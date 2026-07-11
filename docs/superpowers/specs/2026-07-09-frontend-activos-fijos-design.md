# Diseño: Implementación del frontend de Sistema de Activos Fijos

## Propósito

Traducir el prototipo visual `Sistema Activos Fijos.dc.html` (creado en claude.ai/design, proyecto `63fce348-ed48-45a8-8f5a-5840c4437070`) en una aplicación React real, organizada en `frontend/src/`, conectada mediante un cliente API contra el contrato de endpoints documentado aquí, siguiendo la arquitectura del backend definida en `docs/arquitectura/Decisiones_arquitectura.md`.

## Alcance de este avance

* Solo frontend. El backend Django (`companies`, `accounts`, `assets`, `movements`, `disposals`, `reports`) se implementa en una fase posterior.
* El frontend hace llamadas reales al contrato de endpoints definido en este documento. Mientras el backend no exista, las vistas mostrarán sus estados de carga y error reales (sin capa de datos mock que deba descartarse después).
* No se incluye pantalla de login en este avance. Se asume una sesión autenticada mediante un token de prueba (ver sección de autenticación). RF-006 (inicio de sesión) queda pendiente para una fase aparte.
* El selector de empresa en el header se implementa como elemento visual no funcional, igual que en el mockup original (no dispara ninguna acción).

## Stack

| Aspecto | Decisión |
|---|---|
| Build tool | Vite |
| Lenguaje | JavaScript (sin TypeScript, según README) |
| Ruteo | React Router |
| Estado de servidor | TanStack Query (React Query) |
| Estilos | CSS Modules + variables CSS centralizadas (tokens del mockup) |
| Cliente HTTP | `fetch` envuelto en un wrapper propio (sin axios, YAGNI) |

**Justificación de React Query:** el frontend necesita caché, invalidación y estados de carga/error consistentes contra varios endpoints (activos, bajas, reportes). Escribir eso a mano para cinco recursos distintos duplicaría lógica; React Query es la herramienta estándar para este problema y evita construir un mini-Redux a medida, en línea con el principio de diseño del proyecto de evitar sobreingeniería.

**Justificación de CSS Modules:** el prototipo original define casi todo el estilo inline. Eso es razonable en una herramienta de mockup de una sola pantalla, pero no escala a un árbol de componentes real: cambiar un color implica tocar decenas de literales repetidos. Se extraen los valores de color/tipografía/espaciado del mockup a variables CSS una sola vez, y cada componente usa clases de su propio módulo CSS. La fidelidad visual se mantiene; el mantenimiento mejora.

## Estructura de carpetas

```
frontend/
  src/
    api/
      client.js          # wrapper de fetch: base URL, header Authorization, manejo de errores
      activos.js          # listarActivos, obtenerActivo, crearActivo, editarActivo, obtenerMovimientos
      bajas.js             # listarBajas, registrarBaja, revertirBaja
      reportes.js          # generarReporteAuditoria, generarReporteFinanciero
    views/
      activos/
        ActivosView.jsx           # pantalla contenedora, arma rutas hijas (nuevo/:num/:num/editar)
        ActivoTable.jsx
        ActivoFilters.jsx          # buscador + filtros de área/tipo
        ActivoSummaryBar.jsx       # contexto del filtro, conteo, totales
        CrearActivoModal.jsx
        EditarActivoModal.jsx
        ActivoDetailDrawer.jsx     # incluye historial de movimientos
      reportes/
        ReportesView.jsx
        AuditoriaCard.jsx
        FinancieroCard.jsx
      historial/
        HistorialView.jsx
        BajaCard.jsx
        RetiroModal.jsx
        RevertModal.jsx
    components/          # UI genérica: Badge, Button, Toast, FormField, EmptyState, Spinner
    layout/
      AppHeader.jsx        # logo, empresa (no funcional), estado de conexión, usuario
      AppNav.jsx            # pestañas Activos / Reportes / Historial con badges
      AppLayout.jsx
    hooks/
      useActivos.js, useActivo.js, useBajas.js  # hooks de React Query sobre api/
      useToast.js
    lib/
      money.js              # formato ₡ es-CR
      date.js                # fmtDate, fmtRemaining (cuenta regresiva del periodo de gracia)
      validators.js           # validate() de formularios de activo/retiro
    context/
      ToastContext.jsx      # un solo toast visible a la vez, igual que el mockup
      AuthContext.jsx        # token de sesión stub + datos de usuario/empresa actuales
    App.jsx
    main.jsx
    router.jsx
  public/
  .env.example
  package.json
  vite.config.js
```

## Ruteo

Las tres pestañas del mockup son rutas de nivel superior; los modales y el drawer de detalle son rutas anidadas, no estado ad-hoc, para que el botón atrás del navegador los cierre de forma natural y un activo puntual sea enlazable:

```
/activos                    → ActivosView (tabla + filtros)
/activos/nuevo               → ActivosView + CrearActivoModal
/activos/:num                → ActivosView + ActivoDetailDrawer
/activos/:num/editar          → ActivosView + EditarActivoModal
/reportes                    → ReportesView
/historial                   → HistorialView
/historial/nueva              → HistorialView + RetiroModal
/historial/:id/revertir        → HistorialView + RevertModal
```

`/` redirige a `/activos`.

## Contrato de endpoints (propuesto)

Este contrato es un **⚠️ Supuesto**: no existe backend implementado todavía, así que estas rutas son la propuesta del frontend, a validar cuando se construyan las apps Django (`assets`, `movements`, `disposals`, `reports` — DA09). El código de reporte de errores de red del frontend está diseñado para no romperse si cambian antes de esa fase.

| Método | Ruta | Uso | Referencia |
|---|---|---|---|
| GET | `/api/activos/?search=&area=&tipo=` | Listado con filtros (RF-003) | RF-001, RF-003 |
| POST | `/api/activos/` | Registrar activo (RF-001) | RF-001, RN-001 |
| GET | `/api/activos/{num}/` | Detalle de un activo (RF-002.3) | RF-002 |
| PATCH | `/api/activos/{num}/` | Editar activo | RF-001 |
| GET | `/api/activos/{num}/movimientos/` | Historial inmutable del activo | RF-007, DA10 |
| GET | `/api/bajas/` | Listado de bajas/retiros | RF-007, DA12 |
| POST | `/api/bajas/` | Registrar retiro (queda "Pendiente") | RN-002.4 |
| POST | `/api/bajas/{id}/revertir/` | Revertir baja dentro del periodo de gracia | RN-002.4, DA12 |
| GET | `/api/reportes/auditoria/` | Reporte de auditoría (xlsx) | RF-004 |
| GET | `/api/reportes/financiero/?corte=YYYY-MM` | Reporte financiero a fecha de corte (xlsx) | RF-005 |

Los cálculos de valor en libros / depreciación acumulada / estado son responsabilidad exclusiva del backend (DA04, DA05); el frontend nunca los recalcula, solo los muestra tal como los devuelve la API.

## Autenticación (stub para este avance)

`AuthContext` guarda un token fijo de desarrollo (variable `VITE_DEV_TOKEN` en `.env`) y expone `{ token, empresa, usuario }`. El cliente API (`api/client.js`) agrega `Authorization: Bearer <token>` a cada solicitud. Cuando RF-006 se implemente en una fase futura, este contexto se reemplaza por el flujo real de login sin tocar el resto de la aplicación, porque todos los componentes consumen el token a través del contexto, nunca de una variable global.

## Manejo de carga y error

Cada vista que depende de datos del servidor (Activos, Reportes, Historial, Detalle) maneja tres estados vía React Query: `isLoading` (skeleton/spinner), `isError` (mensaje de "no se pudo conectar con el servidor" con botón de reintentar), y éxito (contenido normal). No hay estado "vacío por mock": si el backend no responde, la interfaz lo comunica explícitamente en vez de mostrar datos inventados.

## Componentes por vista (resumen funcional)

**Activos** — tabla con búsqueda por número/nombre, filtros de área y categoría, barra de resumen (conteo, costo total, valor en libros total), acciones "Ver más" (abre drawer) y "Editar" (abre modal). Botón "Registrar activo" abre modal de creación con 14 campos (RF-001.1) y validación de fecha de uso ≥ fecha de adquisición (RF-001.2).

**Reportes** — dos tarjetas independientes: auditoría (genera y exporta xlsx con vista previa, RF-004) y financiero (selector de mes de corte dentro del periodo fiscal actual, genera y exporta xlsx, RF-005).

**Historial** — lista de bajas como tarjetas, cada una con motivo, estado (Pendiente/Definitiva/Revertida), y si está pendiente, cuenta regresiva del periodo de gracia de 2 días con botón de revertir (RN-002.4). Botón "Registrar retiro" abre modal con selección de activo, motivo, descripción y documento de respaldo PDF.

**Toast** — notificación única (éxito/error) en la esquina inferior derecha, auto-oculta a los 3.6s, igual que el mockup.

## Fuera de alcance de este avance

* Backend Django (apps, modelos, endpoints reales).
* Pantalla de login / flujo de autenticación real (RF-006).
* Selector de empresa funcional (multiempresa desde el frontend).
* Subida real de archivos a Supabase Storage (el input de documento de respaldo queda conectado a la función de la API, pero la implementación del backend de almacenamiento es de una fase posterior).

## Testing

Se agregan pruebas de componente (Vitest + React Testing Library) para: validación de formulario de creación de activo, cálculo de estado de carga/error en `ActivosView`, y la cuenta regresiva del periodo de gracia en `BajaCard`. No se prueban estilos ni el layout visual pixel a pixel.
