"""Recalculo periodico de la depreciacion (DA05/DA06): avanza el valor en libros
almacenado de cada activo con el paso del tiempo, reutilizando el motor puro
`calcular_depreciacion`. Se prueba el nucleo por-empresa y el recorrido de todas
las empresas (aislamiento entre schemas incluido)."""
from datetime import date
from decimal import Decimal

from django_tenants.test.cases import TenantTestCase
from django_tenants.utils import get_public_schema_name, schema_context, tenant_context

from assets.depreciacion import calcular_depreciacion
from assets.models import Activo, Categoria, Localizacion
from assets.tareas import actualizar_todas_las_empresas, recalcular_empresa
from companies.models import Domain, Empresa


def _crear_activo_desactualizado(numero, costo='600000', fecha='2022-01-01'):
    """Activo con valores almacenados 'como recien registrado' (dep=0,
    libros=costo) pero con una fecha de inicio en el pasado: el recalculo debe
    avanzarlo. Devuelve el activo."""
    loc, _ = Localizacion.objects.get_or_create(nombre='Bodega')
    cat, _ = Categoria.objects.get_or_create(nombre='Equipo')
    return Activo.objects.create(
        numero_activo=numero, nombre='Equipo de prueba',
        costo_original=Decimal(costo),
        valor_libros_actual=Decimal(costo),
        depreciacion_acumulada_actual=Decimal('0.00'),
        fecha_adquisicion=date.fromisoformat(fecha),
        fecha_inicio=date.fromisoformat(fecha),
        vida_util_anios=5,
        estado_depreciacion=Activo.DEPRECIANDO,
        localizacion=loc, categoria=cat,
    )


class RecalcularEmpresaTest(TenantTestCase):
    def test_avanza_los_valores_almacenados_al_corte_por_defecto(self):
        with tenant_context(self.tenant):
            activo = _crear_activo_desactualizado('AF-0001')
            cambiados = recalcular_empresa()
            activo.refresh_from_db()
            # El corte por defecto de calcular_depreciacion es el primer dia del
            # mes actual, el mismo que usa recalcular_empresa.
            dep, libros, estado = calcular_depreciacion(
                Decimal('600000'), 5, date(2022, 1, 1),
            )
        self.assertEqual(cambiados, 1)
        self.assertEqual(activo.depreciacion_acumulada_actual, dep)
        self.assertEqual(activo.valor_libros_actual, libros)
        self.assertEqual(activo.estado_depreciacion, estado)

    def test_es_idempotente_no_reescribe_lo_ya_correcto(self):
        with tenant_context(self.tenant):
            _crear_activo_desactualizado('AF-0001')
            self.assertEqual(recalcular_empresa(), 1)   # primera vez: avanza
            self.assertEqual(recalcular_empresa(), 0)   # segunda vez: nada cambia


class ActualizarTodasLasEmpresasTest(TenantTestCase):
    def test_recorre_cada_empresa_y_devuelve_el_resumen(self):
        with tenant_context(self.tenant):
            _crear_activo_desactualizado('AF-0001')
        # Segunda empresa independiente (patron de AislamientoActivosTest).
        with schema_context(get_public_schema_name()):
            empresa_b = Empresa(schema_name='empresa_b_tareas', nombre='B', activa=True)
            empresa_b.save()
            Domain.objects.create(domain='b-tareas.localhost', tenant=empresa_b, is_primary=True)
        with tenant_context(empresa_b):
            activo_b = _crear_activo_desactualizado('AF-0001')

        resumen = actualizar_todas_las_empresas()

        self.assertEqual(resumen.get(self.tenant.schema_name), 1)
        self.assertEqual(resumen.get('empresa_b_tareas'), 1)
        with tenant_context(empresa_b):
            activo_b.refresh_from_db()
            self.assertNotEqual(activo_b.valor_libros_actual, Decimal('600000'))
