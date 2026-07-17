from django.contrib.auth.base_user import BaseUserManager


class UsuarioManager(BaseUserManager):
    """Crea usuarios hasheando la contrasena (RS-001). Sin superusuarios:
    el MVP no tiene roles ni admin por tenant."""

    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('El username es obligatorio')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)   # hashea; nunca guarda texto plano
        user.save(using=self._db)
        return user
