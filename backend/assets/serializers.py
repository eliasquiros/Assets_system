"""Serializers de activos.

Las claves y tipos coinciden EXACTAMENTE con lo que espera el frontend ya
construido (ver frontend/src/views/activos/*): `num`, `nombre`, `area`, `tipo`,
`costo`/`libros`/`dep` como numeros (no strings, porque la vista los suma en
cliente), `estado` como etiqueta amigable, y fechas en ISO.
"""
from datetime import date

from django.db import transaction
from rest_framework import serializers
from rest_framework.exceptions import APIException

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
    # version (bloqueo optimista) e IDs de catalogo para precargar los dropdowns
    # del modal de edicion; los nombres de arriba siguen sirviendo al drawer.
    version = serializers.IntegerField(read_only=True)
    categoriaId = serializers.IntegerField(source='categoria_id')
    localizacionId = serializers.IntegerField(source='localizacion_id')
    proveedorId = serializers.IntegerField(source='proveedor_id', allow_null=True)
    marcaId = serializers.IntegerField(source='marca_id', allow_null=True)
    modeloId = serializers.IntegerField(source='modelo_id', allow_null=True)
    origenId = serializers.IntegerField(source='origen_id', allow_null=True)

    class Meta(ActivoListSerializer.Meta):
        fields = ActivoListSerializer.Meta.fields + [
            'fechaUso', 'vidaUtil', 'serie', 'factura', 'proveedor',
            'marca', 'modelo', 'origen', 'fechaRegistro',
            'version', 'categoriaId', 'localizacionId', 'proveedorId',
            'marcaId', 'modeloId', 'origenId',
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
        Movimiento.CAMBIO_FECHAS: 'Ajuste de fechas de adquisición o inicio de uso',
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


class ConflictoDeVersion(APIException):
    """El activo cambio entre que se cargo el formulario y se guardo (bloqueo
    optimista). 409 para que el frontend pida recargar, sin pisar el cambio ajeno."""
    status_code = 409
    default_detail = 'El activo fue modificado por otra persona. Recargá para ver los cambios.'
    default_code = 'conflicto_version'


class ActivoEditSerializer(serializers.ModelSerializer):
    """Edicion de un activo (RF-001/RF-007). Recibe IDs de catalogo + escalares
    camelCase + `version` + `motivo`, valida las mismas reglas de negocio que el
    registro, aplica el cambio bajo bloqueo optimista por `version`, recalcula la
    depreciacion si cambio su base (costo/vida/fecha_inicio) y registra UN
    movimiento por dimension auditable cambiada (costo, vida, area/tipo, fechas).

    `num`, `libros`, `dep` y `estado` NO se editan: el numero es inmutable y los
    tres derivados los calcula el backend (RN-001)."""
    nombre = serializers.CharField(max_length=200)
    costo = serializers.DecimalField(source='costo_original', max_digits=14, decimal_places=2)
    fechaAdq = serializers.DateField(source='fecha_adquisicion')
    fechaUso = serializers.DateField(source='fecha_inicio')
    vidaUtil = serializers.IntegerField(source='vida_util_anios')
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
    version = serializers.IntegerField(write_only=True)
    motivo = serializers.CharField(
        write_only=True, required=False, allow_blank=True, allow_null=True, default='')

    class Meta:
        model = Activo
        fields = [
            'nombre', 'costo', 'fechaAdq', 'fechaUso', 'vidaUtil',
            'serie', 'factura', 'categoria', 'localizacion',
            'proveedor', 'marca', 'modelo', 'origen', 'version', 'motivo',
        ]

    def validate(self, attrs):
        if not attrs.get('serie'):
            attrs['serie'] = None
        costo = attrs.get('costo_original')
        if costo is not None and costo <= 0:
            raise serializers.ValidationError({'costo': 'Debe ser mayor a cero.'})
        if attrs.get('vida_util_anios', 1) <= 0:
            raise serializers.ValidationError({'vidaUtil': 'Debe ser mayor a cero.'})
        inicio, adq = attrs.get('fecha_inicio'), attrs.get('fecha_adquisicion')
        if inicio and adq and inicio < adq:
            raise serializers.ValidationError(
                {'fechaUso': 'La fecha de inicio no puede ser anterior a la de adquisición.'})
        marca, modelo = attrs.get('marca'), attrs.get('modelo')
        if marca and modelo and modelo.marca_id != marca.id:
            raise serializers.ValidationError(
                {'modelo': 'El modelo no pertenece a la marca seleccionada.'})
        return attrs

    def update(self, instance, validated_data):
        version_cliente = validated_data.pop('version')
        motivo = (validated_data.pop('motivo', '') or '').strip() or None

        with transaction.atomic():
            # Relee y bloquea la fila; revalida version dentro de la transaccion
            # para que dos ediciones concurrentes no se pisen (bloqueo optimista).
            activo = Activo.objects.select_for_update().get(pk=instance.pk)
            if activo.version != version_cliente:
                raise ConflictoDeVersion()

            anterior = {
                'costo_original': activo.costo_original,
                'vida_util_anios': activo.vida_util_anios,
                'fecha_inicio': activo.fecha_inicio,
                'fecha_adquisicion': activo.fecha_adquisicion,
                'localizacion_id': activo.localizacion_id,
                'categoria_id': activo.categoria_id,
            }
            for attr, value in validated_data.items():
                setattr(activo, attr, value)

            if (activo.costo_original != anterior['costo_original']
                    or activo.vida_util_anios != anterior['vida_util_anios']
                    or activo.fecha_inicio != anterior['fecha_inicio']):
                dep, libros, estado = calcular_depreciacion(
                    activo.costo_original, activo.vida_util_anios, activo.fecha_inicio,
                )
                activo.depreciacion_acumulada_actual = dep
                activo.valor_libros_actual = libros
                activo.estado_depreciacion = estado

            activo.version = version_cliente + 1
            activo.save()

            for mov in self._movimientos(activo, anterior, motivo):
                Movimiento.objects.create(**mov)
        return activo

    def _movimientos(self, activo, anterior, motivo):
        """Un movimiento por dimension auditable cambiada. Los campos descriptivos
        (nombre, serie, factura, proveedor, marca, modelo, origen) no producen
        movimiento: el historial es solo de valor/clasificacion (RF-007.1)."""
        base = dict(activo=activo, fecha_efectiva=date.today(),
                    usuario=self.context['request'].user, nota=motivo)
        movs = []
        if activo.costo_original != anterior['costo_original']:
            movs.append({**base, 'tipo_evento': Movimiento.CAMBIO_COSTO,
                         'valor_anterior': {'costo_original': str(anterior['costo_original'])},
                         'valor_nuevo': {'costo_original': str(activo.costo_original)}})
        if activo.vida_util_anios != anterior['vida_util_anios']:
            movs.append({**base, 'tipo_evento': Movimiento.CAMBIO_VIDA_UTIL,
                         'valor_anterior': {'vida_util_anios': anterior['vida_util_anios']},
                         'valor_nuevo': {'vida_util_anios': activo.vida_util_anios}})
        area_ant, area_nue = {}, {}
        if activo.localizacion_id != anterior['localizacion_id']:
            area_ant['localizacion_id'] = anterior['localizacion_id']
            area_nue['localizacion_id'] = activo.localizacion_id
        if activo.categoria_id != anterior['categoria_id']:
            area_ant['categoria_id'] = anterior['categoria_id']
            area_nue['categoria_id'] = activo.categoria_id
        if area_nue:
            movs.append({**base, 'tipo_evento': Movimiento.CAMBIO_AREA_TIPO,
                         'valor_anterior': area_ant, 'valor_nuevo': area_nue})
        fecha_ant, fecha_nue = {}, {}
        if activo.fecha_inicio != anterior['fecha_inicio']:
            fecha_ant['fecha_inicio'] = anterior['fecha_inicio'].isoformat()
            fecha_nue['fecha_inicio'] = activo.fecha_inicio.isoformat()
        if activo.fecha_adquisicion != anterior['fecha_adquisicion']:
            fecha_ant['fecha_adquisicion'] = anterior['fecha_adquisicion'].isoformat()
            fecha_nue['fecha_adquisicion'] = activo.fecha_adquisicion.isoformat()
        if fecha_nue:
            movs.append({**base, 'tipo_evento': Movimiento.CAMBIO_FECHAS,
                         'valor_anterior': fecha_ant, 'valor_nuevo': fecha_nue})
        return movs
