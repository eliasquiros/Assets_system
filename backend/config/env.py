"""Helpers para leer configuracion sensible del entorno con defaults seguros.

Regla de la casa: toda variable con impacto en seguridad FALLA CERRADO. Olvidar
una variable en el panel de Render tiene que degradar hacia lo seguro (o no
arrancar), nunca hacia lo permisivo.
"""
import secrets

from django.core.exceptions import ImproperlyConfigured


def resolver_debug(environ):
    """DEBUG solo se enciende con la palabra 'true' explicita.

    El default es False a proposito: DEBUG=True en produccion no solo publica
    tracebacks con la configuracion completa, ademas habilita el camino de
    SECRET_KEY efimero y apaga SECURE_SSL_REDIRECT, HSTS y el flag Secure de las
    cookies. Una variable mal escrita ('TRUE!', '1', 'yes') deja el modo seguro.
    """
    return environ.get('DJANGO_DEBUG', '').strip().lower() == 'true'


# Puerto del pooler de Supabase en modo TRANSACCION. El de modo SESION es 5432.
PUERTO_POOLER_TRANSACCION = '6543'


def validar_conexion_db(config):
    """Impide arrancar contra un pooler en modo transaccion.

    django-tenants aisla a cada empresa fijando `SET search_path` UNA VEZ POR
    CONEXION. El pooler transaccional devuelve la conexion al pool en cada
    sentencia, asi que dos consultas del mismo request pueden caer en backends
    distintos: la segunda corre con el search_path de otra empresa. No lanza
    error ni deja rastro en los logs — devuelve los datos del cliente
    equivocado (RS-002).

    En el panel de Supabase los dos poolers aparecen juntos y solo difieren en
    el puerto, asi que copiar el string equivocado es un error de un caracter.
    Falla cerrado: preferimos que el despliegue no levante a que mezcle datos
    entre clientes sin que nadie se entere.
    """
    if str(config.get('PORT') or '').strip() == PUERTO_POOLER_TRANSACCION:
        raise ImproperlyConfigured(
            f'DB_PORT={PUERTO_POOLER_TRANSACCION} es el pooler de Supabase en modo '
            'TRANSACCION, incompatible con el aislamiento por schema de '
            'django-tenants: puede devolver datos de otra empresa. Usa el pooler '
            'en modo SESION (DB_PORT=5432) o la conexion directa.'
        )


def resolver_secret_key(environ, debug):
    """SECRET_KEY del entorno; en dev, una efimera aleatoria por arranque.

    Nunca hay una clave por defecto escrita en el repositorio. Con el SECRET_KEY
    se firman los JWT, y el claim `tenant` de ese token es la UNICA fuente de
    verdad de a que empresa pertenece cada request (RS-002): una clave publicada
    en el codigo permitiria a cualquiera forjar un token para cualquier empresa.

    En dev, generar una al vuelo cuesta que las sesiones se invaliden al
    reiniciar el servidor — molestia trivial comparada con el riesgo de arrastrar
    una clave conocida a produccion. En produccion (DEBUG=False) es obligatoria:
    sin ella el proceso no arranca.
    """
    key = (environ.get('DJANGO_SECRET_KEY') or '').strip()
    if key:
        return key
    if debug:
        return secrets.token_urlsafe(64)
    raise ImproperlyConfigured('DJANGO_SECRET_KEY es obligatorio cuando DEBUG=False.')
