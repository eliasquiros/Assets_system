"""Serializers de activos.

Las claves y tipos coinciden EXACTAMENTE con lo que espera el frontend ya
construido (ver frontend/src/views/activos/*): `num`, `nombre`, `area`, `tipo`,
`costo`/`libros`/`dep` como numeros (no strings, porque la vista los suma en
cliente), `estado` como etiqueta amigable, y fechas en ISO.
"""
from rest_framework import serializers

from .models import Activo


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
    fechaUso = serializers.DateField(source='fecha_inicio')

    class Meta(ActivoListSerializer.Meta):
        fields = ActivoListSerializer.Meta.fields + ['fechaUso']
