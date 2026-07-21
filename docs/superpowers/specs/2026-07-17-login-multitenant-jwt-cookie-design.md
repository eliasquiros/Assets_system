# Diseño: Inicio de sesión multi-tenant con JWT en cookie httpOnly

Fecha: 2026-07-17
Estado: Aprobado (Enfoque A)
Rama: `feature-inicio-sesion`

## Objetivo

Construir el inicio de sesión de la aplicación de Activos Fijos con:
- **Autenticación** por usuario/contraseña contra el schema de la empresa correcta.
- **Autorización** = sesión válida + aislamiento por tenant (RS-002). Sin roles (la tabla `usuario` no los tiene; YAGNI).
- **Enrutamiento por subdominio → schema** vía `django-tenants` (DA01, DA16).
- **JWT en cookies `httpOnly`**: el token nunca es visible para el usuario (ni `localStorage`, ni body de respuesta, ni accesible por JS).

## Requisitos y decisiones trazadas
- RF-006.1 (login), RS-001 (contraseñas hasheadas), RS-002 (aislamiento total entre empresas).
- DA01 (schema por empresa), DA02 (registro `companies` en schema público), DA03 (usuarios en schema de su empresa), DA08 (rate limiting del login), DA16 (subdominio por empresa; error genérico que no filtra en qué empresa existe una cuenta).

## Stack añadido
| Paquete | Rol |
|---|---|
| `django-tenants` | Enrutamiento por schema según `Host`/subdominio |
| `djangorestframework` | Capa de API |
| `djangorestframework-simplejwt` | Emisión/validación de JWT |

`ENGINE` pasa a `django_tenants.postgresql_backend`. `DATABASE_ROUTERS = ['django_tenants.routers.TenantSyncRouter']`. `TenantMainMiddleware` al inicio de `MIDDLEWARE`.

## Apps y modelos

### `companies` (SHARED_APPS — schema público)
- `Empresa(TenantMixin)` → tabla `empresa`: `nombre`, `schema_name`, `activa`, `fecha_alta`. `auto_create_schema=True`.
- `Domain(DomainMixin)` → **tabla nueva `domain`**: `domain`, `tenant_id`, `is_primary`.
- `TENANT_MODEL='companies.Empresa'`, `TENANT_DOMAIN_MODEL='companies.Domain'`.

**Ajuste al esquema documentado:** hoy `db/schema.sql` guarda `dominio` como columna de `empresa`. `django-tenants` requiere tabla de dominios separada. Se mueve `dominio` de `empresa` a la tabla `domain`. Actualizar `db/schema.sql`, `db/diccionario_datos.md` y DA16 (que hoy además menciona `localStorage`).

### `accounts` (TENANT_APPS — schema de cada empresa)
- `Usuario(AbstractBaseUser)` mapeado **exacto** a la tabla `usuario` existente vía `db_column`:
  - `username` (unique), `password` → `db_column='password_hash'` (max_length 255), `is_active` → `db_column='activo'`, `last_login` → `db_column='ultimo_acceso'`, `fecha_creacion` (`auto_now_add`).
  - **Sin `PermissionsMixin`** (no hay roles). Manager propio (`create_user`). `USERNAME_FIELD='username'`. `AUTH_USER_MODEL='accounts.Usuario'`.
- Contraseñas con los hashers de Django (`make_password`/`check_password`) → RS-001.

## Flujo de autenticación

```
Navegador (acme.sistema.com)                Django
POST /api/auth/login/         ──►  TenantMainMiddleware fija schema=acme (por Host)
  {usuario, password}              LoginView autentica SOLO contra usuario de acme
                                   ├─ éxito: emite access+refresh JWT
                              ◄──  │   Set-Cookie: access  (httpOnly, Secure, SameSite=Lax)
                                   │   Set-Cookie: refresh (httpOnly, Secure, SameSite=Lax, path=/api/auth)
                                   │   Set-Cookie: csrftoken (legible por JS, NO sensible)
                                   │   body: { username, empresa }   ← SIN token
                                   └─ fallo: 401 "Usuario o contraseña incorrectos"
                                       (idéntico si el usuario no existe o si la contraseña
                                        es incorrecta → no filtra RS-002/DA16)
```

### Reglas de seguridad
- **El JWT nunca sale en el body ni toca `localStorage`.** Solo en cookies `httpOnly`, `Secure`, `SameSite=Lax` → invisible a JS/DevTools/XSS.
- **`CookieJWTAuthentication`** (subclase de `rest_framework_simplejwt.authentication.JWTAuthentication`): lee el access token desde la cookie, no del header `Authorization`; y **exige CSRF** en métodos no seguros (igual que `SessionAuthentication`). El frontend reenvía `X-CSRFToken` desde la cookie `csrftoken` legible. El token sensible queda oculto y seguimos protegidos de CSRF.
- **Aislamiento por schema (RS-002):** el middleware fija el schema antes de la vista; el login jamás consulta otro schema.
- **Error genérico (DA16):** mismo 401 y mismo mensaje para usuario inexistente y contraseña incorrecta.
- **Rate limiting del login (DA08):** `ScopedRateThrottle` de DRF, scope `login` (p.ej. `5/min`), respaldado por el cache de Django.
- **Expiración:** access corto (p.ej. 15 min), refresh más largo (p.ej. 7 días). Rotación de refresh activada.

### Endpoints
- `POST /api/auth/login/` → setea cookies; body `{username, empresa}`.
- `POST /api/auth/refresh/` → rota access desde la cookie refresh.
- `POST /api/auth/logout/` → borra cookies (blacklist del refresh si está disponible).
- `GET  /api/auth/me/` → `{username, empresa}` si la cookie es válida; 401 si no. (El frontend no puede leer el JWT httpOnly, así restaura la sesión al recargar.)

## Frontend
- `api/client.js`: `credentials: 'include'`; header `X-CSRFToken` (leído de la cookie `csrftoken`) en métodos no seguros. Se elimina el paso de token Bearer.
- `api/auth.js`: `login()` ya no devuelve token; añadir `me()` y `logout()`.
- `context/AuthContext.jsx`: **no guarda token ni sesión en `localStorage`.** Al montar llama a `/api/auth/me/`; 200 → autenticado (guarda solo `username`/`empresa` en memoria para la UI), 401 → deslogueado. Fuente de verdad: la cookie httpOnly.
- `views/auth/LoginView.jsx`: sin cambios de lógica (usa `login()`).

## Datos de prueba
Comando `seed_demo`: crea empresa `Demo` (schema `empresa_demo`, dominio `demo.localhost`) + un `usuario` con contraseña hasheada, para probar login end-to-end en `demo.localhost:5173`.

## Pruebas (solo las necesarias)
**Backend (5):**
1. Aislamiento entre tenants + error genérico idéntico (usuario inexistente vs contraseña mala).
2. Login exitoso setea cookies `httpOnly` y **no** hay token en el body (verifica flags httponly/secure/samesite).
3. Endpoint protegido: 401 sin cookie / 200 con cookie válida / CSRF exigido en POST.
4. Contraseña se guarda hasheada, nunca en claro (RS-001).
5. Throttle del login tras N intentos (DA08).

**Frontend (2):**
1. `AuthContext` restaura sesión vía `/auth/me/` al montar.
2. `client.js` adjunta `X-CSRFToken` + `credentials: 'include'` en métodos no seguros.

No se prueban modelos/serializers triviales ni scaffolding.

## Descomposición en tareas (para agentes)
1. **Config + django-tenants**: settings (engine, SHARED/TENANT_APPS, routers, middleware, SimpleJWT, throttle, cookies), `.env`/`.env.example`; actualizar `db/schema.sql`, `db/diccionario_datos.md`, DA16.
2. **App `companies`**: `Empresa`, `Domain`, migraciones shared.
3. **App `accounts`**: `Usuario` mapeado, manager, migración tenant.
4. **Capa de auth**: `LoginView`, `CookieJWTAuthentication`, `refresh`/`logout`/`me`, throttle, URLs bajo `/api/auth/`.
5. **`seed_demo`** + pruebas backend.
6. **Frontend**: `client.js`, `auth.js`, `AuthContext.jsx` + pruebas frontend.

## Enfoque elegido
**A**: `AUTH_USER_MODEL=accounts.Usuario` (AbstractBaseUser sin PermissionsMixin) + SimpleJWT + capa de cookies. Mínimo código de cripto propio; camino convencional y auditable.

Descartados: **B** (JWT a mano con PyJWT — más código de seguridad propio y más pruebas) y **C** (sesión Django sin JWT — se pidió JWT explícitamente).

## Riesgos / puntos de atención
- `django.contrib.auth` con usuario por-tenant: se evita fricción al no usar `PermissionsMixin` (sin FKs a permissions/content_types por usuario). Verificar `migrate_schemas --shared` vs migraciones de tenant.
- Cookies en desarrollo: `Secure` requiere HTTPS; en local usar `SESSION_COOKIE_SECURE`/flags condicionados a `DEBUG` para permitir `http://demo.localhost`.
- Subdominios en dev: `demo.localhost` resuelve a 127.0.0.1 en la mayoría de navegadores; Vite ya configurado para subdominios (DA16).
