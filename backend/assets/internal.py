"""Endpoint interno para tareas de mantenimiento disparadas por pg_cron.

No pertenece a ninguna empresa: recorre todos los schemas. No usa la
autenticacion por cookie (no hay usuario detras); se protege con un token
secreto compartido en un header, comparado en tiempo constante y fail-closed
si no esta configurado."""
import hmac

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .tareas import actualizar_todas_las_empresas


class ActualizarDepreciacionView(APIView):
    """POST /api/internal/depreciacion/ — recalcula la depreciacion almacenada
    de todos los activos de todas las empresas (DA05/DA06). Lo dispara pg_cron
    una vez al mes via pg_net; el corte es el primer dia del mes actual."""
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        esperado = settings.INTERNAL_TASK_TOKEN
        if not esperado:
            return Response(
                {'detail': 'Tarea interna no configurada.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        recibido = request.headers.get('X-Internal-Token', '')
        if not hmac.compare_digest(recibido, esperado):
            return Response({'detail': 'No autorizado.'}, status=status.HTTP_403_FORBIDDEN)
        resumen = actualizar_todas_las_empresas()
        return Response({'actualizados': resumen})
