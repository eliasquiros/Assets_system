"""Catalogos para el registro de activos (RF-001): lectura y alta inline.

Cada catalogo expone GET (listar) y, salvo Origen, POST (crear) para el boton
"+ Nuevo" del formulario. La unicidad se valida normalizada (mayusculas/espacios)
para devolver un 400 legible en vez de un IntegrityError del constraint.
"""
from rest_framework import serializers
from rest_framework.generics import ListAPIView, ListCreateAPIView

from .models import Categoria, Localizacion, Marca, Modelo, Origen, Proveedor


def _duplicado(model, nombre, **extra):
    return model.objects.filter(nombre__iexact=(nombre or '').strip(), **extra).exists()


class LocalizacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Localizacion
        fields = ['id', 'nombre']

    def validate_nombre(self, value):
        if _duplicado(Localizacion, value):
            raise serializers.ValidationError('Ya existe una localización con ese nombre.')
        return value


class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = ['id', 'nombre']

    def validate_nombre(self, value):
        if _duplicado(Proveedor, value):
            raise serializers.ValidationError('Ya existe un proveedor con ese nombre.')
        return value


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'prefijo']

    def validate_nombre(self, value):
        if _duplicado(Categoria, value):
            raise serializers.ValidationError('Ya existe una categoría con ese nombre.')
        return value

    def validate_prefijo(self, value):
        value = (value or '').strip().upper()
        if not value:
            raise serializers.ValidationError('El prefijo es obligatorio.')
        if Categoria.objects.filter(prefijo__iexact=value).exists():
            raise serializers.ValidationError('Ese prefijo ya está en uso por otra categoría.')
        return value


class MarcaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marca
        fields = ['id', 'nombre']

    def validate_nombre(self, value):
        if _duplicado(Marca, value):
            raise serializers.ValidationError('Ya existe una marca con ese nombre.')
        return value


class ModeloSerializer(serializers.ModelSerializer):
    class Meta:
        model = Modelo
        fields = ['id', 'nombre', 'marca']

    def validate(self, attrs):
        nombre, marca = attrs.get('nombre'), attrs.get('marca')
        if marca and _duplicado(Modelo, nombre, marca=marca):
            raise serializers.ValidationError({'nombre': 'Esa marca ya tiene un modelo con ese nombre.'})
        return attrs


class OrigenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Origen
        fields = ['id', 'nombre']


class LocalizacionListCreate(ListCreateAPIView):
    serializer_class = LocalizacionSerializer
    queryset = Localizacion.objects.order_by('nombre')


class ProveedorListCreate(ListCreateAPIView):
    serializer_class = ProveedorSerializer
    queryset = Proveedor.objects.order_by('nombre')


class CategoriaListCreate(ListCreateAPIView):
    serializer_class = CategoriaSerializer
    queryset = Categoria.objects.order_by('nombre')


class MarcaListCreate(ListCreateAPIView):
    serializer_class = MarcaSerializer
    queryset = Marca.objects.order_by('nombre')


class ModeloListCreate(ListCreateAPIView):
    """GET /api/catalogos/modelos/?marca=<id> — filtra por la marca elegida."""
    serializer_class = ModeloSerializer

    def get_queryset(self):
        qs = Modelo.objects.select_related('marca').order_by('nombre')
        marca = self.request.query_params.get('marca')
        return qs.filter(marca_id=marca) if marca else qs


class OrigenList(ListAPIView):
    """Catalogo fijo (2 origenes): solo lectura, sin alta desde la UI."""
    serializer_class = OrigenSerializer
    queryset = Origen.objects.order_by('nombre')
