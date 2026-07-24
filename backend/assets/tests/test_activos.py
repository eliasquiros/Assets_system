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

from accounts.models import Usuario
from accounts.tokens import crear_refresh
from assets.models import (
    Activo, Categoria, Localizacion, Marca, Modelo, Movimiento, Origen, Proveedor,
)
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
            access = str(crear_refresh(self.user).access_token)
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
                                         'libros', 'dep', 'estado', 'fechaAdq',
                                         'pendienteBaja'})
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

    def test_detalle_incluye_version_e_ids_de_catalogo(self):
        resp = self.client.get('/api/activos/AF-0001/', HTTP_HOST=self.host)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['version'], 1)
        self.assertIsInstance(resp.data['categoriaId'], int)
        self.assertIn('localizacionId', resp.data)

    def test_detalle_inexistente_da_404(self):
        resp = self.client.get('/api/activos/AF-9999/', HTTP_HOST=self.host)
        self.assertEqual(resp.status_code, 404)

    def test_movimientos_devuelve_el_contrato_del_drawer(self):
        with tenant_context(self.tenant):
            activo = Activo.objects.get(numero_activo='AF-0001')
            Movimiento.objects.create(
                activo=activo, tipo_evento=Movimiento.ALTA, valor_nuevo={},
                fecha_efectiva=date(2022, 3, 15), usuario=self.user,
            )
        resp = self.client.get('/api/activos/AF-0001/movimientos/', HTTP_HOST=self.host)
        self.assertEqual(resp.status_code, 200)
        self.assertIsInstance(resp.data, list)
        self.assertEqual(len(resp.data), 1)
        h = resp.data[0]
        self.assertEqual(set(h.keys()), {'tipo', 'fecha', 'desc'})
        self.assertEqual(h['tipo'], 'Alta / Registro inicial')
        self.assertEqual(h['fecha'], '2022-03-15')
        self.assertEqual(h['desc'], 'Registro inicial del activo')

    def test_movimientos_de_activo_inexistente_da_404(self):
        resp = self.client.get('/api/activos/AF-9999/movimientos/', HTTP_HOST=self.host)
        self.assertEqual(resp.status_code, 404)

    def test_movimientos_requiere_sesion(self):
        anon = APIClient()
        resp = anon.get('/api/activos/AF-0001/movimientos/', HTTP_HOST=self.host)
        self.assertEqual(resp.status_code, 401)


class RegistrarActivoApiTest(TenantTestCase):
    """Registro de activos (RF-001): creacion + ALTA, numeracion y alta de catalogo."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        with tenant_context(cls.tenant):
            cls.user = Usuario.objects.create_user(username='reg', password='secreta123')
            cls.cat = Categoria.objects.create(nombre='Software', prefijo='SOF')
            cls.loc = Localizacion.objects.create(nombre='Centro de datos')
            cls.prov = Proveedor.objects.create(nombre='Proveedor X')
            cls.marca = Marca.objects.create(nombre='Marca X')
            cls.marca_otra = Marca.objects.create(nombre='Marca Y')
            cls.modelo = Modelo.objects.create(nombre='Modelo 1', marca=cls.marca)
            cls.origen = Origen.objects.create(nombre='Dentro de inversión')
        cls.host = cls.tenant.get_primary_domain().domain

    def setUp(self):
        self.client = APIClient()
        with tenant_context(self.tenant):
            access = str(crear_refresh(self.user).access_token)
        self.client.cookies['access'] = access

    def _payload(self, **over):
        data = dict(
            num='SOF-0001', nombre='Sistema contable', costo='500000',
            fechaAdq='2024-01-10', fechaUso='2024-01-15', vidaUtil=5,
            serie='SN-1', factura='F-1',
            categoria=self.cat.id, localizacion=self.loc.id, proveedor=self.prov.id,
            marca=self.marca.id, modelo=self.modelo.id, origen=self.origen.id,
        )
        data.update(over)
        return data

    def _post(self, url, payload):
        return self.client.post(url, payload, format='json', HTTP_HOST=self.host)

    def test_crear_activo_crea_activo_y_su_alta(self):
        resp = self._post('/api/activos/crear/', self._payload())
        self.assertEqual(resp.status_code, 201)
        with tenant_context(self.tenant):
            activo = Activo.objects.get(numero_activo='SOF-0001')
            movs = list(activo.movimientos.all())
            self.assertEqual(len(movs), 1)
            self.assertEqual(movs[0].tipo_evento, Movimiento.ALTA)
            self.assertEqual(movs[0].usuario_id, self.user.id)

    def test_vida_util_cero_registra_como_totalmente_depreciado(self):
        # 0 es valido: cubre activos recibidos ya totalmente depreciados,
        # sin fecha de inicio real conocida (RN-001.4/.7).
        resp = self._post('/api/activos/crear/', self._payload(vidaUtil=0))
        self.assertEqual(resp.status_code, 201)
        with tenant_context(self.tenant):
            activo = Activo.objects.get(numero_activo='SOF-0001')
            self.assertEqual(activo.estado_depreciacion, 'TOTALMENTE_DEPRECIADO')
            self.assertEqual(activo.depreciacion_acumulada_actual, activo.costo_original)
            self.assertEqual(activo.valor_libros_actual, Decimal('0.00'))

    def test_vida_util_negativa_da_400(self):
        resp = self._post('/api/activos/crear/', self._payload(vidaUtil=-1))
        self.assertEqual(resp.status_code, 400)
        self.assertIn('vidaUtil', resp.data)

    def test_libros_dep_y_estado_no_se_reciben_del_cliente_se_calculan(self):
        # El cliente no puede fijar libros/dep/estado; si los envia, se ignoran.
        resp = self._post('/api/activos/crear/', self._payload(
            fechaAdq='2020-01-01', fechaUso='2020-01-01',
            estado='TOTALMENTE_DEPRECIADO', libros='999999', dep='999999',
        ))
        self.assertEqual(resp.status_code, 201)
        with tenant_context(self.tenant):
            activo = Activo.objects.get(numero_activo='SOF-0001')
            # vida util 5 anios desde 2020-01-01: ya paso de sobra -> totalmente depreciado.
            self.assertEqual(activo.estado_depreciacion, 'TOTALMENTE_DEPRECIADO')
            self.assertEqual(activo.depreciacion_acumulada_actual, activo.costo_original)
            self.assertEqual(activo.valor_libros_actual, Decimal('0.00'))

    def test_siguiente_numero_es_correlativo_por_categoria(self):
        r1 = self.client.get(f'/api/activos/siguiente-numero/?categoria={self.cat.id}', HTTP_HOST=self.host)
        self.assertEqual(r1.data['numero'], 'SOF-0001')
        self._post('/api/activos/crear/', self._payload(num='SOF-0001'))
        r2 = self.client.get(f'/api/activos/siguiente-numero/?categoria={self.cat.id}', HTTP_HOST=self.host)
        self.assertEqual(r2.data['numero'], 'SOF-0002')

    def test_numero_duplicado_da_400(self):
        self._post('/api/activos/crear/', self._payload())
        resp = self._post('/api/activos/crear/', self._payload())
        self.assertEqual(resp.status_code, 400)
        self.assertIn('num', resp.data)

    def test_marca_modelo_y_serie_son_opcionales_y_quedan_null(self):
        payload = self._payload()
        del payload['marca']
        del payload['modelo']
        del payload['serie']
        resp = self._post('/api/activos/crear/', payload)
        self.assertEqual(resp.status_code, 201)
        with tenant_context(self.tenant):
            activo = Activo.objects.get(numero_activo='SOF-0001')
            self.assertIsNone(activo.marca_id)
            self.assertIsNone(activo.modelo_id)
            self.assertIsNone(activo.serie)

    def test_serie_en_blanco_se_guarda_como_null(self):
        resp = self._post('/api/activos/crear/', self._payload(serie='  '))
        self.assertEqual(resp.status_code, 201)
        with tenant_context(self.tenant):
            activo = Activo.objects.get(numero_activo='SOF-0001')
            self.assertIsNone(activo.serie)

    def test_modelo_debe_pertenecer_a_la_marca(self):
        resp = self._post('/api/activos/crear/', self._payload(marca=self.marca_otra.id))
        self.assertEqual(resp.status_code, 400)
        self.assertIn('modelo', resp.data)

    def test_fecha_inicio_anterior_a_adquisicion_da_400(self):
        resp = self._post('/api/activos/crear/', self._payload(fechaUso='2024-01-01'))
        self.assertEqual(resp.status_code, 400)
        self.assertIn('fechaUso', resp.data)

    def test_alta_de_catalogo_categoria_con_prefijo_y_modelo_por_marca(self):
        r = self._post('/api/catalogos/categorias/', {'nombre': 'Redes', 'prefijo': 'RED'})
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data['prefijo'], 'RED')
        r2 = self._post('/api/catalogos/modelos/', {'nombre': 'Modelo nuevo', 'marca': self.marca.id})
        self.assertEqual(r2.status_code, 201)
        self.assertEqual(r2.data['marca'], self.marca.id)


class EditarActivoApiTest(TenantTestCase):
    """Edicion de activos (RF-001/RF-007): un movimiento por dimension auditable,
    recalculo de depreciacion, bloqueo optimista por version y validacion."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        with tenant_context(cls.tenant):
            cls.user = Usuario.objects.create_user(username='ed', password='secreta123')
            cls.cat = Categoria.objects.create(nombre='Cómputo', prefijo='COM')
            cls.loc = Localizacion.objects.create(nombre='Oficinas')
            cls.loc2 = Localizacion.objects.create(nombre='Bodega')
            cls.prov = Proveedor.objects.create(nombre='Dell CR')
            cls.origen = Origen.objects.create(nombre='Dentro de inversión')
        cls.host = cls.tenant.get_primary_domain().domain

    def setUp(self):
        self.client = APIClient()
        with tenant_context(self.tenant):
            access = str(crear_refresh(self.user).access_token)
            Activo.objects.create(
                numero_activo='COM-0001', nombre='Laptop',
                costo_original=Decimal('800000'), valor_libros_actual=Decimal('400000'),
                depreciacion_acumulada_actual=Decimal('400000'),
                fecha_adquisicion=date(2022, 1, 1), fecha_inicio=date(2022, 1, 1),
                vida_util_anios=5, estado_depreciacion='DEPRECIANDO',
                localizacion=self.loc, categoria=self.cat, proveedor=self.prov,
                origen=self.origen, version=1,
            )
        self.client.cookies['access'] = access

    def _payload(self, **over):
        data = dict(
            nombre='Laptop', costo='800000', fechaAdq='2022-01-01', fechaUso='2022-01-01',
            vidaUtil=5, serie=None, factura='F-1',
            categoria=self.cat.id, localizacion=self.loc.id, proveedor=self.prov.id,
            marca=None, modelo=None, origen=self.origen.id, version=1, motivo='',
        )
        data.update(over)
        return data

    def _patch(self, **over):
        return self.client.patch('/api/activos/COM-0001/', self._payload(**over),
                                 format='json', HTTP_HOST=self.host)

    def test_cambio_costo_crea_un_movimiento_y_recalcula(self):
        resp = self._patch(costo='1000000', motivo='ajuste contable')
        self.assertEqual(resp.status_code, 200)
        with tenant_context(self.tenant):
            activo = Activo.objects.get(numero_activo='COM-0001')
            self.assertEqual(activo.costo_original, Decimal('1000000'))
            self.assertEqual(activo.version, 2)
            movs = list(activo.movimientos.all())
            self.assertEqual(len(movs), 1)
            self.assertEqual(movs[0].tipo_evento, Movimiento.CAMBIO_COSTO)
            self.assertEqual(movs[0].valor_nuevo, {'costo_original': '1000000.00'})
            self.assertEqual(movs[0].nota, 'ajuste contable')
            # dep + libros == costo: el backend recalculo, no el cliente.
            self.assertEqual(activo.depreciacion_acumulada_actual + activo.valor_libros_actual,
                             activo.costo_original)

    def test_cambios_multiples_crean_un_movimiento_por_dimension(self):
        resp = self._patch(costo='900000', vidaUtil=8,
                           localizacion=self.loc2.id, fechaUso='2022-06-01')
        self.assertEqual(resp.status_code, 200)
        with tenant_context(self.tenant):
            activo = Activo.objects.get(numero_activo='COM-0001')
            tipos = {m.tipo_evento for m in activo.movimientos.all()}
            self.assertEqual(tipos, {
                Movimiento.CAMBIO_COSTO, Movimiento.CAMBIO_VIDA_UTIL,
                Movimiento.CAMBIO_AREA_TIPO, Movimiento.CAMBIO_FECHAS,
            })

    def test_editar_descriptivo_no_genera_movimiento(self):
        resp = self._patch(nombre='Laptop nueva')
        self.assertEqual(resp.status_code, 200)
        with tenant_context(self.tenant):
            activo = Activo.objects.get(numero_activo='COM-0001')
            self.assertEqual(activo.nombre, 'Laptop nueva')
            self.assertEqual(activo.version, 2)
            self.assertEqual(activo.movimientos.count(), 0)

    def test_version_obsoleta_da_409_sin_persistir(self):
        resp = self._patch(nombre='Pisado', version=99)
        self.assertEqual(resp.status_code, 409)
        with tenant_context(self.tenant):
            activo = Activo.objects.get(numero_activo='COM-0001')
            self.assertEqual(activo.nombre, 'Laptop')
            self.assertEqual(activo.version, 1)
            self.assertEqual(activo.movimientos.count(), 0)

    def test_costo_invalido_da_400_sin_movimiento(self):
        resp = self._patch(costo='0')
        self.assertEqual(resp.status_code, 400)
        self.assertIn('costo', resp.data)
        with tenant_context(self.tenant):
            self.assertEqual(
                Activo.objects.get(numero_activo='COM-0001').movimientos.count(), 0)


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
            access_b = str(crear_refresh(user_b).access_token)

        client = APIClient()
        client.cookies['access'] = access_b
        # Sesion valida de B, consultando el subdominio de B: no ve nada de A.
        resp = client.get('/api/activos/', HTTP_HOST='b-assets.localhost')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data, [])
