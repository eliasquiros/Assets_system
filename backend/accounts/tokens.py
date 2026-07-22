"""Emision de JWT sellados con la empresa (tenant) activa.

El SECRET_KEY es compartido por todos los schemas, asi que sin este sello un
access token firmado para una empresa validaria su firma en cualquier otra
(y, si existe un usuario con el mismo id, autenticaria como esa otra persona).
El claim de tenant, verificado en CookieJWTAuthentication, ata cada token a la
empresa que lo emitio (RS-002)."""
from django.db import connection
from rest_framework import exceptions
from rest_framework_simplejwt.tokens import RefreshToken

TENANT_CLAIM = 'tenant'


def crear_refresh(user):
    """RefreshToken para `user` sellado con el schema del tenant activo. El
    access token derivado (`.access_token`) hereda el claim automaticamente."""
    refresh = RefreshToken.for_user(user)
    refresh[TENANT_CLAIM] = connection.tenant.schema_name
    return refresh


def verificar_tenant(token):
    """Exige que el token declare la empresa del schema activo (fijado por el
    Host). Fail-closed: un token sin el claim tampoco es valido. Cierra el
    reuso de un token entre empresas —tanto en el access (autenticacion) como
    en el refresh— que la firma compartida por si sola no impide (RS-002)."""
    if token.get(TENANT_CLAIM) != connection.tenant.schema_name:
        raise exceptions.AuthenticationFailed('Token no válido para esta empresa.')
