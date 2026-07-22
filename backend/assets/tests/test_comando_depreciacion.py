"""El comando `actualizar_depreciacion` recalcula los activos de cada empresa
(es la superficie para correr el recalculo a mano; el endpoint interno usa el
mismo nucleo)."""
from datetime import date
from decimal import Decimal
from io import StringIO

from django.core.management import call_command
from django_tenants.test.cases import TenantTestCase
from django_tenants.utils import tenant_context

from assets.models import Activo, Categoria, Localizacion


class ComandoActualizarDepreciacionTest(TenantTestCase):
    def test_actualiza_los_activos_de_la_empresa(self):
        with tenant_context(self.tenant):
            loc = Localizacion.objects.create(nombre='Bodega')
            cat = Categoria.objects.create(nombre='Equipo')
            activo = Activo.objects.create(
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

        call_command('actualizar_depreciacion', stdout=StringIO())

        with tenant_context(self.tenant):
            activo.refresh_from_db()
        self.assertLess(activo.valor_libros_actual, Decimal('600000'))
        self.assertGreater(activo.depreciacion_acumulada_actual, Decimal('0'))
