"""Pruebas del calculo de depreciacion (RN-001): linea recta, dias exactos."""
from datetime import date, timedelta
from decimal import Decimal

from django.test import SimpleTestCase

from assets.depreciacion import calcular_depreciacion
from assets.models import Activo


class CalcularDepreciacionTest(SimpleTestCase):
    def test_activo_que_arranca_hoy_no_tiene_depreciacion_acumulada(self):
        hoy = date(2026, 7, 20)
        dep, libros, estado = calcular_depreciacion('600000', 5, hoy, hasta=hoy)
        self.assertEqual(dep, Decimal('0.00'))
        self.assertEqual(libros, Decimal('600000'))
        self.assertEqual(estado, Activo.DEPRECIANDO)

    def test_prorratea_por_dias_no_por_meses_completos(self):
        # 917 dias exactos desde 2024-01-15 hasta 2026-07-20 (RN-001.3: no se
        # redondea a meses). dep_diaria = 600000 / (5*365) = 328.7671...
        dep, libros, estado = calcular_depreciacion(
            '600000', 5, date(2024, 1, 15), hasta=date(2026, 7, 20),
        )
        self.assertEqual(estado, Activo.DEPRECIANDO)
        self.assertEqual(dep, Decimal('301479.45'))
        self.assertEqual(libros, Decimal('600000') - dep)

    def test_sin_hasta_explicito_el_corte_es_el_primer_dia_del_mes_actual(self):
        # vida util larga (100 anios) para que no sature TOTALMENTE_DEPRECIADO
        # y la fecha de corte exacta si afecte el monto calculado.
        inicio = date.today().replace(day=1) - timedelta(days=5)
        esperado = calcular_depreciacion(
            '600000', 100, inicio, hasta=date.today().replace(day=1),
        )
        obtenido = calcular_depreciacion('600000', 100, inicio)
        self.assertEqual(obtenido, esperado)

    def test_al_cumplir_la_vida_util_queda_totalmente_depreciado_sin_pasarse(self):
        # RN-001.6/.7: la acumulada nunca supera el costo; al llegar al limite,
        # queda exactamente igual al costo, no un poco mas por el redondeo de dias.
        dep, libros, estado = calcular_depreciacion(
            '600000', 5, date(2018, 1, 1), hasta=date(2026, 7, 20),
        )
        self.assertEqual(estado, Activo.TOTALMENTE_DEPRECIADO)
        self.assertEqual(dep, Decimal('600000'))
        self.assertEqual(libros, Decimal('0.00'))
