"""Emision y resolucion de JWT sellados con la empresa (tenant).

Topologia de API unica: todas las empresas pegan al mismo dominio de backend,
asi que el Host NO identifica a la empresa. La empresa se resuelve, en cada
request autenticado, EXCLUSIVAMENTE desde el claim `tenant` del JWT ya validado
por firma. Como el SECRET_KEY es compartido por todos los schemas, sin este
sello un token firmado para una empresa validaria su firma en cualquier otra;
el claim lo ata a la empresa que lo emitio y es la unica fuente de verdad
(ni el Host ni headers sin firmar intervienen) (RS-002)."""
from django.db import connection
from rest_framework import exceptions
from rest_framework_simplejwt.tokens import RefreshToken, UntypedToken

TENANT_CLAIM = 'tenant'


def crear_refresh(user):
    """RefreshToken para `user` sellado con el schema del tenant activo. El
    access token derivado (`.access_token`) hereda el claim automaticamente.
    Debe llamarse con el schema de la empresa activo (ej. dentro de
    tenant_context en el login)."""
    refresh = RefreshToken.for_user(user)
    refresh[TENANT_CLAIM] = connection.tenant.schema_name
    return refresh


def activar_tenant_desde_token(token):
    """Activa el schema de la empresa declarada en el claim FIRMADO del token y
    devuelve la Empresa. Fail-closed: token sin claim, empresa inexistente o
    inactiva -> AuthenticationFailed. Esta es la unica fuente de verdad de la
    empresa en cada request (RS-002)."""
    from companies.models import Empresa

    schema = token.get(TENANT_CLAIM)
    if not schema:
        raise exceptions.AuthenticationFailed('Token sin empresa.')
    try:
        empresa = Empresa.objects.get(schema_name=schema, activa=True)
    except Empresa.DoesNotExist:
        raise exceptions.AuthenticationFailed('Token no válido para esta empresa.')
    connection.set_tenant(empresa)
    return empresa


def activar_tenant_desde_raw(raw_token):
    """Para tokens de refresh: verifica firma y expiracion del token crudo SIN
    chequear la blacklist (que vive en el schema del tenant) y activa el schema
    de su claim. Debe llamarse ANTES de construir el RefreshToken tipado, cuya
    verificacion de blacklist tiene que correr ya en el schema correcto.

    Leer el claim de un token aun no verificado por completo es seguro: activar
    un schema no expone datos, y UntypedToken ya valido la firma (un token
    forjado con un claim arbitrario se rechaza aqui)."""
    untyped = UntypedToken(raw_token)   # firma + expiracion (sin blacklist)
    activar_tenant_desde_token(untyped)
