from django.conf import settings
from rest_framework import exceptions
from rest_framework.authentication import CSRFCheck
from rest_framework_simplejwt.authentication import JWTAuthentication

from .tokens import activar_tenant_desde_token


def _enforce_csrf(request):
    """Aplica la proteccion CSRF de Django a las peticiones autenticadas por
    cookie, igual que hace SessionAuthentication. CsrfViewMiddleware ya ignora
    los metodos seguros (GET/HEAD/OPTIONS), asi que /me no la exige."""
    check = CSRFCheck(lambda req: None)
    check.process_request(request)
    reason = check.process_view(request, None, (), {})
    if reason:
        raise exceptions.PermissionDenied(f'CSRF Failed: {reason}')


class CookieJWTAuthentication(JWTAuthentication):
    """Autentica leyendo el access token desde la cookie httpOnly, no del
    header Authorization. El token sensible nunca es accesible por JS."""

    def authenticate(self, request):
        raw_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS)
        if not raw_token:
            return None
        validated_token = self.get_validated_token(raw_token)
        # La empresa sale del claim FIRMADO del token, no del Host: activa aqui
        # el schema correcto antes de buscar al usuario (RS-002).
        activar_tenant_desde_token(validated_token)
        user = self.get_user(validated_token)
        _enforce_csrf(request)
        return (user, validated_token)
