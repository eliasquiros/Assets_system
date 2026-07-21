from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    usuario = serializers.CharField()
    password = serializers.CharField(trim_whitespace=False, style={'input_type': 'password'})
