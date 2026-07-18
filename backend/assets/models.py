"""Modelos de activos y catalogos, dentro del schema de cada empresa (DA09).

Mapean las tablas documentadas en db/schema.sql. Este pase cubre solo la
lectura (listar/detalle), por lo que se modelan los catalogos que el listado y
el detalle muestran (localizacion -> area, categoria -> tipo) y los campos
NOT NULL del activo. Los catalogos opcionales no mostrados (marca, modelo,
origen, proveedor) y sus FKs se agregaran cuando se implemente crear/editar.
"""
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
    """Tipo/categoria de activo (catalogo_categorias). RF-001.1, RF-003.1."""
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(null=True, blank=True)
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
    fecha_creacion = models.DateTimeField(auto_now_add=True)

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
            models.CheckConstraint(
                condition=models.Q(vida_util_anios__gt=0),
                name='ck_activo_vida_util_positiva',
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
