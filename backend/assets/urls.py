from django.urls import path

from .views import ActivoDetailView, ActivoListView, MovimientoListView

urlpatterns = [
    path('activos/', ActivoListView.as_view(), name='activo-list'),
    path('activos/<str:num>/', ActivoDetailView.as_view(), name='activo-detail'),
    path('activos/<str:num>/movimientos/', MovimientoListView.as_view(), name='activo-movimientos'),
]
