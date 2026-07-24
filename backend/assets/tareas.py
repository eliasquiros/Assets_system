"""Recalculo periodico de la depreciacion (DA05/DA06).

Avanza el valor en libros, la depreciacion acumulada y el estado almacenados de
cada activo con el simple paso del tiempo, reutilizando el motor puro
`calcular_depreciacion` (RN-001, corte por defecto = primer dia del mes actual).
No escribe Movimiento por corrida: el historial queda para eventos reales.

Lo disparan el management command `actualizar_depreciacion` (para correr a mano)
y el endpoint interno que activa pg_cron via pg_net."""
from django.db import transaction
from django.utils import timezone
from django_tenants.utils import get_public_schema_name, schema_context, tenant_context

from companies.models import Empresa

from .depreciacion import calcular_depreciacion
from .models import Activo, Retiro
from .retiros import GRACIA

CAMPOS = ['depreciacion_acumulada_actual', 'valor_libros_actual', 'estado_depreciacion']


def _cortes_por_baja_definitiva():
    """Mapa activo_id -> fecha_efectiva de su baja DEFINITIVA (si existe).

    A partir de esa fecha la depreciacion queda congelada (RN-002.3/DA14): el
    motor lee el corte desde aqui (via el retiro definitivo), no calcula al
    corte por defecto. A lo sumo hay una baja no revertida por activo."""
    return dict(
        Retiro.objects.filter(estado=Retiro.DEFINITIVA)
        .values_list('activo_id', 'fecha_efectiva')
    )


def recalcular_empresa():
    """Recalcula todos los activos del schema activo y persiste (bulk_update)
    solo los que cambiaron. Devuelve cuantos cambiaron. Los activos con baja
    DEFINITIVA se recalculan con corte en su fecha efectiva (depreciacion
    congelada, DA14); el resto, al corte por defecto (primer dia del mes)."""
    cortes = _cortes_por_baja_definitiva()
    cambiados = []
    for activo in Activo.objects.all():
        dep, libros, estado = calcular_depreciacion(
            activo.costo_original, activo.vida_util_anios, activo.fecha_inicio,
            hasta=cortes.get(activo.id),
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


def promover_retiros_definitivos():
    """Pasa a DEFINITIVA las bajas PENDIENTES cuyo periodo de gracia ya vencio
    (RN-002.4) y, al hacerlo, congela la depreciacion del activo en la fecha
    efectiva de la baja (RN-002.3/DA14). Devuelve cuantas se promovieron."""
    limite = timezone.now() - GRACIA
    pendientes = (
        Retiro.objects.select_related('activo')
        .filter(estado=Retiro.PENDIENTE, fecha_registro__lte=limite)
    )
    promovidos = 0
    for retiro in pendientes:
        with transaction.atomic():
            retiro.estado = Retiro.DEFINITIVA
            retiro.save(update_fields=['estado'])
            activo = retiro.activo
            dep, libros, estado = calcular_depreciacion(
                activo.costo_original, activo.vida_util_anios, activo.fecha_inicio,
                hasta=retiro.fecha_efectiva,
            )
            activo.depreciacion_acumulada_actual = dep
            activo.valor_libros_actual = libros
            activo.estado_depreciacion = estado
            activo.save(update_fields=CAMPOS)
        promovidos += 1
    return promovidos


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


def promover_retiros_todas_las_empresas():
    """Recorre cada empresa (schema) y promueve sus bajas vencidas a definitivas.
    Devuelve un resumen {schema_name: nº de bajas promovidas}. La lista de
    empresas se lee del schema publico; la promocion corre en cada schema."""
    with schema_context(get_public_schema_name()):
        empresas = list(Empresa.objects.all())
    resumen = {}
    for empresa in empresas:
        with tenant_context(empresa):
            resumen[empresa.schema_name] = promover_retiros_definitivos()
    return resumen
