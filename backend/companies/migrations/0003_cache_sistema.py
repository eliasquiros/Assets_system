"""Tabla de cache compartida, usada hoy para el contador de intentos de login.

Va en `companies` a proposito: es una SHARED_APP, asi que django-tenants la
migra UNICAMENTE en el schema publico. Eso es lo que se busca — el limite de
intentos se lleva por direccion de internet, no por empresa, y quien esta
intentando entrar todavia no demostro pertenecer a ninguna. Si la tabla se
creara dentro del schema de cada empresa, cada una llevaria su propia cuenta y
el limite volveria a ser inexacto.

Se crea por migracion (y no con `manage.py createcachetable`) para que exista
sola en cada despliegue: un paso manual olvidado dejaria al login sin contador.
El DDL es exactamente el que genera `createcachetable` para PostgreSQL.
"""
from django.db import migrations

CREAR = """
CREATE TABLE "cache_sistema" (
    "cache_key" varchar(255) NOT NULL PRIMARY KEY,
    "value" text NOT NULL,
    "expires" timestamp with time zone NOT NULL
);
CREATE INDEX "cache_sistema_expires" ON "cache_sistema" ("expires");
"""

BORRAR = 'DROP TABLE "cache_sistema";'


class Migration(migrations.Migration):

    dependencies = [
        ('companies', '0002_empresa_subdominio'),
    ]

    operations = [
        migrations.RunSQL(sql=CREAR, reverse_sql=BORRAR),
    ]
