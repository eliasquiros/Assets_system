"""Pruebas de la baja / retiro de activos (RN-002, DA11-DA15).

Cubren lo de alto valor: registrar deja el retiro PENDIENTE con su movimiento
BAJA y marca el activo "pendiente de baja"; no se permiten dos bajas activas
sobre el mismo activo; revertir dentro de la gracia lo reincorpora; la promocion
a DEFINITIVA congela la depreciacion en la fecha efectiva; el trigger impide
editar una baja ya cerrada; y el reporte financiero excluye las bajas
definitivas. Cada prueba usa su propio activo para no chocar con el indice unico
parcial (a lo sumo una baja no revertida por activo).
"""
import shutil
import tempfile
from datetime import date, timedelta
from decimal import Decimal

from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError, transaction
from django.test import override_settings
from django.utils import timezone
from django_tenants.test.cases import TenantTestCase
from django_tenants.utils import tenant_context
from rest_framework.test import APIClient

from accounts.models import Usuario
from accounts.tokens import crear_refresh
from assets.depreciacion import calcular_depreciacion
from assets.models import Activo, Categoria, Localizacion, Movimiento, Retiro
from assets.reportes import _agrupar_por_categoria
from assets.tareas import promover_retiros_definitivos

_MEDIA = tempfile.mkdtemp()


@override_settings(MEDIA_ROOT=_MEDIA)
class RetiroTest(TenantTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        with tenant_context(cls.tenant):
            cls.user = Usuario.objects.create_user(username='baj', password='secreta123')
            cls.cat = Categoria.objects.create(nombre='Cómputo', prefijo='COM')
            cls.loc = Localizacion.objects.create(nombre='Oficinas')
        cls.host = cls.tenant.get_primary_domain().domain

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(_MEDIA, ignore_errors=True)
        super().tearDownClass()

    def setUp(self):
        self.client = APIClient()
        with tenant_context(self.tenant):
            access = str(crear_refresh(self.user).access_token)
        self.client.cookies['access'] = access

    # --- helpers -----------------------------------------------------------

    def _activo(self, num, fecha_inicio='2024-01-01'):
        with tenant_context(self.tenant):
            return Activo.objects.create(
                numero_activo=num, nombre='Laptop',
                costo_original=Decimal('1200000'),
                valor_libros_actual=Decimal('0'),
                depreciacion_acumulada_actual=Decimal('0'),
                fecha_adquisicion=date.fromisoformat(fecha_inicio),
                fecha_inicio=date.fromisoformat(fecha_inicio),
                vida_util_anios=10, estado_depreciacion='DEPRECIANDO',
                localizacion=self.loc, categoria=self.cat,
            )

    def _registrar(self, num, fecha='2026-06-30', motivo='Venta', desc='Vendido'):
        archivo = SimpleUploadedFile('c.pdf', b'contenido', content_type='application/pdf')
        return self.client.post('/api/bajas/', {
            'activoNum': num, 'motivo': motivo, 'desc': desc,
            'fechaEfectiva': fecha, 'archivo': archivo,
        }, format='multipart', HTTP_HOST=self.host)

    def _retiro_orm(self, activo, estado='PENDIENTE', fecha_efectiva='2026-06-30'):
        with tenant_context(self.tenant):
            return Retiro.objects.create(
                activo=activo, motivo='VENTA', descripcion='Vendido',
                fecha_efectiva=date.fromisoformat(fecha_efectiva),
                archivo_respaldo=SimpleUploadedFile('c.pdf', b'x'),
                usuario=self.user, estado=estado,
            )

    # --- pruebas -----------------------------------------------------------

    def test_requiere_sesion(self):
        anon = APIClient()
        self.assertEqual(anon.get('/api/bajas/', HTTP_HOST=self.host).status_code, 401)

    def test_registrar_crea_pendiente_con_movimiento_baja(self):
        self._activo('COM-0001')
        resp = self._registrar('COM-0001')
        self.assertEqual(resp.status_code, 201, resp.content)
        cuerpo = resp.json()
        self.assertEqual(cuerpo['estado'], 'Pendiente')
        self.assertEqual(cuerpo['activoNum'], 'COM-0001')
        self.assertEqual(cuerpo['motivo'], 'Venta')
        self.assertIsNotNone(cuerpo['venceTs'])
        with tenant_context(self.tenant):
            retiro = Retiro.objects.get(activo__numero_activo='COM-0001')
            self.assertEqual(retiro.estado, 'PENDIENTE')
            mov = Movimiento.objects.get(activo__numero_activo='COM-0001', tipo_evento='BAJA')
            self.assertEqual(mov.retiro_id, retiro.id)

    def test_no_permite_dos_bajas_activas(self):
        self._activo('COM-0002')
        self.assertEqual(self._registrar('COM-0002').status_code, 201)
        segunda = self._registrar('COM-0002')
        self.assertEqual(segunda.status_code, 400)
        self.assertIn('activoNum', segunda.json())

    def test_archivo_es_obligatorio(self):
        self._activo('COM-0003')
        resp = self.client.post('/api/bajas/', {
            'activoNum': 'COM-0003', 'motivo': 'Venta',
            'desc': 'Vendido', 'fechaEfectiva': '2026-06-30',
        }, format='multipart', HTTP_HOST=self.host)
        self.assertEqual(resp.status_code, 400)
        self.assertIn('archivo', resp.json())

    def test_revertir_dentro_de_gracia_reincorpora(self):
        self._activo('COM-0004')
        rid = self._registrar('COM-0004').json()['id']
        resp = self.client.post(f'/api/bajas/{rid}/revertir/', HTTP_HOST=self.host)
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(resp.json()['estado'], 'Revertida')
        with tenant_context(self.tenant):
            self.assertEqual(Retiro.objects.get(pk=rid).estado, 'REVERTIDA')
            self.assertTrue(Movimiento.objects.filter(
                activo__numero_activo='COM-0004', tipo_evento='REVERSION_BAJA').exists())

    def test_promover_a_definitiva_congela_depreciacion(self):
        activo = self._activo('COM-0005')
        rid = self._registrar('COM-0005', fecha='2026-06-30').json()['id']
        with tenant_context(self.tenant):
            # Envejece la baja mas alla del periodo de gracia (2 dias).
            Retiro.objects.filter(pk=rid).update(
                fecha_registro=timezone.now() - timedelta(days=3))
            self.assertEqual(promover_retiros_definitivos(), 1)
            retiro = Retiro.objects.get(pk=rid)
            self.assertEqual(retiro.estado, 'DEFINITIVA')
            activo.refresh_from_db()
            dep, libros, estado = calcular_depreciacion(
                Decimal('1200000'), 10, date(2024, 1, 1), hasta=date(2026, 6, 30))
            self.assertEqual(activo.depreciacion_acumulada_actual, dep)
            self.assertEqual(activo.valor_libros_actual, libros)

    def test_trigger_impide_editar_baja_definitiva(self):
        activo = self._activo('COM-0006')
        retiro = self._retiro_orm(activo, estado='DEFINITIVA')
        with tenant_context(self.tenant):
            with self.assertRaises(IntegrityError):
                with transaction.atomic():
                    Retiro.objects.filter(pk=retiro.id).update(descripcion='cambiado')

    def test_reporte_financiero_excluye_bajas_definitivas(self):
        activo = self._activo('COM-0007')
        self._retiro_orm(activo, estado='DEFINITIVA', fecha_efectiva='2026-06-30')
        with tenant_context(self.tenant):
            grupos = _agrupar_por_categoria(date(2026, 7, 31))
            nums = [fila[0] for g in grupos.values() for fila in g['filas']]
            self.assertNotIn('COM-0007', nums)

    def test_activo_pendiente_de_baja_se_marca_en_el_listado(self):
        activo = self._activo('COM-0008')
        self._retiro_orm(activo, estado='PENDIENTE')
        resp = self.client.get('/api/activos/', HTTP_HOST=self.host)
        self.assertEqual(resp.status_code, 200)
        fila = next(a for a in resp.json() if a['num'] == 'COM-0008')
        self.assertTrue(fila['pendienteBaja'])
