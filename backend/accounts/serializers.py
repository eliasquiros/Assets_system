from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    usuario = serializers.CharField()
    password = serializers.CharField(trim_whitespace=False, style={'input_type': 'password'})
    # Slug de la empresa que el frontend deriva de su subdominio. Es solo un
    # HINT NO autoritativo para saber contra que schema validar credenciales; la
    # seguridad la da la contrasena + el token firmado que se emite (RS-002).
    empresa = serializers.SlugField(required=False, allow_blank=True, default='')
