from django.contrib.auth.base_user import AbstractBaseUser
from django.db import models

from .managers import UsuarioManager


class Usuario(AbstractBaseUser):
    """Usuario dentro del schema de su propia empresa (DA03).

    Mapea EXACTAMENTE la tabla 'usuario' de db/schema.sql. Se sobreescriben
    'password' y 'last_login' de AbstractBaseUser solo para fijar su db_column
    (password_hash, ultimo_acceso). Sin PermissionsMixin: no hay roles.
    """
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=255, db_column='password_hash')
    is_active = models.BooleanField(default=True, db_column='activo')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(
        null=True, blank=True, db_column='ultimo_acceso',
    )

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    objects = UsuarioManager()

    class Meta:
        db_table = 'usuario'

    def __str__(self):
        return self.username
