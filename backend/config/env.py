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

# Credenciales del bucket privado donde viven los comprobantes de baja (RS-005).
VARIABLES_ALMACENAMIENTO = (
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'SUPABASE_BUCKET_RESPALDOS',
)


def validar_almacenamiento(environ, *, debug):
    """Exige almacenamiento persistente fuera de desarrollo.

    Sin estas variables, Django guarda los comprobantes en MEDIA_ROOT, es decir
    en el disco del contenedor. En Render ese disco se borra en cada despliegue:
    el sistema seguiria aceptando bajas y contestando 201, y los respaldos se
    irian evaporando sin un solo error en los logs. Un comprobante perdido es la
    prueba documental de un asiento contable perdida (RN-002.2), asi que en
    produccion se prefiere no arrancar.

    En DEBUG se permite el almacenamiento local: es lo que usan el desarrollo
    sin red y la suite de tests.
    """
    if debug:
        return
    faltantes = [v for v in VARIABLES_ALMACENAMIENTO if not (environ.get(v) or '').strip()]
    if faltantes:
        raise ImproperlyConfigured(
            'Faltan credenciales de Supabase Storage (' + ', '.join(faltantes) + '). '
            'Sin bucket, los comprobantes de baja se guardarian en el disco del '
            'contenedor y se perderian en el siguiente despliegue.'
        )


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
