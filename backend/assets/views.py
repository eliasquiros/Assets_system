"""Vistas de activos: listar y detalle (solo lectura en este pase).

Autenticacion/permiso heredados de la config global (CookieJWTAuthentication +
IsAuthenticated): no hay activos sin sesion. El aislamiento entre empresas lo
da el schema fijado por TenantMainMiddleware antes de llegar aca (RS-002): la
consulta corre siempre contra el schema del subdominio, nunca contra otro.
"""
from django.db.models import Q
from rest_framework.generics import ListAPIView, RetrieveAPIView

from .models import Activo
from .serializers import ActivoDetailSerializer, ActivoListSerializer


class ActivoListView(ListAPIView):
    """GET /api/activos/?search=&area=&tipo= — array de activos del schema actual."""
    serializer_class = ActivoListSerializer

    def get_queryset(self):
        qs = Activo.objects.select_related('localizacion', 'categoria')
        params = self.request.query_params
        search = params.get('search')
        area = params.get('area')
        tipo = params.get('tipo')
        if search:
            qs = qs.filter(Q(numero_activo__icontains=search) | Q(nombre__icontains=search))
        if area:
            qs = qs.filter(localizacion__nombre=area)
        if tipo:
            qs = qs.filter(categoria__nombre=tipo)
        return qs.order_by('numero_activo')


class ActivoDetailView(RetrieveAPIView):
    """GET /api/activos/<num>/ — un activo por su numero (el "ver mas" del drawer)."""
    serializer_class = ActivoDetailSerializer
    queryset = Activo.objects.select_related('localizacion', 'categoria')
    lookup_field = 'numero_activo'
    lookup_url_kwarg = 'num'
