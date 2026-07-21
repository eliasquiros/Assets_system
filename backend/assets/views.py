"""Vistas de activos: listar y detalle (solo lectura en este pase).

Autenticacion/permiso heredados de la config global (CookieJWTAuthentication +
IsAuthenticated): no hay activos sin sesion. El aislamiento entre empresas lo
da el schema fijado por TenantMainMiddleware antes de llegar aca (RS-002): la
consulta corre siempre contra el schema del subdominio, nunca contra otro.
"""
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework.generics import ListAPIView, RetrieveAPIView

from .models import Activo, Movimiento
from .serializers import ActivoDetailSerializer, ActivoListSerializer, MovimientoSerializer


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
    queryset = Activo.objects.select_related('localizacion', 'categoria', 'proveedor')
    lookup_field = 'numero_activo'
    lookup_url_kwarg = 'num'


class MovimientoListView(ListAPIView):
    """GET /api/activos/<num>/movimientos/ — historial del activo (RF-007).

    Es lo que alimenta la seccion "Historial de movimientos" del drawer. Un
    numero de activo inexistente da 404 (no una lista vacia enganosa)."""
    serializer_class = MovimientoSerializer

    def get_queryset(self):
        activo = get_object_or_404(Activo, numero_activo=self.kwargs['num'])
        return activo.movimientos.all()
