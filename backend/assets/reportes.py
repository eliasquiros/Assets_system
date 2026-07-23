"""Reporte de auditoria en XLSX (RF-006).

Genera un libro Excel con una hoja por categoria: cada activo con todos sus
datos (menos id/version/fecha_creacion), y con la depreciacion acumulada, el
valor en libros y el estado recalculados al corte fiscal del 30 de septiembre
del anio solicitado (RN-001). Los activos cuya fecha de inicio de uso es
posterior al corte se excluyen: a esa fecha aun no existian en operacion.
"""
import re
from datetime import date

from django.http import HttpResponse
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView

from .depreciacion import calcular_depreciacion
from .models import Activo

XLSX_CONTENT_TYPE = (
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
)

# Encabezados de columna, en el orden en que se escriben. La categoria no va
# como columna: es el nombre de la hoja (y el titulo de la fila 1).
COLUMNAS = [
    'N.º de activo', 'Nombre', 'Costo original', 'F. adquisición', 'F. inicio de uso',
    'Vida útil (años)', 'Estado', 'Valor en libros', 'Dep. acumulada',
    'Serie', 'Factura', 'Área', 'Proveedor', 'Marca', 'Modelo', 'Origen',
]
# Caracteres prohibidos por Excel en el nombre de una hoja.
_TITULO_INVALIDO = re.compile(r'[\[\]:*?/\\]')

# Formatos y ancho por columna (indice 1-based, en el orden de COLUMNAS).
# 'fecha' -> DD/MM/YYYY; 'moneda' -> 2 decimales con separador de miles.
_FMT_FECHA = 'DD/MM/YYYY'
_FMT_MONEDA = '#,##0.00'
FORMATOS_COLUMNA = {3: _FMT_MONEDA, 4: _FMT_FECHA, 5: _FMT_FECHA,
                    8: _FMT_MONEDA, 9: _FMT_MONEDA}
# Ancho minimo/maximo (en caracteres) al autoajustar segun el contenido.
_ANCHO_MIN = 10
_ANCHO_MAX = 35
_ENCABEZADO_FILL = PatternFill('solid', fgColor='1F4E78')  # azul corporativo
_ENCABEZADO_FONT = Font(bold=True, color='FFFFFF')
_CENTRADO = Alignment(horizontal='center', vertical='center')


def _nombre_hoja(nombre, usados):
    """Nombre de hoja valido para Excel: sin caracteres prohibidos, <= 31 chars
    y unico dentro del libro (desambigua con un sufijo si ya se uso)."""
    base = _TITULO_INVALIDO.sub(' ', nombre).strip()[:31] or 'Sin categoría'
    candidato = base
    i = 2
    while candidato.lower() in usados:
        sufijo = f' ({i})'
        candidato = base[:31 - len(sufijo)] + sufijo
        i += 1
    usados.add(candidato.lower())
    return candidato


def _validar_anio(valor):
    try:
        anio = int(valor)
    except (TypeError, ValueError):
        raise ValidationError({'anio': 'Debe ser un año válido (YYYY).'})
    if not (2000 <= anio <= 2100):
        raise ValidationError({'anio': 'Fuera de rango (2000–2100).'})
    return anio


def _fila(activo, corte):
    """Los 16 valores de un activo, con dep/libros/estado recalculados al corte."""
    dep, libros, estado = calcular_depreciacion(
        activo.costo_original, activo.vida_util_anios, activo.fecha_inicio, hasta=corte,
    )
    return [
        activo.numero_activo, activo.nombre, float(activo.costo_original),
        activo.fecha_adquisicion, activo.fecha_inicio, activo.vida_util_anios,
        # Etiqueta amigable del estado recalculado al corte (no el almacenado).
        dict(Activo.ESTADO_CHOICES)[estado],
        float(libros), float(dep),
        activo.serie or '', activo.factura or '',
        activo.localizacion.nombre,
        activo.proveedor.nombre if activo.proveedor_id else '',
        activo.marca.nombre if activo.marca_id else '',
        activo.modelo.nombre if activo.modelo_id else '',
        activo.origen.nombre if activo.origen_id else '',
    ]


def construir_libro(anio):
    """Arma el Workbook del reporte de auditoria al 30/09 del `anio`."""
    corte = date(anio, 9, 30)
    activos = (
        Activo.objects
        .filter(fecha_inicio__lte=corte)
        .select_related('localizacion', 'categoria', 'proveedor', 'marca', 'modelo', 'origen')
        .order_by('categoria__nombre', 'numero_activo')
    )

    # Agrupa preservando el orden por nombre de categoria.
    grupos = {}
    for activo in activos:
        grupos.setdefault(activo.categoria.nombre, []).append(activo)

    wb = Workbook()
    wb.remove(wb.active)  # quita la hoja vacia por defecto
    usados = set()

    for categoria, items in grupos.items():
        ws = wb.create_sheet(title=_nombre_hoja(categoria, usados))
        ws['A1'] = categoria
        ws['A1'].font = Font(bold=True, size=14)
        ws.append([])  # fila 2 en blanco
        ws.append(COLUMNAS)  # fila 3: encabezados
        for celda in ws[ws.max_row]:
            celda.font = _ENCABEZADO_FONT
            celda.fill = _ENCABEZADO_FILL
            celda.alignment = _CENTRADO
        for activo in items:
            ws.append(_fila(activo, corte))
        _dar_formato(ws)

    if not wb.worksheets:
        wb.create_sheet(title='Sin activos')

    return wb


def _ancho_visible(celda):
    """Longitud aproximada de como se ve la celda ya formateada (no el valor crudo)."""
    valor = celda.value
    if valor is None:
        return 0
    if celda.number_format == _FMT_FECHA:
        return len('DD/MM/YYYY')
    if celda.number_format == _FMT_MONEDA:
        return len(f'{valor:,.2f}')
    return len(str(valor))


def _dar_formato(ws):
    """Formato de fechas/moneda, ancho de columna autoajustado al contenido
    (con tope minimo/maximo) y encabezados congelados."""
    # El bloque de datos empieza en la fila 4 (1=titulo, 2=blanco, 3=headers).
    for fila in ws.iter_rows(min_row=4, max_col=len(COLUMNAS)):
        for celda in fila:
            fmt = FORMATOS_COLUMNA.get(celda.column)
            if fmt:
                celda.number_format = fmt

    for i, encabezado in enumerate(COLUMNAS, start=1):
        letra = get_column_letter(i)
        max_dato = max(
            (_ancho_visible(c) for c in ws[letra][3:]), default=0,
        )
        ancho = max(len(encabezado), max_dato) + 2  # margen
        ws.column_dimensions[letra].width = min(max(ancho, _ANCHO_MIN), _ANCHO_MAX)
    ws.freeze_panes = 'A4'  # mantiene titulo + encabezados visibles al scrollear


class ReporteAuditoriaView(APIView):
    """GET /api/reportes/auditoria/?anio=<YYYY> — descarga el .xlsx de auditoria."""

    def get(self, request):
        anio = _validar_anio(request.query_params.get('anio'))
        wb = construir_libro(anio)
        response = HttpResponse(content_type=XLSX_CONTENT_TYPE)
        response['Content-Disposition'] = (
            f'attachment; filename="reporte_auditoria_{anio}.xlsx"'
        )
        wb.save(response)
        return response
