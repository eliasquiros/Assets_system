# Login Multi-Tenant con JWT en Cookie httpOnly — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el inicio de sesión de la app: autenticación usuario/contraseña enrutada por subdominio al schema de su empresa (django-tenants), emitiendo JWT que viven únicamente en cookies httpOnly (invisibles a JS/DevTools), con aislamiento total entre empresas.

**Architecture:** `django-tenants` resuelve el schema por el `Host` antes de la vista. Una app `companies` (schema público) registra empresas y dominios; una app `accounts` (schema de cada empresa) contiene el modelo `Usuario` y toda la capa de auth. SimpleJWT emite los tokens; una capa de cookies los guarda como httpOnly/Secure/SameSite y una autenticación DRF personalizada los lee desde la cookie y exige CSRF. El frontend deja de guardar tokens: usa cookies (`credentials:'include'`) + header `X-CSRFToken`, y restaura sesión con `GET /api/auth/me/`.

**Tech Stack:** Django 6, django-tenants, djangorestframework, djangorestframework-simplejwt, PostgreSQL (localhost:5430); React + Vitest (frontend).

## Global Constraints

- Rama de trabajo: `feature-inicio-sesion`. Commits en español, imperativo, con `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- El JWT NUNCA aparece en el body de una respuesta ni en `localStorage`; solo en cookies `httpOnly`. (Requisito central del usuario.)
- Error de login idéntico (mismo status 401 y mismo mensaje `"Usuario o contraseña incorrectos"`) para usuario inexistente y para contraseña incorrecta (RS-002 / DA16 — no filtrar en qué empresa existe una cuenta).
- Contraseñas siempre hasheadas con los hashers de Django, nunca en texto plano (RS-001).
- Cookies: `httponly=True`, `samesite='Lax'`, `secure = not DEBUG` (en dev sobre `http://demo.localhost` debe funcionar).
- El modelo `Usuario` mapea EXACTAMENTE la tabla `usuario` de `db/schema.sql` (columnas `username`, `password_hash`, `activo`, `fecha_creacion`, `ultimo_acceso`) vía `db_column`.
- Sin roles: autorización = `IsAuthenticated` + aislamiento por schema.
- Base de datos de desarrollo/pruebas: PostgreSQL en `localhost:5430` (debe estar corriendo para las pruebas backend; django-tenants no funciona sobre sqlite).
- Todos los comandos `manage.py` se ejecutan desde `backend/` con el venv activo.

## File Structure

**Backend (nuevo salvo lo indicado):**
- `backend/config/settings.py` (modificar) — django-tenants, DRF, SimpleJWT, cookies, throttle.
- `backend/config/urls.py` (modificar) — montar `api/auth/`.
- `backend/companies/{__init__,apps,models}.py` + `migrations/` — tenant registry (schema público).
- `backend/accounts/{__init__,apps,models,managers,cookies,authentication,serializers,views,urls}.py` + `migrations/` — usuario + capa de auth (schema de empresa).
- `backend/accounts/management/commands/seed_demo.py` — empresa + usuario demo.
- `backend/accounts/tests/{__init__,test_auth}.py` — pruebas de integración.
- `db/schema.sql`, `db/diccionario_datos.md`, `docs/arquitectura/Decisiones_arquitectura.md` (modificar) — mover `dominio` a tabla `domain`; DA16 pasa de `localStorage` a cookie httpOnly.

**Frontend (modificar):**
- `frontend/src/api/client.js` — cookies + CSRF, sin Bearer.
- `frontend/src/api/auth.js` — `login`/`me`/`logout`.
- `frontend/src/context/AuthContext.jsx` — restaurar vía `/me`, sin localStorage.
- `frontend/src/layout/AppHeader.jsx` — mostrar `username` (no `usuario.nombre/cargo`).
- Pruebas a reescribir: `api/client.test.js`, `context/AuthContext.test.jsx`, `App.test.jsx`, `api/endpoints.test.js`, `hooks/hooks.test.jsx`.

---

### Task 1: Configuración de django-tenants, DRF, SimpleJWT y cookies

**Files:**
- Modify: `requirements.txt`
- Modify: `backend/config/settings.py`
- Modify: `backend/.env`, `backend/.env.example`

**Interfaces:**
- Produces: settings `AUTH_USER_MODEL='accounts.Usuario'`, `TENANT_MODEL='companies.Empresa'`, `TENANT_DOMAIN_MODEL='companies.Domain'`; constantes de cookie `AUTH_COOKIE_ACCESS='access'`, `AUTH_COOKIE_REFRESH='refresh'`, `AUTH_COOKIE_SECURE`, `AUTH_COOKIE_SAMESITE='Lax'`; throttle scope `login`; `REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES']=('accounts.authentication.CookieJWTAuthentication',)`.
- Consumes: nada (primera tarea).

- [ ] **Step 1: Añadir dependencias**

En `requirements.txt` añadir (mantener las existentes):

```
django-tenants==3.9.0
djangorestframework==3.16.1
djangorestframework-simplejwt==5.5.1
```

- [ ] **Step 2: Instalar**

Run: `pip install -r requirements.txt`
Expected: instala django-tenants, djangorestframework, djangorestframework-simplejwt sin errores.

- [ ] **Step 3: Reescribir la sección de apps/middleware/DB de `settings.py`**

Reemplazar el bloque `INSTALLED_APPS = [...]`, `MIDDLEWARE = [...]` y `DATABASES = {...}` por:

```python
from datetime import timedelta

SHARED_APPS = [
    'django_tenants',            # obligatorio primero
    'companies',                 # registro de empresas (schema publico)
    'django.contrib.contenttypes',
    'django.contrib.staticfiles',
    'rest_framework',
]

TENANT_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'accounts',                  # usuarios + auth (schema de cada empresa)
]

INSTALLED_APPS = list(SHARED_APPS) + [a for a in TENANT_APPS if a not in SHARED_APPS]

TENANT_MODEL = 'companies.Empresa'
TENANT_DOMAIN_MODEL = 'companies.Domain'
AUTH_USER_MODEL = 'accounts.Usuario'

DATABASE_ROUTERS = ('django_tenants.routers.TenantSyncRouter',)

MIDDLEWARE = [
    'django_tenants.middleware.main.TenantMainMiddleware',   # fija el schema por Host, primero
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

DATABASES = {
    'default': {
        'ENGINE': 'django_tenants.postgresql_backend',
        'NAME': os.environ.get('DB_NAME', 'activos_fijos'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'postgres'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5430'),
    }
}
```

Eliminar de `settings.py` `django.contrib.admin`, `django.contrib.sessions`, `django.contrib.messages` de INSTALLED_APPS y sus middlewares/context_processors correspondientes (no se usan; simplifican la integración con django-tenants). En `TEMPLATES['OPTIONS']['context_processors']` dejar solo `'django.template.context_processors.request'`.

- [ ] **Step 4: Añadir configuración de DRF, SimpleJWT, cookies, CSRF y cache**

Añadir al final de `settings.py`:

```python
# --- API / autenticacion ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'accounts.authentication.CookieJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.ScopedRateThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'login': '5/min',
    },
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# Cookies donde vive el JWT (nunca en el body ni en localStorage).
AUTH_COOKIE_ACCESS = 'access'
AUTH_COOKIE_REFRESH = 'refresh'
AUTH_COOKIE_SAMESITE = 'Lax'
AUTH_COOKIE_SECURE = not DEBUG          # en dev (DEBUG=True) permite http://demo.localhost
AUTH_COOKIE_REFRESH_PATH = '/api/auth'  # el refresh solo se envia a los endpoints de auth

# CSRF: el token DEBE ser legible por JS para reenviarlo en X-CSRFToken.
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = not DEBUG
CSRF_TRUSTED_ORIGINS = [
    o.strip()
    for o in os.environ.get(
        'DJANGO_CSRF_TRUSTED_ORIGINS',
        'http://localhost:5173,http://demo.localhost:5173',
    ).split(',')
    if o.strip()
]

# Cache local para el throttle del login (DA08). En produccion se cambia el backend (DA07).
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}
```

- [ ] **Step 5: Documentar en `.env.example`**

Añadir a `backend/.env.example`:

```
# Origenes permitidos para CSRF (subdominios del frontend en dev).
DJANGO_CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://demo.localhost:5173
```

Replicar la misma línea en `backend/.env`.

- [ ] **Step 6: Verificar que la configuración carga**

Run: `python manage.py check`
Expected: falla con `ModuleNotFoundError: No module named 'companies'` o `accounts` (aún no existen). Esto confirma que el resto de la config es válida. Se resolverá en las tareas 2–4.

> Nota: `manage.py check` no pasará limpio hasta la Task 4 (cuando existan `companies` y `accounts`). Esta tarea NO tiene commit propio verificable en verde de forma aislada; se commitea junto con la Task 2 para dejar un estado consistente. Si se ejecuta con subagentes, tratar Task 1 + Task 2 como un mismo commit.

- [ ] **Step 7: Actualizar la documentación de esquema (mover `dominio` a tabla `domain`)**

En `db/schema.sql`, en la tabla `public.empresa`, eliminar la columna `dominio` y su constraint `uq_empresa_dominio`, y añadir después de la definición de `empresa`:

```sql
-- Tabla de dominios de django-tenants: enruta cada Host al schema de su empresa.
-- Antes 'dominio' era columna de empresa; django-tenants exige tabla propia.
CREATE TABLE public.domain (
    id          BIGSERIAL    PRIMARY KEY,
    domain      VARCHAR(253) NOT NULL,
    tenant_id   BIGINT       NOT NULL REFERENCES public.empresa(id) ON DELETE CASCADE,
    is_primary  BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_domain_domain UNIQUE (domain)
);
```

En `db/diccionario_datos.md`, mover la fila `dominio` desde la tabla `empresa` a una nueva tabla `domain` (columnas `domain`, `tenant_id`, `is_primary`), con la misma nota de justificación.

En `docs/arquitectura/Decisiones_arquitectura.md`, en DA16, actualizar la "Consecuencia de seguridad relevante": la sesión ya NO se guarda en `localStorage`; el JWT vive en cookies `httpOnly` aisladas por origen (subdominio), lo que refuerza RS-002 igual o mejor, sin exponer el token a JS. Ajustar la referencia al campo `dominio` de `empresa` para que apunte a la tabla `domain`.

- [ ] **Step 8: Commit (junto con Task 2 — ver nota del Step 6)**

Diferir el commit hasta completar la Task 2.

---

### Task 2: App `companies` (registro de empresas, schema público)

**Files:**
- Create: `backend/companies/__init__.py` (vacío)
- Create: `backend/companies/apps.py`
- Create: `backend/companies/models.py`
- Create: `backend/companies/migrations/__init__.py` (vacío)

**Interfaces:**
- Consumes: `TENANT_MODEL`/`TENANT_DOMAIN_MODEL` de settings (Task 1).
- Produces: `companies.models.Empresa` (campos `nombre`, `schema_name`, `activa`, `fecha_alta`, `auto_create_schema=True`, tabla `empresa`) y `companies.models.Domain` (tabla `domain`). `connection.tenant` será una instancia de `Empresa` con atributo `.nombre`.

- [ ] **Step 1: Crear `apps.py`**

```python
from django.apps import AppConfig


class CompaniesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'companies'
```

- [ ] **Step 2: Crear `models.py`**

```python
from django.db import models
from django_tenants.models import DomainMixin, TenantMixin


class Empresa(TenantMixin):
    """Empresa cliente (tenant). Vive en el schema publico (DA02).

    TenantMixin aporta 'schema_name'. auto_create_schema=True hace que al
    guardar una Empresa nueva, django-tenants cree su schema y corra las
    migraciones de TENANT_APPS dentro de el.
    """
    nombre = models.CharField(max_length=200)
    activa = models.BooleanField(default=True)
    fecha_alta = models.DateTimeField(auto_now_add=True)

    auto_create_schema = True

    class Meta:
        db_table = 'empresa'

    def __str__(self):
        return self.nombre


class Domain(DomainMixin):
    """Dominio/subdominio que enruta un Host al schema de su empresa (DA16)."""

    class Meta:
        db_table = 'domain'
```

- [ ] **Step 3: Generar la migración**

Run: `python manage.py makemigrations companies`
Expected: crea `backend/companies/migrations/0001_initial.py` con `Empresa` y `Domain`.

- [ ] **Step 4: Aplicar migraciones al schema público**

Run: `python manage.py migrate_schemas --shared`
Expected: crea las tablas `empresa` y `domain` en el schema `public` sin errores.

- [ ] **Step 5: Commit (incluye Task 1)**

```bash
git add requirements.txt backend/config/settings.py backend/.env.example backend/companies db/schema.sql db/diccionario_datos.md docs/arquitectura/Decisiones_arquitectura.md
git commit -m "feat(backend): configurar django-tenants y app companies (schema publico)"
```

---

### Task 3: App `accounts` — modelo `Usuario` mapeado a la tabla existente

**Files:**
- Create: `backend/accounts/__init__.py` (vacío)
- Create: `backend/accounts/apps.py`
- Create: `backend/accounts/managers.py`
- Create: `backend/accounts/models.py`
- Create: `backend/accounts/migrations/__init__.py` (vacío)
- Create: `backend/accounts/tests/__init__.py` (vacío)
- Create: `backend/accounts/tests/test_models.py`

**Interfaces:**
- Consumes: `AUTH_USER_MODEL='accounts.Usuario'` (Task 1).
- Produces: `accounts.models.Usuario` con `USERNAME_FIELD='username'`, campos `username`, `password` (`db_column='password_hash'`), `is_active` (`db_column='activo'`), `fecha_creacion`, `last_login` (`db_column='ultimo_acceso'`); manager `UsuarioManager.create_user(username, password)`. Método `check_password(raw)` heredado de `AbstractBaseUser`.

- [ ] **Step 1: Crear `apps.py`**

```python
from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'
```

- [ ] **Step 2: Crear `managers.py`**

```python
from django.contrib.auth.base_user import BaseUserManager


class UsuarioManager(BaseUserManager):
    """Crea usuarios hasheando la contrasena (RS-001). Sin superusuarios:
    el MVP no tiene roles ni admin por tenant."""

    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('El username es obligatorio')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)   # hashea; nunca guarda texto plano
        user.save(using=self._db)
        return user
```

- [ ] **Step 3: Crear `models.py`**

```python
from django.contrib.auth.base_user import AbstractBaseUser
from django.db import models

from .managers import UsuarioManager


class Usuario(AbstractBaseUser):
    """Usuario dentro del schema de su propia empresa (DA03).

    Mapea EXACTAMENTE la tabla 'usuario' de db/schema.sql. Se sobreescriben
    'password' y 'last_login' de AbstractBaseUser solo para fijar su db_column
    (password_hash, ultimo_acceso). Sin PermissionsMixin: no hay roles.
    """
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=255, db_column='password_hash')
    is_active = models.BooleanField(default=True, db_column='activo')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(
        null=True, blank=True, db_column='ultimo_acceso',
    )

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    objects = UsuarioManager()

    class Meta:
        db_table = 'usuario'

    def __str__(self):
        return self.username
```

- [ ] **Step 4: Escribir la prueba de hashing (RS-001)**

Crear `backend/accounts/tests/test_models.py`:

```python
from django_tenants.test.cases import TenantTestCase

from accounts.models import Usuario


class UsuarioModelTest(TenantTestCase):
    def test_create_user_hashea_la_contrasena(self):
        user = Usuario.objects.create_user(username='ana', password='secreta123')

        # Nunca se guarda en texto plano (RS-001).
        self.assertNotEqual(user.password, 'secreta123')
        self.assertTrue(user.password.startswith(('pbkdf2_', 'argon2')))
        # Pero se puede verificar.
        self.assertTrue(user.check_password('secreta123'))
        self.assertFalse(user.check_password('otra'))
```

- [ ] **Step 5: Generar la migración de accounts**

Run: `python manage.py makemigrations accounts`
Expected: crea `backend/accounts/migrations/0001_initial.py` con el modelo `Usuario`.

- [ ] **Step 6: Ejecutar la prueba**

Run: `python manage.py test accounts.tests.test_models`
Expected: PASS. (`TenantTestCase` crea un tenant de prueba y corre las migraciones de tenant, incluyendo `usuario`.)

- [ ] **Step 7: Commit**

```bash
git add backend/accounts
git commit -m "feat(accounts): modelo Usuario mapeado a la tabla usuario con hashing (RS-001)"
```

---

### Task 4: Capa de autenticación — cookies, JWT, endpoints

**Files:**
- Create: `backend/accounts/cookies.py`
- Create: `backend/accounts/authentication.py`
- Create: `backend/accounts/serializers.py`
- Create: `backend/accounts/views.py`
- Create: `backend/accounts/urls.py`
- Modify: `backend/config/urls.py`

**Interfaces:**
- Consumes: `Usuario` (Task 3); constantes de cookie y `SIMPLE_JWT` (Task 1); `connection.tenant.nombre` (Task 2).
- Produces: endpoints `POST /api/auth/login/`, `POST /api/auth/refresh/`, `POST /api/auth/logout/`, `GET /api/auth/me/`; clase `accounts.authentication.CookieJWTAuthentication`; helpers `set_auth_cookies(response, access, refresh)` y `clear_auth_cookies(response)`.

- [ ] **Step 1: Crear `cookies.py`**

```python
from django.conf import settings
from rest_framework_simplejwt.settings import api_settings


def set_auth_cookies(response, access_token, refresh_token):
    """Guarda el JWT en cookies httpOnly. El token nunca va en el body."""
    common = {
        'httponly': True,
        'secure': settings.AUTH_COOKIE_SECURE,
        'samesite': settings.AUTH_COOKIE_SAMESITE,
    }
    response.set_cookie(
        settings.AUTH_COOKIE_ACCESS,
        str(access_token),
        max_age=int(api_settings.ACCESS_TOKEN_LIFETIME.total_seconds()),
        path='/',
        **common,
    )
    response.set_cookie(
        settings.AUTH_COOKIE_REFRESH,
        str(refresh_token),
        max_age=int(api_settings.REFRESH_TOKEN_LIFETIME.total_seconds()),
        path=settings.AUTH_COOKIE_REFRESH_PATH,
        **common,
    )


def clear_auth_cookies(response):
    response.delete_cookie(settings.AUTH_COOKIE_ACCESS, path='/')
    response.delete_cookie(
        settings.AUTH_COOKIE_REFRESH, path=settings.AUTH_COOKIE_REFRESH_PATH,
    )
```

- [ ] **Step 2: Crear `authentication.py` (lee el JWT de la cookie y exige CSRF)**

```python
from django.conf import settings
from rest_framework import exceptions
from rest_framework.authentication import CSRFCheck
from rest_framework_simplejwt.authentication import JWTAuthentication


def _enforce_csrf(request):
    """Aplica la proteccion CSRF de Django a las peticiones autenticadas por
    cookie, igual que hace SessionAuthentication. CsrfViewMiddleware ya ignora
    los metodos seguros (GET/HEAD/OPTIONS), asi que /me no la exige."""
    check = CSRFCheck(lambda req: None)
    check.process_request(request)
    reason = check.process_view(request, None, (), {})
    if reason:
        raise exceptions.PermissionDenied(f'CSRF Failed: {reason}')


class CookieJWTAuthentication(JWTAuthentication):
    """Autentica leyendo el access token desde la cookie httpOnly, no del
    header Authorization. El token sensible nunca es accesible por JS."""

    def authenticate(self, request):
        raw_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS)
        if not raw_token:
            return None
        validated_token = self.get_validated_token(raw_token)
        user = self.get_user(validated_token)
        _enforce_csrf(request)
        return (user, validated_token)
```

- [ ] **Step 3: Crear `serializers.py`**

```python
from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    usuario = serializers.CharField()
    password = serializers.CharField(trim_whitespace=False, style={'input_type': 'password'})
```

- [ ] **Step 4: Crear `views.py`**

```python
from django.db import connection
from django.middleware.csrf import get_token
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .cookies import clear_auth_cookies, set_auth_cookies
from .models import Usuario
from .serializers import LoginSerializer

CREDENCIALES_INVALIDAS = 'Usuario o contraseña incorrectos'


def _empresa_nombre():
    return getattr(connection.tenant, 'nombre', None)


class LoginView(APIView):
    """POST /api/auth/login/ — autentica contra el usuario del schema actual
    (fijado por el Host) y setea el JWT en cookies httpOnly."""
    permission_classes = [AllowAny]
    authentication_classes = []          # el login es el bootstrap, no exige cookie previa
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data['usuario']
        password = serializer.validated_data['password']

        # Consulta SOLO contra el schema ya fijado por el middleware (RS-002).
        # Mensaje identico para usuario inexistente y contrasena mala (DA16).
        try:
            user = Usuario.objects.get(username=username)
        except Usuario.DoesNotExist:
            user = None
        if user is None or not user.is_active or not user.check_password(password):
            return Response(
                {'detail': CREDENCIALES_INVALIDAS},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)
        response = Response({'username': user.username, 'empresa': _empresa_nombre()})
        set_auth_cookies(response, refresh.access_token, refresh)
        get_token(request)   # marca a CsrfViewMiddleware para setear la cookie csrftoken
        return response


class RefreshView(APIView):
    """POST /api/auth/refresh/ — rota el access token desde la cookie refresh."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        raw = request.COOKIES.get('refresh')
        if not raw:
            return Response({'detail': 'Sesión no encontrada'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            refresh = RefreshToken(raw)
        except TokenError:
            response = Response({'detail': 'Sesión expirada'}, status=status.HTTP_401_UNAUTHORIZED)
            clear_auth_cookies(response)
            return response
        response = Response({'detail': 'ok'})
        set_auth_cookies(response, refresh.access_token, refresh)
        return response


class LogoutView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        response = Response(status=status.HTTP_204_NO_CONTENT)
        clear_auth_cookies(response)
        return response


class MeView(APIView):
    """GET /api/auth/me/ — devuelve el perfil si la cookie es valida. Permite
    al frontend restaurar la sesion sin poder leer el JWT httpOnly."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'username': request.user.username, 'empresa': _empresa_nombre()})
```

- [ ] **Step 5: Crear `urls.py` de accounts**

```python
from django.urls import path

from .views import LoginView, LogoutView, MeView, RefreshView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', RefreshView.as_view(), name='refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', MeView.as_view(), name='me'),
]
```

- [ ] **Step 6: Montar en `config/urls.py`**

Reemplazar el contenido de `backend/config/urls.py` por:

```python
from django.urls import include, path

urlpatterns = [
    path('api/auth/', include('accounts.urls')),
]
```

- [ ] **Step 7: Verificar que todo carga**

Run: `python manage.py check`
Expected: `System check identified no issues (0 silenced).`

- [ ] **Step 8: Commit**

```bash
git add backend/accounts backend/config/urls.py
git commit -m "feat(accounts): login/refresh/logout/me con JWT en cookies httpOnly y CSRF"
```

---

### Task 5: Comando `seed_demo` y pruebas de integración de autenticación

**Files:**
- Create: `backend/accounts/management/__init__.py` (vacío)
- Create: `backend/accounts/management/commands/__init__.py` (vacío)
- Create: `backend/accounts/management/commands/seed_demo.py`
- Create: `backend/accounts/tests/test_auth.py`

**Interfaces:**
- Consumes: endpoints y `CookieJWTAuthentication` (Task 4); `Empresa`/`Domain` (Task 2); `Usuario` (Task 3).
- Produces: comando `seed_demo`; suite `accounts.tests.test_auth`.

- [ ] **Step 1: Crear `seed_demo.py`**

```python
from django.core.management.base import BaseCommand
from django_tenants.utils import schema_context

from accounts.models import Usuario
from companies.models import Domain, Empresa


class Command(BaseCommand):
    help = 'Crea la empresa Demo (demo.localhost) y un usuario admin/demo12345.'

    def handle(self, *args, **options):
        empresa, creada = Empresa.objects.get_or_create(
            schema_name='empresa_demo',
            defaults={'nombre': 'Demo', 'activa': True},
        )
        Domain.objects.get_or_create(
            domain='demo.localhost', tenant=empresa,
            defaults={'is_primary': True},
        )
        with schema_context('empresa_demo'):
            if not Usuario.objects.filter(username='admin').exists():
                Usuario.objects.create_user(username='admin', password='demo12345')
        self.stdout.write(self.style.SUCCESS('Demo lista: http://demo.localhost:8000  (admin / demo12345)'))
```

- [ ] **Step 2: Ejecutar el seed y arrancar el server para prueba manual**

Run: `python manage.py migrate_schemas --shared && python manage.py seed_demo`
Expected: imprime "Demo lista..."; crea el schema `empresa_demo` con su tabla `usuario`.

- [ ] **Step 3: Escribir las pruebas de integración**

Crear `backend/accounts/tests/test_auth.py`. Estas son las ÚNICAS pruebas backend nuevas (alto valor: seguridad del login). Usan `TenantTestCase` (un tenant con dominio de prueba) y `APIClient`.

```python
from django.core.cache import cache
from django.test import override_settings
from django_tenants.test.cases import TenantTestCase
from django_tenants.utils import tenant_context
from rest_framework.test import APIClient, APIRequestFactory
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import Usuario
from companies.models import Domain, Empresa


class AuthFlowTest(TenantTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Usuario dentro del tenant de prueba (self.tenant lo crea TenantTestCase).
        with tenant_context(cls.tenant):
            Usuario.objects.create_user(username='ana', password='secreta123')
        cls.host = cls.tenant.get_primary_domain().domain

    def setUp(self):
        # El throttle usa LocMemCache por IP; sin limpiar, los intentos de un
        # test contarian en los demas y dispararian 429 espurios.
        cache.clear()
        self.client = APIClient()

    def _login(self, usuario='ana', password='secreta123'):
        return self.client.post(
            '/api/auth/login/', {'usuario': usuario, 'password': password},
            format='json', HTTP_HOST=self.host,
        )

    def test_login_ok_setea_cookies_httponly_y_no_expone_token(self):
        resp = self._login()
        self.assertEqual(resp.status_code, 200)
        # El token NUNCA aparece en el body.
        self.assertNotIn('access', resp.data)
        self.assertNotIn('token', resp.data)
        self.assertEqual(resp.data['username'], 'ana')
        # El JWT vive en cookies httpOnly.
        access = resp.cookies['access']
        self.assertTrue(access['httponly'])
        self.assertEqual(access['samesite'], 'Lax')
        self.assertTrue(resp.cookies['refresh']['httponly'])

    def test_error_generico_identico_para_usuario_inexistente_y_password_mala(self):
        r_mala = self._login(password='equivocada')
        r_inexistente = self._login(usuario='fantasma', password='loquesea')
        self.assertEqual(r_mala.status_code, 401)
        self.assertEqual(r_inexistente.status_code, 401)
        # Mismo status y mismo mensaje: no filtra si la cuenta existe (RS-002/DA16).
        self.assertEqual(r_mala.data, r_inexistente.data)

    def test_endpoint_protegido_rechaza_sin_cookie_y_acepta_con_ella(self):
        # Sin cookie -> 401.
        anon = APIClient()
        self.assertEqual(anon.get('/api/auth/me/', HTTP_HOST=self.host).status_code, 401)
        # Con cookie de un login previo -> 200.
        self._login()
        me = self.client.get('/api/auth/me/', HTTP_HOST=self.host)
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.data['username'], 'ana')

    @override_settings(REST_FRAMEWORK={
        'DEFAULT_AUTHENTICATION_CLASSES': ('accounts.authentication.CookieJWTAuthentication',),
        'DEFAULT_PERMISSION_CLASSES': ('rest_framework.permissions.IsAuthenticated',),
        'DEFAULT_THROTTLE_CLASSES': ('rest_framework.throttling.ScopedRateThrottle',),
        'DEFAULT_THROTTLE_RATES': {'login': '3/min'},
    })
    def test_throttle_bloquea_tras_demasiados_intentos(self):
        from django.core.cache import cache
        cache.clear()
        for _ in range(3):
            self._login(password='mala')
        # El 4o intento supera el limite (DA08).
        self.assertEqual(self._login(password='mala').status_code, 429)


class AislamientoEntreEmpresasTest(TenantTestCase):
    """RS-002: un usuario de la empresa A no puede entrar por el subdominio de B."""

    def test_usuario_de_A_no_autentica_en_subdominio_de_B(self):
        # Segunda empresa, independiente del tenant de prueba (empresa A).
        empresa_b = Empresa(schema_name='empresa_b', nombre='B', activa=True)
        empresa_b.save()
        Domain.objects.create(domain='b.localhost', tenant=empresa_b, is_primary=True)
        with tenant_context(self.tenant):
            Usuario.objects.create_user(username='soloA', password='secreta123')

        client = APIClient()
        # 'soloA' existe en A, pero pedimos login por el Host de B -> no lo encuentra.
        resp = client.post(
            '/api/auth/login/', {'usuario': 'soloA', 'password': 'secreta123'},
            format='json', HTTP_HOST='b.localhost',
        )
        self.assertEqual(resp.status_code, 401)
        empresa_b.delete(force_drop=True)


class CookieCSRFTest(TenantTestCase):
    """CookieJWTAuthentication exige CSRF en metodos no seguros y lo omite en
    los seguros — se prueba la clase directamente porque esta feature aun no
    expone un POST autenticado por cookie."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        with tenant_context(cls.tenant):
            cls.user = Usuario.objects.create_user(username='ana', password='secreta123')

    def _access_cookie(self):
        with tenant_context(self.tenant):
            return str(RefreshToken.for_user(self.user).access_token)

    def test_post_por_cookie_sin_csrf_es_rechazado(self):
        from rest_framework.exceptions import PermissionDenied
        from accounts.authentication import CookieJWTAuthentication

        request = APIRequestFactory(enforce_csrf_checks=True).post('/x/', {}, format='json')
        request.COOKIES['access'] = self._access_cookie()
        with tenant_context(self.tenant):
            with self.assertRaises(PermissionDenied):
                CookieJWTAuthentication().authenticate(request)

    def test_get_por_cookie_no_exige_csrf(self):
        from accounts.authentication import CookieJWTAuthentication

        request = APIRequestFactory(enforce_csrf_checks=True).get('/x/')
        request.COOKIES['access'] = self._access_cookie()
        with tenant_context(self.tenant):
            user, _ = CookieJWTAuthentication().authenticate(request)
        self.assertEqual(user.username, 'ana')
```

> Nota para el ejecutor: `TenantTestCase` requiere PostgreSQL corriendo en `localhost:5430`. No añadas más pruebas de las listadas; si alguna necesita un ajuste menor de API (p.ej. cómo se obtiene el dominio primario del tenant), corrígelo sin cambiar lo que la prueba verifica.

- [ ] **Step 4: Ejecutar toda la suite backend**

Run: `python manage.py test accounts`
Expected: PASS (test_models + test_auth). Si PostgreSQL no está corriendo, arráncalo antes.

- [ ] **Step 5: Commit**

```bash
git add backend/accounts/management backend/accounts/tests/test_auth.py
git commit -m "feat(accounts): seed_demo y pruebas de aislamiento, cookies, CSRF y throttle del login"
```

---

### Task 6: Frontend — capa API con cookies y CSRF (sin Bearer)

**Files:**
- Modify: `frontend/src/api/client.js`
- Modify: `frontend/src/api/auth.js`
- Modify (reescribir): `frontend/src/api/client.test.js`

**Interfaces:**
- Consumes: endpoints `POST /api/auth/login/`, `GET /api/auth/me/`, `POST /api/auth/logout/` (Task 4).
- Produces: `apiFetch(path, {method, body, headers})` que envía `credentials:'include'` y `X-CSRFToken` (leído de la cookie `csrftoken`) en métodos no seguros; `auth.js` exporta `login(usuario, password)`, `me()`, `logout()`.

- [ ] **Step 1: Reescribir la prueba de `client.js`**

Reemplazar `frontend/src/api/client.test.js` por:

```js
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, ApiError } from './client'

describe('apiFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    document.cookie = 'csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  })

  it('GET envía las cookies y no manda Authorization', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) })
    vi.stubGlobal('fetch', mockFetch)

    const data = await apiFetch('/auth/me/')

    expect(data).toEqual({ ok: true })
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/me/', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: undefined,
    })
  })

  it('POST adjunta X-CSRFToken desde la cookie y envía credenciales', async () => {
    document.cookie = 'csrftoken=abc123'
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ username: 'ana' }) })
    vi.stubGlobal('fetch', mockFetch)

    await apiFetch('/auth/login/', { method: 'POST', body: { usuario: 'ana', password: 'x' } })

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': 'abc123' },
      credentials: 'include',
      body: JSON.stringify({ usuario: 'ana', password: 'x' }),
    })
  })

  it('devuelve null en un 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204 }))
    expect(await apiFetch('/auth/logout/', { method: 'POST' })).toBeNull()
  })

  it('lanza ApiError con el detail del servidor en respuesta no-ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 401, json: async () => ({ detail: 'Usuario o contraseña incorrectos' }),
    }))
    await expect(apiFetch('/auth/login/', { method: 'POST' })).rejects.toThrow('Usuario o contraseña incorrectos')
  })

  it('lanza ApiError de conexión cuando fetch rechaza', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const error = await apiFetch('/auth/me/').catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(0)
  })
})
```

- [ ] **Step 2: Ejecutar la prueba y verla fallar**

Run (desde `frontend/`): `npm test -- src/api/client.test.js`
Expected: FAIL (el `client.js` actual manda `Authorization` y no envía `credentials`).

- [ ] **Step 3: Reescribir `client.js`**

```js
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function getCookie(name) {
  const match = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')
  return match ? decodeURIComponent(match.pop()) : null
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export async function apiFetch(path, { method = 'GET', body, headers } = {}) {
  const finalHeaders = { 'Content-Type': 'application/json', ...(headers || {}) }

  // En métodos que cambian estado, reenviamos el token CSRF legible. El JWT
  // viaja solo en cookies httpOnly (no accesibles desde aquí) vía credentials.
  if (!SAFE_METHODS.has(method.toUpperCase())) {
    const csrf = getCookie('csrftoken')
    if (csrf) finalHeaders['X-CSRFToken'] = csrf
  }

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      credentials: 'include',
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
      // sin cuerpo JSON: se mantiene el mensaje genérico
    }
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) return null
  return response.json()
}
```

- [ ] **Step 4: Actualizar `auth.js`**

```js
import { apiFetch } from './client'

export function login(usuario, password) {
  return apiFetch('/auth/login/', { method: 'POST', body: { usuario, password } })
}

export function me() {
  return apiFetch('/auth/me/')
}

export function logout() {
  return apiFetch('/auth/logout/', { method: 'POST' })
}
```

- [ ] **Step 5: Ejecutar la prueba y verla pasar**

Run: `npm test -- src/api/client.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/api/client.js frontend/src/api/auth.js frontend/src/api/client.test.js
git commit -m "feat(frontend): apiFetch con cookies httpOnly y CSRF, sin token Bearer"
```

---

### Task 7: Frontend — AuthContext por cookie, header y pruebas afectadas

**Files:**
- Modify: `frontend/src/context/AuthContext.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/layout/AppHeader.jsx`
- Modify (reescribir): `frontend/src/context/AuthContext.test.jsx`
- Modify: `frontend/src/App.test.jsx`, `frontend/src/api/endpoints.test.js`, `frontend/src/hooks/hooks.test.jsx`

**Interfaces:**
- Consumes: `auth.js` `login`/`me`/`logout` (Task 6).
- Produces: `useAuth()` devuelve `{ username, empresa, isAuthenticated, loading, login, logout }`. Ya NO expone `token` ni `usuario`, ni usa `localStorage`.

- [ ] **Step 1: Reescribir `AuthContext.test.jsx`**

```js
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './AuthContext'
import { login as loginRequest, me as meRequest, logout as logoutRequest } from '../api/auth'

vi.mock('../api/auth')

function Consumer() {
  const { isAuthenticated, loading, username, empresa, login, logout } = useAuth()
  if (loading) return <span>cargando</span>
  if (!isAuthenticated) return <button onClick={() => login('ana', 'secreta123')}>entrar</button>
  return (
    <div>
      <span>{username} · {empresa}</span>
      <button onClick={logout}>salir</button>
    </div>
  )
}

describe('AuthContext', () => {
  afterEach(() => vi.clearAllMocks())

  it('arranca sin sesión cuando /me responde 401', async () => {
    meRequest.mockRejectedValue(new Error('401'))
    render(<AuthProvider><Consumer /></AuthProvider>)
    expect(await screen.findByText('entrar')).toBeInTheDocument()
  })

  it('restaura la sesión desde /me al montar', async () => {
    meRequest.mockResolvedValue({ username: 'ana', empresa: 'Demo' })
    render(<AuthProvider><Consumer /></AuthProvider>)
    expect(await screen.findByText('ana · Demo')).toBeInTheDocument()
  })

  it('login guarda la sesión devuelta por la API (sin token en cliente)', async () => {
    meRequest.mockRejectedValue(new Error('401'))
    loginRequest.mockResolvedValue({ username: 'ana', empresa: 'Demo' })
    render(<AuthProvider><Consumer /></AuthProvider>)

    await userEvent.click(await screen.findByText('entrar'))

    expect(await screen.findByText('ana · Demo')).toBeInTheDocument()
  })

  it('logout limpia la sesión', async () => {
    meRequest.mockResolvedValue({ username: 'ana', empresa: 'Demo' })
    logoutRequest.mockResolvedValue(null)
    render(<AuthProvider><Consumer /></AuthProvider>)

    await userEvent.click(await screen.findByText('salir'))
    await waitFor(() => expect(screen.getByText('entrar')).toBeInTheDocument())
  })

  it('lanza si useAuth se usa fuera del provider', () => {
    function Broken() { useAuth(); return null }
    expect(() => render(<Broken />)).toThrow('useAuth debe usarse dentro de AuthProvider')
  })
})
```

- [ ] **Step 2: Ejecutar y ver fallar**

Run (desde `frontend/`): `npm test -- src/context/AuthContext.test.jsx`
Expected: FAIL (el AuthContext actual usa token/localStorage y no llama a `/me`).

- [ ] **Step 3: Reescribir `AuthContext.jsx`**

```jsx
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { login as loginRequest, logout as logoutRequest, me as meRequest } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)   // { username, empresa } | null
  const [loading, setLoading] = useState(true)

  // La fuente de verdad es la cookie httpOnly (no legible por JS). Al montar
  // preguntamos a /me si esa cookie es válida y recuperamos el perfil.
  useEffect(() => {
    let active = true
    meRequest()
      .then((data) => { if (active) setSession(data) })
      .catch(() => { if (active) setSession(null) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const login = useCallback(async (usuario, password) => {
    const data = await loginRequest(usuario, password)
    setSession(data)
    return data
  }, [])

  const logout = useCallback(async () => {
    try { await logoutRequest() } finally { setSession(null) }
  }, [])

  const value = { ...session, isAuthenticated: !!session, loading, login, logout }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
```

- [ ] **Step 4: Ejecutar y ver pasar**

Run: `npm test -- src/context/AuthContext.test.jsx`
Expected: PASS.

- [ ] **Step 5: Gate de carga en `App.jsx`**

Modificar `RequireAuth` para no parpadear al login mientras se resuelve `/me`:

```jsx
function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  return isAuthenticated ? children : <Navigate to="/login" replace />
}
```

- [ ] **Step 6: Actualizar `AppHeader.jsx` (usa `username`, no `usuario.nombre`)**

El backend solo provee `username`. Reemplazar el bloque de usuario:

```jsx
import { useAuth } from '../context/AuthContext'
import styles from './AppHeader.module.css'

export function AppHeader() {
  const { empresa, username, logout } = useAuth()
  const iniciales = (username || '?').slice(0, 2).toUpperCase()
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
            <div className={styles.userName}>{username}</div>
          </div>
          <div className={styles.avatar}>{iniciales}</div>
        </div>
        <button type="button" className={styles.logout} onClick={logout}>Salir</button>
      </div>
    </header>
  )
}
```

- [ ] **Step 7: Corregir las pruebas que usaban la sesión mock antigua**

Estas pruebas fijan la sesión vía `localStorage`/objeto `usuario`; hay que adaptarlas al nuevo modelo (`username`/`empresa`, restauración por `/me`).

En `frontend/src/App.test.jsx` y `frontend/src/api/endpoints.test.js`: sustituir el objeto `SESSION` `{ token, empresa, usuario:{nombre,cargo,iniciales} }` por `{ username: 'ana', empresa: 'Demo' }`, y donde se sembraba `localStorage.setItem('af_session', ...)` para autenticar, mockear en su lugar `me` de `../api/auth` para que resuelva ese objeto (`vi.mock('../api/auth')` + `meRequest.mockResolvedValue({ username:'ana', empresa:'Demo' })`). En `endpoints.test.js` el body de login sigue siendo `{ usuario, password }`, pero la respuesta esperada de `login` ahora es `{ username, empresa }` sin `token`.

En `frontend/src/hooks/hooks.test.jsx` (línea ~23): eliminar `localStorage.setItem('af_session', ...)`; envolver el `renderHook` en un `AuthProvider` con `me` mockeado a una sesión válida, o mockear `useAuth` para devolver `{ isAuthenticated: true }`. Los hooks ya no dependen de `token` (las cookies autentican), así que basta con que el provider reporte sesión activa.

- [ ] **Step 8: Ejecutar toda la suite frontend**

Run (desde `frontend/`): `npm test`
Expected: PASS en todos los archivos. Corregir cualquier prueba restante que aún referencie `token`, `usuario.nombre`, `usuario.cargo`, `usuario.iniciales` o `af_session`.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/context/AuthContext.jsx frontend/src/App.jsx frontend/src/layout/AppHeader.jsx frontend/src/context/AuthContext.test.jsx frontend/src/App.test.jsx frontend/src/api/endpoints.test.js frontend/src/hooks/hooks.test.jsx
git commit -m "feat(frontend): sesión por cookie httpOnly vía /me, sin token en el cliente"
```

---

## Verificación end-to-end (manual, tras completar todas las tareas)

1. Backend: `cd backend && python manage.py migrate_schemas --shared && python manage.py seed_demo && python manage.py runserver`
2. Frontend: `cd frontend && npm run dev`
3. Navegar a `http://demo.localhost:5173`, iniciar sesión con `admin` / `demo12345`.
4. En DevTools → Application → Cookies: confirmar que `access` y `refresh` están marcadas `HttpOnly` (no legibles por JS); `csrftoken` sí legible. Confirmar que NO hay token en `localStorage` ni en el body de la respuesta de login (pestaña Network).
5. Recargar la página: la sesión persiste (vía `/me`), sin token visible.
6. Intentar `http://demo.localhost:5173` con credenciales incorrectas: mismo mensaje genérico.

## Self-Review (cobertura del spec)

- Autenticación por schema/subdominio → Tasks 1,2,4 (TenantMainMiddleware + login contra schema actual). ✓
- JWT nunca visible (cookies httpOnly, no body, no localStorage) → Tasks 4,6,7 + prueba `test_login_ok_setea_cookies_httponly_y_no_expone_token`. ✓
- Aislamiento entre empresas + error genérico (RS-002/DA16) → Task 5 (`AislamientoEntreEmpresasTest`, `test_error_generico_identico...`). ✓
- Contraseñas hasheadas (RS-001) → Task 3 (`test_create_user_hashea_la_contrasena`). ✓
- Rate limiting del login (DA08) → Tasks 1,4 + `test_throttle_bloquea...`. ✓
- CSRF con cookie legible + header → Tasks 1,4,6 + `CookieCSRFTest`. ✓
- Modelo Usuario mapeado exacto a `usuario` → Task 3. ✓
- Doc de esquema/DA16 actualizada (dominio→domain, localStorage→cookie) → Task 1 Step 7. ✓
- Frontend adaptado (client, auth, AuthContext, AppHeader) + pruebas existentes que rompen → Tasks 6,7. ✓
