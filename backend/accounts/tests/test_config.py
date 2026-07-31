"""Config de entorno: DEBUG y SECRET_KEY tienen que fallar CERRADO.

Estos tests cubren el peor escenario de despliegue: una variable de entorno que
se olvida en Render. Si DEBUG quedara encendido por defecto, ademas de exponer
tracebacks arrastraria al SECRET_KEY a un valor por defecto; y un SECRET_KEY
predecible permite FIRMAR un JWT con el claim `tenant` de cualquier empresa, que
es la unica fuente de verdad del aislamiento (RS-002). Por eso el default seguro
no es una preferencia de estilo: es lo que separa "falta una variable" de
"cualquiera entra a los datos de todos los clientes".
"""
from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase

from config.env import (
    resolver_debug,
    resolver_secret_key,
    validar_almacenamiento,
    validar_conexion_db,
)


class ResolverDebugTest(SimpleTestCase):
    def test_sin_la_variable_debug_queda_apagado(self):
        # Olvidar DJANGO_DEBUG en produccion no puede encender el modo debug.
        self.assertFalse(resolver_debug({}))

    def test_true_explicito_enciende_debug(self):
        self.assertTrue(resolver_debug({'DJANGO_DEBUG': 'True'}))

    def test_acepta_true_sin_importar_mayusculas_ni_espacios(self):
        for valor in ('true', 'TRUE', ' True '):
            with self.subTest(valor=valor):
                self.assertTrue(resolver_debug({'DJANGO_DEBUG': valor}))

    def test_cualquier_otro_valor_deja_debug_apagado(self):
        # Nada ambiguo enciende DEBUG: solo la palabra 'true'.
        for valor in ('', '1', 'yes', 'on', 'False', 'debug', 'si'):
            with self.subTest(valor=valor):
                self.assertFalse(resolver_debug({'DJANGO_DEBUG': valor}))


class ResolverSecretKeyTest(SimpleTestCase):
    def test_usa_la_clave_del_entorno_si_existe(self):
        self.assertEqual(
            resolver_secret_key({'DJANGO_SECRET_KEY': 'real-key'}, debug=False),
            'real-key',
        )

    def test_en_prod_sin_clave_falla(self):
        with self.assertRaises(ImproperlyConfigured):
            resolver_secret_key({}, debug=False)

    def test_en_dev_sin_clave_genera_una_efimera_e_impredecible(self):
        # Antes se caia a una constante escrita en el repositorio: cualquiera que
        # leyera el codigo podia firmar tokens si DEBUG quedaba encendido. Ahora
        # se genera al vuelo, distinta en cada arranque y nunca versionada.
        primera = resolver_secret_key({}, debug=True)
        segunda = resolver_secret_key({}, debug=True)
        self.assertNotEqual(primera, segunda)
        self.assertGreaterEqual(len(primera), 50)

    def test_una_clave_en_blanco_se_trata_como_ausente(self):
        # DJANGO_SECRET_KEY= (vacia) en Render es tan peligroso como no ponerla.
        with self.assertRaises(ImproperlyConfigured):
            resolver_secret_key({'DJANGO_SECRET_KEY': '   '}, debug=False)


class ValidarConexionDbTest(SimpleTestCase):
    """El pooler de Supabase en modo TRANSACCION rompe el aislamiento por empresa.

    django-tenants fija el schema con `SET search_path` una vez POR CONEXION. El
    pooler transaccional (puerto 6543) puede entregar un backend distinto entre
    sentencias de un mismo request: la consulta corre entonces contra el
    search_path de OTRA empresa. No hay excepcion, no hay log — simplemente
    devuelve datos del cliente equivocado (RS-002).

    Como los dos poolers aparecen uno al lado del otro en el panel de Supabase y
    solo difieren en el puerto, copiar el string equivocado es un error de un
    caracter con consecuencias de fuga de datos entre clientes. Por eso el
    proceso no debe arrancar.
    """

    def _config(self, port, host='aws-0-us-east-1.pooler.supabase.com'):
        return {'HOST': host, 'PORT': port}

    def test_el_pooler_transaccional_impide_arrancar(self):
        with self.assertRaises(ImproperlyConfigured):
            validar_conexion_db(self._config('6543'))

    def test_el_puerto_puede_venir_como_entero(self):
        # DATABASES['PORT'] puede ser int si alguien lo fija en codigo.
        with self.assertRaises(ImproperlyConfigured):
            validar_conexion_db(self._config(6543))

    def test_el_mensaje_explica_como_corregirlo(self):
        # Un guard que no dice como arreglarlo se termina comentando.
        with self.assertRaises(ImproperlyConfigured) as ctx:
            validar_conexion_db(self._config('6543'))
        self.assertIn('5432', str(ctx.exception))

    def test_el_pooler_en_modo_sesion_es_valido(self):
        validar_conexion_db(self._config('5432'))   # no levanta

    def test_la_conexion_directa_es_valida(self):
        validar_conexion_db(self._config('5432', host='db.abcdefgh.supabase.co'))

    def test_el_postgres_local_de_desarrollo_es_valido(self):
        validar_conexion_db(self._config('5430', host='localhost'))

    def test_sin_puerto_definido_no_estorba(self):
        # Postgres asume 5432; no hay nada que objetar.
        validar_conexion_db({'HOST': 'localhost', 'PORT': ''})


class ValidarAlmacenamientoTest(SimpleTestCase):
    """Sin bucket, los comprobantes de baja se guardarian en el disco del
    contenedor. En Render ese disco se borra en cada despliegue: el sistema
    seguiria aceptando bajas y contestando 201 mientras los respaldos se
    evaporan, sin un solo error en los logs. Un comprobante perdido es la prueba
    documental de un asiento contable perdida (RN-002.2), y se descubre meses
    despues, en una auditoria. Por eso en produccion se prefiere no arrancar.
    """

    COMPLETO = {
        'SUPABASE_URL': 'https://proyecto.supabase.co',
        'SUPABASE_SERVICE_KEY': 'clave',
        'SUPABASE_BUCKET_RESPALDOS': 'respaldos-retiro',
    }

    def test_en_produccion_sin_credenciales_no_arranca(self):
        with self.assertRaises(ImproperlyConfigured):
            validar_almacenamiento({}, debug=False)

    def test_el_mensaje_nombra_las_variables_que_faltan(self):
        # Quien despliega tiene que saber que anotar en el panel de Render.
        entorno = {**self.COMPLETO}
        del entorno['SUPABASE_SERVICE_KEY']
        with self.assertRaises(ImproperlyConfigured) as ctx:
            validar_almacenamiento(entorno, debug=False)
        self.assertIn('SUPABASE_SERVICE_KEY', str(ctx.exception))
        self.assertNotIn('SUPABASE_URL', str(ctx.exception).split('(')[1].split(')')[0])

    def test_una_variable_en_blanco_cuenta_como_ausente(self):
        with self.assertRaises(ImproperlyConfigured):
            validar_almacenamiento({**self.COMPLETO, 'SUPABASE_BUCKET_RESPALDOS': '  '}, debug=False)

    def test_con_las_tres_variables_arranca(self):
        validar_almacenamiento(self.COMPLETO, debug=False)   # no levanta

    def test_en_desarrollo_el_almacenamiento_local_es_aceptable(self):
        # Trabajar sin red no puede exigir credenciales de un bucket real.
        validar_almacenamiento({}, debug=True)
