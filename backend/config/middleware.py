"""Resolucion de tenant SIN depender del Host (topologia de API unica).

En la Opcion B, todas las empresas pegan al mismo dominio de backend
(ej. api.sistema.com), asi que el Host ya no identifica a la empresa. Este
middleware NO decide la empresa: solo deja la conexion en el schema publico al
inicio de cada request (base limpia y segura, incluso con conexiones
persistentes/pooled). La empresa real se activa mas adelante, siempre a partir
de una fuente FIRMADA o validada:

  * en el login, desde el hint de subdominio, tras verificar credenciales
    (accounts/views.LoginView);
  * en el resto de requests, desde el claim `tenant` del JWT ya validado
    (accounts/authentication.CookieJWTAuthentication) o del refresh
    (accounts/views.RefreshView).

Nunca se lee el Host ni un header sin firmar como fuente de verdad de la
empresa (RS-002).
"""
from django.db import connection


class TenantFromTokenMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Base limpia: cada request empieza en el schema publico. Si la conexion
        # se reutiliza (CONN_MAX_AGE>0), esto evita heredar el tenant del request
        # anterior antes de que el login/auth active el que corresponde.
        connection.set_schema_to_public()
        try:
            return self.get_response(request)
        finally:
            # Vuelve a publico al terminar para no dejar la conexion pooled
            # apuntando al schema de una empresa entre requests.
            connection.set_schema_to_public()
