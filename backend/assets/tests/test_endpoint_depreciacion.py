"""Endpoint interno POST /api/internal/depreciacion/ que dispara pg_cron (via
pg_net). No es de un tenant: recorre todas las empresas. Protegido por un token
secreto en header, fail-closed si no esta configurado."""
from datetime import date
from decimal import Decimal

from django.test import override_settings
from django_tenants.test.cases import TenantTestCase
from django_tenants.utils import tenant_context
from rest_framework.test import APIClient

from assets.models import Activo, Categoria, Localizacion

URL = '/api/internal/depreciacion/'


class EndpointDepreciacionTest(TenantTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.host = cls.tenant.get_primary_domain().domain

    def _crear_activo_desactualizado(self):
        with tenant_context(self.tenant):
            loc = Localizacion.objects.create(nombre='Bodega')
            cat = Categoria.objects.create(nombre='Equipo')
            return Activo.objects.create(
                numero_activo='AF-0001', nombre='Equipo',
                costo_original=Decimal('600000'),
                valor_libros_actual=Decimal('600000'),
                depreciacion_acumulada_actual=Decimal('0.00'),
                fecha_adquisicion=date(2022, 1, 1),
                fecha_inicio=date(2022, 1, 1),
                vida_util_anios=5,
                estado_depreciacion=Activo.DEPRECIANDO,
                localizacion=loc, categoria=cat,
            )

    @override_settings(INTERNAL_TASK_TOKEN='')
    def test_sin_token_configurado_da_503(self):
        resp = APIClient().post(URL, HTTP_HOST=self.host, HTTP_X_INTERNAL_TOKEN='loquesea')
        self.assertEqual(resp.status_code, 503)

    @override_settings(INTERNAL_TASK_TOKEN='secreto-real')
    def test_token_ausente_o_incorrecto_da_403(self):
        sin = APIClient().post(URL, HTTP_HOST=self.host)
        malo = APIClient().post(URL, HTTP_HOST=self.host, HTTP_X_INTERNAL_TOKEN='otro')
        self.assertEqual(sin.status_code, 403)
        self.assertEqual(malo.status_code, 403)

    @override_settings(INTERNAL_TASK_TOKEN='secreto-real')
    def test_token_correcto_recalcula_y_responde_200(self):
        activo = self._crear_activo_desactualizado()
        resp = APIClient().post(URL, HTTP_HOST=self.host, HTTP_X_INTERNAL_TOKEN='secreto-real')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['actualizados'].get(self.tenant.schema_name), 1)
        with tenant_context(self.tenant):
            activo.refresh_from_db()
        self.assertLess(activo.valor_libros_actual, Decimal('600000'))
