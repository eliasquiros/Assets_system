"""Onboarding de una empresa cliente real: crea su Empresa (schema + todas las
migraciones de TENANT_APPS via auto_create_schema), su Domain y su primer
usuario administrador.

Herramienta de operacion manual, NO parte del producto: no se commitea (ver
.gitignore en la raiz del repo). Uso:

    python manage.py crear_empresa --nombre "Acme S.A." --subdominio acme --usuario admin

La contrasena se pide de forma interactiva (getpass) si no se pasa con
--password, para que no quede en el historial de la shell ni en la lista de
procesos.
"""
import getpass

from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django_tenants.utils import schema_context

from accounts.models import Usuario
from companies.models import Domain, Empresa


class Command(BaseCommand):
    help = 'Crea una empresa (schema propio), su Domain y su primer usuario administrador.'

    def add_arguments(self, parser):
        parser.add_argument('--nombre', required=True, help='Nombre visible de la empresa (ej. "Acme S.A.")')
        parser.add_argument('--subdominio', required=True, help='Slug de la empresa (ej. "acme"); es el hint de login')
        parser.add_argument('--usuario', required=True, help='Username del primer usuario administrador')
        parser.add_argument('--password', help='Si se omite, se pide de forma interactiva (recomendado)')
        parser.add_argument('--email', default='', help='Correo opcional del primer usuario')
        parser.add_argument(
            '--dominio', default=None,
            help='Domain a registrar en django-tenants (por defecto "<subdominio>.localhost", uso de desarrollo). '
                 'El login en produccion resuelve la empresa por --subdominio, no por este valor (API unica, DA16).',
        )
        parser.add_argument('--yes', '-y', action='store_true', help='No pedir confirmacion antes de crear.')

    def handle(self, *args, **options):
        nombre = options['nombre'].strip()
        subdominio = options['subdominio'].strip().lower()
        username = options['usuario'].strip()
        email = (options['email'] or '').strip() or None
        dominio = options['dominio'] or f'{subdominio}.localhost'
        # Postgres no acepta guiones en un identificador de schema sin comillas;
        # el slug si los permite (ej. "mi-empresa"), de ahi la normalizacion.
        schema_name = f'empresa_{subdominio.replace("-", "_")}'

        if not nombre:
            raise CommandError('--nombre no puede estar vacio.')
        if Empresa.objects.filter(subdominio=subdominio).exists():
            raise CommandError(f'Ya existe una empresa con el subdominio "{subdominio}".')
        if Empresa.objects.filter(schema_name=schema_name).exists():
            raise CommandError(f'Ya existe una empresa con el schema "{schema_name}".')

        empresa = Empresa(nombre=nombre, subdominio=subdominio, schema_name=schema_name, activa=True)
        try:
            empresa.full_clean()
        except ValidationError as e:
            raise CommandError(f'Datos invalidos: {e.message_dict}')

        password = options['password']
        if not password:
            password = getpass.getpass(f'Contraseña para "{username}": ')
            confirmacion = getpass.getpass('Repetila: ')
            if password != confirmacion:
                raise CommandError('Las contraseñas no coinciden.')
        if not password:
            raise CommandError('La contraseña no puede estar vacia.')

        self.stdout.write(self.style.WARNING(
            f'\nSe va a crear:\n'
            f'  Empresa:    {nombre}\n'
            f'  Schema:     {schema_name}\n'
            f'  Subdominio: {subdominio}  (hint de login)\n'
            f'  Dominio:    {dominio}\n'
            f'  Usuario:    {username}' + (f' <{email}>' if email else '') + '\n'
        ))
        if not options['yes']:
            if input('¿Confirmar? [s/N] ').strip().lower() not in ('s', 'si', 'sí', 'y', 'yes'):
                self.stdout.write('Cancelado.')
                return

        # auto_create_schema=True (Empresa.Meta): este save() crea el schema de
        # Postgres y corre todas las migraciones de TENANT_APPS dentro de el.
        empresa.save()
        Domain.objects.create(domain=dominio, tenant=empresa, is_primary=True)

        with schema_context(schema_name):
            Usuario.objects.create_user(username=username, password=password, email=email)

        self.stdout.write(self.style.SUCCESS(
            f'\nListo. "{nombre}" creada (schema "{schema_name}"), '
            f'usuario "{username}" listo para iniciar sesion con subdominio "{subdominio}".'
        ))
