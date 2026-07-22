"""Recalculo periodico de la depreciacion (DA05/DA06).

Avanza el valor en libros, la depreciacion acumulada y el estado almacenados de
cada activo con el simple paso del tiempo, reutilizando el motor puro
`calcular_depreciacion` (RN-001, corte por defecto = primer dia del mes actual).
No escribe Movimiento por corrida: el historial queda para eventos reales.

Lo disparan el management command `actualizar_depreciacion` (para correr a mano)
y el endpoint interno que activa pg_cron via pg_net."""
from django_tenants.utils import get_public_schema_name, schema_context, tenant_context

from companies.models import Empresa

from .depreciacion import calcular_depreciacion
from .models import Activo

CAMPOS = ['depreciacion_acumulada_actual', 'valor_libros_actual', 'estado_depreciacion']


def recalcular_empresa():
    """Recalcula todos los activos del schema activo al corte por defecto y
    persiste (bulk_update) solo los que cambiaron. Devuelve cuantos cambiaron."""
    cambiados = []
    for activo in Activo.objects.all():
        dep, libros, estado = calcular_depreciacion(
            activo.costo_original, activo.vida_util_anios, activo.fecha_inicio,
        )
        if (activo.depreciacion_acumulada_actual != dep
                or activo.valor_libros_actual != libros
                or activo.estado_depreciacion != estado):
            activo.depreciacion_acumulada_actual = dep
            activo.valor_libros_actual = libros
            activo.estado_depreciacion = estado
            cambiados.append(activo)
    if cambiados:
        Activo.objects.bulk_update(cambiados, CAMPOS)
    return len(cambiados)


def actualizar_todas_las_empresas():
    """Recorre cada empresa (schema) y recalcula sus activos. Devuelve un
    resumen {schema_name: nº de activos actualizados}. La lista de empresas se
    lee del schema publico; el recalculo de cada una corre en su propio schema."""
    with schema_context(get_public_schema_name()):
        empresas = list(Empresa.objects.all())
    resumen = {}
    for empresa in empresas:
        with tenant_context(empresa):
            resumen[empresa.schema_name] = recalcular_empresa()
    return resumen
