"""Pruebas de la seccion de activos (listar/detalle).

Minimas y de alto valor: verifican el contrato exacto que espera el frontend,
los filtros, el detalle, y el aislamiento entre empresas (RS-002). No se
prueban getters/serializers triviales por separado.
"""
from datetime import date
from decimal import Decimal

from django_tenants.test.cases import TenantTestCase
from django_tenants.utils import get_public_schema_name, schema_context, tenant_context
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import Usuario
from assets.models import Activo, Categoria, Localizacion
from companies.models import Domain, Empresa


def crear_activo(numero, nombre, area, tipo, costo, libros, dep,
                 estado='DEPRECIANDO', fecha_adq='2022-03-15', fecha_uso='2022-04-01'):
    loc, _ = Localizacion.objects.get_or_create(nombre=area)
    cat, _ = Categoria.objects.get_or_create(nombre=tipo)
    return Activo.objects.create(
        numero_activo=numero, nombre=nombre,
        costo_original=Decimal(costo), valor_libros_actual=Decimal(libros),
        depreciacion_acumulada_actual=Decimal(dep),
        fecha_adquisicion=date.fromisoformat(fecha_adq),
        fecha_inicio=date.fromisoformat(fecha_uso),
        vida_util_anios=5, estado_depreciacion=estado,
        localizacion=loc, categoria=cat,
    )


class ActivosApiTest(TenantTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        with tenant_context(cls.tenant):
            cls.user = Usuario.objects.create_user(username='ana', password='secreta123')
            crear_activo('AF-0001', 'Laptop Dell', 'Oficinas Administrativas',
                         'Equipo de cómputo', '850000', '255000', '595000')
            crear_activo('AF-0002', 'Escritorio ejecutivo', 'Bodega Central',
                         'Mobiliario y enseres', '415000', '277000', '138000',
                         estado='TOTALMENTE_DEPRECIADO')
        cls.host = cls.tenant.get_primary_domain().domain

    def setUp(self):
        self.client = APIClient()
        with tenant_context(self.tenant):
            access = str(RefreshToken.for_user(self.user).access_token)
        self.client.cookies['access'] = access

    def test_listar_requiere_sesion(self):
        anon = APIClient()
        self.assertEqual(anon.get('/api/activos/', HTTP_HOST=self.host).status_code, 401)

    def test_listar_devuelve_el_contrato_exacto_del_frontend(self):
        resp = self.client.get('/api/activos/', HTTP_HOST=self.host)
        self.assertEqual(resp.status_code, 200)
        # Array plano (sin envoltura de paginacion): la vista suma en cliente.
        self.assertIsInstance(resp.data, list)
        self.assertEqual(len(resp.data), 2)
        a = resp.data[0]
        self.assertEqual(set(a.keys()), {'num', 'nombre', 'area', 'tipo', 'costo',
                                         'libros', 'dep', 'estado', 'fechaAdq'})
        self.assertEqual(a['num'], 'AF-0001')
        self.assertEqual(a['area'], 'Oficinas Administrativas')
        self.assertEqual(a['tipo'], 'Equipo de cómputo')
        self.assertEqual(a['estado'], 'Depreciando')  # etiqueta amigable, no el enum
        self.assertEqual(a['fechaAdq'], '2022-03-15')
        # Montos como numeros (no strings) para que la SummaryBar pueda sumarlos.
        self.assertEqual(a['costo'], 850000)
        self.assertIsInstance(a['costo'], (int, float))
        self.assertEqual(resp.data[1]['estado'], 'Totalmente depreciado')

    def test_filtros_search_area_tipo(self):
        por_nombre = self.client.get('/api/activos/?search=laptop', HTTP_HOST=self.host)
        self.assertEqual([x['num'] for x in por_nombre.data], ['AF-0001'])

        por_numero = self.client.get('/api/activos/?search=AF-0002', HTTP_HOST=self.host)
        self.assertEqual([x['num'] for x in por_numero.data], ['AF-0002'])

        por_area = self.client.get('/api/activos/?area=Bodega Central', HTTP_HOST=self.host)
        self.assertEqual([x['num'] for x in por_area.data], ['AF-0002'])

        por_tipo = self.client.get('/api/activos/?tipo=Equipo de cómputo', HTTP_HOST=self.host)
        self.assertEqual([x['num'] for x in por_tipo.data], ['AF-0001'])

    def test_detalle_incluye_fecha_de_uso(self):
        resp = self.client.get('/api/activos/AF-0001/', HTTP_HOST=self.host)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['num'], 'AF-0001')
        self.assertEqual(resp.data['fechaUso'], '2022-04-01')

    def test_detalle_inexistente_da_404(self):
        resp = self.client.get('/api/activos/AF-9999/', HTTP_HOST=self.host)
        self.assertEqual(resp.status_code, 404)


class AislamientoActivosTest(TenantTestCase):
    """RS-002: los activos de una empresa no se ven desde el subdominio de otra."""

    def test_activos_de_A_no_aparecen_en_el_subdominio_de_B(self):
        with tenant_context(self.tenant):  # empresa A (tenant de prueba)
            user_a = Usuario.objects.create_user(username='soloA', password='secreta123')
            crear_activo('AF-0001', 'Activo de A', 'Bodega Central',
                         'Equipo de cómputo', '100000', '100000', '0')

        with schema_context(get_public_schema_name()):
            empresa_b = Empresa(schema_name='empresa_b_assets', nombre='B', activa=True)
            empresa_b.save()
            Domain.objects.create(domain='b-assets.localhost', tenant=empresa_b, is_primary=True)

        with tenant_context(empresa_b):
            user_b = Usuario.objects.create_user(username='soloB', password='secreta123')
            access_b = str(RefreshToken.for_user(user_b).access_token)

        client = APIClient()
        client.cookies['access'] = access_b
        # Sesion valida de B, consultando el subdominio de B: no ve nada de A.
        resp = client.get('/api/activos/', HTTP_HOST='b-assets.localhost')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data, [])
