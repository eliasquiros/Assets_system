"""CORS: solo los origenes de la allowlist reciben cabeceras con credenciales."""
from django.test import override_settings
from django_tenants.test.cases import TenantTestCase
from rest_framework.test import APIClient


class CorsHeadersTest(TenantTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.host = cls.tenant.get_primary_domain().domain

    @override_settings(
        CORS_ALLOWED_ORIGIN_REGEXES=[r'^https://[a-z0-9-]+\.sistema\.com$'],
        CORS_ALLOW_CREDENTIALS=True,
    )
    def test_origen_permitido_recibe_cabeceras_cors_con_credenciales(self):
        resp = APIClient().get(
            '/api/auth/me/', HTTP_HOST=self.host, HTTP_ORIGIN='https://demo.sistema.com',
        )
        self.assertEqual(resp['Access-Control-Allow-Origin'], 'https://demo.sistema.com')
        self.assertEqual(resp['Access-Control-Allow-Credentials'], 'true')

    @override_settings(
        CORS_ALLOWED_ORIGIN_REGEXES=[r'^https://[a-z0-9-]+\.sistema\.com$'],
        CORS_ALLOW_CREDENTIALS=True,
    )
    def test_origen_no_permitido_no_recibe_allow_origin(self):
        resp = APIClient().get(
            '/api/auth/me/', HTTP_HOST=self.host, HTTP_ORIGIN='https://atacante.com',
        )
        self.assertNotIn('Access-Control-Allow-Origin', resp)
