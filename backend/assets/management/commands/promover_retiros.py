"""Promueve a DEFINITIVA las bajas cuyo periodo de gracia ya vencio, por empresa.

Superficie para correr la promocion a mano o desde un cron; el endpoint interno
que dispara pg_cron usa el mismo nucleo (`assets.tareas`). Al promover, congela
la depreciacion del activo en la fecha efectiva de la baja (RN-002.4/DA14)."""
from django.core.management.base import BaseCommand

from assets.tareas import promover_retiros_todas_las_empresas


class Command(BaseCommand):
    help = 'Pasa a definitivas las bajas vencidas de todas las empresas.'

    def handle(self, *args, **options):
        resumen = promover_retiros_todas_las_empresas()
        total = sum(resumen.values())
        for schema, n in resumen.items():
            self.stdout.write(f'  {schema}: {n} bajas promovidas')
        self.stdout.write(self.style.SUCCESS(
            f'Promoción completa: {total} baja(s) definitiva(s) en {len(resumen)} empresa(s).'
        ))
