"""Vistas de activos: listar y detalle (solo lectura en este pase).

Autenticacion/permiso heredados de la config global (CookieJWTAuthentication +
IsAuthenticated): no hay activos sin sesion. El aislamiento entre empresas lo
da el schema fijado por TenantMainMiddleware antes de llegar aca (RS-002): la
consulta corre siempre contra el schema del subdominio, nunca contra otro.
"""
from django.db.models import Exists, OuterRef, Q
from django.shortcuts import get_object_or_404
from rest_framework.generics import (
    CreateAPIView, ListAPIView, RetrieveUpdateAPIView,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Activo, Categoria, Movimiento, Retiro
from .serializers import (
    ActivoCreateSerializer, ActivoDetailSerializer, ActivoEditSerializer,
    ActivoListSerializer, MovimientoSerializer,
)


class ActivoListView(ListAPIView):
    """GET /api/activos/?search=&area=&tipo= — array de activos del schema actual."""
    serializer_class = ActivoListSerializer

    def get_queryset(self):
        # Anota "pendiente de baja" (RN-002.5/DA15) con un Exists por activo para
        # que el serializer no dispare una consulta por fila.
        pendiente = Retiro.objects.filter(
            activo=OuterRef('pk'), estado=Retiro.PENDIENTE,
        )
        qs = (
            Activo.objects.select_related('localizacion', 'categoria')
            .annotate(pendiente_baja=Exists(pendiente))
        )
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


class ActivoDetailView(RetrieveUpdateAPIView):
    """GET /api/activos/<num>/ (detalle, "ver mas") y PATCH (edicion, RF-001/RF-007).

    El GET usa el serializer de detalle; el PATCH usa el de edicion, que valida,
    aplica bajo bloqueo optimista por `version` y registra los movimientos. No se
    permite PUT: la edicion es siempre parcial sobre el activo existente."""
    queryset = Activo.objects.select_related(
        'localizacion', 'categoria', 'proveedor', 'marca', 'modelo', 'origen',
    )
    lookup_field = 'numero_activo'
    lookup_url_kwarg = 'num'
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_serializer_class(self):
        if self.request.method == 'PATCH':
            return ActivoEditSerializer
        return ActivoDetailSerializer


class MovimientoListView(ListAPIView):
    """GET /api/activos/<num>/movimientos/ — historial del activo (RF-007).

    Es lo que alimenta la seccion "Historial de movimientos" del drawer. Un
    numero de activo inexistente da 404 (no una lista vacia enganosa)."""
    serializer_class = MovimientoSerializer

    def get_queryset(self):
        activo = get_object_or_404(Activo, numero_activo=self.kwargs['num'])
        return activo.movimientos.all()


class ActivoCreateView(CreateAPIView):
    """POST /api/activos/crear/ — registra un activo y su movimiento ALTA (RF-001)."""
    serializer_class = ActivoCreateSerializer


class SiguienteNumeroView(APIView):
    """GET /api/activos/siguiente-numero/?categoria=<id> — numero sugerido.

    Devuelve el siguiente correlativo de la categoria (PREFIJO-####) mirando los
    numeros existentes con ese prefijo, para precargar el campo en el formulario.
    """
    def get(self, request):
        categoria = get_object_or_404(Categoria, pk=request.query_params.get('categoria'))
        prefijo = (categoria.prefijo or '').strip().upper()
        if not prefijo:
            return Response({'numero': ''})
        maximo = 0
        existentes = Activo.objects.filter(
            numero_activo__istartswith=f'{prefijo}-'
        ).values_list('numero_activo', flat=True)
        for numero in existentes:
            sufijo = numero.split('-', 1)[1] if '-' in numero else ''
            if sufijo.isdigit():
                maximo = max(maximo, int(sufijo))
        return Response({'numero': f'{prefijo}-{maximo + 1:04d}'})
