from django.conf import settings
from django.db import connection
from django.middleware.csrf import get_token, rotate_token
from django.utils import timezone
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
from .authentication import _enforce_csrf
from .cookies import clear_auth_cookies, set_auth_cookies
from .models import Usuario
from .serializers import LoginSerializer
from .tokens import activar_tenant_desde_raw, crear_refresh

CREDENCIALES_INVALIDAS = 'Usuario o contraseña incorrectos'


def _gastar_hash_dummy(password):
    """Corre el hasher sobre un usuario vacio para que las rutas de fallo del
    login cuesten lo mismo que la ruta con usuario real.

    Sin esto el `or` del chequeo de credenciales cortocircuita: solo se llega a
    check_password() cuando el usuario existe y esta activo, y como PBKDF2 corre
    1.2M de iteraciones esa rama tarda cientos de ms contra el par de ms de una
    consulta fallida. El 401 identico (RS-002/DA16) no sirve de nada si el reloj
    delata la diferencia: midiendo el tiempo se enumera que empresas existen y
    que usuarios estan activos dentro de cada una. Es la misma defensa que
    django.contrib.auth.backends.ModelBackend, que aqui no aplica porque el
    login nunca llama a authenticate()."""
    Usuario().set_password(password)


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


class CsrfView(APIView):
    """GET /api/auth/csrf/ — siembra la cookie csrftoken.

    Los endpoints de auth exigen CSRF, pero un visitante que todavia no inicio
    sesion no tiene la cookie: este GET es el bootstrap que se la entrega antes
    del primer POST a /login/. Es un metodo seguro y no expone nada — el token
    CSRF no es un secreto de autenticacion, su valor esta en que un origen
    ajeno no puede leerlo para reenviarlo en el header."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        get_token(request)   # marca a CsrfViewMiddleware para setear la cookie
        return Response(status=status.HTTP_204_NO_CONTENT)


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
        # authentication_classes=[] deja fuera a CookieJWTAuthentication, que es
        # donde vive el unico chequeo CSRF del proyecto, y APIView.as_view() se
        # envuelve en csrf_exempt, asi que CsrfViewMiddleware tampoco cubre esta
        # vista. Sin esta llamada explicita, un form cross-site puede postear
        # aqui las credenciales del atacante y dejar a la victima trabajando
        # dentro del tenant de el (la cookie va con SameSite=None en prod).
        _enforce_csrf(request)

        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data['usuario']
        password = serializer.validated_data['password']
        empresa = _empresa_por_hint(serializer.validated_data.get('empresa'))

        # Empresa no resuelta o credenciales malas -> mismo 401 y mismo mensaje:
        # no se distingue empresa inexistente, usuario inexistente ni contrasena
        # mala (RS-002/DA16, evita enumeracion).
        if empresa is None:
            _gastar_hash_dummy(password)
            return Response({'detail': CREDENCIALES_INVALIDAS}, status=status.HTTP_401_UNAUTHORIZED)

        with tenant_context(empresa):
            try:
                user = Usuario.objects.get(username=username)
            except Usuario.DoesNotExist:
                user = None
            # Se evita el cortocircuito a proposito: toda rama de fallo paga un
            # hash, igual que la del usuario real (ver _gastar_hash_dummy).
            if user is not None and user.is_active:
                password_ok = user.check_password(password)
            else:
                _gastar_hash_dummy(password)
                password_ok = False
            if not password_ok:
                return Response(
                    {'detail': CREDENCIALES_INVALIDAS},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            # Solo el login real (usuario+contrasena) cuenta como acceso: el
            # refresh de token no pasa por aqui, asi que "ultimo acceso" no se
            # confunde con la renovacion automatica de sesion. update_fields
            # acota el UPDATE a esta sola columna (no reescribe password_hash
            # ni nada mas de la fila).
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            refresh = crear_refresh(user)   # claim `tenant` = empresa.schema_name
            response = Response({'username': user.username, 'empresa': empresa.nombre})
            set_auth_cookies(response, refresh.access_token, refresh)

        # Se rota el token al autenticar, igual que el login() de Django: el
        # valor que el visitante traia (posiblemente sembrado por un tercero)
        # deja de servir en cuanto la sesion existe.
        rotate_token(request)
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
        # Mismo hueco que en LoginView: sin esto, una pagina ajena puede rotar
        # la sesion de la victima a voluntad.
        _enforce_csrf(request)

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
        # Sin esto, cualquier pagina que la victima abra puede revocarle el
        # refresh token del lado del servidor sin que ella haga nada.
        _enforce_csrf(request)

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
            # El slug, ademas del nombre: el frontend lo compara contra el
            # subdominio que se esta visitando para no mostrar los datos de una
            # empresa bajo la URL de otra (la sesion vive en una cookie de la
            # API, comun a todos los subdominios del frontend).
            'subdominio': getattr(connection.tenant, 'subdominio', None),
        })
