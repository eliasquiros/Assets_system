from datetime import date
from decimal import Decimal

from django.core.management.base import BaseCommand
from django_tenants.utils import schema_context

from accounts.models import Usuario
from assets.models import (
    Activo, Categoria, Localizacion, Marca, Modelo, Movimiento, Origen, Proveedor,
)
from companies.models import Domain, Empresa

USUARIOS = [
    ('admin', 'demo12345'),
    ('mrivera', 'secreta123'),
    ('jsolano', 'clave456'),
]

# Prefijo con el que se autonumera cada categoria al registrar (RF-001).
CATEGORIA_PREFIJOS = {
    'Equipo de cómputo': 'COM',
    'Mobiliario y enseres': 'MOB',
    'Maquinaria industrial': 'MAQ',
    'Vehículos': 'VEH',
    'Equipo de oficina': 'OFI',
}

ORIGENES = ['Dentro de inversión', 'Fuera de inversión']

# (numero, nombre, area, tipo, costo, libros, dep, estado, fecha_adq, fecha_uso,
#  serie, factura, proveedor, marca, modelo, origen)
ACTIVOS = [
    ('AF-0001', 'Laptop Dell Latitude 5540', 'Oficinas Administrativas', 'Equipo de cómputo', '850000', '255000', '595000', 'DEPRECIANDO', '2022-03-15', '2022-04-01', 'DL5540-8823A', 'FE-2022-00841', 'Distribuidora Tecnológica CR', 'Dell', 'Latitude 5540', 'Dentro de inversión'),
    ('AF-0002', 'Escritorio ejecutivo en L', 'Oficinas Administrativas', 'Mobiliario y enseres', '415000', '277000', '138000', 'DEPRECIANDO', '2023-01-10', '2023-01-15', 'MOB-EJEC-0102', 'FE-2023-00119', 'Mobiliario Corporativo S.A.', 'Office Line', 'Ejecutivo L', 'Dentro de inversión'),
    ('AF-0003', 'Torno CNC industrial', 'Planta de Producción', 'Maquinaria industrial', '12500000', '9800000', '2700000', 'DEPRECIANDO', '2021-06-01', '2021-06-20', 'CNC-TX7-55019', 'FE-2021-02233', 'Maquinaria Industrial del Valle', 'Haas', 'TX-7', 'Dentro de inversión'),
    ('AF-0004', 'Camión de reparto Hino', 'Departamento de Transporte', 'Vehículos', '28000000', '28000000', '0', 'TOTALMENTE_DEPRECIADO', '2016-02-01', '2016-02-10', 'JHDGD1LWXGS', 'FA-2016-00457', 'Automotores Centroamérica', 'Hino', 'Serie 300', 'Fuera de inversión'),
    ('AF-0005', 'Impresora multifuncional', 'Sucursal San Pedro', 'Equipo de oficina', '320000', '96000', '224000', 'DEPRECIANDO', '2022-09-05', '2022-09-10', 'HPM428-7714', 'FE-2022-03310', 'Distribuidora Tecnológica CR', 'HP', 'LaserJet M428', 'Dentro de inversión'),
    ('AF-0006', 'Estantería metálica', 'Bodega Central', 'Mobiliario y enseres', '180000', '54000', '126000', 'DEPRECIANDO', '2022-11-20', '2022-11-25', 'EST-MET-4410', 'FE-2022-04102', 'Mobiliario Corporativo S.A.', 'Metalúrgica CR', 'Rack 4410', 'Dentro de inversión'),
]


class Command(BaseCommand):
    help = 'Crea la empresa Demo (demo.localhost) con usuarios y activos de muestra. Idempotente.'

    def handle(self, *args, **options):
        empresa, _ = Empresa.objects.get_or_create(
            schema_name='empresa_demo',
            defaults={'nombre': 'Demo', 'activa': True, 'subdominio': 'demo'},
        )
        # Idempotente: fija el slug aunque la empresa ya existiera de un seed previo.
        if empresa.subdominio != 'demo':
            empresa.subdominio = 'demo'
            empresa.save(update_fields=['subdominio'])
        Domain.objects.get_or_create(
            domain='demo.localhost', tenant=empresa,
            defaults={'is_primary': True},
        )
        with schema_context('empresa_demo'):
            for username, password in USUARIOS:
                if not Usuario.objects.filter(username=username).exists():
                    Usuario.objects.create_user(username=username, password=password)

            for nombre_origen in ORIGENES:
                Origen.objects.get_or_create(nombre=nombre_origen)

            autor = Usuario.objects.get(username='admin')
            for (num, nombre, area, tipo, costo, libros, dep, estado, fadq, fuso,
                 serie, factura, prov, marca_n, modelo_n, origen_n) in ACTIVOS:
                loc, _ = Localizacion.objects.get_or_create(nombre=area)
                cat, _ = Categoria.objects.update_or_create(
                    nombre=tipo, defaults={'prefijo': CATEGORIA_PREFIJOS.get(tipo, '')},
                )
                proveedor, _ = Proveedor.objects.get_or_create(nombre=prov)
                marca, _ = Marca.objects.get_or_create(nombre=marca_n)
                modelo, _ = Modelo.objects.get_or_create(nombre=modelo_n, marca=marca)
                origen = Origen.objects.get(nombre=origen_n)
                activo, _ = Activo.objects.update_or_create(
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
                        'serie': serie,
                        'factura': factura,
                        'localizacion': loc,
                        'categoria': cat,
                        'proveedor': proveedor,
                        'marca': marca,
                        'modelo': modelo,
                        'origen': origen,
                    },
                )
                # Evento ALTA de cada activo (RF-007). Idempotente: solo se crea
                # si el activo aun no tiene su registro inicial en el historial.
                if not activo.movimientos.filter(tipo_evento=Movimiento.ALTA).exists():
                    Movimiento.objects.create(
                        activo=activo,
                        tipo_evento=Movimiento.ALTA,
                        valor_anterior=None,
                        valor_nuevo={
                            'costo_original': costo,
                            'vida_util_anios': 5,
                            'fecha_inicio': fuso,
                            'localizacion_id': loc.id,
                            'categoria_id': cat.id,
                        },
                        fecha_efectiva=date.fromisoformat(fadq),
                        usuario=autor,
                    )

        self.stdout.write(self.style.SUCCESS(
            'Demo lista: http://demo.localhost:5173  (admin/demo12345, mrivera/secreta123, jsolano/clave456) '
            f'con {len(ACTIVOS)} activos'
        ))
