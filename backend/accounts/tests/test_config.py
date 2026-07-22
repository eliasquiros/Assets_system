"""Config de entorno: el SECRET_KEY no puede caer al default inseguro en prod."""
from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase

from config.env import INSECURE_DEV_SECRET_KEY, resolver_secret_key


class ResolverSecretKeyTest(SimpleTestCase):
    def test_usa_la_clave_del_entorno_si_existe(self):
        self.assertEqual(
            resolver_secret_key({'DJANGO_SECRET_KEY': 'real-key'}, debug=False),
            'real-key',
        )

    def test_en_dev_sin_clave_cae_al_default_inseguro(self):
        self.assertEqual(resolver_secret_key({}, debug=True), INSECURE_DEV_SECRET_KEY)

    def test_en_prod_sin_clave_falla(self):
        with self.assertRaises(ImproperlyConfigured):
            resolver_secret_key({}, debug=False)
