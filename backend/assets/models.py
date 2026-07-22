"""Modelos de activos y catalogos, dentro del schema de cada empresa (DA09).

Mapean las tablas documentadas en db/schema.sql. Cubren el listado/detalle y el
registro de activos (RF-001): todos los catalogos (localizacion, categoria,
proveedor, marca, modelo, origen) y las FKs correspondientes en `activo`.
"""
from django.conf import settings
from django.db import models
from django.db.models.functions import Lower, Trim


class Localizacion(models.Model):
    """Area/ubicacion interna (catalogo_localizaciones). RF-001.1."""
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(null=True, blank=True)
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = 'catalogo_localizaciones'
        constraints = [
            models.UniqueConstraint(
                Lower(Trim('nombre')), name='uq_localizacion_nombre_norm',
            ),
        ]

    def __str__(self):
        return self.nombre


class Categoria(models.Model):
    """Tipo/categoria de activo (catalogo_categorias). RF-001.1, RF-003.1.

    `prefijo` es el codigo corto (ej. SOF, VEH) con el que se arma el numero de
    activo al registrar: numero = PREFIJO-#### correlativo dentro de la categoria.
    """
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(null=True, blank=True)
    prefijo = models.CharField(max_length=8, blank=True, default='')
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = 'catalogo_categorias'
        constraints = [
            models.UniqueConstraint(
                Lower(Trim('nombre')), name='uq_categoria_nombre_norm',
            ),
        ]

    def __str__(self):
        return self.nombre


class Proveedor(models.Model):
    """Proveedor que suministro el activo (catalogo_proveedores).

    No corresponde a un RF explicito; normaliza la trazabilidad de compras sin
    acoplarla al activo con texto libre. Se muestra en el detalle ("Ver mas")."""
    nombre = models.CharField(max_length=200)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'catalogo_proveedores'
        constraints = [
            models.UniqueConstraint(
                Lower(Trim('nombre')), name='uq_proveedor_nombre_norm',
            ),
        ]

    def __str__(self):
        return self.nombre


class Marca(models.Model):
    """Marca del activo (catalogo_marcas). RF-001.1. 1:N hacia Modelo."""
    nombre = models.CharField(max_length=150)
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = 'catalogo_marcas'
        constraints = [
            models.UniqueConstraint(
                Lower(Trim('nombre')), name='uq_marca_nombre_norm',
            ),
        ]

    def __str__(self):
        return self.nombre


class Modelo(models.Model):
    """Modelo, asociado a una unica marca (catalogo_modelos, 1:N marca->modelo).

    El nombre es unico dentro de la marca, no globalmente (dos marcas pueden
    tener un modelo homonimo)."""
    nombre = models.CharField(max_length=150)
    marca = models.ForeignKey(Marca, on_delete=models.PROTECT, related_name='modelos')
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = 'catalogo_modelos'
        constraints = [
            models.UniqueConstraint(
                'marca', Lower(Trim('nombre')), name='uq_modelo_marca_nombre_norm',
            ),
        ]

    def __str__(self):
        return self.nombre


class Origen(models.Model):
    """Origen del activo (catalogo_origenes). RF-001.1. Catalogo fijo: se siembran
    'Dentro de inversion' y 'Fuera de inversion'; no se crean desde la UI."""
    nombre = models.CharField(max_length=150)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'catalogo_origenes'
        constraints = [
            models.UniqueConstraint(
                Lower(Trim('nombre')), name='uq_origen_nombre_norm',
            ),
        ]

    def __str__(self):
        return self.nombre


class Activo(models.Model):
    """Activo fijo de la empresa (tabla `activo`, RF-001).

    valor_libros_actual y depreciacion_acumulada_actual son atajos de lectura
    derivados del historial (DA05): el listado y el detalle los leen tal cual,
    no recalculan nada.
    """
    DEPRECIANDO = 'DEPRECIANDO'
    TOTALMENTE_DEPRECIADO = 'TOTALMENTE_DEPRECIADO'
    ESTADO_CHOICES = [
        (DEPRECIANDO, 'Depreciando'),
        (TOTALMENTE_DEPRECIADO, 'Totalmente depreciado'),
    ]

    numero_activo = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=200)
    costo_original = models.DecimalField(max_digits=14, decimal_places=2)
    fecha_adquisicion = models.DateField()
    fecha_inicio = models.DateField()
    vida_util_anios = models.IntegerField()
    estado_depreciacion = models.CharField(max_length=30, choices=ESTADO_CHOICES)
    valor_libros_actual = models.DecimalField(max_digits=14, decimal_places=2)
    depreciacion_acumulada_actual = models.DecimalField(max_digits=14, decimal_places=2)
    serie = models.CharField(max_length=100, null=True, blank=True)
    factura = models.CharField(max_length=100, null=True, blank=True)
    localizacion = models.ForeignKey(
        Localizacion, on_delete=models.PROTECT, related_name='activos',
    )
    categoria = models.ForeignKey(
        Categoria, on_delete=models.PROTECT, related_name='activos',
    )
    proveedor = models.ForeignKey(
        Proveedor, on_delete=models.PROTECT, related_name='activos',
        null=True, blank=True,
    )
    marca = models.ForeignKey(
        Marca, on_delete=models.PROTECT, related_name='activos',
        null=True, blank=True,
    )
    modelo = models.ForeignKey(
        Modelo, on_delete=models.PROTECT, related_name='activos',
        null=True, blank=True,
    )
    origen = models.ForeignKey(
        Origen, on_delete=models.PROTECT, related_name='activos',
        null=True, blank=True,
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    # Testigo de bloqueo optimista (RF-001): sube en cada edicion. El detalle lo
    # expone y la edicion lo reenvia; si no coincide, la edicion se rechaza (409).
    version = models.PositiveIntegerField(default=1)

    class Meta:
        db_table = 'activo'
        constraints = [
            models.CheckConstraint(
                condition=models.Q(costo_original__gt=0),
                name='ck_activo_costo_original_positivo',
            ),
            models.CheckConstraint(
                condition=models.Q(fecha_inicio__gte=models.F('fecha_adquisicion')),
                name='ck_activo_fecha_inicio_valida',
            ),
            # 0 es valido: cubre activos que se registran ya totalmente
            # depreciados (sin fecha de inicio real conocida), ver RN-001.4/.7.
            models.CheckConstraint(
                condition=models.Q(vida_util_anios__gte=0),
                name='ck_activo_vida_util_no_negativa',
            ),
            models.CheckConstraint(
                condition=models.Q(estado_depreciacion__in=['DEPRECIANDO', 'TOTALMENTE_DEPRECIADO']),
                name='ck_activo_estado_depreciacion',
            ),
            models.CheckConstraint(
                condition=models.Q(valor_libros_actual__gte=0),
                name='ck_activo_valor_libros_no_negativo',
            ),
            models.CheckConstraint(
                condition=models.Q(depreciacion_acumulada_actual__gte=0),
                name='ck_activo_depreciacion_acumulada_no_negativa',
            ),
            models.CheckConstraint(
                condition=models.Q(depreciacion_acumulada_actual__lte=models.F('costo_original')),
                name='ck_activo_depreciacion_no_supera_costo',
            ),
        ]

    def __str__(self):
        return f'{self.numero_activo} — {self.nombre}'


class Movimiento(models.Model):
    """Historial inmutable de eventos de un activo (tabla `movimiento`, RF-007).

    Es la unica fuente de verdad del historial que muestra el "Ver mas" del
    activo (ActivoDetailDrawer). Este pase cubre la lectura del historial; la
    escritura de cada tipo de evento se ira agregando junto con crear/editar y
    baja/retiro. Por eso el FK opcional a `retiro` (solo aplica a BAJA/
    REVERSION_BAJA) se difiere hasta que exista el modulo de retiros (DA13),
    igual que los catalogos opcionales del Activo.

    valor_anterior/valor_nuevo guardan la forma JSON documentada en
    db/schema.sql segun tipo_evento; aqui se leen para describir el movimiento.
    """
    ALTA = 'ALTA'
    CAMBIO_COSTO = 'CAMBIO_COSTO'
    CAMBIO_VIDA_UTIL = 'CAMBIO_VIDA_UTIL'
    CAMBIO_AREA_TIPO = 'CAMBIO_AREA_TIPO'
    CAMBIO_FECHAS = 'CAMBIO_FECHAS'
    BAJA = 'BAJA'
    REVERSION_BAJA = 'REVERSION_BAJA'
    TIPO_EVENTO_CHOICES = [
        (ALTA, 'Alta / Registro inicial'),
        (CAMBIO_COSTO, 'Cambio de costo'),
        (CAMBIO_VIDA_UTIL, 'Cambio de vida útil'),
        (CAMBIO_AREA_TIPO, 'Cambio de área / categoría'),
        (CAMBIO_FECHAS, 'Cambio de fechas'),
        (BAJA, 'Baja / Retiro'),
        (REVERSION_BAJA, 'Reversión de baja'),
    ]

    activo = models.ForeignKey(
        Activo, on_delete=models.PROTECT, related_name='movimientos',
    )
    tipo_evento = models.CharField(max_length=30, choices=TIPO_EVENTO_CHOICES)
    valor_anterior = models.JSONField(null=True, blank=True)
    valor_nuevo = models.JSONField(null=True, blank=True)
    fecha_efectiva = models.DateField()
    fecha_registro = models.DateTimeField(auto_now_add=True)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='movimientos',
    )
    # Motivo/nota opcional del cambio (solo ediciones; NULL en ALTA).
    nota = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'movimiento'
        # Historial mas reciente primero: el drawer lo lista de arriba a abajo.
        ordering = ['-fecha_efectiva', '-id']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(tipo_evento__in=[
                    'ALTA', 'CAMBIO_COSTO', 'CAMBIO_VIDA_UTIL',
                    'CAMBIO_AREA_TIPO', 'CAMBIO_FECHAS', 'BAJA', 'REVERSION_BAJA',
                ]),
                name='ck_movimiento_tipo_evento',
            ),
        ]

    def __str__(self):
        return f'{self.activo.numero_activo} · {self.tipo_evento} · {self.fecha_efectiva}'
