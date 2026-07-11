# Frontend de Sistema de Activos Fijos - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the React frontend (`frontend/`) that implements the `Sistema Activos Fijos.dc.html` design as real, tested views connected to the documented DRF endpoint contract.

**Architecture:** Vite + React (JavaScript) SPA. React Router for navigation, with modals/drawer as nested routes. TanStack Query for all server state. A thin `fetch` wrapper (`api/client.js`) is the single seam through which auth tokens and error handling flow. CSS Modules + a shared token file reproduce the mockup's visual language.

**Tech Stack:** Vite, React 18, react-router-dom, @tanstack/react-query, Vitest, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom.

## Global Constraints

- Node.js >= 18 (README requirement).
- JavaScript only, no TypeScript (matches README's "React (JavaScript)").
- No axios — all HTTP goes through `frontend/src/api/client.js`.
- Default API base URL is `/api`, overridable via `VITE_API_URL`.
- Dev auth token comes from `VITE_DEV_TOKEN`, default `'dev-token'` — read only inside `AuthContext`, never elsewhere (RS002/RS003: one seam controls how the token reaches the network).
- No login screen this pass (RF-006 deferred); `AuthProvider` always supplies a session.
- Money formatting: `money(n)` → `'₡ ' + Math.round(n).toLocaleString('es-CR')`, no decimals.
- **Data shapes** (all tasks must match these exactly):
  - `Activo`: `{ num, nombre, area, tipo, costo, dep, libros, estado, fechaAdq, fechaUso, vidaUtil, origen, proveedor, serie, modelo, marca, factura }`
  - `Baja`: `{ id, activoNum, activoNombre, motivo, desc, fechaEfectiva, fechaRegistro, user, doc, estado, venceTs }`
  - `Movimiento`: `{ tipo, fecha, desc, prev, next, user }`
  - Reporte auditoría (`GET /api/reportes/auditoria/`): `{ activos: [{num, nombre, libros}], total }`
  - Reporte financiero (`GET /api/reportes/financiero/?corte=YYYY-MM`): `{ corte, activos: [{num, nombre, libros, dep}], totalLibros, totalDep }`
- **Testing strategy (layered, matches the spec's testing scope):**
  - Pure functions (`lib/*`) — direct unit tests.
  - `api/*` — tested by mocking `./client`, asserting exact path/method/body.
  - `hooks/*` — tested by mocking the relevant `api/*` module, with a real `QueryClientProvider`.
  - Views/layout components — tested by mocking the hooks module they consume, wrapped in `MemoryRouter` when they use router hooks. Per the spec, deep coverage is required only for: form validation (Crear/Retiro), loading/error state in `ActivosView`, and the grace-period countdown in `BajaCard`. Other components get one focused smoke/behavior test each — no pixel/style assertions.
- Every file that renders JSX uses the `.jsx` extension; pure logic files use `.js`.

---

## Task 1: Scaffold the Vite project and test tooling

**Files:**
- Create: `frontend/` (via `npm create vite@latest`)
- Modify: `frontend/vite.config.js`
- Modify: `frontend/package.json`
- Create: `frontend/src/test/setup.js`
- Create: `frontend/src/styles/tokens.css`
- Create: `frontend/src/styles/global.css`
- Create: `frontend/.env.example`
- Create: `frontend/src/smoke.test.js`

**Interfaces:**
- Produces: a working `npm run dev`, `npm run build`, `npm test` in `frontend/`; `--color-*` CSS custom properties in `tokens.css` that every later component may reference; `.mono` and `.page-head` utility classes in `global.css`.

- [ ] **Step 1: Scaffold the Vite React template**

Run from the repo root:
```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

- [ ] **Step 2: Install runtime and test dependencies**

```bash
npm install react-router-dom @tanstack/react-query
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 3: Configure Vitest in `vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
```

- [ ] **Step 4: Add the test setup file and a `test` script**

`frontend/src/test/setup.js`:
```js
import '@testing-library/jest-dom/vitest'
```

Add to `frontend/package.json` `scripts`:
```json
"test": "vitest run"
```

- [ ] **Step 5: Add a smoke test to verify the tooling is wired**

`frontend/src/smoke.test.js`:
```js
import { describe, expect, it } from 'vitest'

describe('tooling smoke test', () => {
  it('runs vitest with jsdom and globals', () => {
    expect(typeof document).toBe('object')
    expect(1 + 1).toBe(2)
  })
})
```

Run: `npm test` (inside `frontend/`)
Expected: `1 passed`

- [ ] **Step 6: Add design tokens and global styles**

`frontend/src/styles/tokens.css`:
```css
:root {
  --color-bg: #EEF1F6;
  --color-text: #0B2545;
  --color-navy: #13315C;
  --color-navy-dark: #0B2545;
  --color-blue: #2D6CB5;
  --color-border: #DDE3EC;
  --color-border-light: #E7ECF3;
  --color-muted: #5D6E86;
  --color-muted-2: #8493A8;
  --color-success-bg: #E4F1E9;
  --color-success-text: #1F6B4A;
  --color-success-border: #C4E0D0;
  --color-warning-bg: #FBEBCF;
  --color-warning-text: #8A5A12;
  --color-warning-border: #F0D9AE;
  --color-error-bg: #FBECEC;
  --color-error-text: #8F3A38;
  --color-error-border: #EAC9C9;
  --color-neutral-bg: #EAEEF4;
  --color-neutral-text: #41506A;
  --color-neutral-border: #D5DCE7;
  --font-sans: 'IBM Plex Sans', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
}
```

`frontend/src/styles/global.css`:
```css
* { box-sizing: border-box; }
html, body, #root { margin: 0; padding: 0; height: 100%; }
body {
  font-family: var(--font-sans);
  color: var(--color-text);
  background: var(--color-bg);
}
.mono { font-family: var(--font-mono); }
.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}
```

- [ ] **Step 7: Add `.env.example`**

`frontend/.env.example`:
```
VITE_API_URL=/api
VITE_DEV_TOKEN=dev-token
```

- [ ] **Step 8: Commit**

```bash
git add frontend
git commit -m "chore: Scaffold frontend Vite project with Vitest and design tokens"
```

---

## Task 2: `lib/money.js`

**Files:**
- Create: `frontend/src/lib/money.js`
- Test: `frontend/src/lib/money.test.js`

**Interfaces:**
- Produces: `money(n: number): string` — used by `ActivoSummaryBar`, `ActivoTable`, `ActivoDetailDrawer`, `AuditoriaCard`, `FinancieroCard`, `CrearActivoModal`, `EditarActivoModal`.

- [ ] **Step 1: Write the failing test**

`frontend/src/lib/money.test.js`:
```js
import { describe, expect, it } from 'vitest'
import { money } from './money'

describe('money', () => {
  it('formats a positive integer with the colón symbol and thousands separator', () => {
    expect(money(850000)).toBe('₡ 850.000')
  })

  it('rounds decimals', () => {
    expect(money(1234.6)).toBe('₡ 1.235')
  })

  it('treats null, undefined and NaN as zero', () => {
    expect(money(null)).toBe('₡ 0')
    expect(money(undefined)).toBe('₡ 0')
    expect(money(Number('x'))).toBe('₡ 0')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- money`
Expected: FAIL — `Failed to resolve import "./money"`

- [ ] **Step 3: Implement `money`**

`frontend/src/lib/money.js`:
```js
export function money(n) {
  const value = Math.round(Number(n) || 0)
  return '₡ ' + value.toLocaleString('es-CR')
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- money`
Expected: `3 passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/money.js frontend/src/lib/money.test.js
git commit -m "feat: Add money formatter for colón amounts"
```

---

## Task 3: `lib/date.js`

**Files:**
- Create: `frontend/src/lib/date.js`
- Test: `frontend/src/lib/date.test.js`

**Interfaces:**
- Produces: `fmtDate(iso: string): string`, `fmtRemaining(ms: number): string` — used by `ActivoTable`, `ActivoDetailDrawer`, `BajaCard`, `RevertModal`, `FinancieroCard` (month label uses its own helper, see Task 24).

- [ ] **Step 1: Write the failing test**

`frontend/src/lib/date.test.js`:
```js
import { describe, expect, it } from 'vitest'
import { fmtDate, fmtRemaining } from './date'

describe('fmtDate', () => {
  it('converts an ISO date to dd/mm/yyyy', () => {
    expect(fmtDate('2022-03-15')).toBe('15/03/2022')
  })

  it('returns an em dash for empty input', () => {
    expect(fmtDate('')).toBe('—')
    expect(fmtDate(null)).toBe('—')
  })
})

describe('fmtRemaining', () => {
  it('formats days and hours when more than a day remains', () => {
    expect(fmtRemaining(2 * 86400000 + 3 * 3600000)).toBe('2 días 3 h')
  })

  it('formats a single day without pluralizing', () => {
    expect(fmtRemaining(1 * 86400000 + 1 * 3600000)).toBe('1 día 1 h')
  })

  it('formats hours and minutes when less than a day remains', () => {
    expect(fmtRemaining(5 * 3600000 + 30 * 60000)).toBe('5 h 30 min')
  })

  it('formats minutes only when less than an hour remains', () => {
    expect(fmtRemaining(15 * 60000)).toBe('15 min')
  })

  it('returns "expirado" when time is up', () => {
    expect(fmtRemaining(0)).toBe('expirado')
    expect(fmtRemaining(-1000)).toBe('expirado')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- date`
Expected: FAIL — `Failed to resolve import "./date"`

- [ ] **Step 3: Implement `fmtDate` and `fmtRemaining`**

`frontend/src/lib/date.js`:
```js
export function fmtDate(iso) {
  if (!iso) return '—'
  const parts = String(iso).split('-')
  if (parts.length < 3) return iso
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

export function fmtRemaining(ms) {
  if (ms <= 0) return 'expirado'
  const totalMin = Math.floor(ms / 60000)
  const d = Math.floor(totalMin / 1440)
  const h = Math.floor((totalMin % 1440) / 60)
  const m = totalMin % 60
  if (d > 0) return `${d} día${d > 1 ? 's' : ''} ${h} h`
  if (h > 0) return `${h} h ${m} min`
  return `${m} min`
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- date`
Expected: `6 passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/date.js frontend/src/lib/date.test.js
git commit -m "feat: Add date formatting and grace-period countdown helpers"
```

---

## Task 4: `lib/validators.js`

**Files:**
- Create: `frontend/src/lib/validators.js`
- Test: `frontend/src/lib/validators.test.js`

**Interfaces:**
- Produces: `ACTIVO_REQUIRED_FIELDS: string[]`, `validateActivo(values: object): object`, `validateRetiro(values: object): object` — used by `CrearActivoModal`, `EditarActivoModal` (Tasks 20-21) and `RetiroModal` (Task 27).

- [ ] **Step 1: Write the failing test**

`frontend/src/lib/validators.test.js`:
```js
import { describe, expect, it } from 'vitest'
import { validateActivo, validateRetiro } from './validators'

const VALID_ACTIVO = {
  num: 'AF-0001', nombre: 'Laptop', costo: '850000', fechaAdq: '2022-03-15',
  fechaUso: '2022-04-01', vidaUtil: '5', origen: 'Compra local', proveedor: 'Dell',
  area: 'Oficinas', tipo: 'Cómputo', serie: 'X1', modelo: 'M1', marca: 'Dell', factura: 'F-1',
}

describe('validateActivo', () => {
  it('returns no errors for a fully valid activo', () => {
    expect(validateActivo(VALID_ACTIVO)).toEqual({})
  })

  it('flags every missing required field', () => {
    const errors = validateActivo({})
    expect(errors.num).toBe('Campo obligatorio')
    expect(errors.nombre).toBe('Campo obligatorio')
    expect(Object.keys(errors)).toHaveLength(14)
  })

  it('rejects a cost of zero or less', () => {
    const errors = validateActivo({ ...VALID_ACTIVO, costo: '0' })
    expect(errors.costo).toBe('Debe ser mayor a cero')
  })

  it('rejects a vida util of zero or less', () => {
    const errors = validateActivo({ ...VALID_ACTIVO, vidaUtil: '-1' })
    expect(errors.vidaUtil).toBe('Debe ser mayor a cero')
  })

  it('rejects a start-of-use date earlier than the acquisition date', () => {
    const errors = validateActivo({ ...VALID_ACTIVO, fechaAdq: '2022-04-01', fechaUso: '2022-03-15' })
    expect(errors.fechaUso).toBe('No puede ser anterior a la fecha de adquisición')
  })
})

describe('validateRetiro', () => {
  it('returns no errors for a fully valid retiro', () => {
    expect(validateRetiro({ activoNum: 'AF-0001', motivo: 'Venta', desc: 'detalle' })).toEqual({})
  })

  it('requires activoNum, motivo and a non-blank desc', () => {
    const errors = validateRetiro({ activoNum: '', motivo: '', desc: '   ' })
    expect(errors).toEqual({
      activoNum: 'Selecciona un activo',
      motivo: 'Selecciona un motivo',
      desc: 'Ingresa una descripción',
    })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- validators`
Expected: FAIL — `Failed to resolve import "./validators"`

- [ ] **Step 3: Implement the validators**

`frontend/src/lib/validators.js`:
```js
export const ACTIVO_REQUIRED_FIELDS = [
  'num', 'nombre', 'costo', 'fechaAdq', 'fechaUso', 'vidaUtil',
  'origen', 'proveedor', 'area', 'tipo', 'serie', 'modelo', 'marca', 'factura',
]

export function validateActivo(values) {
  const errors = {}
  ACTIVO_REQUIRED_FIELDS.forEach((key) => {
    const value = values[key]
    if (value === null || value === undefined || String(value).trim() === '') {
      errors[key] = 'Campo obligatorio'
    }
  })
  if (values.costo && Number(values.costo) <= 0) {
    errors.costo = 'Debe ser mayor a cero'
  }
  if (values.vidaUtil && Number(values.vidaUtil) <= 0) {
    errors.vidaUtil = 'Debe ser mayor a cero'
  }
  if (values.fechaAdq && values.fechaUso && values.fechaUso < values.fechaAdq) {
    errors.fechaUso = 'No puede ser anterior a la fecha de adquisición'
  }
  return errors
}

export function validateRetiro(values) {
  const errors = {}
  if (!values.activoNum) errors.activoNum = 'Selecciona un activo'
  if (!values.motivo) errors.motivo = 'Selecciona un motivo'
  if (!String(values.desc || '').trim()) errors.desc = 'Ingresa una descripción'
  return errors
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- validators`
Expected: `7 passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/validators.js frontend/src/lib/validators.test.js
git commit -m "feat: Add form validation for activo and retiro (RF-001.2, RN-002.4)"
```

---

## Task 5: `api/client.js`

**Files:**
- Create: `frontend/src/api/client.js`
- Test: `frontend/src/api/client.test.js`

**Interfaces:**
- Produces: `apiFetch(path: string, options?: { method?, body?, token?, headers? }): Promise<any>`, `class ApiError extends Error { status: number }` — used by every file in `api/*` (Tasks 6-8).

- [ ] **Step 1: Write the failing test**

`frontend/src/api/client.test.js`:
```js
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, ApiError } from './client'

describe('apiFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('GETs with the auth header and returns parsed JSON', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => ({ ok: true }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const data = await apiFetch('/activos/', { token: 't1' })

    expect(data).toEqual({ ok: true })
    expect(mockFetch).toHaveBeenCalledWith('/api/activos/', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer t1' },
      body: undefined,
    })
  })

  it('serializes the body and sets the method for a POST', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ num: 'AF-0001' }) })
    vi.stubGlobal('fetch', mockFetch)

    await apiFetch('/activos/', { method: 'POST', body: { num: 'AF-0001' }, token: 't1' })

    expect(mockFetch).toHaveBeenCalledWith('/api/activos/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer t1' },
      body: JSON.stringify({ num: 'AF-0001' }),
    })
  })

  it('returns null for a 204 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204 }))
    const data = await apiFetch('/bajas/1/revertir/', { method: 'POST' })
    expect(data).toBeNull()
  })

  it('throws ApiError with the server detail message on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 400, json: async () => ({ detail: 'Costo debe ser mayor a cero' }),
    }))
    await expect(apiFetch('/activos/')).rejects.toThrow('Costo debe ser mayor a cero')
  })

  it('throws a connection ApiError when fetch itself rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const error = await apiFetch('/activos/').catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.message).toBe('No se pudo conectar con el servidor')
    expect(error.status).toBe(0)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- client`
Expected: FAIL — `Failed to resolve import "./client"`

- [ ] **Step 3: Implement `apiFetch` and `ApiError`**

`frontend/src/api/client.js`:
```js
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch(path, { method = 'GET', body, token, headers } = {}) {
  const finalHeaders = { 'Content-Type': 'application/json', ...(headers || {}) }
  if (token) finalHeaders.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('No se pudo conectar con el servidor', 0)
  }

  if (!response.ok) {
    let message = `Error ${response.status}`
    try {
      const errorBody = await response.json()
      if (errorBody && errorBody.detail) message = errorBody.detail
    } catch {
      // response had no JSON body — keep the generic message
    }
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) return null
  return response.json()
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- client`
Expected: `5 passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/api/client.js frontend/src/api/client.test.js
git commit -m "feat: Add fetch wrapper with auth header and error normalization (RS003)"
```

---

## Task 6: `api/activos.js`

**Files:**
- Create: `frontend/src/api/activos.js`
- Test: `frontend/src/api/activos.test.js`

**Interfaces:**
- Consumes: `apiFetch` from `./client` (Task 5).
- Produces: `listarActivos({search,area,tipo,token}): Promise<Activo[]>`, `obtenerActivo(num,{token}): Promise<Activo>`, `crearActivo(datos,{token}): Promise<Activo>`, `editarActivo(num,datos,{token}): Promise<Activo>`, `obtenerMovimientos(num,{token}): Promise<Movimiento[]>` — used by `hooks/useActivos.js` (Task 13).

- [ ] **Step 1: Write the failing test**

`frontend/src/api/activos.test.js`:
```js
import { describe, expect, it, vi } from 'vitest'
import { apiFetch } from './client'
import { crearActivo, editarActivo, listarActivos, obtenerActivo, obtenerMovimientos } from './activos'

vi.mock('./client')

describe('api/activos', () => {
  it('listarActivos builds the query string from active filters and forwards the token', async () => {
    apiFetch.mockResolvedValue([])
    await listarActivos({ search: 'dell', area: 'Bodega Central', tipo: '', token: 't1' })
    expect(apiFetch).toHaveBeenCalledWith('/activos/?search=dell&area=Bodega+Central', { token: 't1' })
  })

  it('listarActivos omits the query string when there are no filters', async () => {
    apiFetch.mockResolvedValue([])
    await listarActivos({ token: 't1' })
    expect(apiFetch).toHaveBeenCalledWith('/activos/', { token: 't1' })
  })

  it('crearActivo POSTs to /activos/', async () => {
    apiFetch.mockResolvedValue({ num: 'AF-0001' })
    await crearActivo({ num: 'AF-0001' }, { token: 't1' })
    expect(apiFetch).toHaveBeenCalledWith('/activos/', { method: 'POST', body: { num: 'AF-0001' }, token: 't1' })
  })

  it('editarActivo PATCHes /activos/{num}/', async () => {
    apiFetch.mockResolvedValue({ num: 'AF-0001' })
    await editarActivo('AF-0001', { nombre: 'x' }, { token: 't1' })
    expect(apiFetch).toHaveBeenCalledWith('/activos/AF-0001/', { method: 'PATCH', body: { nombre: 'x' }, token: 't1' })
  })

  it('obtenerActivo and obtenerMovimientos fetch the expected paths', async () => {
    apiFetch.mockResolvedValue({})
    await obtenerActivo('AF-0001', { token: 't1' })
    await obtenerMovimientos('AF-0001', { token: 't1' })
    expect(apiFetch).toHaveBeenCalledWith('/activos/AF-0001/', { token: 't1' })
    expect(apiFetch).toHaveBeenCalledWith('/activos/AF-0001/movimientos/', { token: 't1' })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- api/activos`
Expected: FAIL — `Failed to resolve import "./activos"`

- [ ] **Step 3: Implement the endpoint functions**

`frontend/src/api/activos.js`:
```js
import { apiFetch } from './client'

export function listarActivos({ search = '', area = '', tipo = '', token } = {}) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (area) params.set('area', area)
  if (tipo) params.set('tipo', tipo)
  const qs = params.toString()
  return apiFetch(`/activos/${qs ? `?${qs}` : ''}`, { token })
}

export function obtenerActivo(num, { token } = {}) {
  return apiFetch(`/activos/${num}/`, { token })
}

export function crearActivo(datos, { token } = {}) {
  return apiFetch('/activos/', { method: 'POST', body: datos, token })
}

export function editarActivo(num, datos, { token } = {}) {
  return apiFetch(`/activos/${num}/`, { method: 'PATCH', body: datos, token })
}

export function obtenerMovimientos(num, { token } = {}) {
  return apiFetch(`/activos/${num}/movimientos/`, { token })
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- api/activos`
Expected: `5 passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/api/activos.js frontend/src/api/activos.test.js
git commit -m "feat: Add activos endpoint functions (RF-001, RF-002, RF-003)"
```

---

## Task 7: `api/bajas.js`

**Files:**
- Create: `frontend/src/api/bajas.js`
- Test: `frontend/src/api/bajas.test.js`

**Interfaces:**
- Consumes: `apiFetch` from `./client` (Task 5).
- Produces: `listarBajas({token}): Promise<Baja[]>`, `registrarBaja(datos,{token}): Promise<Baja>`, `revertirBaja(id,{token}): Promise<void>` — used by `hooks/useBajas.js` (Task 14).

- [ ] **Step 1: Write the failing test**

`frontend/src/api/bajas.test.js`:
```js
import { describe, expect, it, vi } from 'vitest'
import { apiFetch } from './client'
import { listarBajas, registrarBaja, revertirBaja } from './bajas'

vi.mock('./client')

describe('api/bajas', () => {
  it('listarBajas fetches /bajas/', async () => {
    apiFetch.mockResolvedValue([])
    await listarBajas({ token: 't1' })
    expect(apiFetch).toHaveBeenCalledWith('/bajas/', { token: 't1' })
  })

  it('registrarBaja POSTs the form data', async () => {
    const datos = { activoNum: 'AF-0001', motivo: 'Venta', desc: 'detalle' }
    apiFetch.mockResolvedValue({ id: 'BJ-2026-019' })
    await registrarBaja(datos, { token: 't1' })
    expect(apiFetch).toHaveBeenCalledWith('/bajas/', { method: 'POST', body: datos, token: 't1' })
  })

  it('revertirBaja POSTs to /bajas/{id}/revertir/', async () => {
    apiFetch.mockResolvedValue(null)
    await revertirBaja('BJ-2026-018', { token: 't1' })
    expect(apiFetch).toHaveBeenCalledWith('/bajas/BJ-2026-018/revertir/', { method: 'POST', token: 't1' })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- api/bajas`
Expected: FAIL — `Failed to resolve import "./bajas"`

- [ ] **Step 3: Implement the endpoint functions**

`frontend/src/api/bajas.js`:
```js
import { apiFetch } from './client'

export function listarBajas({ token } = {}) {
  return apiFetch('/bajas/', { token })
}

export function registrarBaja(datos, { token } = {}) {
  return apiFetch('/bajas/', { method: 'POST', body: datos, token })
}

export function revertirBaja(id, { token } = {}) {
  return apiFetch(`/bajas/${id}/revertir/`, { method: 'POST', token })
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- api/bajas`
Expected: `3 passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/api/bajas.js frontend/src/api/bajas.test.js
git commit -m "feat: Add bajas endpoint functions (RN-002.4, DA12)"
```

---

## Task 8: `api/reportes.js`

**Files:**
- Create: `frontend/src/api/reportes.js`
- Test: `frontend/src/api/reportes.test.js`

**Interfaces:**
- Consumes: `apiFetch` from `./client` (Task 5).
- Produces: `generarReporteAuditoria({token}): Promise<{activos, total}>`, `generarReporteFinanciero(corte,{token}): Promise<{corte, activos, totalLibros, totalDep}>` — used by `hooks/useReportes.js` (Task 15).

- [ ] **Step 1: Write the failing test**

`frontend/src/api/reportes.test.js`:
```js
import { describe, expect, it, vi } from 'vitest'
import { apiFetch } from './client'
import { generarReporteAuditoria, generarReporteFinanciero } from './reportes'

vi.mock('./client')

describe('api/reportes', () => {
  it('generarReporteAuditoria fetches /reportes/auditoria/', async () => {
    apiFetch.mockResolvedValue({ activos: [], total: 0 })
    await generarReporteAuditoria({ token: 't1' })
    expect(apiFetch).toHaveBeenCalledWith('/reportes/auditoria/', { token: 't1' })
  })

  it('generarReporteFinanciero fetches /reportes/financiero/ with the cutoff month', async () => {
    apiFetch.mockResolvedValue({ corte: '2026-06', activos: [], totalLibros: 0, totalDep: 0 })
    await generarReporteFinanciero('2026-06', { token: 't1' })
    expect(apiFetch).toHaveBeenCalledWith('/reportes/financiero/?corte=2026-06', { token: 't1' })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- api/reportes`
Expected: FAIL — `Failed to resolve import "./reportes"`

- [ ] **Step 3: Implement the endpoint functions**

`frontend/src/api/reportes.js`:
```js
import { apiFetch } from './client'

export function generarReporteAuditoria({ token } = {}) {
  return apiFetch('/reportes/auditoria/', { token })
}

export function generarReporteFinanciero(corte, { token } = {}) {
  return apiFetch(`/reportes/financiero/?corte=${encodeURIComponent(corte)}`, { token })
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- api/reportes`
Expected: `2 passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/api/reportes.js frontend/src/api/reportes.test.js
git commit -m "feat: Add reportes endpoint functions (RF-004, RF-005)"
```

---

## Task 9: `context/AuthContext.jsx`

**Files:**
- Create: `frontend/src/context/AuthContext.jsx`
- Test: `frontend/src/context/AuthContext.test.jsx`

**Interfaces:**
- Produces: `<AuthProvider>`, `useAuth(): { token, empresa, usuario: { nombre, cargo, iniciales } }` — used by every hook in `hooks/*` (Tasks 13-15) and `AppHeader` (Task 16).

- [ ] **Step 1: Write the failing test**

`frontend/src/context/AuthContext.test.jsx`:
```jsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

function Consumer() {
  const { token, empresa, usuario } = useAuth()
  return <div>{token} · {empresa} · {usuario.nombre}</div>
}

describe('AuthContext', () => {
  it('provides the dev session to consumers', () => {
    render(<AuthProvider><Consumer /></AuthProvider>)
    expect(screen.getByText('dev-token · Comercial Rivera S.A. · Marcela Rivera S.')).toBeInTheDocument()
  })

  it('throws when useAuth is called outside the provider', () => {
    function Broken() {
      useAuth()
      return null
    }
    expect(() => render(<Broken />)).toThrow('useAuth debe usarse dentro de AuthProvider')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- AuthContext`
Expected: FAIL — `Failed to resolve import "./AuthContext"`

- [ ] **Step 3: Implement `AuthContext`**

`frontend/src/context/AuthContext.jsx`:
```jsx
import { createContext, useContext } from 'react'

const AuthContext = createContext(null)

const DEV_SESSION = {
  token: import.meta.env.VITE_DEV_TOKEN || 'dev-token',
  empresa: 'Comercial Rivera S.A.',
  usuario: { nombre: 'Marcela Rivera S.', cargo: 'Contadora general', iniciales: 'MR' },
}

export function AuthProvider({ children }) {
  return <AuthContext.Provider value={DEV_SESSION}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- AuthContext`
Expected: `2 passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/context/AuthContext.jsx frontend/src/context/AuthContext.test.jsx
git commit -m "feat: Add stub AuthContext for dev sessions (RF-006 deferred)"
```

---

## Task 10: `context/ToastContext.jsx` + `components/Toast.jsx`

**Files:**
- Create: `frontend/src/context/ToastContext.jsx`
- Create: `frontend/src/components/Toast.jsx`
- Create: `frontend/src/components/Toast.module.css`
- Test: `frontend/src/context/ToastContext.test.jsx`

**Interfaces:**
- Produces: `<ToastProvider>`, `useToast(): { toast: {msg,type}|null, showToast(msg, type?) }`, `<Toast />` — used by every modal/mutation-triggering view (Tasks 20-21, 24, 27) and `AppLayout` (Task 17).

- [ ] **Step 1: Write the failing test**

`frontend/src/context/ToastContext.test.jsx`:
```jsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ToastProvider, useToast } from './ToastContext'
import { Toast } from '../components/Toast'

function Trigger() {
  const { showToast } = useToast()
  return <button onClick={() => showToast('Activo AF-0001 registrado correctamente', 'success')}>disparar</button>
}

describe('ToastContext + Toast', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('shows a toast after showToast is called and hides it after 3.6s', async () => {
    const user = (await import('@testing-library/user-event')).default.setup({ delay: null, advanceTimers: vi.advanceTimersByTime })
    render(<ToastProvider><Trigger /><Toast /></ToastProvider>)

    expect(screen.queryByText('Activo AF-0001 registrado correctamente')).not.toBeInTheDocument()
    await user.click(screen.getByText('disparar'))
    expect(screen.getByText('Activo AF-0001 registrado correctamente')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(3600))
    expect(screen.queryByText('Activo AF-0001 registrado correctamente')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- ToastContext`
Expected: FAIL — `Failed to resolve import "./ToastContext"`

- [ ] **Step 3: Implement `ToastContext` and `Toast`**

`frontend/src/context/ToastContext.jsx`:
```jsx
import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setToast(null), 3600)
  }, [])

  return (
    <ToastContext.Provider value={{ toast, showToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}
```

`frontend/src/components/Toast.module.css`:
```css
.wrap { position: fixed; bottom: 24px; right: 24px; z-index: 95; }
.toast {
  display: flex; align-items: center; gap: 11px;
  background: var(--color-navy-dark); color: #fff;
  border-radius: 10px; padding: 12px 16px;
  box-shadow: 0 10px 30px rgba(11,37,69,.3);
  min-width: 260px;
}
.success { border: 1px solid #1C5138; }
.error { border: 1px solid #7A2E2E; }
.icon {
  width: 22px; height: 22px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; flex: none;
}
.success .icon { background: #2E8B57; }
.error .icon { background: #B23A48; }
.msg { font-size: 13px; font-weight: 500; }
```

`frontend/src/components/Toast.jsx`:
```jsx
import { useToast } from '../context/ToastContext'
import styles from './Toast.module.css'

export function Toast() {
  const { toast } = useToast()
  if (!toast) return null
  const isError = toast.type === 'error'
  return (
    <div className={styles.wrap}>
      <div className={`${styles.toast} ${isError ? styles.error : styles.success}`}>
        <span className={styles.icon}>{isError ? '!' : '✓'}</span>
        <span className={styles.msg}>{toast.msg}</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- ToastContext`
Expected: `1 passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/context/ToastContext.jsx frontend/src/context/ToastContext.test.jsx frontend/src/components/Toast.jsx frontend/src/components/Toast.module.css
git commit -m "feat: Add single-toast notification system"
```

---

## Task 11: `components/Badge.jsx` + `components/FormField.jsx`

**Files:**
- Create: `frontend/src/components/Badge.jsx`
- Create: `frontend/src/components/Badge.module.css`
- Create: `frontend/src/components/FormField.jsx`
- Create: `frontend/src/components/FormField.module.css`
- Test: `frontend/src/components/Badge.test.jsx`
- Test: `frontend/src/components/FormField.test.jsx`

**Interfaces:**
- Produces: `<Badge label={string} />`, `<FormField label={string} error={string} required={boolean}>{children}</FormField>` — used by `ActivoTable` (Task 19), `ActivoDetailDrawer` (Task 22), `BajaCard` (Task 26), `CrearActivoModal`/`EditarActivoModal` (Tasks 20-21), `RetiroModal` (Task 27).

- [ ] **Step 1: Write the failing tests**

`frontend/src/components/Badge.test.jsx`:
```jsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'
import styles from './Badge.module.css'

describe('Badge', () => {
  it('renders the label text', () => {
    render(<Badge label="Depreciando" />)
    expect(screen.getByText('Depreciando')).toBeInTheDocument()
  })

  it('applies the success class for "Depreciando"', () => {
    render(<Badge label="Depreciando" />)
    expect(screen.getByText('Depreciando').closest('span')).toHaveClass(styles.success)
  })

  it('applies the warning class for "Pendiente de baja"', () => {
    render(<Badge label="Pendiente de baja" />)
    expect(screen.getByText('Pendiente de baja').closest('span')).toHaveClass(styles.warning)
  })

  it('falls back to the neutral class for an unknown label', () => {
    render(<Badge label="Totalmente depreciado" />)
    expect(screen.getByText('Totalmente depreciado').closest('span')).toHaveClass(styles.neutral)
  })
})
```

`frontend/src/components/FormField.test.jsx`:
```jsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FormField } from './FormField'

describe('FormField', () => {
  it('renders the label, the required marker and its children', () => {
    render(<FormField label="Costo original"><input aria-label="costo" /></FormField>)
    expect(screen.getByText('Costo original')).toBeInTheDocument()
    expect(screen.getByText('*')).toBeInTheDocument()
    expect(screen.getByLabelText('costo')).toBeInTheDocument()
  })

  it('shows the error message when provided', () => {
    render(<FormField label="Costo original" error="Debe ser mayor a cero"><input /></FormField>)
    expect(screen.getByText('Debe ser mayor a cero')).toBeInTheDocument()
  })

  it('hides the required marker when required is false', () => {
    render(<FormField label="Opcional" required={false}><input /></FormField>)
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- Badge FormField`
Expected: FAIL — both imports unresolved

- [ ] **Step 3: Implement `Badge` and `FormField`**

`frontend/src/components/Badge.module.css`:
```css
.badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 10px 3px 8px; border-radius: 999px;
  font-size: 11.5px; font-weight: 600; white-space: nowrap; line-height: 1.4;
  border: 1px solid transparent;
}
.dot { width: 6px; height: 6px; border-radius: 50%; flex: none; background: currentColor; }
.success { background: var(--color-success-bg); color: var(--color-success-text); border-color: var(--color-success-border); }
.warning { background: var(--color-warning-bg); color: var(--color-warning-text); border-color: var(--color-warning-border); }
.neutral { background: var(--color-neutral-bg); color: var(--color-neutral-text); border-color: var(--color-neutral-border); }
.dark { background: var(--color-navy-dark); color: #fff; border-color: var(--color-navy-dark); }
```

`frontend/src/components/Badge.jsx`:
```jsx
import styles from './Badge.module.css'

const VARIANTS = {
  depreciando: styles.success,
  'pendiente de baja': styles.warning,
  pendiente: styles.warning,
  definitiva: styles.dark,
  revertida: styles.neutral,
}

export function Badge({ label }) {
  const className = VARIANTS[(label || '').toLowerCase()] || styles.neutral
  return (
    <span className={`${styles.badge} ${className}`}>
      <span className={styles.dot} />
      {label}
    </span>
  )
}
```

`frontend/src/components/FormField.module.css`:
```css
.field { display: flex; flex-direction: column; gap: 6px; }
.label { font-size: 12px; font-weight: 600; color: var(--color-neutral-text); }
.required { color: #C0504D; }
.error { font-size: 11px; color: #C0504D; font-weight: 500; }
```

`frontend/src/components/FormField.jsx`:
```jsx
import styles from './FormField.module.css'

export function FormField({ label, error, required = true, children }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>
        {label} {required && <span className={styles.required}>*</span>}
      </span>
      {children}
      {error && <span className={styles.error}>{error}</span>}
    </label>
  )
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- Badge FormField`
Expected: `7 passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Badge.jsx frontend/src/components/Badge.module.css frontend/src/components/Badge.test.jsx frontend/src/components/FormField.jsx frontend/src/components/FormField.module.css frontend/src/components/FormField.test.jsx
git commit -m "feat: Add Badge and FormField components"
```

---

## Task 12: `components/Spinner.jsx` + `components/EmptyState.jsx` + `components/Button.jsx`

**Files:**
- Create: `frontend/src/components/Spinner.jsx`, `Spinner.module.css`
- Create: `frontend/src/components/EmptyState.jsx`, `EmptyState.module.css`
- Create: `frontend/src/components/Button.jsx`, `Button.module.css`
- Test: `frontend/src/components/uiPrimitives.test.jsx`

**Interfaces:**
- Produces: `<Spinner size={number} />`, `<EmptyState message={string} />`, `<Button variant="primary"|"secondary" ...rest>{children}</Button>` — used throughout `views/*` (Tasks 19-28).

- [ ] **Step 1: Write the failing test**

`frontend/src/components/uiPrimitives.test.jsx`:
```jsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Spinner } from './Spinner'
import { EmptyState } from './EmptyState'
import { Button } from './Button'

describe('Spinner', () => {
  it('renders a status role for accessibility', () => {
    render(<Spinner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})

describe('EmptyState', () => {
  it('renders the given message', () => {
    render(<EmptyState message="No se encontraron activos con los filtros actuales." />)
    expect(screen.getByText('No se encontraron activos con los filtros actuales.')).toBeInTheDocument()
  })
})

describe('Button', () => {
  it('renders children and forwards onClick', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Registrar activo</Button>)
    await userEvent.click(screen.getByText('Registrar activo'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('applies the secondary variant class', () => {
    render(<Button variant="secondary">Cancelar</Button>)
    expect(screen.getByText('Cancelar')).toHaveClass('secondary')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- uiPrimitives`
Expected: FAIL — imports unresolved

- [ ] **Step 3: Implement `Spinner`, `EmptyState`, `Button`**

`frontend/src/components/Spinner.module.css`:
```css
.spinner {
  display: inline-block; border-radius: 50%;
  border: 2px solid rgba(11,37,69,.15);
  border-top-color: var(--color-blue);
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
```

`frontend/src/components/Spinner.jsx`:
```jsx
import styles from './Spinner.module.css'

export function Spinner({ size = 14 }) {
  return (
    <span
      className={styles.spinner}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Cargando"
    />
  )
}
```

`frontend/src/components/EmptyState.module.css`:
```css
.empty { padding: 48px; text-align: center; color: var(--color-muted-2); font-size: 13px; }
```

`frontend/src/components/EmptyState.jsx`:
```jsx
import styles from './EmptyState.module.css'

export function EmptyState({ message }) {
  return <div className={styles.empty}>{message}</div>
}
```

`frontend/src/components/Button.module.css`:
```css
.button {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  border: none; border-radius: 9px; padding: 10px 16px;
  font-size: 13px; font-weight: 600; cursor: pointer;
}
.button:disabled { cursor: default; opacity: .75; }
.primary { background: var(--color-navy); color: #fff; }
.secondary { background: #fff; color: var(--color-muted); border: 1px solid var(--color-border); }
```

`frontend/src/components/Button.jsx`:
```jsx
import styles from './Button.module.css'

export function Button({ variant = 'primary', className = '', children, ...rest }) {
  return (
    <button className={`${styles.button} ${styles[variant]} ${className}`.trim()} {...rest}>
      {children}
    </button>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- uiPrimitives`
Expected: `4 passed`

Note: the `toHaveClass('secondary')` assertion works because CSS Modules in test mode (`jsdom`, no build step) fall back to returning the class name as-is when Vite's CSS module transform isn't applied identically to production hashing — Vitest's default CSS handling exposes the literal key. If this assertion fails once real hashed classnames are generated, replace it with `expect(screen.getByText('Cancelar').className).toContain('secondary')`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Spinner.jsx frontend/src/components/Spinner.module.css frontend/src/components/EmptyState.jsx frontend/src/components/EmptyState.module.css frontend/src/components/Button.jsx frontend/src/components/Button.module.css frontend/src/components/uiPrimitives.test.jsx
git commit -m "feat: Add Spinner, EmptyState and Button components"
```

---

## Task 13: `hooks/useActivos.js`

**Files:**
- Create: `frontend/src/test/queryClient.js`
- Create: `frontend/src/hooks/useActivos.js`
- Test: `frontend/src/hooks/useActivos.test.jsx`

**Interfaces:**
- Consumes: `listarActivos, obtenerActivo, crearActivo, editarActivo, obtenerMovimientos` from `../api/activos` (Task 6); `useAuth` from `../context/AuthContext` (Task 9).
- Produces: `createTestQueryClient()` (test helper, reused by Tasks 14-15), `useActivos({search,area,tipo})`, `useActivo(num)`, `useMovimientos(num)`, `useCrearActivo()`, `useEditarActivo()` — used by `views/activos/*` (Tasks 20-23) and `layout/useBadges.js` (Task 17).

- [ ] **Step 1: Write the failing test**

`frontend/src/test/queryClient.js`:
```js
import { QueryClient } from '@tanstack/react-query'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}
```

`frontend/src/hooks/useActivos.test.jsx`:
```jsx
import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from '../test/queryClient'
import { AuthProvider } from '../context/AuthContext'
import * as activosApi from '../api/activos'
import { useActivo, useActivos, useCrearActivo, useEditarActivo, useMovimientos } from './useActivos'

vi.mock('../api/activos')

function wrapper({ children }) {
  const client = createTestQueryClient()
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}

describe('useActivos', () => {
  it('calls listarActivos with the current filters and the dev token', async () => {
    activosApi.listarActivos.mockResolvedValue([{ num: 'AF-0001' }])
    const { result } = renderHook(() => useActivos({ search: 'dell', area: '', tipo: '' }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(activosApi.listarActivos).toHaveBeenCalledWith({ search: 'dell', area: '', tipo: '', token: 'dev-token' })
    expect(result.current.data).toEqual([{ num: 'AF-0001' }])
  })
})

describe('useActivo', () => {
  it('calls obtenerActivo only when num is truthy', async () => {
    activosApi.obtenerActivo.mockResolvedValue({ num: 'AF-0001' })
    const { result } = renderHook(() => useActivo('AF-0001'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(activosApi.obtenerActivo).toHaveBeenCalledWith('AF-0001', { token: 'dev-token' })
  })

  it('does not call the API when num is null', () => {
    renderHook(() => useActivo(null), { wrapper })
    expect(activosApi.obtenerActivo).not.toHaveBeenCalled()
  })
})

describe('useMovimientos', () => {
  it('calls obtenerMovimientos for the given num', async () => {
    activosApi.obtenerMovimientos.mockResolvedValue([])
    const { result } = renderHook(() => useMovimientos('AF-0001'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(activosApi.obtenerMovimientos).toHaveBeenCalledWith('AF-0001', { token: 'dev-token' })
  })
})

describe('useCrearActivo', () => {
  it('calls crearActivo with the submitted data', async () => {
    activosApi.crearActivo.mockResolvedValue({ num: 'AF-0019' })
    const { result } = renderHook(() => useCrearActivo(), { wrapper })
    await result.current.mutateAsync({ num: 'AF-0019' })
    expect(activosApi.crearActivo).toHaveBeenCalledWith({ num: 'AF-0019' }, { token: 'dev-token' })
  })
})

describe('useEditarActivo', () => {
  it('calls editarActivo with the num and the updated data', async () => {
    activosApi.editarActivo.mockResolvedValue({ num: 'AF-0001' })
    const { result } = renderHook(() => useEditarActivo(), { wrapper })
    await result.current.mutateAsync({ num: 'AF-0001', datos: { nombre: 'x' } })
    expect(activosApi.editarActivo).toHaveBeenCalledWith('AF-0001', { nombre: 'x' }, { token: 'dev-token' })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- hooks/useActivos`
Expected: FAIL — `Failed to resolve import "./useActivos"`

- [ ] **Step 3: Implement the hooks**

`frontend/src/hooks/useActivos.js`:
```js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { crearActivo, editarActivo, listarActivos, obtenerActivo, obtenerMovimientos } from '../api/activos'
import { useAuth } from '../context/AuthContext'

export function useActivos({ search = '', area = '', tipo = '' } = {}) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['activos', { search, area, tipo }],
    queryFn: () => listarActivos({ search, area, tipo, token }),
  })
}

export function useActivo(num) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['activo', num],
    queryFn: () => obtenerActivo(num, { token }),
    enabled: !!num,
  })
}

export function useMovimientos(num) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['movimientos', num],
    queryFn: () => obtenerMovimientos(num, { token }),
    enabled: !!num,
  })
}

export function useCrearActivo() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos) => crearActivo(datos, { token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activos'] }),
  })
}

export function useEditarActivo() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ num, datos }) => editarActivo(num, datos, { token }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activos'] })
      queryClient.invalidateQueries({ queryKey: ['activo', variables.num] })
    },
  })
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- hooks/useActivos`
Expected: `6 passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/test/queryClient.js frontend/src/hooks/useActivos.js frontend/src/hooks/useActivos.test.jsx
git commit -m "feat: Add React Query hooks for activos (RF-001, RF-002)"
```

---

## Task 14: `hooks/useBajas.js`

**Files:**
- Create: `frontend/src/hooks/useBajas.js`
- Test: `frontend/src/hooks/useBajas.test.jsx`

**Interfaces:**
- Consumes: `listarBajas, registrarBaja, revertirBaja` from `../api/bajas` (Task 7); `useAuth` (Task 9); `createTestQueryClient` from `../test/queryClient` (Task 13).
- Produces: `useBajas()`, `useRegistrarBaja()`, `useRevertirBaja()` — used by `views/historial/*` (Tasks 26-28) and `layout/useBadges.js` (Task 17).

- [ ] **Step 1: Write the failing test**

`frontend/src/hooks/useBajas.test.jsx`:
```jsx
import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from '../test/queryClient'
import { AuthProvider } from '../context/AuthContext'
import * as bajasApi from '../api/bajas'
import { useBajas, useRegistrarBaja, useRevertirBaja } from './useBajas'

vi.mock('../api/bajas')

function wrapper({ children }) {
  const client = createTestQueryClient()
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}

describe('useBajas', () => {
  it('calls listarBajas with the dev token', async () => {
    bajasApi.listarBajas.mockResolvedValue([{ id: 'BJ-2026-018' }])
    const { result } = renderHook(() => useBajas(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(bajasApi.listarBajas).toHaveBeenCalledWith({ token: 'dev-token' })
    expect(result.current.data).toEqual([{ id: 'BJ-2026-018' }])
  })
})

describe('useRegistrarBaja', () => {
  it('calls registrarBaja with the submitted form', async () => {
    bajasApi.registrarBaja.mockResolvedValue({ id: 'BJ-2026-019' })
    const { result } = renderHook(() => useRegistrarBaja(), { wrapper })
    const datos = { activoNum: 'AF-0001', motivo: 'Venta', desc: 'x' }
    await result.current.mutateAsync(datos)
    expect(bajasApi.registrarBaja).toHaveBeenCalledWith(datos, { token: 'dev-token' })
  })
})

describe('useRevertirBaja', () => {
  it('calls revertirBaja with the given id', async () => {
    bajasApi.revertirBaja.mockResolvedValue(null)
    const { result } = renderHook(() => useRevertirBaja(), { wrapper })
    await result.current.mutateAsync('BJ-2026-018')
    expect(bajasApi.revertirBaja).toHaveBeenCalledWith('BJ-2026-018', { token: 'dev-token' })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- hooks/useBajas`
Expected: FAIL — `Failed to resolve import "./useBajas"`

- [ ] **Step 3: Implement the hooks**

`frontend/src/hooks/useBajas.js`:
```js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listarBajas, registrarBaja, revertirBaja } from '../api/bajas'
import { useAuth } from '../context/AuthContext'

export function useBajas() {
  const { token } = useAuth()
  return useQuery({ queryKey: ['bajas'], queryFn: () => listarBajas({ token }) })
}

export function useRegistrarBaja() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos) => registrarBaja(datos, { token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bajas'] })
      queryClient.invalidateQueries({ queryKey: ['activos'] })
    },
  })
}

export function useRevertirBaja() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => revertirBaja(id, { token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bajas'] })
      queryClient.invalidateQueries({ queryKey: ['activos'] })
    },
  })
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- hooks/useBajas`
Expected: `3 passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useBajas.js frontend/src/hooks/useBajas.test.jsx
git commit -m "feat: Add React Query hooks for bajas (RN-002.4, DA12)"
```

---

## Task 15: `hooks/useReportes.js`

**Files:**
- Create: `frontend/src/hooks/useReportes.js`
- Test: `frontend/src/hooks/useReportes.test.jsx`

**Interfaces:**
- Consumes: `generarReporteAuditoria, generarReporteFinanciero` from `../api/reportes` (Task 8); `useAuth` (Task 9); `createTestQueryClient` (Task 13).
- Produces: `useGenerarAuditoria()`, `useGenerarFinanciero()` — used by `views/reportes/*` (Task 24).

- [ ] **Step 1: Write the failing test**

`frontend/src/hooks/useReportes.test.jsx`:
```jsx
import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from '../test/queryClient'
import { AuthProvider } from '../context/AuthContext'
import * as reportesApi from '../api/reportes'
import { useGenerarAuditoria, useGenerarFinanciero } from './useReportes'

vi.mock('../api/reportes')

function wrapper({ children }) {
  const client = createTestQueryClient()
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}

describe('useGenerarAuditoria', () => {
  it('calls generarReporteAuditoria with the dev token', async () => {
    reportesApi.generarReporteAuditoria.mockResolvedValue({ activos: [], total: 0 })
    const { result } = renderHook(() => useGenerarAuditoria(), { wrapper })
    await result.current.mutateAsync()
    expect(reportesApi.generarReporteAuditoria).toHaveBeenCalledWith({ token: 'dev-token' })
  })
})

describe('useGenerarFinanciero', () => {
  it('calls generarReporteFinanciero with the chosen cutoff month', async () => {
    reportesApi.generarReporteFinanciero.mockResolvedValue({ corte: '2026-06', activos: [], totalLibros: 0, totalDep: 0 })
    const { result } = renderHook(() => useGenerarFinanciero(), { wrapper })
    await result.current.mutateAsync('2026-06')
    expect(reportesApi.generarReporteFinanciero).toHaveBeenCalledWith('2026-06', { token: 'dev-token' })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- hooks/useReportes`
Expected: FAIL — `Failed to resolve import "./useReportes"`

- [ ] **Step 3: Implement the hooks**

`frontend/src/hooks/useReportes.js`:
```js
import { useMutation } from '@tanstack/react-query'
import { generarReporteAuditoria, generarReporteFinanciero } from '../api/reportes'
import { useAuth } from '../context/AuthContext'

export function useGenerarAuditoria() {
  const { token } = useAuth()
  return useMutation({ mutationFn: () => generarReporteAuditoria({ token }) })
}

export function useGenerarFinanciero() {
  const { token } = useAuth()
  return useMutation({ mutationFn: (corte) => generarReporteFinanciero(corte, { token }) })
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- hooks/useReportes`
Expected: `2 passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useReportes.js frontend/src/hooks/useReportes.test.jsx
git commit -m "feat: Add React Query hooks for reportes (RF-004, RF-005)"
```

---

## Task 16: `layout/AppHeader.jsx` + `layout/AppNav.jsx`

**Files:**
- Create: `frontend/src/layout/AppHeader.jsx`, `AppHeader.module.css`
- Create: `frontend/src/layout/AppNav.jsx`, `AppNav.module.css`
- Test: `frontend/src/layout/AppNav.test.jsx`

**Interfaces:**
- Consumes: `useAuth` from `../context/AuthContext` (Task 9).
- Produces: `<AppHeader />`, `<AppNav badges={{ '/activos': string|null, '/historial': string|null }} />` — used by `AppLayout` (Task 17).

- [ ] **Step 1: Write the failing test**

`frontend/src/layout/AppNav.test.jsx`:
```jsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppNav } from './AppNav'
import styles from './AppNav.module.css'

describe('AppNav', () => {
  it('marks the current tab as active', () => {
    render(
      <MemoryRouter initialEntries={['/activos']}>
        <AppNav badges={{}} />
      </MemoryRouter>
    )
    expect(screen.getByText('Activos').closest('a')).toHaveClass(styles.active)
    expect(screen.getByText('Reportes').closest('a')).not.toHaveClass(styles.active)
  })

  it('renders a badge only for tabs with a non-null value', () => {
    render(
      <MemoryRouter initialEntries={['/activos']}>
        <AppNav badges={{ '/activos': '18', '/historial': null }} />
      </MemoryRouter>
    )
    expect(screen.getByText('18')).toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- AppNav`
Expected: FAIL — `Failed to resolve import "./AppNav"`

- [ ] **Step 3: Implement `AppHeader` and `AppNav`**

`frontend/src/layout/AppHeader.module.css`:
```css
.header {
  position: fixed; top: 0; left: 0; right: 0; height: 60px;
  background: var(--color-navy-dark);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 22px; z-index: 60;
}
.brand { display: flex; align-items: center; gap: 13px; }
.logo {
  width: 34px; height: 34px; border-radius: 8px;
  background: linear-gradient(150deg, var(--color-blue), #1B4965);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-mono); font-weight: 600; font-size: 14px; color: #fff;
}
.title { font-size: 15px; font-weight: 600; color: #fff; }
.subtitle { font-size: 10.5px; color: #7E93B4; text-transform: uppercase; }
.company {
  display: flex; align-items: center; gap: 10px;
  background: #0F2A4E; border: 1px solid #21456F; border-radius: 9px;
  padding: 6px 12px; cursor: pointer; color: #fff;
}
.companyLabel { font-size: 9px; color: #7E93B4; text-transform: uppercase; display: block; }
.companyName { font-size: 12.5px; font-weight: 600; display: block; }
.session { display: flex; align-items: center; gap: 18px; }
.secure { font-size: 11px; font-weight: 600; color: #6FD6A0; }
.user { display: flex; align-items: center; gap: 10px; }
.userInfo { text-align: right; }
.userName { font-size: 12.5px; color: #fff; font-weight: 600; }
.userRole { font-size: 10.5px; color: #7E93B4; }
.avatar {
  width: 34px; height: 34px; border-radius: 50%; background: #1B4965;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600; color: #BBD3EE; font-family: var(--font-mono);
}
```

`frontend/src/layout/AppHeader.jsx`:
```jsx
import { useAuth } from '../context/AuthContext'
import styles from './AppHeader.module.css'

export function AppHeader() {
  const { empresa, usuario } = useAuth()
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.logo}>AF</div>
        <div>
          <div className={styles.title}>Sistema de Activos Fijos</div>
          <div className={styles.subtitle}>Gestión contable · Costa Rica</div>
        </div>
      </div>
      <button type="button" className={styles.company}>
        <span>
          <span className={styles.companyLabel}>Empresa</span>
          <span className={styles.companyName}>{empresa}</span>
        </span>
        <span aria-hidden="true">▾</span>
      </button>
      <div className={styles.session}>
        <span className={styles.secure}>Conexión cifrada · HTTPS</span>
        <div className={styles.user}>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{usuario.nombre}</div>
            <div className={styles.userRole}>{usuario.cargo}</div>
          </div>
          <div className={styles.avatar}>{usuario.iniciales}</div>
        </div>
      </div>
    </header>
  )
}
```

`frontend/src/layout/AppNav.module.css`:
```css
.nav {
  position: fixed; top: 60px; left: 0; right: 0; height: 47px;
  background: #fff; border-bottom: 1px solid var(--color-border);
  display: flex; gap: 2px; padding: 0 18px; z-index: 59;
}
.tab {
  display: flex; align-items: center; gap: 8px;
  padding: 0 14px; height: 47px;
  font-weight: 600; font-size: 13px; color: #6B7A90;
  border-bottom: 2px solid transparent; text-decoration: none;
}
.active { color: var(--color-navy-dark); border-bottom-color: var(--color-blue); }
.badge {
  font-family: var(--font-mono); font-size: 10.5px; font-weight: 600;
  min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px;
  display: inline-flex; align-items: center; justify-content: center;
  background: #E2E8F1; color: #6B7A90;
}
.active .badge { background: var(--color-blue); color: #fff; }
```

`frontend/src/layout/AppNav.jsx`:
```jsx
import { NavLink } from 'react-router-dom'
import styles from './AppNav.module.css'

const TABS = [
  { to: '/activos', label: 'Activos' },
  { to: '/reportes', label: 'Reportes' },
  { to: '/historial', label: 'Historial de baja' },
]

export function AppNav({ badges = {} }) {
  return (
    <nav className={styles.nav}>
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`.trim()}
        >
          <span>{tab.label}</span>
          {badges[tab.to] ? <span className={styles.badge}>{badges[tab.to]}</span> : null}
        </NavLink>
      ))}
    </nav>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- AppNav`
Expected: `2 passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/layout/AppHeader.jsx frontend/src/layout/AppHeader.module.css frontend/src/layout/AppNav.jsx frontend/src/layout/AppNav.module.css frontend/src/layout/AppNav.test.jsx
git commit -m "feat: Add AppHeader and AppNav layout components"
```

---

## Task 17: `layout/useBadges.js` + `layout/AppLayout.jsx`

**Files:**
- Create: `frontend/src/layout/useBadges.js`
- Create: `frontend/src/layout/AppLayout.jsx`, `AppLayout.module.css`
- Test: `frontend/src/layout/useBadges.test.jsx`

**Interfaces:**
- Consumes: `useActivos` from `../hooks/useActivos` (Task 13), `useBajas` from `../hooks/useBajas` (Task 14), `AppHeader`/`AppNav` (Task 16), `Toast` (Task 10).
- Produces: `useBadges(): { '/activos': string|null, '/historial': string|null }`, `<AppLayout />` (renders `<Outlet />`) — used by `App.jsx` (Task 29).

- [ ] **Step 1: Write the failing test**

`frontend/src/layout/useBadges.test.jsx`:
```jsx
import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useBadges } from './useBadges'
import { useActivos } from '../hooks/useActivos'
import { useBajas } from '../hooks/useBajas'

vi.mock('../hooks/useActivos')
vi.mock('../hooks/useBajas')

describe('useBadges', () => {
  it('shows the activos count and the pending-baja count', async () => {
    useActivos.mockReturnValue({ data: [{ num: 'AF-0001' }, { num: 'AF-0002' }] })
    useBajas.mockReturnValue({ data: [{ estado: 'Pendiente' }, { estado: 'Definitiva' }, { estado: 'Pendiente' }] })

    const { result } = renderHook(() => useBadges())
    await waitFor(() => {
      expect(result.current['/activos']).toBe('2')
      expect(result.current['/historial']).toBe('2')
    })
  })

  it('shows null for historial when there are no pending bajas', () => {
    useActivos.mockReturnValue({ data: [] })
    useBajas.mockReturnValue({ data: [{ estado: 'Definitiva' }] })

    const { result } = renderHook(() => useBadges())
    expect(result.current['/historial']).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- useBadges`
Expected: FAIL — `Failed to resolve import "./useBadges"`

- [ ] **Step 3: Implement `useBadges` and `AppLayout`**

`frontend/src/layout/useBadges.js`:
```js
import { useActivos } from '../hooks/useActivos'
import { useBajas } from '../hooks/useBajas'

export function useBadges() {
  const { data: activos } = useActivos()
  const { data: bajas } = useBajas()
  const pendientes = (bajas || []).filter((b) => b.estado === 'Pendiente').length
  return {
    '/activos': activos ? String(activos.length) : null,
    '/historial': pendientes > 0 ? String(pendientes) : null,
  }
}
```

`frontend/src/layout/AppLayout.module.css`:
```css
.main {
  position: fixed; top: 107px; left: 0; right: 0; bottom: 0;
  overflow: auto; padding: 26px 22px 60px;
}
```

`frontend/src/layout/AppLayout.jsx`:
```jsx
import { Outlet } from 'react-router-dom'
import { AppHeader } from './AppHeader'
import { AppNav } from './AppNav'
import { Toast } from '../components/Toast'
import { useBadges } from './useBadges'
import styles from './AppLayout.module.css'

export function AppLayout() {
  const badges = useBadges()
  return (
    <div>
      <AppHeader />
      <AppNav badges={badges} />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Toast />
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- useBadges`
Expected: `2 passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/layout/useBadges.js frontend/src/layout/useBadges.test.jsx frontend/src/layout/AppLayout.jsx frontend/src/layout/AppLayout.module.css
git commit -m "feat: Add AppLayout with tab badge counts"
```

---

## Task 18: `views/activos/ActivoFilters.jsx` + `views/activos/ActivoSummaryBar.jsx`

**Files:**
- Create: `frontend/src/views/activos/ActivoFilters.jsx`, `ActivoFilters.module.css`
- Create: `frontend/src/views/activos/ActivoSummaryBar.jsx`, `ActivoSummaryBar.module.css`
- Test: `frontend/src/views/activos/ActivoFilters.test.jsx`
- Test: `frontend/src/views/activos/ActivoSummaryBar.test.jsx`

**Interfaces:**
- Consumes: `money` from `../../lib/money` (Task 2).
- Produces: `<ActivoFilters search area tipo areas tipos onSearchChange onAreaChange onTipoChange onClear />`, `<ActivoSummaryBar label activos={Activo[]} />` — used by `ActivosView` (Task 23).

- [ ] **Step 1: Write the failing tests**

`frontend/src/views/activos/ActivoFilters.test.jsx`:
```jsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActivoFilters } from './ActivoFilters'

const BASE_PROPS = {
  search: '', area: '', tipo: '', areas: ['Bodega Central'], tipos: ['Equipo de cómputo'],
  onSearchChange: vi.fn(), onAreaChange: vi.fn(), onTipoChange: vi.fn(), onClear: vi.fn(),
}

describe('ActivoFilters', () => {
  it('calls onSearchChange as the user types', async () => {
    const onSearchChange = vi.fn()
    render(<ActivoFilters {...BASE_PROPS} onSearchChange={onSearchChange} />)
    await userEvent.type(screen.getByPlaceholderText('Buscar por número o nombre…'), 'dell')
    expect(onSearchChange).toHaveBeenCalledWith('d')
  })

  it('does not show the clear button when no filters are active', () => {
    render(<ActivoFilters {...BASE_PROPS} />)
    expect(screen.queryByText('✕ Limpiar filtros')).not.toBeInTheDocument()
  })

  it('shows and wires the clear button when a filter is active', async () => {
    const onClear = vi.fn()
    render(<ActivoFilters {...BASE_PROPS} search="dell" onClear={onClear} />)
    await userEvent.click(screen.getByText('✕ Limpiar filtros'))
    expect(onClear).toHaveBeenCalledTimes(1)
  })
})
```

`frontend/src/views/activos/ActivoSummaryBar.test.jsx`:
```jsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActivoSummaryBar } from './ActivoSummaryBar'

const ACTIVOS = [
  { num: 'AF-0001', costo: 850000, libros: 255000 },
  { num: 'AF-0002', costo: 415000, libros: 277000 },
]

describe('ActivoSummaryBar', () => {
  it('shows the count and the summed totals for the given activos', () => {
    render(<ActivoSummaryBar label="Todos los activos" activos={ACTIVOS} />)
    expect(screen.getByText('Todos los activos')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('₡ 1.265.000')).toBeInTheDocument()
    expect(screen.getByText('₡ 532.000')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- ActivoFilters ActivoSummaryBar`
Expected: FAIL — both imports unresolved

- [ ] **Step 3: Implement `ActivoFilters` and `ActivoSummaryBar`**

`frontend/src/views/activos/ActivoFilters.module.css`:
```css
.bar { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; }
.search { flex: 1; min-width: 240px; max-width: 360px; height: 40px; padding: 0 12px; border: 1px solid var(--color-border); border-radius: 8px; font-size: 13px; }
.select { height: 40px; padding: 0 12px; border: 1px solid var(--color-border); border-radius: 8px; font-size: 13px; min-width: 190px; background: #fff; }
.clear { height: 40px; padding: 0 12px; border: 1px solid var(--color-border); background: #fff; border-radius: 8px; font-size: 12.5px; font-weight: 500; color: var(--color-muted); cursor: pointer; }
```

`frontend/src/views/activos/ActivoFilters.jsx`:
```jsx
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
```

`frontend/src/views/activos/ActivoSummaryBar.module.css`:
```css
.bar { display: flex; background: #fff; border: 1px solid var(--color-border); border-radius: 10px; overflow: hidden; margin-bottom: 16px; }
.cell { flex: 1; padding: 15px 20px; border-right: 1px solid var(--color-border-light); }
.cell:last-child { border-right: none; }
.highlight { background: #F6F9FD; }
.label { font-size: 10px; font-weight: 600; color: var(--color-muted-2); text-transform: uppercase; margin-bottom: 5px; }
.value { font-size: 15px; font-weight: 600; color: var(--color-navy); }
```

`frontend/src/views/activos/ActivoSummaryBar.jsx`:
```jsx
import { money } from '../../lib/money'
import styles from './ActivoSummaryBar.module.css'

export function ActivoSummaryBar({ label, activos }) {
  const count = activos.length
  const costoTotal = activos.reduce((sum, a) => sum + a.costo, 0)
  const librosTotal = activos.reduce((sum, a) => sum + a.libros, 0)
  return (
    <div className={styles.bar}>
      <div className={styles.cell}>
        <div className={styles.label}>Contexto del filtro</div>
        <div className={styles.value}>{label}</div>
      </div>
      <div className={styles.cell}>
        <div className={styles.label}>Activos</div>
        <div className="mono">{count}</div>
      </div>
      <div className={styles.cell}>
        <div className={styles.label}>Costo original total</div>
        <div className="mono">{money(costoTotal)}</div>
      </div>
      <div className={`${styles.cell} ${styles.highlight}`}>
        <div className={styles.label}>Valor en libros total</div>
        <div className="mono">{money(librosTotal)}</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- ActivoFilters ActivoSummaryBar`
Expected: `4 passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/activos/ActivoFilters.jsx frontend/src/views/activos/ActivoFilters.module.css frontend/src/views/activos/ActivoFilters.test.jsx frontend/src/views/activos/ActivoSummaryBar.jsx frontend/src/views/activos/ActivoSummaryBar.module.css frontend/src/views/activos/ActivoSummaryBar.test.jsx
git commit -m "feat: Add Activos filters and summary bar (RF-003)"
```

---

## Task 19: `views/activos/ActivoTable.jsx`

**Files:**
- Create: `frontend/src/views/activos/ActivoTable.jsx`, `ActivoTable.module.css`
- Test: `frontend/src/views/activos/ActivoTable.test.jsx`

**Interfaces:**
- Consumes: `Badge` (Task 11), `Spinner`, `EmptyState` (Task 12), `money` (Task 2), `fmtDate` (Task 3).
- Produces: `<ActivoTable isLoading isError activos={Activo[]} />` — used by `ActivosView` (Task 23).

- [ ] **Step 1: Write the failing test**

`frontend/src/views/activos/ActivoTable.test.jsx`:
```jsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ActivoTable } from './ActivoTable'

const ACTIVOS = [
  { num: 'AF-0001', nombre: 'Laptop Dell', area: 'Oficinas', tipo: 'Cómputo', costo: 850000, libros: 255000, dep: 595000, estado: 'Depreciando', fechaAdq: '2022-03-15' },
]

function renderTable(props) {
  return render(<MemoryRouter><ActivoTable isLoading={false} isError={false} activos={[]} {...props} /></MemoryRouter>)
}

describe('ActivoTable', () => {
  it('shows a spinner while loading', () => {
    renderTable({ isLoading: true })
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows a connection error message on error', () => {
    renderTable({ isError: true })
    expect(screen.getByText('No se pudo conectar con el servidor.')).toBeInTheDocument()
  })

  it('shows an empty state when there are no activos', () => {
    renderTable({ activos: [] })
    expect(screen.getByText('No se encontraron activos con los filtros actuales.')).toBeInTheDocument()
  })

  it('renders a row per activo with formatted values', () => {
    renderTable({ activos: ACTIVOS })
    expect(screen.getByText('AF-0001')).toBeInTheDocument()
    expect(screen.getByText('Laptop Dell')).toBeInTheDocument()
    expect(screen.getByText('₡ 850.000')).toBeInTheDocument()
    expect(screen.getByText('15/03/2022')).toBeInTheDocument()
    expect(screen.getByText('Depreciando')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- ActivoTable`
Expected: FAIL — `Failed to resolve import "./ActivoTable"`

- [ ] **Step 3: Implement `ActivoTable`**

`frontend/src/views/activos/ActivoTable.module.css`:
```css
.wrap { background: #fff; border: 1px solid var(--color-border); border-radius: 10px; overflow: hidden; }
.table { width: 100%; border-collapse: collapse; min-width: 1180px; }
.table th { text-align: left; padding: 11px 14px; font-size: 10.5px; font-weight: 600; color: #6A7A92; text-transform: uppercase; background: #F5F7FB; border-bottom: 1px solid var(--color-border); }
.table td { padding: 12px 14px; border-bottom: 1px solid var(--color-border-light); font-size: 13px; }
.actions a { margin-right: 8px; }
```

`frontend/src/views/activos/ActivoTable.jsx`:
```jsx
import { Link } from 'react-router-dom'
import { Badge } from '../../components/Badge'
import { Spinner } from '../../components/Spinner'
import { EmptyState } from '../../components/EmptyState'
import { money } from '../../lib/money'
import { fmtDate } from '../../lib/date'
import styles from './ActivoTable.module.css'

export function ActivoTable({ isLoading, isError, activos }) {
  if (isLoading) return <Spinner size={24} />
  if (isError) return <EmptyState message="No se pudo conectar con el servidor." />
  if (activos.length === 0) return <EmptyState message="No se encontraron activos con los filtros actuales." />

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>N.º Activo</th><th>Descripción</th><th>Área</th><th>Categoría</th>
            <th>Costo original</th><th>Valor en libros</th><th>Dep. acumulada</th>
            <th>Estado</th><th>F. adquisición</th><th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {activos.map((a) => (
            <tr key={a.num}>
              <td className="mono">{a.num}</td>
              <td>{a.nombre}</td>
              <td>{a.area}</td>
              <td>{a.tipo}</td>
              <td className="mono">{money(a.costo)}</td>
              <td className="mono">{money(a.libros)}</td>
              <td className="mono">{money(a.dep)}</td>
              <td><Badge label={a.estado} /></td>
              <td className="mono">{fmtDate(a.fechaAdq)}</td>
              <td className={styles.actions}>
                <Link to={`/activos/${a.num}`}>Ver más</Link>
                <Link to={`/activos/${a.num}/editar`}>Editar</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- ActivoTable`
Expected: `4 passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/activos/ActivoTable.jsx frontend/src/views/activos/ActivoTable.module.css frontend/src/views/activos/ActivoTable.test.jsx
git commit -m "feat: Add ActivoTable with loading, error and empty states (RF-002.3)"
```

---

## Task 20: `views/activos/fieldDefs.js` + `views/activos/CrearActivoModal.jsx`

**Files:**
- Create: `frontend/src/views/activos/fieldDefs.js`
- Create: `frontend/src/views/activos/CrearActivoModal.jsx`, `ActivoModal.module.css`
- Test: `frontend/src/views/activos/CrearActivoModal.test.jsx`

**Interfaces:**
- Consumes: `useCrearActivo` from `../../hooks/useActivos` (Task 13), `useToast` from `../../context/ToastContext` (Task 10), `validateActivo` from `../../lib/validators` (Task 4), `FormField` (Task 11), `Button` (Task 12).
- Produces: `ACTIVO_FIELD_DEFS: {key,label,type,placeholder,mono}[]`, `BLANK_ACTIVO_FORM: object` (also used by `EditarActivoModal`, Task 21), `<CrearActivoModal onClose={fn} />` — used by `ActivosView` (Task 23).

- [ ] **Step 1: Write the failing test**

`frontend/src/views/activos/CrearActivoModal.test.jsx`:
```jsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CrearActivoModal } from './CrearActivoModal'
import { useCrearActivo } from '../../hooks/useActivos'
import { useToast } from '../../context/ToastContext'

vi.mock('../../hooks/useActivos')
vi.mock('../../context/ToastContext')

describe('CrearActivoModal', () => {
  it('shows validation errors and does not submit when required fields are blank', async () => {
    const mutateAsync = vi.fn()
    const showToast = vi.fn()
    useCrearActivo.mockReturnValue({ mutateAsync })
    useToast.mockReturnValue({ showToast })

    render(<CrearActivoModal onClose={vi.fn()} />)
    await userEvent.click(screen.getByText('Guardar activo'))

    expect(mutateAsync).not.toHaveBeenCalled()
    expect(showToast).toHaveBeenCalledWith('Faltan campos obligatorios', 'error')
    expect(screen.getAllByText('Campo obligatorio').length).toBeGreaterThan(0)
  })

  it('submits the form and closes the modal when all fields are valid', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ num: 'AF-0019' })
    const showToast = vi.fn()
    const onClose = vi.fn()
    useCrearActivo.mockReturnValue({ mutateAsync })
    useToast.mockReturnValue({ showToast })

    render(<CrearActivoModal onClose={onClose} />)
    await userEvent.type(screen.getByPlaceholderText('AF-0000'), 'AF-0019')
    await userEvent.type(screen.getByPlaceholderText('Ej. Computadora portátil…'), 'Monitor 27"')
    await userEvent.type(screen.getByPlaceholderText('0'), '250000')
    await userEvent.type(screen.getByPlaceholderText('5'), '5')
    await userEvent.type(screen.getByPlaceholderText('Compra local'), 'Compra local')
    await userEvent.type(screen.getByPlaceholderText('Nombre del proveedor'), 'PC Store')
    await userEvent.type(screen.getByPlaceholderText('Bodega Central'), 'Bodega Central')
    await userEvent.type(screen.getByPlaceholderText('Equipo de cómputo'), 'Equipo de cómputo')
    await userEvent.type(screen.getByPlaceholderText('N.º de serie'), 'S1')
    await userEvent.type(screen.getByPlaceholderText('Modelo'), 'M1')
    await userEvent.type(screen.getByPlaceholderText('Marca'), 'Dell')
    await userEvent.type(screen.getByPlaceholderText('F-0000'), 'F-1')
    const [fechaAdq, fechaUso] = screen.getAllByDisplayValue('')
    await userEvent.type(fechaAdq, '2026-01-01')
    await userEvent.type(fechaUso, '2026-01-05')

    await userEvent.click(screen.getByText('Guardar activo'))

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ num: 'AF-0019', costo: 250000, vidaUtil: 5 }))
    expect(showToast).toHaveBeenCalledWith('Activo AF-0019 registrado correctamente', 'success')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- CrearActivoModal`
Expected: FAIL — `Failed to resolve import "./CrearActivoModal"`

- [ ] **Step 3: Implement `fieldDefs` and `CrearActivoModal`**

`frontend/src/views/activos/fieldDefs.js`:
```js
export const ACTIVO_FIELD_DEFS = [
  { key: 'num', label: 'Número de activo', type: 'text', placeholder: 'AF-0000', mono: true },
  { key: 'nombre', label: 'Nombre / descripción', type: 'text', placeholder: 'Ej. Computadora portátil…' },
  { key: 'costo', label: 'Costo original (₡)', type: 'number', placeholder: '0', mono: true },
  { key: 'fechaAdq', label: 'Fecha de adquisición', type: 'date', placeholder: '' },
  { key: 'fechaUso', label: 'Fecha de inicio de uso', type: 'date', placeholder: '' },
  { key: 'vidaUtil', label: 'Vida útil (años)', type: 'number', placeholder: '5', mono: true },
  { key: 'origen', label: 'Origen', type: 'text', placeholder: 'Compra local' },
  { key: 'proveedor', label: 'Proveedor', type: 'text', placeholder: 'Nombre del proveedor' },
  { key: 'area', label: 'Área', type: 'text', placeholder: 'Bodega Central' },
  { key: 'tipo', label: 'Tipo / categoría', type: 'text', placeholder: 'Equipo de cómputo' },
  { key: 'serie', label: 'Serie', type: 'text', placeholder: 'N.º de serie', mono: true },
  { key: 'modelo', label: 'Modelo', type: 'text', placeholder: 'Modelo' },
  { key: 'marca', label: 'Marca', type: 'text', placeholder: 'Marca' },
  { key: 'factura', label: 'N.º de factura', type: 'text', placeholder: 'F-0000', mono: true },
]

export const BLANK_ACTIVO_FORM = ACTIVO_FIELD_DEFS.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {})
```

`frontend/src/views/activos/ActivoModal.module.css`:
```css
.overlay { position: fixed; inset: 0; background: rgba(11,37,69,.42); z-index: 85; display: flex; align-items: flex-start; justify-content: center; padding: 40px 20px; overflow-y: auto; }
.modal { width: 960px; max-width: 100%; background: #fff; border-radius: 12px; margin: auto; }
.modal h2 { padding: 18px 22px; margin: 0; border-bottom: 1px solid var(--color-border-light); font-size: 16px; }
.grid { padding: 22px; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px 18px; }
.grid input, .grid textarea, .grid select { height: 40px; padding: 0 12px; border: 1px solid var(--color-border); border-radius: 7px; font-size: 13.5px; width: 100%; }
.actions { padding: 16px 22px; border-top: 1px solid var(--color-border-light); display: flex; justify-content: flex-end; gap: 10px; }
```

`frontend/src/views/activos/CrearActivoModal.jsx`:
```jsx
import { useState } from 'react'
import { useCrearActivo } from '../../hooks/useActivos'
import { useToast } from '../../context/ToastContext'
import { validateActivo } from '../../lib/validators'
import { FormField } from '../../components/FormField'
import { Button } from '../../components/Button'
import { ACTIVO_FIELD_DEFS, BLANK_ACTIVO_FORM } from './fieldDefs'
import styles from './ActivoModal.module.css'

export function CrearActivoModal({ onClose }) {
  const [form, setForm] = useState(BLANK_ACTIVO_FORM)
  const [errors, setErrors] = useState({})
  const crear = useCrearActivo()
  const { showToast } = useToast()

  function handleChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validateActivo(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      showToast('Faltan campos obligatorios', 'error')
      return
    }
    try {
      const datos = { ...form, costo: Number(form.costo), vidaUtil: Number(form.vidaUtil) }
      await crear.mutateAsync(datos)
      showToast(`Activo ${form.num} registrado correctamente`, 'success')
      onClose()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Registrar nuevo activo</h2>
        <div className={styles.grid}>
          {ACTIVO_FIELD_DEFS.map((f) => (
            <FormField key={f.key} label={f.label} error={errors[f.key]}>
              <input
                type={f.type}
                value={form[f.key]}
                placeholder={f.placeholder}
                onChange={(e) => handleChange(f.key, e.target.value)}
              />
            </FormField>
          ))}
        </div>
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Guardar activo</Button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- CrearActivoModal`
Expected: `2 passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/activos/fieldDefs.js frontend/src/views/activos/CrearActivoModal.jsx frontend/src/views/activos/ActivoModal.module.css frontend/src/views/activos/CrearActivoModal.test.jsx
git commit -m "feat: Add CrearActivoModal with validation (RF-001.1, RF-001.2)"
```

---

## Task 21: `views/activos/EditarActivoModal.jsx`

**Files:**
- Create: `frontend/src/views/activos/EditarActivoModal.jsx`
- Test: `frontend/src/views/activos/EditarActivoModal.test.jsx`

**Interfaces:**
- Consumes: `useActivo, useEditarActivo` from `../../hooks/useActivos` (Task 13), `useToast` (Task 10), `validateActivo` (Task 4), `FormField` (Task 11), `Button` (Task 12), `ACTIVO_FIELD_DEFS` (Task 20), `ActivoModal.module.css` (Task 20).
- Produces: `<EditarActivoModal onClose={fn} />` (reads `num` via `useParams`) — used by `ActivosView` (Task 23).

- [ ] **Step 1: Write the failing test**

`frontend/src/views/activos/EditarActivoModal.test.jsx`:
```jsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { EditarActivoModal } from './EditarActivoModal'
import { useActivo, useEditarActivo } from '../../hooks/useActivos'
import { useToast } from '../../context/ToastContext'

vi.mock('../../hooks/useActivos')
vi.mock('../../context/ToastContext')

const ACTIVO = {
  num: 'AF-0001', nombre: 'Laptop Dell', costo: 850000, dep: 595000, area: 'Oficinas',
  tipo: 'Cómputo', fechaAdq: '2022-03-15', fechaUso: '2022-04-01', vidaUtil: 5,
  origen: 'Compra local', proveedor: 'Dell CR', serie: 'S1', modelo: 'M1', marca: 'Dell', factura: 'F-1',
}

function renderModal(onClose = vi.fn()) {
  return render(
    <MemoryRouter initialEntries={['/activos/AF-0001/editar']}>
      <Routes>
        <Route path="/activos/:num/editar" element={<EditarActivoModal onClose={onClose} />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('EditarActivoModal', () => {
  it('pre-fills the form with the fetched activo', () => {
    useActivo.mockReturnValue({ data: ACTIVO })
    useEditarActivo.mockReturnValue({ mutateAsync: vi.fn() })
    useToast.mockReturnValue({ showToast: vi.fn() })

    renderModal()
    expect(screen.getByDisplayValue('Laptop Dell')).toBeInTheDocument()
    expect(screen.getByDisplayValue('850000')).toBeInTheDocument()
  })

  it('submits the edited data and closes on success', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(ACTIVO)
    const showToast = vi.fn()
    const onClose = vi.fn()
    useActivo.mockReturnValue({ data: ACTIVO })
    useEditarActivo.mockReturnValue({ mutateAsync })
    useToast.mockReturnValue({ showToast })

    renderModal(onClose)
    await userEvent.click(screen.getByText('Guardar cambios'))

    expect(mutateAsync).toHaveBeenCalledWith({ num: 'AF-0001', datos: expect.objectContaining({ nombre: 'Laptop Dell' }) })
    expect(showToast).toHaveBeenCalledWith('Activo AF-0001 actualizado correctamente', 'success')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- EditarActivoModal`
Expected: FAIL — `Failed to resolve import "./EditarActivoModal"`

- [ ] **Step 3: Implement `EditarActivoModal`**

`frontend/src/views/activos/EditarActivoModal.jsx`:
```jsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useActivo, useEditarActivo } from '../../hooks/useActivos'
import { useToast } from '../../context/ToastContext'
import { validateActivo } from '../../lib/validators'
import { FormField } from '../../components/FormField'
import { Button } from '../../components/Button'
import { ACTIVO_FIELD_DEFS } from './fieldDefs'
import styles from './ActivoModal.module.css'

export function EditarActivoModal({ onClose }) {
  const { num } = useParams()
  const { data: activo } = useActivo(num)
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})
  const editar = useEditarActivo()
  const { showToast } = useToast()

  useEffect(() => {
    if (activo) setForm(activo)
  }, [activo])

  if (!form) return null

  function handleChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validateActivo(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      showToast('Revisa los campos marcados', 'error')
      return
    }
    try {
      const datos = { ...form, costo: Number(form.costo), vidaUtil: Number(form.vidaUtil) }
      await editar.mutateAsync({ num, datos })
      showToast(`Activo ${form.num} actualizado correctamente`, 'success')
      onClose()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Editar activo</h2>
        <div className={styles.grid}>
          {ACTIVO_FIELD_DEFS.map((f) => (
            <FormField key={f.key} label={f.label} error={errors[f.key]}>
              <input
                type={f.type}
                value={form[f.key] ?? ''}
                onChange={(e) => handleChange(f.key, e.target.value)}
              />
            </FormField>
          ))}
        </div>
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Guardar cambios</Button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- EditarActivoModal`
Expected: `2 passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/activos/EditarActivoModal.jsx frontend/src/views/activos/EditarActivoModal.test.jsx
git commit -m "feat: Add EditarActivoModal (RF-001)"
```

---

## Task 22: `views/activos/ActivoDetailDrawer.jsx`

**Files:**
- Create: `frontend/src/views/activos/ActivoDetailDrawer.jsx`, `ActivoDetailDrawer.module.css`
- Test: `frontend/src/views/activos/ActivoDetailDrawer.test.jsx`

**Interfaces:**
- Consumes: `useActivo, useMovimientos` from `../../hooks/useActivos` (Task 13), `Badge` (Task 11), `Spinner` (Task 12), `money` (Task 2), `fmtDate` (Task 3).
- Produces: `<ActivoDetailDrawer onClose={fn} />` (reads `num` via `useParams`) — used by `ActivosView` (Task 23).

- [ ] **Step 1: Write the failing test**

`frontend/src/views/activos/ActivoDetailDrawer.test.jsx`:
```jsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ActivoDetailDrawer } from './ActivoDetailDrawer'
import { useActivo, useMovimientos } from '../../hooks/useActivos'

vi.mock('../../hooks/useActivos')

const ACTIVO = {
  num: 'AF-0001', nombre: 'Laptop Dell', estado: 'Depreciando', costo: 850000, libros: 255000, dep: 595000,
  area: 'Oficinas', tipo: 'Cómputo', fechaAdq: '2022-03-15', fechaUso: '2022-04-01',
}
const MOVIMIENTOS = [{ tipo: 'Alta / Registro inicial', fecha: '2022-03-15', desc: 'Registro inicial del activo', prev: '—', next: '₡ 850.000', user: 'C. Jiménez' }]

function renderDrawer() {
  return render(
    <MemoryRouter initialEntries={['/activos/AF-0001']}>
      <Routes>
        <Route path="/activos/:num" element={<ActivoDetailDrawer onClose={vi.fn()} />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ActivoDetailDrawer', () => {
  it('shows a spinner while the activo is loading', () => {
    useActivo.mockReturnValue({ data: undefined, isLoading: true })
    useMovimientos.mockReturnValue({ data: undefined })
    renderDrawer()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows the activo values and its movement history once loaded', () => {
    useActivo.mockReturnValue({ data: ACTIVO, isLoading: false })
    useMovimientos.mockReturnValue({ data: MOVIMIENTOS })
    renderDrawer()
    expect(screen.getByText('Laptop Dell')).toBeInTheDocument()
    expect(screen.getByText('₡ 255.000')).toBeInTheDocument()
    expect(screen.getByText('Alta / Registro inicial')).toBeInTheDocument()
    expect(screen.getByText('Registro inicial del activo')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- ActivoDetailDrawer`
Expected: FAIL — `Failed to resolve import "./ActivoDetailDrawer"`

- [ ] **Step 3: Implement `ActivoDetailDrawer`**

`frontend/src/views/activos/ActivoDetailDrawer.module.css`:
```css
.overlay { position: fixed; inset: 0; background: rgba(11,37,69,.42); z-index: 80; }
.drawer { position: absolute; top: 0; right: 0; bottom: 0; width: 480px; max-width: 92vw; background: #fff; overflow-y: auto; padding: 20px 22px; }
.values { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 22px; }
.ficha { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 22px; }
.label { font-size: 10.5px; color: var(--color-muted-2); margin-bottom: 3px; }
.histItem { padding-bottom: 16px; }
.histTop { display: flex; justify-content: space-between; gap: 10px; font-size: 13px; font-weight: 600; }
.histDesc { font-size: 12px; color: var(--color-muted); margin: 3px 0 5px; }
```

`frontend/src/views/activos/ActivoDetailDrawer.jsx`:
```jsx
import { useParams } from 'react-router-dom'
import { useActivo, useMovimientos } from '../../hooks/useActivos'
import { Badge } from '../../components/Badge'
import { Spinner } from '../../components/Spinner'
import { money } from '../../lib/money'
import { fmtDate } from '../../lib/date'
import styles from './ActivoDetailDrawer.module.css'

export function ActivoDetailDrawer({ onClose }) {
  const { num } = useParams()
  const { data: activo, isLoading } = useActivo(num)
  const { data: movimientos } = useMovimientos(num)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {isLoading || !activo ? (
          <Spinner size={24} />
        ) : (
          <>
            <div>
              <div className="mono">{activo.num}</div>
              <div style={{ fontSize: 17, fontWeight: 600 }}>{activo.nombre}</div>
              <div style={{ marginTop: 10 }}><Badge label={activo.estado} /></div>
            </div>
            <div className={styles.values}>
              <div><div className={styles.label}>Costo original</div><div className="mono">{money(activo.costo)}</div></div>
              <div><div className={styles.label}>Valor en libros</div><div className="mono">{money(activo.libros)}</div></div>
              <div><div className={styles.label}>Dep. acumulada</div><div className="mono">{money(activo.dep)}</div></div>
            </div>
            <div className={styles.ficha}>
              <div><div className={styles.label}>Área</div><div>{activo.area}</div></div>
              <div><div className={styles.label}>Categoría</div><div>{activo.tipo}</div></div>
              <div><div className={styles.label}>F. adquisición</div><div className="mono">{fmtDate(activo.fechaAdq)}</div></div>
              <div><div className={styles.label}>Inicio de uso</div><div className="mono">{fmtDate(activo.fechaUso)}</div></div>
            </div>
            <div>
              <div className={styles.label}>Historial de movimientos</div>
              {(movimientos || []).map((h, i) => (
                <div key={i} className={styles.histItem}>
                  <div className={styles.histTop}>
                    <span>{h.tipo}</span>
                    <span className="mono">{fmtDate(h.fecha)}</span>
                  </div>
                  <div className={styles.histDesc}>{h.desc}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- ActivoDetailDrawer`
Expected: `2 passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/activos/ActivoDetailDrawer.jsx frontend/src/views/activos/ActivoDetailDrawer.module.css frontend/src/views/activos/ActivoDetailDrawer.test.jsx
git commit -m "feat: Add ActivoDetailDrawer with movement history (RF-002.3, RF-007)"
```

---

## Task 23: `views/activos/ActivosView.jsx`

**Files:**
- Create: `frontend/src/views/activos/ActivosView.jsx`
- Test: `frontend/src/views/activos/ActivosView.test.jsx`

**Interfaces:**
- Consumes: `useActivos` (Task 13), `ActivoFilters`, `ActivoSummaryBar` (Task 18), `ActivoTable` (Task 19), `CrearActivoModal` (Task 20), `EditarActivoModal` (Task 21), `ActivoDetailDrawer` (Task 22), `Button` (Task 12).
- Produces: `<ActivosView />` (self-routes `nuevo`, `:num`, `:num/editar` via a nested `<Routes>`) — mounted at `activos/*` by `App.jsx` (Task 29).

- [ ] **Step 1: Write the failing test**

`frontend/src/views/activos/ActivosView.test.jsx`:
```jsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ActivosView } from './ActivosView'
import { useActivos } from '../../hooks/useActivos'

vi.mock('../../hooks/useActivos')
vi.mock('../../context/ToastContext', () => ({ useToast: () => ({ showToast: vi.fn() }) }))

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/activos/*" element={<ActivosView />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ActivosView', () => {
  it('shows the table in a loading state while the query is pending', () => {
    useActivos.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    renderAt('/activos')
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows a connection error when the query fails', () => {
    useActivos.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    renderAt('/activos')
    expect(screen.getByText('No se pudo conectar con el servidor.')).toBeInTheDocument()
  })

  it('renders the fetched activos once the query succeeds', () => {
    useActivos.mockReturnValue({
      data: [{ num: 'AF-0001', nombre: 'Laptop Dell', area: 'Oficinas', tipo: 'Cómputo', costo: 850000, libros: 255000, dep: 595000, estado: 'Depreciando', fechaAdq: '2022-03-15' }],
      isLoading: false, isError: false,
    })
    renderAt('/activos')
    expect(screen.getByText('AF-0001')).toBeInTheDocument()
    expect(screen.getByText('Todos los activos')).toBeInTheDocument()
  })

  it('opens the CrearActivoModal at /activos/nuevo', () => {
    useActivos.mockReturnValue({ data: [], isLoading: false, isError: false })
    renderAt('/activos/nuevo')
    expect(screen.getByText('Registrar nuevo activo')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- ActivosView`
Expected: FAIL — `Failed to resolve import "./ActivosView"`

- [ ] **Step 3: Implement `ActivosView`**

`frontend/src/views/activos/ActivosView.jsx`:
```jsx
import { useState } from 'react'
import { Route, Routes, useNavigate } from 'react-router-dom'
import { useActivos } from '../../hooks/useActivos'
import { ActivoFilters } from './ActivoFilters'
import { ActivoSummaryBar } from './ActivoSummaryBar'
import { ActivoTable } from './ActivoTable'
import { CrearActivoModal } from './CrearActivoModal'
import { EditarActivoModal } from './EditarActivoModal'
import { ActivoDetailDrawer } from './ActivoDetailDrawer'
import { Button } from '../../components/Button'

const AREAS = ['Bodega Central', 'Oficinas Administrativas', 'Planta de Producción', 'Sucursal San Pedro', 'Departamento de Transporte']
const TIPOS = ['Equipo de cómputo', 'Mobiliario y enseres', 'Maquinaria industrial', 'Vehículos', 'Equipo de oficina']

export function ActivosView() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [area, setArea] = useState('')
  const [tipo, setTipo] = useState('')
  const { data, isLoading, isError } = useActivos({ search, area, tipo })
  const activos = data || []
  const label = area || tipo
    ? [area, tipo].filter(Boolean).join(' · ')
    : (search ? 'Resultados de búsqueda' : 'Todos los activos')

  return (
    <div>
      <div className="page-head">
        <h1>Activos fijos</h1>
        <Button onClick={() => navigate('/activos/nuevo')}>+ Registrar activo</Button>
      </div>
      <ActivoFilters
        search={search} area={area} tipo={tipo} areas={AREAS} tipos={TIPOS}
        onSearchChange={setSearch} onAreaChange={setArea} onTipoChange={setTipo}
        onClear={() => { setSearch(''); setArea(''); setTipo('') }}
      />
      <ActivoSummaryBar label={label} activos={activos} />
      <ActivoTable isLoading={isLoading} isError={isError} activos={activos} />
      <Routes>
        <Route path="nuevo" element={<CrearActivoModal onClose={() => navigate('/activos')} />} />
        <Route path=":num" element={<ActivoDetailDrawer onClose={() => navigate('/activos')} />} />
        <Route path=":num/editar" element={<EditarActivoModal onClose={() => navigate('/activos')} />} />
      </Routes>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- ActivosView`
Expected: `4 passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/activos/ActivosView.jsx frontend/src/views/activos/ActivosView.test.jsx
git commit -m "feat: Wire ActivosView with nested modal/drawer routes (RF-001, RF-002, RF-003)"
```

---

## Task 24: `views/reportes/AuditoriaCard.jsx` + `views/reportes/FinancieroCard.jsx`

**Files:**
- Create: `frontend/src/views/reportes/AuditoriaCard.jsx`
- Create: `frontend/src/views/reportes/FinancieroCard.jsx`
- Create: `frontend/src/views/reportes/ReporteCard.module.css`
- Test: `frontend/src/views/reportes/AuditoriaCard.test.jsx`
- Test: `frontend/src/views/reportes/FinancieroCard.test.jsx`

**Interfaces:**
- Consumes: `useGenerarAuditoria, useGenerarFinanciero` from `../../hooks/useReportes` (Task 15), `useToast` (Task 10), `Button`, `Spinner` (Task 12), `money` (Task 2).
- Produces: `<AuditoriaCard />`, `<FinancieroCard />` — used by `ReportesView` (Task 25).

- [ ] **Step 1: Write the failing tests**

`frontend/src/views/reportes/AuditoriaCard.test.jsx`:
```jsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuditoriaCard } from './AuditoriaCard'
import { useGenerarAuditoria } from '../../hooks/useReportes'
import { useToast } from '../../context/ToastContext'

vi.mock('../../hooks/useReportes')
vi.mock('../../context/ToastContext')

describe('AuditoriaCard', () => {
  it('generates the report and shows the resulting preview', async () => {
    const mutate = vi.fn()
    useToast.mockReturnValue({ showToast: vi.fn() })
    useGenerarAuditoria.mockReturnValue({
      mutate, isPending: false, isError: false,
      isSuccess: true, data: { activos: [{ num: 'AF-0001', nombre: 'Laptop Dell', libros: 255000 }], total: 1 },
    })

    render(<AuditoriaCard />)
    await userEvent.click(screen.getByText('Generar y exportar'))

    expect(mutate).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Reporte generado — 1 activos incluidos')).toBeInTheDocument()
    expect(screen.getByText('AF-0001')).toBeInTheDocument()
  })

  it('calls showToast when the export button is clicked', async () => {
    const showToast = vi.fn()
    useToast.mockReturnValue({ showToast })
    useGenerarAuditoria.mockReturnValue({
      mutate: vi.fn(), isPending: false, isError: false,
      isSuccess: true, data: { activos: [], total: 0 },
    })

    render(<AuditoriaCard />)
    await userEvent.click(screen.getByText('↓ Exportar reporte_auditoria.xlsx'))
    expect(showToast).toHaveBeenCalledWith('Exportado: reporte_auditoria.xlsx', 'success')
  })
})
```

`frontend/src/views/reportes/FinancieroCard.test.jsx`:
```jsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FinancieroCard } from './FinancieroCard'
import { useGenerarFinanciero } from '../../hooks/useReportes'
import { useToast } from '../../context/ToastContext'

vi.mock('../../hooks/useReportes')
vi.mock('../../context/ToastContext')

describe('FinancieroCard', () => {
  it('generates the report for the selected cutoff month', async () => {
    const mutate = vi.fn()
    useToast.mockReturnValue({ showToast: vi.fn() })
    useGenerarFinanciero.mockReturnValue({ mutate, isPending: false, isError: false, isSuccess: false })

    render(<FinancieroCard />)
    await userEvent.click(screen.getByText('Generar'))

    expect(mutate).toHaveBeenCalledWith('2026-06')
  })

  it('shows the totals row once the report is generated', () => {
    useToast.mockReturnValue({ showToast: vi.fn() })
    useGenerarFinanciero.mockReturnValue({
      mutate: vi.fn(), isPending: false, isError: false, isSuccess: true,
      data: { corte: '2026-06', activos: [{ num: 'AF-0001', nombre: 'Laptop Dell', libros: 255000, dep: 595000 }], totalLibros: 255000, totalDep: 595000 },
    })

    render(<FinancieroCard />)
    expect(screen.getByText('TOTAL VIGENTES (1)')).toBeInTheDocument()
    expect(screen.getByText('₡ 255.000')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- AuditoriaCard FinancieroCard`
Expected: FAIL — both imports unresolved

- [ ] **Step 3: Implement `AuditoriaCard` and `FinancieroCard`**

`frontend/src/views/reportes/ReporteCard.module.css`:
```css
.card { flex: 1; min-width: 380px; background: #fff; border: 1px solid var(--color-border); border-radius: 12px; padding: 18px 20px; }
.card table { width: 100%; border-collapse: collapse; margin-top: 12px; }
.card td, .card th { padding: 8px 12px; font-size: 12px; text-align: left; }
.error { font-size: 12.5px; color: var(--color-error-text); margin-top: 10px; }
.result { margin-top: 14px; }
.cutoffRow { display: flex; gap: 10px; margin-bottom: 8px; }
.cutoffRow select { flex: 1; height: 40px; padding: 0 12px; border: 1px solid var(--color-border); border-radius: 8px; }
```

`frontend/src/views/reportes/AuditoriaCard.jsx`:
```jsx
import { useGenerarAuditoria } from '../../hooks/useReportes'
import { useToast } from '../../context/ToastContext'
import { Button } from '../../components/Button'
import { Spinner } from '../../components/Spinner'
import { money } from '../../lib/money'
import styles from './ReporteCard.module.css'

export function AuditoriaCard() {
  const auditoria = useGenerarAuditoria()
  const { showToast } = useToast()

  return (
    <div className={styles.card}>
      <h3>Reporte de auditoría</h3>
      <p>Listado completo de activos con su historial de movimientos.</p>
      <Button onClick={() => auditoria.mutate()} disabled={auditoria.isPending}>
        {auditoria.isPending ? <Spinner size={14} /> : 'Generar y exportar'}
      </Button>
      {auditoria.isError && <p className={styles.error}>No se pudo generar el reporte.</p>}
      {auditoria.isSuccess && (
        <div className={styles.result}>
          <p>Reporte generado — {auditoria.data.activos.length} activos incluidos</p>
          <table>
            <tbody>
              {auditoria.data.activos.slice(0, 5).map((a) => (
                <tr key={a.num}><td>{a.num}</td><td>{a.nombre}</td><td>{money(a.libros)}</td></tr>
              ))}
            </tbody>
          </table>
          <Button variant="secondary" onClick={() => showToast('Exportado: reporte_auditoria.xlsx', 'success')}>
            ↓ Exportar reporte_auditoria.xlsx
          </Button>
        </div>
      )}
    </div>
  )
}
```

`frontend/src/views/reportes/FinancieroCard.jsx`:
```jsx
import { useState } from 'react'
import { useGenerarFinanciero } from '../../hooks/useReportes'
import { useToast } from '../../context/ToastContext'
import { Button } from '../../components/Button'
import { Spinner } from '../../components/Spinner'
import { money } from '../../lib/money'
import styles from './ReporteCard.module.css'

const FISCAL_MONTHS = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09']
const MES_LABEL = { '01': 'enero', '02': 'febrero', '03': 'marzo', '04': 'abril', '05': 'mayo', '06': 'junio', '07': 'julio', '08': 'agosto', '09': 'setiembre', '10': 'octubre', '11': 'noviembre', '12': 'diciembre' }

function monthLabel(value) {
  const [year, month] = value.split('-')
  return `${MES_LABEL[month]} ${year}`
}

export function FinancieroCard() {
  const [cutoff, setCutoff] = useState('2026-06')
  const financiero = useGenerarFinanciero()
  const { showToast } = useToast()

  return (
    <div className={styles.card}>
      <h3>Reporte financiero</h3>
      <p>Valor en libros y depreciación acumulada de los activos vigentes a un mes de corte.</p>
      <div className={styles.cutoffRow}>
        <select value={cutoff} onChange={(e) => setCutoff(e.target.value)}>
          {FISCAL_MONTHS.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
        <Button onClick={() => financiero.mutate(cutoff)} disabled={financiero.isPending}>
          {financiero.isPending ? <Spinner size={14} /> : 'Generar'}
        </Button>
      </div>
      {financiero.isError && <p className={styles.error}>No se pudo generar el reporte.</p>}
      {financiero.isSuccess && (
        <div className={styles.result}>
          <p>Generado — corte al {monthLabel(financiero.data.corte)}</p>
          <table>
            <tbody>
              {financiero.data.activos.map((a) => (
                <tr key={a.num}><td>{a.num} {a.nombre}</td><td>{money(a.libros)}</td><td>{money(a.dep)}</td></tr>
              ))}
              <tr>
                <td>TOTAL VIGENTES ({financiero.data.activos.length})</td>
                <td>{money(financiero.data.totalLibros)}</td>
                <td>{money(financiero.data.totalDep)}</td>
              </tr>
            </tbody>
          </table>
          <Button variant="secondary" onClick={() => showToast('Exportado: reporte_financiero.xlsx', 'success')}>
            ↓ Exportar reporte_financiero.xlsx
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- AuditoriaCard FinancieroCard`
Expected: `4 passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/reportes/AuditoriaCard.jsx frontend/src/views/reportes/FinancieroCard.jsx frontend/src/views/reportes/ReporteCard.module.css frontend/src/views/reportes/AuditoriaCard.test.jsx frontend/src/views/reportes/FinancieroCard.test.jsx
git commit -m "feat: Add Auditoria and Financiero report cards (RF-004, RF-005)"
```

---

## Task 25: `views/reportes/ReportesView.jsx`

**Files:**
- Create: `frontend/src/views/reportes/ReportesView.jsx`, `ReportesView.module.css`
- Test: `frontend/src/views/reportes/ReportesView.test.jsx`

**Interfaces:**
- Consumes: `AuditoriaCard`, `FinancieroCard` (Task 24).
- Produces: `<ReportesView />` — mounted at `reportes` by `App.jsx` (Task 29).

- [ ] **Step 1: Write the failing test**

`frontend/src/views/reportes/ReportesView.test.jsx`:
```jsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReportesView } from './ReportesView'
import { useGenerarAuditoria, useGenerarFinanciero } from '../../hooks/useReportes'

vi.mock('../../hooks/useReportes')
vi.mock('../../context/ToastContext', () => ({ useToast: () => ({ showToast: vi.fn() }) }))

describe('ReportesView', () => {
  it('renders both report cards', () => {
    useGenerarAuditoria.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false, isSuccess: false })
    useGenerarFinanciero.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false, isSuccess: false })

    render(<ReportesView />)
    expect(screen.getByText('Reporte de auditoría')).toBeInTheDocument()
    expect(screen.getByText('Reporte financiero')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- ReportesView`
Expected: FAIL — `Failed to resolve import "./ReportesView"`

- [ ] **Step 3: Implement `ReportesView`**

`frontend/src/views/reportes/ReportesView.module.css`:
```css
.grid { display: flex; gap: 20px; flex-wrap: wrap; align-items: flex-start; }
```

`frontend/src/views/reportes/ReportesView.jsx`:
```jsx
import { AuditoriaCard } from './AuditoriaCard'
import { FinancieroCard } from './FinancieroCard'
import styles from './ReportesView.module.css'

export function ReportesView() {
  return (
    <div>
      <h1>Reportes</h1>
      <div className={styles.grid}>
        <AuditoriaCard />
        <FinancieroCard />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- ReportesView`
Expected: `1 passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/reportes/ReportesView.jsx frontend/src/views/reportes/ReportesView.module.css frontend/src/views/reportes/ReportesView.test.jsx
git commit -m "feat: Wire ReportesView"
```

---

## Task 26: `views/historial/BajaCard.jsx`

**Files:**
- Create: `frontend/src/views/historial/BajaCard.jsx`, `BajaCard.module.css`
- Test: `frontend/src/views/historial/BajaCard.test.jsx`

**Interfaces:**
- Consumes: `fmtDate, fmtRemaining` from `../../lib/date` (Task 3).
- Produces: `<BajaCard baja={Baja} now={number} />` — used by `HistorialView` (Task 28).

- [ ] **Step 1: Write the failing test**

`frontend/src/views/historial/BajaCard.test.jsx`:
```jsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BajaCard } from './BajaCard'

const NOW = Date.parse('2026-07-09T12:00:00Z')

function renderCard(baja) {
  return render(<MemoryRouter><BajaCard baja={baja} now={NOW} /></MemoryRouter>)
}

describe('BajaCard', () => {
  it('shows the grace-period countdown and a revert link when pending', () => {
    renderCard({
      id: 'BJ-2026-018', activoNum: 'AF-0031', activoNombre: 'Laptop HP', motivo: 'Desecho u obsolescencia',
      desc: 'Equipo dañado', fechaEfectiva: '2026-07-09', fechaRegistro: '2026-07-09', user: 'J. Mora',
      estado: 'Pendiente', venceTs: NOW + (28 * 3600000),
    })
    expect(screen.getByText('Periodo de gracia · Vence en 1 día 4 h')).toBeInTheDocument()
    expect(screen.getByText('↺ Revertir baja')).toBeInTheDocument()
  })

  it('shows the reincorporation message when the baja was reverted', () => {
    renderCard({
      id: 'BJ-2026-009', activoNum: 'AF-0020', activoNombre: 'Escritorio', motivo: 'Desecho u obsolescencia',
      desc: 'Reasignado', fechaEfectiva: '2026-04-15', fechaRegistro: '2026-04-15', user: 'J. Mora',
      estado: 'Revertida', venceTs: null,
    })
    expect(screen.getByText('Baja revertida — el activo fue reincorporado al inventario vigente.')).toBeInTheDocument()
    expect(screen.queryByText('↺ Revertir baja')).not.toBeInTheDocument()
  })

  it('labels a definitiva baja without the countdown or revert link', () => {
    renderCard({
      id: 'BJ-2026-015', activoNum: 'AF-0024', activoNombre: 'Vehículo', motivo: 'Venta',
      desc: 'Vendido', fechaEfectiva: '2026-06-30', fechaRegistro: '2026-06-30', user: 'M. Rivera',
      estado: 'Definitiva', venceTs: null,
    })
    expect(screen.getByText('Baja definitiva')).toBeInTheDocument()
    expect(screen.queryByText('↺ Revertir baja')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- BajaCard`
Expected: FAIL — `Failed to resolve import "./BajaCard"`

- [ ] **Step 3: Implement `BajaCard`**

`frontend/src/views/historial/BajaCard.module.css`:
```css
.card { background: #fff; border: 1px solid var(--color-border); border-radius: 11px; overflow: hidden; margin-bottom: 14px; }
.head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 15px 18px; border-bottom: 1px solid var(--color-border-light); }
.body { padding: 15px 18px; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px 22px; margin-bottom: 16px; }
.pending { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 11px 14px; background: var(--color-warning-bg); border: 1px solid var(--color-warning-border); border-radius: 9px; }
.reverted { padding: 10px 14px; background: var(--color-neutral-bg); border: 1px solid var(--color-neutral-border); border-radius: 9px; font-size: 12px; color: var(--color-neutral-text); }
```

`frontend/src/views/historial/BajaCard.jsx`:
```jsx
import { Link } from 'react-router-dom'
import { fmtDate, fmtRemaining } from '../../lib/date'
import styles from './BajaCard.module.css'

export function BajaCard({ baja, now }) {
  const isPendiente = baja.estado === 'Pendiente'
  const isRevertida = baja.estado === 'Revertida'
  const estadoLabel = baja.estado === 'Definitiva' ? 'Baja definitiva' : baja.estado
  const remaining = baja.venceTs ? fmtRemaining(baja.venceTs - now) : ''

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <div className="mono">{baja.id}</div>
          <div>
            <div style={{ fontWeight: 600 }}>{baja.activoNombre}</div>
            <div className="mono">{baja.activoNum}</div>
          </div>
        </div>
        <div>
          <span>{baja.motivo}</span>
          <span style={{ marginLeft: 8 }}>{estadoLabel}</span>
        </div>
      </div>
      <div className={styles.body}>
        <p>{baja.desc}</p>
        <div className={styles.grid}>
          <div><div>Fecha efectiva</div><div className="mono">{fmtDate(baja.fechaEfectiva)}</div></div>
          <div><div>Registrada</div><div className="mono">{fmtDate(baja.fechaRegistro)}</div></div>
          <div><div>Responsable</div><div>{baja.user}</div></div>
        </div>
        {isPendiente && (
          <div className={styles.pending}>
            <span>Periodo de gracia · Vence en {remaining}</span>
            <Link to={`/historial/${baja.id}/revertir`}>↺ Revertir baja</Link>
          </div>
        )}
        {isRevertida && (
          <div className={styles.reverted}>Baja revertida — el activo fue reincorporado al inventario vigente.</div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- BajaCard`
Expected: `3 passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/historial/BajaCard.jsx frontend/src/views/historial/BajaCard.module.css frontend/src/views/historial/BajaCard.test.jsx
git commit -m "feat: Add BajaCard with grace-period countdown (RN-002.4)"
```

---

## Task 27: `views/historial/RetiroModal.jsx` + `views/historial/RevertModal.jsx`

**Files:**
- Create: `frontend/src/views/historial/RetiroModal.jsx`, `RetiroModal.module.css`
- Create: `frontend/src/views/historial/RevertModal.jsx`, `RevertModal.module.css`
- Test: `frontend/src/views/historial/RetiroModal.test.jsx`
- Test: `frontend/src/views/historial/RevertModal.test.jsx`

**Interfaces:**
- Consumes: `useActivos` (Task 13), `useBajas, useRegistrarBaja, useRevertirBaja` (Task 14), `useToast` (Task 10), `validateRetiro` (Task 4), `FormField`, `Button` (Tasks 11-12).
- Produces: `<RetiroModal onClose={fn} />`, `<RevertModal onClose={fn} />` (reads `id` via `useParams`) — used by `HistorialView` (Task 28).

- [ ] **Step 1: Write the failing tests**

`frontend/src/views/historial/RetiroModal.test.jsx`:
```jsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RetiroModal } from './RetiroModal'
import { useActivos } from '../../hooks/useActivos'
import { useRegistrarBaja } from '../../hooks/useBajas'
import { useToast } from '../../context/ToastContext'

vi.mock('../../hooks/useActivos')
vi.mock('../../hooks/useBajas')
vi.mock('../../context/ToastContext')

describe('RetiroModal', () => {
  it('shows validation errors and does not submit when required fields are blank', async () => {
    const mutateAsync = vi.fn()
    const showToast = vi.fn()
    useActivos.mockReturnValue({ data: [{ num: 'AF-0001', nombre: 'Laptop Dell' }] })
    useRegistrarBaja.mockReturnValue({ mutateAsync })
    useToast.mockReturnValue({ showToast })

    render(<RetiroModal onClose={vi.fn()} />)
    await userEvent.click(screen.getByText('Registrar baja'))

    expect(mutateAsync).not.toHaveBeenCalled()
    expect(showToast).toHaveBeenCalledWith('Completa los campos requeridos', 'error')
    expect(screen.getByText('Selecciona un activo')).toBeInTheDocument()
  })

  it('submits the retiro and closes the modal on success', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 'BJ-2026-019' })
    const showToast = vi.fn()
    const onClose = vi.fn()
    useActivos.mockReturnValue({ data: [{ num: 'AF-0001', nombre: 'Laptop Dell' }] })
    useRegistrarBaja.mockReturnValue({ mutateAsync })
    useToast.mockReturnValue({ showToast })

    render(<RetiroModal onClose={onClose} />)
    await userEvent.selectOptions(screen.getByLabelText(/Activo a retirar/), 'AF-0001')
    await userEvent.selectOptions(screen.getByLabelText(/Motivo/), 'Venta')
    await userEvent.type(screen.getByRole('textbox', { name: /Descripción/ }), 'Venta a colaborador')
    await userEvent.click(screen.getByText('Registrar baja'))

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ activoNum: 'AF-0001', motivo: 'Venta', desc: 'Venta a colaborador' }))
    expect(showToast).toHaveBeenCalledWith('Retiro BJ-2026-019 registrado — pendiente en periodo de gracia', 'success')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
```

`frontend/src/views/historial/RevertModal.test.jsx`:
```jsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RevertModal } from './RevertModal'
import { useBajas, useRevertirBaja } from '../../hooks/useBajas'
import { useToast } from '../../context/ToastContext'

vi.mock('../../hooks/useBajas')
vi.mock('../../context/ToastContext')

const BAJA = { id: 'BJ-2026-018', activoNum: 'AF-0031', activoNombre: 'Laptop HP', estado: 'Pendiente' }

function renderModal(onClose = vi.fn()) {
  return render(
    <MemoryRouter initialEntries={['/historial/BJ-2026-018/revertir']}>
      <Routes>
        <Route path="/historial/:id/revertir" element={<RevertModal onClose={onClose} />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('RevertModal', () => {
  it('shows the activo that will be reincorporated', () => {
    useBajas.mockReturnValue({ data: [BAJA] })
    useRevertirBaja.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
    useToast.mockReturnValue({ showToast: vi.fn() })

    renderModal()
    expect(screen.getByText('Laptop HP')).toBeInTheDocument()
  })

  it('confirms the reversion and closes the modal', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(null)
    const showToast = vi.fn()
    const onClose = vi.fn()
    useBajas.mockReturnValue({ data: [BAJA] })
    useRevertirBaja.mockReturnValue({ mutateAsync, isPending: false })
    useToast.mockReturnValue({ showToast })

    renderModal(onClose)
    await userEvent.click(screen.getByText('Confirmar reversión'))

    expect(mutateAsync).toHaveBeenCalledWith('BJ-2026-018')
    expect(showToast).toHaveBeenCalledWith('Baja BJ-2026-018 revertida — activo reincorporado', 'success')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- RetiroModal RevertModal`
Expected: FAIL — both imports unresolved

- [ ] **Step 3: Implement `RetiroModal` and `RevertModal`**

`frontend/src/views/historial/RetiroModal.module.css`:
```css
.overlay { position: fixed; inset: 0; background: rgba(11,37,69,.42); z-index: 85; display: flex; align-items: flex-start; justify-content: center; padding: 40px 20px; overflow-y: auto; }
.modal { width: 540px; max-width: 100%; background: #fff; border-radius: 12px; margin: auto; padding: 22px; display: flex; flex-direction: column; gap: 16px; }
.modal select, .modal textarea { padding: 10px 12px; border: 1px solid var(--color-border); border-radius: 7px; font-size: 13.5px; width: 100%; }
.actions { display: flex; justify-content: flex-end; gap: 10px; }
```

`frontend/src/views/historial/RetiroModal.jsx`:
```jsx
import { useState } from 'react'
import { useActivos } from '../../hooks/useActivos'
import { useRegistrarBaja } from '../../hooks/useBajas'
import { useToast } from '../../context/ToastContext'
import { validateRetiro } from '../../lib/validators'
import { FormField } from '../../components/FormField'
import { Button } from '../../components/Button'
import styles from './RetiroModal.module.css'

const MOTIVOS = ['Venta', 'Desecho u obsolescencia', 'Robo o pérdida']

export function RetiroModal({ onClose }) {
  const { data: activos } = useActivos()
  const [form, setForm] = useState({ activoNum: '', motivo: '', desc: '' })
  const [errors, setErrors] = useState({})
  const registrar = useRegistrarBaja()
  const { showToast } = useToast()

  function handleChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validateRetiro(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      showToast('Completa los campos requeridos', 'error')
      return
    }
    try {
      const baja = await registrar.mutateAsync(form)
      showToast(`Retiro ${baja.id} registrado — pendiente en periodo de gracia`, 'success')
      onClose()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Registrar retiro / baja de activo</h2>
        <FormField label="Activo a retirar" error={errors.activoNum}>
          <select aria-label="Activo a retirar" value={form.activoNum} onChange={(e) => handleChange('activoNum', e.target.value)}>
            <option value="">Selecciona un activo…</option>
            {(activos || []).map((a) => <option key={a.num} value={a.num}>{a.num} — {a.nombre}</option>)}
          </select>
        </FormField>
        <FormField label="Motivo" error={errors.motivo}>
          <select aria-label="Motivo" value={form.motivo} onChange={(e) => handleChange('motivo', e.target.value)}>
            <option value="">Selecciona un motivo…</option>
            {MOTIVOS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </FormField>
        <FormField label="Descripción" error={errors.desc}>
          <textarea aria-label="Descripción" value={form.desc} onChange={(e) => handleChange('desc', e.target.value)} rows={3} />
        </FormField>
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Registrar baja</Button>
        </div>
      </form>
    </div>
  )
}
```

`frontend/src/views/historial/RevertModal.module.css`:
```css
.overlay { position: fixed; inset: 0; background: rgba(11,37,69,.42); z-index: 85; display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal { width: 440px; max-width: 100%; background: #fff; border-radius: 12px; padding: 22px; }
.actions { display: flex; gap: 10px; margin-top: 18px; }
```

`frontend/src/views/historial/RevertModal.jsx`:
```jsx
import { useParams } from 'react-router-dom'
import { useBajas, useRevertirBaja } from '../../hooks/useBajas'
import { useToast } from '../../context/ToastContext'
import { Button } from '../../components/Button'
import styles from './RevertModal.module.css'

export function RevertModal({ onClose }) {
  const { id } = useParams()
  const { data: bajas } = useBajas()
  const baja = (bajas || []).find((b) => b.id === id)
  const revertir = useRevertirBaja()
  const { showToast } = useToast()

  async function handleConfirm() {
    try {
      await revertir.mutateAsync(id)
      showToast(`Baja ${id} revertida — activo reincorporado`, 'success')
      onClose()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  if (!baja) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Revertir baja del activo</h2>
        <p>Se reincorporará <strong>{baja.activoNombre}</strong> ({baja.activoNum}) al inventario vigente.</p>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={revertir.isPending}>Confirmar reversión</Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- RetiroModal RevertModal`
Expected: `4 passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/historial/RetiroModal.jsx frontend/src/views/historial/RetiroModal.module.css frontend/src/views/historial/RetiroModal.test.jsx frontend/src/views/historial/RevertModal.jsx frontend/src/views/historial/RevertModal.module.css frontend/src/views/historial/RevertModal.test.jsx
git commit -m "feat: Add RetiroModal and RevertModal (RN-002.4, DA12)"
```

---

## Task 28: `views/historial/HistorialView.jsx`

**Files:**
- Create: `frontend/src/views/historial/HistorialView.jsx`
- Test: `frontend/src/views/historial/HistorialView.test.jsx`

**Interfaces:**
- Consumes: `useBajas` (Task 14), `BajaCard` (Task 26), `RetiroModal`, `RevertModal` (Task 27), `Button`, `Spinner`, `EmptyState` (Tasks 11-12).
- Produces: `<HistorialView />` (self-routes `nueva`, `:id/revertir`) — mounted at `historial/*` by `App.jsx` (Task 29).

- [ ] **Step 1: Write the failing test**

`frontend/src/views/historial/HistorialView.test.jsx`:
```jsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { HistorialView } from './HistorialView'
import { useBajas } from '../../hooks/useBajas'

vi.mock('../../hooks/useBajas')
vi.mock('../../hooks/useActivos', () => ({ useActivos: () => ({ data: [] }) }))
vi.mock('../../context/ToastContext', () => ({ useToast: () => ({ showToast: vi.fn() }) }))

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/historial/*" element={<HistorialView />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('HistorialView', () => {
  it('shows a connection error when the query fails', () => {
    useBajas.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    renderAt('/historial')
    expect(screen.getByText('No se pudo conectar con el servidor.')).toBeInTheDocument()
  })

  it('renders one BajaCard per baja', () => {
    useBajas.mockReturnValue({
      data: [
        { id: 'BJ-2026-018', activoNum: 'AF-0031', activoNombre: 'Laptop HP', motivo: 'Desecho u obsolescencia', desc: 'x', fechaEfectiva: '2026-07-09', fechaRegistro: '2026-07-09', user: 'J. Mora', estado: 'Pendiente', venceTs: Date.now() + 3600000 },
      ],
      isLoading: false, isError: false,
    })
    renderAt('/historial')
    expect(screen.getByText('Laptop HP')).toBeInTheDocument()
  })

  it('opens the RetiroModal at /historial/nueva', () => {
    useBajas.mockReturnValue({ data: [], isLoading: false, isError: false })
    renderAt('/historial/nueva')
    expect(screen.getByText('Registrar retiro / baja de activo')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- HistorialView`
Expected: FAIL — `Failed to resolve import "./HistorialView"`

- [ ] **Step 3: Implement `HistorialView`**

`frontend/src/views/historial/HistorialView.jsx`:
```jsx
import { Route, Routes, useNavigate } from 'react-router-dom'
import { useBajas } from '../../hooks/useBajas'
import { BajaCard } from './BajaCard'
import { RetiroModal } from './RetiroModal'
import { RevertModal } from './RevertModal'
import { Button } from '../../components/Button'
import { Spinner } from '../../components/Spinner'
import { EmptyState } from '../../components/EmptyState'

export function HistorialView() {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useBajas()
  const now = Date.now()

  return (
    <div>
      <div className="page-head">
        <h1>Historial de retiro / baja</h1>
        <Button onClick={() => navigate('/historial/nueva')}>+ Registrar retiro</Button>
      </div>
      {isLoading && <Spinner size={24} />}
      {isError && <EmptyState message="No se pudo conectar con el servidor." />}
      {!isLoading && !isError && (data || []).map((baja) => <BajaCard key={baja.id} baja={baja} now={now} />)}
      <Routes>
        <Route path="nueva" element={<RetiroModal onClose={() => navigate('/historial')} />} />
        <Route path=":id/revertir" element={<RevertModal onClose={() => navigate('/historial')} />} />
      </Routes>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- HistorialView`
Expected: `3 passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/historial/HistorialView.jsx frontend/src/views/historial/HistorialView.test.jsx
git commit -m "feat: Wire HistorialView with nested retiro/revertir routes (RF-007, RN-002.4)"
```

---

## Task 29: `App.jsx` + `router` + `main.jsx` (final integration)

**Files:**
- Create: `frontend/src/App.jsx`
- Modify: `frontend/src/main.jsx`
- Test: `frontend/src/App.test.jsx`
- Delete: `frontend/src/smoke.test.js` (superseded by this end-to-end test)
- Delete (if present from the Vite template): `frontend/src/App.css`, default `frontend/src/assets/`

**Interfaces:**
- Consumes: `AuthProvider` (Task 9), `ToastProvider` (Task 10), `AppLayout` (Task 17), `ActivosView` (Task 23), `ReportesView` (Task 25), `HistorialView` (Task 28).
- Produces: `<App />` — rendered by `main.jsx`, the root of the whole frontend.

- [ ] **Step 1: Write the failing test**

`frontend/src/App.test.jsx`:
```jsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { App } from './App'

vi.mock('./hooks/useActivos', () => ({
  useActivos: () => ({ data: [], isLoading: false, isError: false }),
  useActivo: () => ({ data: undefined, isLoading: false }),
  useMovimientos: () => ({ data: [] }),
  useCrearActivo: () => ({ mutateAsync: vi.fn() }),
  useEditarActivo: () => ({ mutateAsync: vi.fn() }),
}))
vi.mock('./hooks/useBajas', () => ({
  useBajas: () => ({ data: [], isLoading: false, isError: false }),
  useRegistrarBaja: () => ({ mutateAsync: vi.fn() }),
  useRevertirBaja: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))
vi.mock('./hooks/useReportes', () => ({
  useGenerarAuditoria: () => ({ mutate: vi.fn(), isPending: false, isError: false, isSuccess: false }),
  useGenerarFinanciero: () => ({ mutate: vi.fn(), isPending: false, isError: false, isSuccess: false }),
}))

describe('App', () => {
  it('redirects "/" to the Activos tab by default', () => {
    window.history.pushState({}, '', '/')
    render(<App />)
    expect(screen.getByText('Activos fijos')).toBeInTheDocument()
  })

  it('renders the header with the session from AuthContext', () => {
    window.history.pushState({}, '', '/')
    render(<App />)
    expect(screen.getByText('Sistema de Activos Fijos')).toBeInTheDocument()
    expect(screen.getByText('Marcela Rivera S.')).toBeInTheDocument()
  })

  it('navigates to the Reportes view', () => {
    window.history.pushState({}, '', '/reportes')
    render(<App />)
    expect(screen.getByText('Reporte de auditoría')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- App.test`
Expected: FAIL — `Failed to resolve import "./App"`

- [ ] **Step 3: Implement `App` and update `main.jsx`**

`frontend/src/App.jsx`:
```jsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { AppLayout } from './layout/AppLayout'
import { ActivosView } from './views/activos/ActivosView'
import { ReportesView } from './views/reportes/ReportesView'
import { HistorialView } from './views/historial/HistorialView'

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Navigate to="/activos" replace />} />
                <Route path="activos/*" element={<ActivosView />} />
                <Route path="reportes" element={<ReportesView />} />
                <Route path="historial/*" element={<HistorialView />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
```

`frontend/src/main.jsx`:
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles/tokens.css'
import './styles/global.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 4: Remove the scaffold smoke test and unused template assets**

```bash
rm frontend/src/smoke.test.js
rm -f frontend/src/App.css
rm -rf frontend/src/assets
```

- [ ] **Step 5: Run the full test suite to verify everything passes**

Run: `npm test` (inside `frontend/`)
Expected: all test files pass, including `App.test.jsx` (`3 passed`)

- [ ] **Step 6: Verify the dev server actually renders the app**

Run: `npm run dev` (inside `frontend/`), open the printed local URL in a browser.
Expected: the Activos tab loads, shows the header/nav, and displays a "No se pudo conectar con el servidor." message in the table area (since no backend exists yet) — confirming the real-request-with-error-state behavior described in the spec, not a silent blank screen.
Stop the dev server (Ctrl+C) once verified.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/App.jsx frontend/src/App.test.jsx frontend/src/main.jsx
git rm frontend/src/smoke.test.js
git add -A frontend/src
git commit -m "feat: Wire App with routing and providers; complete frontend scaffold"
```

---

## Self-Review

**Spec coverage:**
- Folder structure (`api/`, `views/`, `components/`, `layout/`, `hooks/`, `lib/`, `context/`) — Tasks 1-29 cover every directory named in the spec.
- Routing with nested modal/drawer routes — Tasks 23, 28, 29.
- TanStack Query for server state — Tasks 13-15.
- CSS Modules + tokens — Task 1 (tokens/global), every component task creates its own `.module.css`.
- `api/client.js` seam for auth token + error normalization — Task 5.
- Endpoint contract (`/api/activos/`, `/api/bajas/`, `/api/reportes/*`) — Tasks 6-8, matches the spec's table exactly.
- No login, stub `AuthContext` — Task 9.
- Toast notifications — Task 10.
- RF-001.1/RF-001.2 (registro y validación de activos) — Tasks 4, 20.
- RF-002.3 (valores visibles sin cálculo aparte) — Tasks 19, 22 (frontend only displays what the API returns, per DA04/DA05).
- RF-003 (filtro por área/tipo) — Task 18.
- RF-004/RF-005 (reportes) — Tasks 8, 15, 24-25.
- RF-007 (historial de movimientos e inmutabilidad) — Task 22 (movimientos), Task 26 (bajas), read-only rendering only (no edit/delete UI exists anywhere in the plan, matching RF-007.2).
- RN-002.4 (periodo de gracia de 2 días, reversión) — Tasks 3 (`fmtRemaining`), 26, 27.
- Testing scope boundary (validación, loading/error en ActivosView, countdown en BajaCard) — Tasks 20 and 23 (validation/loading), Task 26 (countdown) all have the deepest test coverage in the plan; other components get one focused test each, no style assertions.

**Placeholder scan:** no "TBD", "TODO", or "similar to Task N" found — every step has complete, runnable code.

**Type consistency:** `Activo`, `Baja`, and `Movimiento` field names are identical everywhere they're used (`api/*.js` return shapes, `hooks/*.js` data, component destructuring) because they were fixed once in Global Constraints and never redefined per task. Function names (`money`, `fmtDate`, `fmtRemaining`, `validateActivo`, `validateRetiro`, `apiFetch`, `useActivos`, `useActivo`, `useMovimientos`, `useCrearActivo`, `useEditarActivo`, `useBajas`, `useRegistrarBaja`, `useRevertirBaja`, `useGenerarAuditoria`, `useGenerarFinanciero`) match between their producing task and every consuming task.

---

**Plan complete and saved to `docs/superpowers/plans/2026-07-09-frontend-activos-fijos.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
