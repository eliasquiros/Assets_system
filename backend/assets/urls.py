from django.urls import path

from .catalogos import (
    CategoriaListCreate, LocalizacionListCreate, MarcaListCreate,
    ModeloListCreate, OrigenList, ProveedorListCreate,
)
from .views import (
    ActivoCreateView, ActivoDetailView, ActivoListView,
    MovimientoListView, SiguienteNumeroView,
)

urlpatterns = [
    path('activos/', ActivoListView.as_view(), name='activo-list'),
    path('activos/crear/', ActivoCreateView.as_view(), name='activo-create'),
    path('activos/siguiente-numero/', SiguienteNumeroView.as_view(), name='activo-siguiente-numero'),
    path('activos/<str:num>/', ActivoDetailView.as_view(), name='activo-detail'),
    path('activos/<str:num>/movimientos/', MovimientoListView.as_view(), name='activo-movimientos'),

    path('catalogos/localizaciones/', LocalizacionListCreate.as_view(), name='cat-localizaciones'),
    path('catalogos/proveedores/', ProveedorListCreate.as_view(), name='cat-proveedores'),
    path('catalogos/categorias/', CategoriaListCreate.as_view(), name='cat-categorias'),
    path('catalogos/marcas/', MarcaListCreate.as_view(), name='cat-marcas'),
    path('catalogos/modelos/', ModeloListCreate.as_view(), name='cat-modelos'),
    path('catalogos/origenes/', OrigenList.as_view(), name='cat-origenes'),
]
