"""Almacenamiento de comprobantes en Supabase Storage con enlace firmado (RS-005).

Por que un backend propio y no django-storages/boto3: lo unico que se necesita
de Supabase Storage son cuatro operaciones REST (subir, firmar, descargar,
borrar) y anadir boto3 traeria ~15 MB de dependencia para eso. La API de
Supabase es HTTP plano, asi que basta urllib de la stdlib.

Los comprobantes NO se sirven publicamente: el bucket es privado y cada acceso
se resuelve con un enlace firmado de vida corta que emite el backend despues de
comprobar la sesion. Sin firma, la URL del objeto responde 400.

El aislamiento entre empresas lo da la ruta: cada objeto cuelga del schema del
tenant (ver `ruta_respaldo_retiro` en assets/models.py). La clave service_role
salta las policies de RLS de Storage, de modo que la unica frontera real es la
que aplica la vista antes de firmar — por eso la vista busca el retiro dentro
del schema activo y jamas acepta una ruta que venga del cliente.

Dos guardas mas, fail-closed como el resto del proyecto: SUPABASE_URL tiene que
ser https (la clave service_role viaja en Authorization en cada peticion) y el
Content-Type que se sube al bucket SIEMPRE se deriva de la extension ya
validada, nunca del que declara el cliente en el multipart — sin esto, un
archivo "factura.pdf" con Content-Type: text/html serviria como HTML al abrir
el enlace firmado (XSS almacenado, RS-005).
"""
import json
import mimetypes
from urllib import request as peticiones
from urllib.error import HTTPError, URLError
from urllib.parse import quote

from django.core.exceptions import ImproperlyConfigured
from django.core.files.base import ContentFile
from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible

# Vida del enlace firmado. Corta a proposito: es para abrir el comprobante en el
# momento, no para compartirlo. Si el enlace se filtra, la ventana es minima.
TTL_ENLACE_SEGUNDOS = 300

TIMEOUT_SUBIDA = 20
TIMEOUT_LECTURA = 10


class ErrorDeAlmacenamiento(Exception):
    """Fallo hablando con Supabase Storage.

    Se distingue de un error de programacion para que la vista pueda responder
    502 (vuelva a intentarlo) en vez de un 500 opaco: que el bucket este caido
    no es un bug del sistema y el usuario merece saber que su archivo no se
    guardo.
    """


@deconstructible
class AlmacenamientoSupabase(Storage):
    """Storage de Django sobre la API REST de Supabase Storage.

    Es `deconstructible` porque un FileField puede referenciarlo desde una
    migracion; las credenciales se leen del entorno en cada instancia, nunca se
    serializan en el archivo de migracion.
    """

    def __init__(self, bucket=None, url_proyecto=None, clave=None, ttl=None):
        self.bucket = bucket
        self.url_proyecto = (url_proyecto or '').rstrip('/')
        self.clave = clave
        self.ttl = ttl or TTL_ENLACE_SEGUNDOS
        if not self.bucket or not self.url_proyecto or not self.clave:
            raise ImproperlyConfigured(
                'Falta configuracion de Supabase Storage: se requieren '
                'SUPABASE_URL, SUPABASE_SERVICE_KEY y SUPABASE_BUCKET_RESPALDOS.'
            )
        # Falla cerrado: la clave service_role viaja en la cabecera Authorization
        # de CADA peticion (subida, firma, lectura). Un SUPABASE_URL en http://
        # por error de copiado mandaria esa clave —acceso total al bucket, salta
        # RLS— en texto plano. Mismo criterio que validar_conexion_db con el
        # puerto del pooler: un typo de un caracter no debe degradar en silencio.
        if not self.url_proyecto.startswith('https://'):
            raise ImproperlyConfigured(
                f'SUPABASE_URL debe empezar con https:// (recibido: {self.url_proyecto!r}). '
                'Sin TLS, la clave service_role viajaria en texto plano en cada peticion.'
            )

    # -- infraestructura ---------------------------------------------------
    def _url_api(self, sufijo):
        return f'{self.url_proyecto}/storage/v1/{sufijo}'

    def _ruta_objeto(self, name):
        # quote() por segmento: el nombre puede traer espacios o acentos y la
        # ruta ya viene saneada desde upload_to.
        return quote(name.lstrip('/'), safe='/')

    def _peticion(self, metodo, sufijo, *, cuerpo=None, content_type=None, timeout=None):
        req = peticiones.Request(self._url_api(sufijo), method=metodo, data=cuerpo)
        req.add_header('Authorization', f'Bearer {self.clave}')
        if content_type:
            req.add_header('Content-Type', content_type)
        try:
            with peticiones.urlopen(req, timeout=timeout or TIMEOUT_LECTURA) as resp:
                return resp.status, resp.read(), resp.headers
        except HTTPError as exc:
            return exc.code, exc.read(), exc.headers
        except (URLError, TimeoutError, OSError) as exc:
            raise ErrorDeAlmacenamiento(
                f'No se pudo contactar con Supabase Storage: {exc}'
            ) from exc

    # -- contrato de Storage ------------------------------------------------
    def _save(self, name, content):
        content.seek(0)
        datos = content.read()
        # NUNCA content.content_type: es la cabecera Content-Type que declaro el
        # cliente en el multipart, no verificada contra el contenido real. Un
        # archivo "factura.pdf" con Content-Type: text/html y un <script> dentro
        # quedaria servido por Supabase con ESE content-type, y el navegador de
        # quien abra el enlace firmado lo ejecutaria como HTML (XSS almacenado).
        # El tipo se deriva siempre de la extension ya validada en assets/retiros
        # (_validar_archivo solo permite pdf/jpg/jpeg/png/webp).
        tipo = mimetypes.guess_type(name)[0] or 'application/octet-stream'
        estado, cuerpo, _ = self._peticion(
            'POST', f'object/{self.bucket}/{self._ruta_objeto(name)}',
            cuerpo=datos, content_type=tipo, timeout=TIMEOUT_SUBIDA,
        )
        if estado not in (200, 201):
            raise ErrorDeAlmacenamiento(
                f'Supabase rechazo la subida ({estado}): {cuerpo[:300]!r}'
            )
        return name

    def _open(self, name, mode='rb'):
        estado, cuerpo, _ = self._peticion(
            'GET', f'object/{self.bucket}/{self._ruta_objeto(name)}',
        )
        if estado != 200:
            raise ErrorDeAlmacenamiento(
                f'No se pudo leer {name} de Supabase ({estado}).'
            )
        return ContentFile(cuerpo, name=name)

    def exists(self, name):
        # HEAD sobre el mismo endpoint de descarga en vez de la ruta `info`:
        # esta ya se ejercita en cada lectura, asi que no depende de que otra
        # ruta de la API siga llamandose igual.
        estado, _, _ = self._peticion(
            'HEAD', f'object/{self.bucket}/{self._ruta_objeto(name)}',
        )
        return estado == 200

    def size(self, name):
        estado, _, cabeceras = self._peticion(
            'HEAD', f'object/{self.bucket}/{self._ruta_objeto(name)}',
        )
        if estado != 200:
            raise ErrorDeAlmacenamiento(f'No se pudo consultar {name} ({estado}).')
        return int(cabeceras.get('Content-Length') or 0)

    def delete(self, name):
        self._peticion('DELETE', f'object/{self.bucket}/{self._ruta_objeto(name)}')

    def url(self, name):
        """Enlace firmado de vida corta (TTL_ENLACE_SEGUNDOS).

        Django llama a `.url` para cualquier FileField, asi que devolver aqui el
        enlace firmado evita que otro punto del codigo exponga sin querer una
        ruta permanente: no existe una URL publica que filtrar.
        """
        return self.enlace_firmado(name)

    # -- lo especifico de Supabase -----------------------------------------
    def enlace_firmado(self, name, ttl=None):
        segundos = ttl or self.ttl
        estado, cuerpo, _ = self._peticion(
            'POST', f'object/sign/{self.bucket}/{self._ruta_objeto(name)}',
            cuerpo=json.dumps({'expiresIn': segundos}).encode(),
            content_type='application/json',
        )
        if estado != 200:
            raise ErrorDeAlmacenamiento(
                f'Supabase no firmo el enlace de {name} ({estado}): {cuerpo[:300]!r}'
            )
        # La respuesta trae la ruta relativa a /storage/v1, no la URL completa.
        firmada = json.loads(cuerpo).get('signedURL', '')
        if not firmada:
            raise ErrorDeAlmacenamiento(f'Supabase devolvio una firma vacia para {name}.')
        return self._url_api(firmada.lstrip('/'))


def construir_almacenamiento(environ):
    """Devuelve el storage de comprobantes segun el entorno.

    Sin credenciales de Supabase cae al almacenamiento local de Django, que es
    lo que usan los tests y el desarrollo sin red. En produccion la ausencia de
    las variables se detecta en el arranque (ver settings), no aqui: este helper
    no debe decidir por su cuenta que un despliegue real puede quedarse sin
    almacenamiento persistente.
    """
    url = (environ.get('SUPABASE_URL') or '').strip()
    clave = (environ.get('SUPABASE_SERVICE_KEY') or '').strip()
    bucket = (environ.get('SUPABASE_BUCKET_RESPALDOS') or '').strip()
    if not (url and clave and bucket):
        return None
    return AlmacenamientoSupabase(bucket=bucket, url_proyecto=url, clave=clave)
