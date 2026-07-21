from django.conf import settings
from rest_framework_simplejwt.settings import api_settings


def set_auth_cookies(response, access_token, refresh_token):
    """Guarda el JWT en cookies httpOnly. El token nunca va en el body."""
    common = {
        'httponly': True,
        'secure': settings.AUTH_COOKIE_SECURE,
        'samesite': settings.AUTH_COOKIE_SAMESITE,
    }
    response.set_cookie(
        settings.AUTH_COOKIE_ACCESS,
        str(access_token),
        max_age=int(api_settings.ACCESS_TOKEN_LIFETIME.total_seconds()),
        path='/',
        **common,
    )
    response.set_cookie(
        settings.AUTH_COOKIE_REFRESH,
        str(refresh_token),
        max_age=int(api_settings.REFRESH_TOKEN_LIFETIME.total_seconds()),
        path=settings.AUTH_COOKIE_REFRESH_PATH,
        **common,
    )


def clear_auth_cookies(response):
    response.delete_cookie(settings.AUTH_COOKIE_ACCESS, path='/')
    response.delete_cookie(
        settings.AUTH_COOKIE_REFRESH, path=settings.AUTH_COOKIE_REFRESH_PATH,
    )
