from django_tenants.test.cases import TenantTestCase

from accounts.models import Usuario


class UsuarioModelTest(TenantTestCase):
    def test_create_user_hashea_la_contrasena(self):
        user = Usuario.objects.create_user(username='ana', password='secreta123')

        # Nunca se guarda en texto plano (RS-001).
        self.assertNotEqual(user.password, 'secreta123')
        self.assertTrue(user.password.startswith(('pbkdf2_', 'argon2')))
        # Pero se puede verificar.
        self.assertTrue(user.check_password('secreta123'))
        self.assertFalse(user.check_password('otra'))
