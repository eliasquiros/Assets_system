"""Helpers para leer configuración sensible del entorno con defaults seguros."""
from django.core.exceptions import ImproperlyConfigured

# Clave solo apta para desarrollo. En producción (DEBUG=False) es obligatorio
# fijar DJANGO_SECRET_KEY; caer a esta clave conocida seria un agujero.
INSECURE_DEV_SECRET_KEY = 'django-insecure-f+if@u3vpin#lef!q^a7m&7=i&iv&y1*_5p$doo#1ttsq&g#l!'


def resolver_secret_key(environ, debug):
    key = environ.get('DJANGO_SECRET_KEY')
    if key:
        return key
    if debug:
        return INSECURE_DEV_SECRET_KEY
    raise ImproperlyConfigured('DJANGO_SECRET_KEY es obligatorio cuando DEBUG=False.')
