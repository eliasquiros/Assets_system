from django.core.management.base import BaseCommand
from django_tenants.utils import schema_context

from accounts.models import Usuario
from companies.models import Domain, Empresa


class Command(BaseCommand):
    help = 'Crea la empresa Demo (demo.localhost) y un usuario admin/demo12345.'

    def handle(self, *args, **options):
        empresa, creada = Empresa.objects.get_or_create(
            schema_name='empresa_demo',
            defaults={'nombre': 'Demo', 'activa': True},
        )
        Domain.objects.get_or_create(
            domain='demo.localhost', tenant=empresa,
            defaults={'is_primary': True},
        )
        with schema_context('empresa_demo'):
            if not Usuario.objects.filter(username='admin').exists():
                Usuario.objects.create_user(username='admin', password='demo12345')
        self.stdout.write(self.style.SUCCESS('Demo lista: http://demo.localhost:8000  (admin / demo12345)'))
