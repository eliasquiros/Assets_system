from unittest.mock import patch

from django.core.cache import cache
from django_tenants.test.cases import TenantTestCase
from django_tenants.utils import get_public_schema_name, schema_context, tenant_context
from rest_framework.test import APIClient, APIRequestFactory
from rest_framework.throttling import ScopedRateThrottle
from accounts.models import Usuario
from accounts.tokens import crear_refresh
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

    def test_throttle_bloquea_tras_demasiados_intentos(self):
        cache.clear()
        # DRF fija ScopedRateThrottle.THROTTLE_RATES como atributo de clase al
        # importar el modulo (copia el valor de settings en ese momento), por lo
        # que @override_settings sobre REST_FRAMEWORK no lo actualiza en caliente.
        # Se parchea el atributo directamente para bajar el limite a 3/min y
        # poder probar el bloqueo (DA08) sin depender del rate real (5/min).
        with patch.object(ScopedRateThrottle, 'THROTTLE_RATES', {'login': '3/min'}):
            for _ in range(3):
                self._login(password='mala')
            # El 4o intento supera el limite (DA08).
            self.assertEqual(self._login(password='mala').status_code, 429)

    def test_refresh_rota_el_token_e_invalida_el_anterior(self):
        self._login()
        old_refresh = self.client.cookies['refresh'].value

        r1 = self.client.post('/api/auth/refresh/', HTTP_HOST=self.host)
        self.assertEqual(r1.status_code, 200)
        new_refresh = self.client.cookies['refresh'].value
        self.assertNotEqual(old_refresh, new_refresh)

        # El refresh viejo, ya rotado, no debe volver a servir (RS-002/DA08:
        # limita la ventana de un token robado).
        self.client.cookies['refresh'] = old_refresh
        r2 = self.client.post('/api/auth/refresh/', HTTP_HOST=self.host)
        self.assertEqual(r2.status_code, 401)

    def test_logout_invalida_el_refresh_token(self):
        self._login()
        refresh_value = self.client.cookies['refresh'].value

        self.client.post('/api/auth/logout/', HTTP_HOST=self.host)

        self.client.cookies['refresh'] = refresh_value
        r = self.client.post('/api/auth/refresh/', HTTP_HOST=self.host)
        self.assertEqual(r.status_code, 401)


class AislamientoEntreEmpresasTest(TenantTestCase):
    """RS-002: un usuario de la empresa A no puede entrar por el subdominio de B."""

    def test_usuario_de_A_no_autentica_en_subdominio_de_B(self):
        # Segunda empresa, independiente del tenant de prueba (empresa A).
        # TenantTestCase deja la conexion fijada en el schema del tenant de
        # prueba (self.tenant); django-tenants solo permite crear un tenant
        # nuevo con la conexion en el schema publico, asi que se cambia
        # explicitamente antes de crear empresa_b y su dominio.
        with schema_context(get_public_schema_name()):
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
        # No se llama a empresa_b.delete(force_drop=True) aqui: TenantTestCase
        # corre cada test dentro de la transaccion atomica de TestCase, y
        # Postgres soporta DDL transaccional, asi que el CREATE SCHEMA de
        # empresa_b se revierte solo al hacer rollback en el teardown. Intentar
        # el DROP SCHEMA CASCADE en la misma transaccion falla con
        # "cannot DROP TABLE ... because it has pending trigger events" (los
        # triggers diferidos de FK de las migraciones de auth/contenttypes
        # corridas al crear el schema siguen pendientes hasta el commit).


class TokenTenantClaimTest(TenantTestCase):
    """RS-002: un access token emitido para una empresa no debe autenticar en
    otra, aunque la firma sea valida (el SECRET_KEY es compartido) y exista un
    usuario con el mismo id en la otra empresa. Sin un claim de tenant en el
    JWT, un token de A (user_id=1) reenviado al Host de B autenticaria como el
    usuario 1 de B — el puente entre empresas que la Opcion B debe cerrar."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Empresa A = tenant de prueba. Un solo usuario -> id=1.
        with tenant_context(cls.tenant):
            cls.user_a = Usuario.objects.create_user(username='userA', password='secreta123')
        cls.host_a = cls.tenant.get_primary_domain().domain

    def setUp(self):
        cache.clear()

    def _crear_empresa_b_con_id_colisionado(self):
        """Empresa B independiente con un usuario que colisiona en id con el de
        A (ambos =1). Se crea dentro del test (no en setUpClass) por la misma
        razon que AislamientoEntreEmpresasTest: el CREATE SCHEMA se revierte con
        el rollback de la transaccion atomica de cada test. Sin la colision de
        id el test no probaria nada: el rechazo vendria de 'usuario inexistente'
        y no de la verificacion de empresa."""
        with schema_context(get_public_schema_name()):
            empresa_b = Empresa(schema_name='empresa_b_claim', nombre='B', activa=True)
            empresa_b.save()
            Domain.objects.create(domain='b-claim.localhost', tenant=empresa_b, is_primary=True)
        with tenant_context(empresa_b):
            user_b = Usuario.objects.create_user(username='userB', password='secreta123')
        self.assertEqual(self.user_a.id, user_b.id)

    def _login_en_a(self):
        client = APIClient()
        resp = client.post(
            '/api/auth/login/', {'usuario': 'userA', 'password': 'secreta123'},
            format='json', HTTP_HOST=self.host_a,
        )
        self.assertEqual(resp.status_code, 200)
        return client

    def test_access_de_A_no_autentica_en_el_host_de_B(self):
        self._crear_empresa_b_con_id_colisionado()
        client = self._login_en_a()

        # La MISMA cookie de acceso, reenviada contra el Host de B, es rechazada.
        atacante = APIClient()
        atacante.cookies['access'] = client.cookies['access'].value
        resp = atacante.get('/api/auth/me/', HTTP_HOST='b-claim.localhost')
        self.assertEqual(resp.status_code, 401)

    def test_refresh_de_A_no_emite_sesion_en_el_host_de_B(self):
        self._crear_empresa_b_con_id_colisionado()
        client = self._login_en_a()

        # El refresh token de A, reenviado a /refresh/ por el Host de B, no debe
        # emitir una sesion valida de B (mismo agujero, otra superficie).
        atacante = APIClient()
        atacante.cookies['refresh'] = client.cookies['refresh'].value
        resp = atacante.post('/api/auth/refresh/', HTTP_HOST='b-claim.localhost')
        self.assertEqual(resp.status_code, 401)


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
            return str(crear_refresh(self.user).access_token)

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
