"""El limite de intentos de login no puede evadirse falsificando cabeceras.

DRF identifica al cliente anonimo con `X-Forwarded-For` cuando NUM_PROXIES no
esta configurado, y usa la cabecera COMPLETA como clave del throttle. Como esa
cabecera la controla el cliente, basta variarla en cada intento para que cada
request caiga en un balde distinto: el limite de 5/min deja de existir y la
fuerza bruta contra el login queda sin freno.

Estos tests simulan la topologia real de Render: el atacante manda su propio
X-Forwarded-For y el proxy inverso APENDE la IP del peer que le conecto
(comportamiento estandar, equivalente a proxy_add_x_forwarded_for de nginx).
Django entonces ve "<lo-que-mando-el-cliente>, <IP-real>", y la unica porcion
confiable es la ultima.
"""
from django.core.cache import cache
from django.db import connection
from django_tenants.test.cases import TenantTestCase
from django_tenants.utils import get_public_schema_name, schema_context, tenant_context
from rest_framework.test import APIClient

from accounts.models import Usuario

# Tabla donde se lleva la cuenta de intentos (ver companies/migrations).
TABLA_CACHE = 'cache_sistema'

# IP que el proxy de Render inserta al final de la cadena: la real del cliente.
IP_REAL = '203.0.113.9'


def cadena_xff(falsificada, ip_real=IP_REAL):
    """Cabecera tal como la ve Django detras de un proxy inverso: lo que mando
    el cliente primero, y la IP observada por el proxy al final."""
    return f'{falsificada}, {ip_real}'


class _LoginBase(TenantTestCase):
    """Setup comun: una empresa con un usuario contra el cual intentar entrar."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        with tenant_context(cls.tenant):
            Usuario.objects.create_user(username='ana', password='secreta123')
        cls.slug = 'testco'
        with schema_context(get_public_schema_name()):
            cls.tenant.subdominio = cls.slug
            cls.tenant.save(update_fields=['subdominio'])

    def setUp(self):
        cache.clear()   # el throttle vive en cache: aislamos cada test
        self.client = APIClient()

    def _intento(self, xff, password='equivocada'):
        return self.client.post(
            '/api/auth/login/',
            {'usuario': 'ana', 'password': password, 'empresa': self.slug},
            format='json',
            HTTP_X_FORWARDED_FOR=xff,
        )


class LoginThrottleTest(_LoginBase):
    def test_el_limite_frena_la_fuerza_bruta_desde_una_misma_ip(self):
        # Linea base: sin falsificar nada, el limite de 5/min tiene que actuar.
        codigos = [self._intento(cadena_xff('198.51.100.7')).status_code for _ in range(8)]
        self.assertIn(429, codigos, 'El throttle de login no se activo nunca')

    def test_no_se_evade_el_limite_variando_x_forwarded_for(self):
        # Mismo atacante, misma IP real, pero rotando la parte que el controla.
        # Si la clave del throttle usa la cabecera completa, nunca hay 429.
        codigos = [
            self._intento(cadena_xff(f'10.0.0.{i}')).status_code for i in range(8)
        ]
        self.assertIn(
            429, codigos,
            'Rotando X-Forwarded-For se evadio el limite: fuerza bruta sin freno',
        )

    def test_una_cadena_larga_de_saltos_falsos_tampoco_evade_el_limite(self):
        # Variante del mismo ataque: muchos saltos inventados por delante.
        codigos = [
            self._intento(cadena_xff(f'10.0.0.{i}, 172.16.0.{i}, 192.168.1.{i}')).status_code
            for i in range(8)
        ]
        self.assertIn(429, codigos, 'Una cadena XFF larga evadio el limite')

    def test_clientes_distintos_no_comparten_el_mismo_balde(self):
        # El contrapeso: endurecer la identificacion no debe meter a todos los
        # usuarios en un solo balde (eso dejaria a una empresa sin servicio
        # porque otra agoto el limite).
        for i in range(4):
            codigo = self._intento(cadena_xff('10.0.0.1', ip_real=f'198.51.100.{i}')).status_code
            self.assertNotEqual(
                codigo, 429,
                f'El cliente {i} fue limitado por intentos de OTRA IP',
            )


class ThrottlePersistenteTest(_LoginBase):
    """El contador de intentos tiene que vivir en almacenamiento COMPARTIDO.

    En memoria del proceso el limite no es el que uno cree: cada worker de
    Gunicorn lleva su propia cuenta (el limite real se multiplica por la
    cantidad de workers) y todo se pierde en cada reinicio o despliegue. Un
    limite que no se puede afirmar con certeza no es un limite.

    La tabla vive en el schema PUBLICO, no dentro del de cada empresa: el
    contador se lleva por direccion de internet, y quien esta intentando entrar
    todavia no demostro pertenecer a ninguna empresa.
    """

    def _filas_de_throttle(self):
        with connection.cursor() as cur:
            cur.execute(
                f'SELECT count(*) FROM {TABLA_CACHE} WHERE cache_key LIKE %s',
                ['%throttle_login%'],
            )
            return cur.fetchone()[0]

    def test_el_contador_de_intentos_queda_guardado_en_la_base(self):
        self.assertEqual(self._filas_de_throttle(), 0)
        self._intento(cadena_xff('198.51.100.7'))
        self.assertEqual(
            self._filas_de_throttle(), 1,
            'El intento no quedo en la base: el contador sigue en memoria del '
            'proceso y se pierde al reiniciar',
        )

    def test_todos_los_intentos_de_una_ip_se_acumulan_en_la_misma_fila(self):
        # Una fila por direccion, no una por intento: es lo que permite que
        # cualquier worker lea la cuenta completa que llevan los demas.
        for _ in range(3):
            self._intento(cadena_xff('198.51.100.7'))
        self.assertEqual(self._filas_de_throttle(), 1)

    def test_la_tabla_de_cache_vive_solo_en_el_schema_publico(self):
        # Si se hubiera creado dentro del schema de cada empresa, cada una
        # llevaria su propia cuenta y el limite volveria a ser inexacto.
        with connection.cursor() as cur:
            cur.execute(
                'SELECT table_schema FROM information_schema.tables '
                'WHERE table_name = %s ORDER BY table_schema',
                [TABLA_CACHE],
            )
            schemas = [fila[0] for fila in cur.fetchall()]
        self.assertEqual(schemas, ['public'])
