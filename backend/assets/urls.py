from django.urls import path

from .views import ActivoDetailView, ActivoListView

urlpatterns = [
    path('activos/', ActivoListView.as_view(), name='activo-list'),
    path('activos/<str:num>/', ActivoDetailView.as_view(), name='activo-detail'),
]
