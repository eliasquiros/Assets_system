from django.db import models
from django_tenants.models import DomainMixin, TenantMixin


class Empresa(TenantMixin):
    """Empresa cliente (tenant). Vive en el schema publico (DA02).

    TenantMixin aporta 'schema_name'. auto_create_schema=True hace que al
    guardar una Empresa nueva, django-tenants cree su schema y corra las
    migraciones de TENANT_APPS dentro de el.
    """
    nombre = models.CharField(max_length=200)
    activa = models.BooleanField(default=True)
    fecha_alta = models.DateTimeField(auto_now_add=True)

    auto_create_schema = True

    class Meta:
        db_table = 'empresa'

    def __str__(self):
        return self.nombre


class Domain(DomainMixin):
    """Dominio/subdominio que enruta un Host al schema de su empresa (DA16)."""

    class Meta:
        db_table = 'domain'
