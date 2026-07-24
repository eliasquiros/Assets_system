"""Calculo de depreciacion en linea recta (RN-001).

RN-001.1: metodo de linea recta. RN-001.2: siempre desde fecha_inicio, nunca
fecha_adquisicion. RN-001.3: precision por dias exactos (año de 365 dias), no
meses completos — un activo que empieza a mitad de mes deprecia ese mes de
forma proporcional. Al registrar, el corte de calculo no es el dia exacto
sino el primer dia del mes en que se registra. RN-001.6/.7: la acumulada
nunca supera el costo; al llegar o superar la vida util en dias, queda
TOTALMENTE_DEPRECIADO con acumulada == costo exacto.
"""
from datetime import date
from decimal import ROUND_HALF_UP, Decimal

from .models import Activo

DIAS_POR_ANIO = Decimal('365')
DOS_DECIMALES = Decimal('0.01')


def calcular_depreciacion(costo_original, vida_util_anios, fecha_inicio, hasta=None):
    """Devuelve (depreciacion_acumulada, valor_libros, estado) a la fecha `hasta`
    (el primer dia del mes actual por defecto), para un activo que costo
    `costo_original`, con `vida_util_anios` y que inicio su uso en `fecha_inicio`."""
    hasta = hasta or date.today().replace(day=1)
    costo_original = Decimal(costo_original)
    dias_vida_util = Decimal(vida_util_anios) * DIAS_POR_ANIO
    dias_transcurridos = max((hasta - fecha_inicio).days, 0)

    if Decimal(dias_transcurridos) >= dias_vida_util:
        return costo_original, Decimal('0.00'), Activo.TOTALMENTE_DEPRECIADO

    dep_diaria = costo_original / dias_vida_util
    acumulada = (dep_diaria * dias_transcurridos).quantize(DOS_DECIMALES, rounding=ROUND_HALF_UP)
    if acumulada > costo_original:
        acumulada = costo_original
    valor_libros = costo_original - acumulada
    return acumulada, valor_libros, Activo.DEPRECIANDO
