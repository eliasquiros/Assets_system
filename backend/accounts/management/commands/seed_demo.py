from datetime import date
from decimal import Decimal

from django.core.management.base import BaseCommand
from django_tenants.utils import schema_context

from accounts.models import Usuario
from assets.models import Activo, Categoria, Localizacion
from companies.models import Domain, Empresa

USUARIOS = [
    ('admin', 'demo12345'),
    ('mrivera', 'secreta123'),
    ('jsolano', 'clave456'),
]

# (numero, nombre, area, tipo, costo, libros, dep, estado, fecha_adq, fecha_uso)
ACTIVOS = [
    ('AF-0001', 'Laptop Dell Latitude 5540', 'Oficinas Administrativas', 'Equipo de cómputo', '850000', '255000', '595000', 'DEPRECIANDO', '2022-03-15', '2022-04-01'),
    ('AF-0002', 'Escritorio ejecutivo en L', 'Oficinas Administrativas', 'Mobiliario y enseres', '415000', '277000', '138000', 'DEPRECIANDO', '2023-01-10', '2023-01-15'),
    ('AF-0003', 'Torno CNC industrial', 'Planta de Producción', 'Maquinaria industrial', '12500000', '9800000', '2700000', 'DEPRECIANDO', '2021-06-01', '2021-06-20'),
    ('AF-0004', 'Camión de reparto Hino', 'Departamento de Transporte', 'Vehículos', '28000000', '28000000', '0', 'TOTALMENTE_DEPRECIADO', '2016-02-01', '2016-02-10'),
    ('AF-0005', 'Impresora multifuncional', 'Sucursal San Pedro', 'Equipo de oficina', '320000', '96000', '224000', 'DEPRECIANDO', '2022-09-05', '2022-09-10'),
    ('AF-0006', 'Estantería metálica', 'Bodega Central', 'Mobiliario y enseres', '180000', '54000', '126000', 'DEPRECIANDO', '2022-11-20', '2022-11-25'),
]


class Command(BaseCommand):
    help = 'Crea la empresa Demo (demo.localhost) con usuarios y activos de muestra. Idempotente.'

    def handle(self, *args, **options):
        empresa, _ = Empresa.objects.get_or_create(
            schema_name='empresa_demo',
            defaults={'nombre': 'Demo', 'activa': True},
        )
        Domain.objects.get_or_create(
            domain='demo.localhost', tenant=empresa,
            defaults={'is_primary': True},
        )
        with schema_context('empresa_demo'):
            for username, password in USUARIOS:
                if not Usuario.objects.filter(username=username).exists():
                    Usuario.objects.create_user(username=username, password=password)

            for num, nombre, area, tipo, costo, libros, dep, estado, fadq, fuso in ACTIVOS:
                loc, _ = Localizacion.objects.get_or_create(nombre=area)
                cat, _ = Categoria.objects.get_or_create(nombre=tipo)
                Activo.objects.update_or_create(
                    numero_activo=num,
                    defaults={
                        'nombre': nombre,
                        'costo_original': Decimal(costo),
                        'valor_libros_actual': Decimal(libros),
                        'depreciacion_acumulada_actual': Decimal(dep),
                        'fecha_adquisicion': date.fromisoformat(fadq),
                        'fecha_inicio': date.fromisoformat(fuso),
                        'vida_util_anios': 5,
                        'estado_depreciacion': estado,
                        'localizacion': loc,
                        'categoria': cat,
                    },
                )

        self.stdout.write(self.style.SUCCESS(
            'Demo lista: http://demo.localhost:5173  (admin/demo12345, mrivera/secreta123, jsolano/clave456) '
            f'con {len(ACTIVOS)} activos'
        ))
