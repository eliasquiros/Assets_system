from django.conf import settings
from django.db import connection
from django.middleware.csrf import get_token
from django_tenants.utils import tenant_context
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from companies.models import Empresa
from .cookies import clear_auth_cookies, set_auth_cookies
from .models import Usuario
from .serializers import LoginSerializer
from .tokens import activar_tenant_desde_raw, crear_refresh

CREDENCIALES_INVALIDAS = 'Usuario o contraseña incorrectos'


def _empresa_por_hint(hint):
    """Resuelve la empresa por el slug (hint) que el frontend deriva de su
    subdominio. Se consulta en el schema publico. Devuelve None si no existe o
    esta inactiva: el login trata ese caso como credenciales invalidas, para no
    filtrar que empresas existen (RS-002/DA16)."""
    if not hint:
        return None
    try:
        return Empresa.objects.get(subdominio=hint, activa=True)
    except Empresa.DoesNotExist:
        return None


class LoginView(APIView):
    """POST /api/auth/login/ — autentica contra el usuario de la empresa
    indicada por el hint de subdominio y setea el JWT (sellado con esa empresa)
    en cookies httpOnly. El hint no es autoritativo: un hint hacia otra empresa
    igual exige credenciales validas de esa empresa."""
    permission_classes = [AllowAny]
    authentication_classes = []          # el login es el bootstrap, no exige cookie previa
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data['usuario']
        password = serializer.validated_data['password']
        empresa = _empresa_por_hint(serializer.validated_data.get('empresa'))

        # Empresa no resuelta o credenciales malas -> mismo 401 y mismo mensaje:
        # no se distingue empresa inexistente, usuario inexistente ni contrasena
        # mala (RS-002/DA16, evita enumeracion).
        if empresa is None:
            return Response({'detail': CREDENCIALES_INVALIDAS}, status=status.HTTP_401_UNAUTHORIZED)

        with tenant_context(empresa):
            try:
                user = Usuario.objects.get(username=username)
            except Usuario.DoesNotExist:
                user = None
            if user is None or not user.is_active or not user.check_password(password):
                return Response(
                    {'detail': CREDENCIALES_INVALIDAS},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            refresh = crear_refresh(user)   # claim `tenant` = empresa.schema_name
            response = Response({'username': user.username, 'empresa': empresa.nombre})
            set_auth_cookies(response, refresh.access_token, refresh)

        get_token(request)   # marca a CsrfViewMiddleware para setear la cookie csrftoken
        return response


class RefreshView(APIView):
    """POST /api/auth/refresh/ — rota el access Y el refresh token: el
    refresh usado se invalida (blacklist) y se emite uno nuevo, para que un
    refresh token robado deje de servir en cuanto el usuario legitimo
    refresca su sesion. La empresa sale del claim firmado del refresh."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        raw = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)
        if not raw:
            return Response({'detail': 'Sesión no encontrada'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            # Primero firma+expiracion y activacion del schema del claim; recien
            # ahi se construye el RefreshToken tipado, cuya verificacion de
            # blacklist (y el usuario) viven en ese schema. Un token de otra
            # empresa se rechaza aqui como sesion invalida.
            activar_tenant_desde_raw(raw)
            old_refresh = RefreshToken(raw)
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
                # La blacklist vive en el schema de la empresa del token: se
                # activa desde el claim firmado antes de construir/revocar.
                activar_tenant_desde_raw(raw)
                RefreshToken(raw).blacklist()
            except (TokenError, AuthenticationFailed):
                pass
        response = Response(status=status.HTTP_204_NO_CONTENT)
        clear_auth_cookies(response)
        return response


class MeView(APIView):
    """GET /api/auth/me/ — devuelve el perfil si la cookie es valida. Permite
    al frontend restaurar la sesion sin poder leer el JWT httpOnly."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # La autenticacion ya activo el schema de la empresa desde el claim.
        return Response({
            'username': request.user.username,
            'empresa': getattr(connection.tenant, 'nombre', None),
        })
