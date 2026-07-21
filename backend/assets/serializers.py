"""Serializers de activos.

Las claves y tipos coinciden EXACTAMENTE con lo que espera el frontend ya
construido (ver frontend/src/views/activos/*): `num`, `nombre`, `area`, `tipo`,
`costo`/`libros`/`dep` como numeros (no strings, porque la vista los suma en
cliente), `estado` como etiqueta amigable, y fechas en ISO.
"""
from rest_framework import serializers

from .models import Activo, Movimiento


class ActivoListSerializer(serializers.ModelSerializer):
    num = serializers.CharField(source='numero_activo')
    area = serializers.CharField(source='localizacion.nombre')
    tipo = serializers.CharField(source='categoria.nombre')
    # FloatField (no DecimalField) para emitir un numero JSON, no un string:
    # la ActivoSummaryBar del frontend hace aritmetica sobre estos valores.
    costo = serializers.FloatField(source='costo_original')
    libros = serializers.FloatField(source='valor_libros_actual')
    dep = serializers.FloatField(source='depreciacion_acumulada_actual')
    estado = serializers.CharField(source='get_estado_depreciacion_display')
    fechaAdq = serializers.DateField(source='fecha_adquisicion')

    class Meta:
        model = Activo
        fields = ['num', 'nombre', 'area', 'tipo', 'costo', 'libros', 'dep', 'estado', 'fechaAdq']


class ActivoDetailSerializer(ActivoListSerializer):
    """Detalle completo del activo para el "Ver mas": ademas del contrato del
    listado, expone todos los campos restantes del modelo (vida util, serie,
    factura, fechas) para que el drawer muestre la ficha entera."""
    fechaUso = serializers.DateField(source='fecha_inicio')
    vidaUtil = serializers.IntegerField(source='vida_util_anios')
    serie = serializers.CharField(allow_null=True)
    factura = serializers.CharField(allow_null=True)
    proveedor = serializers.CharField(source='proveedor.nombre', allow_null=True, default=None)
    # fecha_creacion es DateTimeField; se emite como fecha (YYYY-MM-DD) para que
    # el fmtDate del frontend la formatee igual que las demas fechas.
    fechaRegistro = serializers.DateTimeField(source='fecha_creacion', format='%Y-%m-%d')

    class Meta(ActivoListSerializer.Meta):
        fields = ActivoListSerializer.Meta.fields + [
            'fechaUso', 'vidaUtil', 'serie', 'factura', 'proveedor', 'fechaRegistro',
        ]


class MovimientoSerializer(serializers.ModelSerializer):
    """Emite el contrato exacto que consume el historial del ActivoDetailDrawer:
    `tipo` (etiqueta amigable), `fecha` (ISO) y `desc` (texto legible)."""
    tipo = serializers.CharField(source='get_tipo_evento_display')
    fecha = serializers.DateField(source='fecha_efectiva')
    desc = serializers.SerializerMethodField()

    class Meta:
        model = Movimiento
        fields = ['tipo', 'fecha', 'desc']

    def get_desc(self, obj):
        return self._DESCRIPCIONES.get(obj.tipo_evento, obj.get_tipo_evento_display())

    _DESCRIPCIONES = {
        Movimiento.ALTA: 'Registro inicial del activo',
        Movimiento.CAMBIO_COSTO: 'Ajuste del costo original del activo',
        Movimiento.CAMBIO_VIDA_UTIL: 'Ajuste de la vida útil estimada',
        Movimiento.CAMBIO_AREA_TIPO: 'Reubicación de área o cambio de categoría',
        Movimiento.BAJA: 'Retiro / baja del activo',
        Movimiento.REVERSION_BAJA: 'Reversión de la baja registrada',
    }
