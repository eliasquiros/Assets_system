from django.urls import path

from .catalogos import (
    CategoriaListCreate, LocalizacionListCreate, MarcaListCreate,
    ModeloListCreate, OrigenList, ProveedorListCreate,
)
from .internal import ActualizarDepreciacionView, PromoverRetirosView
from .reportes import ReporteAuditoriaView, ReporteFinancieroView
from .retiros import RetiroListCreateView, RetiroRevertirView
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

    path('bajas/', RetiroListCreateView.as_view(), name='baja-list-create'),
    path('bajas/<int:id>/revertir/', RetiroRevertirView.as_view(), name='baja-revertir'),

    path('reportes/auditoria/', ReporteAuditoriaView.as_view(), name='reporte-auditoria'),
    path('reportes/financiero/', ReporteFinancieroView.as_view(), name='reporte-financiero'),

    # Tareas internas (pg_cron): recalculo mensual de depreciacion y promocion de
    # bajas vencidas a definitivas. No son de un tenant; protegidas por token, no
    # por sesion.
    path('internal/depreciacion/', ActualizarDepreciacionView.as_view(), name='internal-depreciacion'),
    path('internal/promover-retiros/', PromoverRetirosView.as_view(), name='internal-promover-retiros'),
]
