"""Recalcula la depreciacion almacenada de todos los activos, en cada empresa.

Superficie para correr el recalculo a mano o desde un cron; el endpoint interno
que dispara pg_cron usa el mismo nucleo (`assets.tareas`)."""
from django.core.management.base import BaseCommand

from assets.tareas import actualizar_todas_las_empresas


class Command(BaseCommand):
    help = 'Recalcula el valor en libros de todos los activos de todas las empresas.'

    def handle(self, *args, **options):
        resumen = actualizar_todas_las_empresas()
        total = sum(resumen.values())
        for schema, n in resumen.items():
            self.stdout.write(f'  {schema}: {n} activos actualizados')
        self.stdout.write(self.style.SUCCESS(
            f'Recalculo completo: {total} activos actualizados en {len(resumen)} empresa(s).'
        ))
