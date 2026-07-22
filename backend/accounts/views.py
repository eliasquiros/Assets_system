from django.conf import settings
from django.db import connection
from django.middleware.csrf import get_token
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .cookies import clear_auth_cookies, set_auth_cookies
from .models import Usuario
from .serializers import LoginSerializer
from .tokens import crear_refresh, verificar_tenant

CREDENCIALES_INVALIDAS = 'Usuario o contraseña incorrectos'


def _empresa_nombre():
    return getattr(connection.tenant, 'nombre', None)


class LoginView(APIView):
    """POST /api/auth/login/ — autentica contra el usuario del schema actual
    (fijado por el Host) y setea el JWT en cookies httpOnly."""
    permission_classes = [AllowAny]
    authentication_classes = []          # el login es el bootstrap, no exige cookie previa
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data['usuario']
        password = serializer.validated_data['password']

        # Consulta SOLO contra el schema ya fijado por el middleware (RS-002).
        # Mensaje identico para usuario inexistente y contrasena mala (DA16).
        try:
            user = Usuario.objects.get(username=username)
        except Usuario.DoesNotExist:
            user = None
        if user is None or not user.is_active or not user.check_password(password):
            return Response(
                {'detail': CREDENCIALES_INVALIDAS},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = crear_refresh(user)
        response = Response({'username': user.username, 'empresa': _empresa_nombre()})
        set_auth_cookies(response, refresh.access_token, refresh)
        get_token(request)   # marca a CsrfViewMiddleware para setear la cookie csrftoken
        return response


class RefreshView(APIView):
    """POST /api/auth/refresh/ — rota el access Y el refresh token: el
    refresh usado se invalida (blacklist) y se emite uno nuevo, para que un
    refresh token robado deje de servir en cuanto el usuario legitimo
    refresca su sesion."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        raw = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)
        if not raw:
            return Response({'detail': 'Sesión no encontrada'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            old_refresh = RefreshToken(raw)
            # El refresh solo sirve en la empresa que lo emitio: un token de otro
            # schema (misma firma) se trata como sesion invalida, sin distinguirlo
            # para no filtrar la existencia de la otra empresa.
            verificar_tenant(old_refresh)
            user = Usuario.objects.get(pk=old_refresh['user_id'])
        except (TokenError, AuthenticationFailed, Usuario.DoesNotExist):
            response = Response({'detail': 'Sesión expirada'}, status=status.HTTP_401_UNAUTHORIZED)
            clear_auth_cookies(response)
            return response

        old_refresh.blacklist()
        new_refresh = crear_refresh(user)
        response = Response({'detail': 'ok'})
        set_auth_cookies(response, new_refresh.access_token, new_refresh)
        return response


class LogoutView(APIView):
    """POST /api/auth/logout/ — limpia las cookies y revoca el refresh token
    del lado del servidor (blacklist), no solo del lado del cliente."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        raw = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)
        if raw:
            try:
                RefreshToken(raw).blacklist()
            except TokenError:
                pass
        response = Response(status=status.HTTP_204_NO_CONTENT)
        clear_auth_cookies(response)
        return response


class MeView(APIView):
    """GET /api/auth/me/ — devuelve el perfil si la cookie es valida. Permite
    al frontend restaurar la sesion sin poder leer el JWT httpOnly."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'username': request.user.username, 'empresa': _empresa_nombre()})
