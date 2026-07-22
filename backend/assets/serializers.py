"""Serializers de activos.

Las claves y tipos coinciden EXACTAMENTE con lo que espera el frontend ya
construido (ver frontend/src/views/activos/*): `num`, `nombre`, `area`, `tipo`,
`costo`/`libros`/`dep` como numeros (no strings, porque la vista los suma en
cliente), `estado` como etiqueta amigable, y fechas en ISO.
"""
from django.db import transaction
from rest_framework import serializers

from .depreciacion import calcular_depreciacion
from .models import (
    Activo, Categoria, Localizacion, Marca, Modelo, Movimiento, Origen, Proveedor,
)


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
    marca = serializers.CharField(source='marca.nombre', allow_null=True, default=None)
    modelo = serializers.CharField(source='modelo.nombre', allow_null=True, default=None)
    origen = serializers.CharField(source='origen.nombre', allow_null=True, default=None)
    # fecha_creacion es DateTimeField; se emite como fecha (YYYY-MM-DD) para que
    # el fmtDate del frontend la formatee igual que las demas fechas.
    fechaRegistro = serializers.DateTimeField(source='fecha_creacion', format='%Y-%m-%d')

    class Meta(ActivoListSerializer.Meta):
        fields = ActivoListSerializer.Meta.fields + [
            'fechaUso', 'vidaUtil', 'serie', 'factura', 'proveedor',
            'marca', 'modelo', 'origen', 'fechaRegistro',
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


class ActivoCreateSerializer(serializers.ModelSerializer):
    """Registro de un activo (RF-001). Recibe IDs de catalogo + escalares con las
    mismas claves camelCase del formulario, valida las reglas de negocio y crea
    el activo junto con su movimiento ALTA (RF-007) en una sola transaccion.

    Valor en libros, depreciacion acumulada y estado NO se reciben del cliente:
    el backend los calcula (RN-001, linea recta por dias exactos) a partir del
    costo, la vida util y la fecha de inicio de uso, hasta la fecha de registro."""
    num = serializers.CharField(source='numero_activo', max_length=50)
    costo = serializers.DecimalField(source='costo_original', max_digits=14, decimal_places=2)
    fechaAdq = serializers.DateField(source='fecha_adquisicion')
    fechaUso = serializers.DateField(source='fecha_inicio')
    vidaUtil = serializers.IntegerField(source='vida_util_anios')
    # Marca, modelo y serie son opcionales: si no se ingresan (o vienen en
    # blanco), quedan en null en la base de datos (default=None fuerza que la
    # clave siempre este presente en validated_data, aunque se omita).
    serie = serializers.CharField(
        max_length=100, required=False, allow_null=True, allow_blank=True, default=None)
    factura = serializers.CharField(max_length=100)
    categoria = serializers.PrimaryKeyRelatedField(queryset=Categoria.objects.all())
    localizacion = serializers.PrimaryKeyRelatedField(queryset=Localizacion.objects.all())
    proveedor = serializers.PrimaryKeyRelatedField(queryset=Proveedor.objects.all())
    marca = serializers.PrimaryKeyRelatedField(
        queryset=Marca.objects.all(), required=False, allow_null=True, default=None)
    modelo = serializers.PrimaryKeyRelatedField(
        queryset=Modelo.objects.all(), required=False, allow_null=True, default=None)
    origen = serializers.PrimaryKeyRelatedField(queryset=Origen.objects.all())

    class Meta:
        model = Activo
        fields = [
            'num', 'nombre', 'costo', 'fechaAdq', 'fechaUso', 'vidaUtil',
            'serie', 'factura', 'categoria', 'localizacion',
            'proveedor', 'marca', 'modelo', 'origen',
        ]

    def validate_num(self, value):
        if Activo.objects.filter(numero_activo=value).exists():
            raise serializers.ValidationError('Ya existe un activo con ese número.')
        return value

    def validate(self, attrs):
        if not attrs.get('serie'):
            attrs['serie'] = None
        costo = attrs.get('costo_original')
        if costo is not None and costo <= 0:
            raise serializers.ValidationError({'costo': 'Debe ser mayor a cero.'})
        if attrs.get('vida_util_anios', 1) <= 0:
            raise serializers.ValidationError({'vidaUtil': 'Debe ser mayor a cero.'})
        if attrs['fecha_inicio'] < attrs['fecha_adquisicion']:
            raise serializers.ValidationError(
                {'fechaUso': 'La fecha de inicio no puede ser anterior a la de adquisición.'})
        marca, modelo = attrs.get('marca'), attrs.get('modelo')
        if marca and modelo and modelo.marca_id != marca.id:
            raise serializers.ValidationError(
                {'modelo': 'El modelo no pertenece a la marca seleccionada.'})
        return attrs

    def create(self, validated_data):
        dep, libros, estado = calcular_depreciacion(
            validated_data['costo_original'],
            validated_data['vida_util_anios'],
            validated_data['fecha_inicio'],
        )
        validated_data['depreciacion_acumulada_actual'] = dep
        validated_data['valor_libros_actual'] = libros
        validated_data['estado_depreciacion'] = estado
        with transaction.atomic():
            activo = Activo.objects.create(**validated_data)
            Movimiento.objects.create(
                activo=activo,
                tipo_evento=Movimiento.ALTA,
                valor_anterior=None,
                valor_nuevo={
                    'costo_original': str(activo.costo_original),
                    'vida_util_anios': activo.vida_util_anios,
                    'fecha_inicio': activo.fecha_inicio.isoformat(),
                    'localizacion_id': activo.localizacion_id,
                    'categoria_id': activo.categoria_id,
                },
                fecha_efectiva=activo.fecha_adquisicion,
                usuario=self.context['request'].user,
            )
        return activo
