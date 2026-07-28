"""Throttles que no confunden a los usuarios de empresas distintas.

DRF identifica al cliente autenticado con `request.user.pk` a secas. En una
sola base eso alcanza, pero aqui cada empresa vive en su propio schema y los
ids arrancan en 1 en todas: el usuario 1 de una empresa y el usuario 1 de otra
caerian en el MISMO balde. Una empresa activa dejaria a otra sin servicio sin
tener ninguna relacion con ella, que es justo el aislamiento que exige RS-002
—esta vez sobre la disponibilidad, no sobre los datos—.

La correccion es anteponer el schema al identificador. Para el cliente anonimo
no cambia nada: ahi la clave es la direccion de internet (endurecida via
NUM_PROXIES, ver tests/test_throttling.py) y quien todavia no autentica no
pertenece a ninguna empresa.
"""
from django.db import connection
from rest_framework.throttling import ScopedRateThrottle, UserRateThrottle


def _identificador(throttle, request):
    """Identidad del cliente para el contador: schema+usuario si autentico, y
    la direccion de internet si no."""
    if request.user and request.user.is_authenticated:
        return f'{connection.schema_name}:{request.user.pk}'
    return throttle.get_ident(request)


class TenantScopedRateThrottle(ScopedRateThrottle):
    """ScopedRateThrottle con la empresa incluida en la clave."""

    def get_cache_key(self, request, view):
        # allow_request() ya fijo self.scope y corto en seco si la vista no
        # declara throttle_scope, asi que aqui solo cambia el identificador.
        return self.cache_format % {
            'scope': self.scope,
            'ident': _identificador(self, request),
        }


class TenantUserRateThrottle(UserRateThrottle):
    """UserRateThrottle con la empresa incluida en la clave."""

    def get_cache_key(self, request, view):
        return self.cache_format % {
            'scope': self.scope,
            'ident': _identificador(self, request),
        }
