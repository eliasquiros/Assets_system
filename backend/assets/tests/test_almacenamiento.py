"""Cliente de Supabase Storage: el comprobante se sube y se firma, o falla claro.

Aqui no se toca la red: se sustituye `urlopen` para comprobar el contrato que el
sistema espera de Supabase —a que URL va cada operacion, que la clave viaja en
la cabecera, y que una respuesta anomala se convierte en ErrorDeAlmacenamiento
en vez de propagarse como un fallo cualquiera—. Esa distincion es la que permite
a la vista contestar 502 "vuelva a intentarlo" en lugar de un 500 opaco: que el
bucket este caido no es un bug del sistema, pero el usuario tiene que enterarse
de que su comprobante NO quedo guardado (RN-002.2).
"""
import json
from io import BytesIO
from unittest.mock import patch
from urllib.error import URLError

from django.core.exceptions import ImproperlyConfigured
from django.core.files.base import ContentFile
from django.test import SimpleTestCase

from config.almacenamiento import (
    AlmacenamientoSupabase,
    ErrorDeAlmacenamiento,
    construir_almacenamiento,
)

ENTORNO = {
    'SUPABASE_URL': 'https://proyecto.supabase.co',
    'SUPABASE_SERVICE_KEY': 'clave-secreta',
    'SUPABASE_BUCKET_RESPALDOS': 'respaldos-retiro',
}


class RespuestaFalsa(BytesIO):
    """Imita lo justo de la respuesta de urlopen: `status`, `read` y el `with`."""

    def __init__(self, status, cuerpo=b'', cabeceras=None):
        super().__init__(cuerpo)
        self.status = status
        self.headers = cabeceras or {}

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


def _almacenamiento():
    return AlmacenamientoSupabase(
        bucket=ENTORNO['SUPABASE_BUCKET_RESPALDOS'],
        url_proyecto=ENTORNO['SUPABASE_URL'],
        clave=ENTORNO['SUPABASE_SERVICE_KEY'],
    )


class ConstruirAlmacenamientoTest(SimpleTestCase):
    def test_sin_credenciales_no_construye_nada(self):
        # Desarrollo y tests: se cae al almacenamiento local de Django.
        self.assertIsNone(construir_almacenamiento({}))

    def test_con_credenciales_completas_construye_el_cliente(self):
        almacenamiento = construir_almacenamiento(ENTORNO)
        self.assertIsInstance(almacenamiento, AlmacenamientoSupabase)
        self.assertEqual(almacenamiento.bucket, 'respaldos-retiro')

    def test_una_variable_en_blanco_se_trata_como_ausente(self):
        self.assertIsNone(construir_almacenamiento({**ENTORNO, 'SUPABASE_SERVICE_KEY': '   '}))

    def test_configuracion_a_medias_no_se_instancia_en_silencio(self):
        # Un cliente sin bucket subiria a ninguna parte devolviendo exito.
        with self.assertRaises(ImproperlyConfigured):
            AlmacenamientoSupabase(bucket='', url_proyecto='https://x.co', clave='k')

    def test_rechaza_una_url_sin_https(self):
        # La clave service_role viaja en Authorization en cada peticion; sin
        # TLS iria en texto plano. Un typo de un caracter (http en vez de
        # https) no puede degradar en silencio.
        with self.assertRaises(ImproperlyConfigured):
            AlmacenamientoSupabase(bucket='b', url_proyecto='http://proyecto.supabase.co', clave='k')

    def test_construir_almacenamiento_tambien_falla_cerrado_sin_https(self):
        with self.assertRaises(ImproperlyConfigured):
            construir_almacenamiento({**ENTORNO, 'SUPABASE_URL': 'http://proyecto.supabase.co'})


class SubidaTest(SimpleTestCase):
    def test_sube_al_bucket_con_la_clave_en_la_cabecera(self):
        with patch('config.almacenamiento.peticiones.urlopen') as urlopen:
            urlopen.return_value = RespuestaFalsa(200, b'{}')
            nombre = _almacenamiento()._save(
                'respaldos_retiro/empresa/uuid/acta.pdf', ContentFile(b'bytes'),
            )

        peticion = urlopen.call_args[0][0]
        self.assertEqual(
            peticion.full_url,
            'https://proyecto.supabase.co/storage/v1/object/'
            'respaldos-retiro/respaldos_retiro/empresa/uuid/acta.pdf',
        )
        self.assertEqual(peticion.get_header('Authorization'), 'Bearer clave-secreta')
        self.assertEqual(peticion.data, b'bytes')
        # El nombre que se devuelve es el que queda guardado en la fila.
        self.assertEqual(nombre, 'respaldos_retiro/empresa/uuid/acta.pdf')

    def test_los_espacios_y_acentos_del_nombre_no_rompen_la_ruta(self):
        with patch('config.almacenamiento.peticiones.urlopen') as urlopen:
            urlopen.return_value = RespuestaFalsa(200, b'{}')
            _almacenamiento()._save('respaldos_retiro/e/u/acta final.pdf', ContentFile(b'x'))

        self.assertIn('acta%20final.pdf', urlopen.call_args[0][0].full_url)

    def test_ignora_el_content_type_que_declara_el_cliente(self):
        # El Content-Type de un multipart lo pone quien sube el archivo, no
        # Django: un "factura.pdf" con Content-Type: text/html y un <script>
        # dentro quedaria servido por Supabase con ESE content-type, y el
        # navegador de quien abra el enlace firmado lo ejecutaria como HTML
        # (XSS almacenado). El tipo real SIEMPRE sale de la extension ya
        # validada (assets/retiros._validar_archivo), nunca de lo declarado.
        archivo = ContentFile(b'<script>alert(1)</script>', name='acta.pdf')
        archivo.content_type = 'text/html'  # lo que declararia un cliente malicioso

        with patch('config.almacenamiento.peticiones.urlopen') as urlopen:
            urlopen.return_value = RespuestaFalsa(200, b'{}')
            _almacenamiento()._save('respaldos_retiro/e/u/acta.pdf', archivo)

        peticion = urlopen.call_args[0][0]
        self.assertEqual(peticion.get_header('Content-type'), 'application/pdf')

    def test_un_rechazo_de_supabase_no_pasa_por_exito(self):
        # Lo peligroso seria devolver el nombre igualmente: la baja quedaria
        # registrada apuntando a un objeto que no existe.
        with patch('config.almacenamiento.peticiones.urlopen') as urlopen:
            urlopen.return_value = RespuestaFalsa(403, b'{"message":"denegado"}')
            with self.assertRaises(ErrorDeAlmacenamiento):
                _almacenamiento()._save('x/y.pdf', ContentFile(b'x'))

    def test_una_caida_de_red_se_traduce_a_error_de_almacenamiento(self):
        with patch('config.almacenamiento.peticiones.urlopen', side_effect=URLError('sin ruta')):
            with self.assertRaises(ErrorDeAlmacenamiento):
                _almacenamiento()._save('x/y.pdf', ContentFile(b'x'))


class ConsultaTest(SimpleTestCase):
    def test_exists_pregunta_por_el_objeto_sin_descargarlo(self):
        with patch('config.almacenamiento.peticiones.urlopen') as urlopen:
            urlopen.return_value = RespuestaFalsa(200)
            existe = _almacenamiento().exists('e/u/acta.pdf')

        peticion = urlopen.call_args[0][0]
        self.assertTrue(existe)
        self.assertEqual(peticion.get_method(), 'HEAD')
        self.assertEqual(
            peticion.full_url,
            'https://proyecto.supabase.co/storage/v1/object/respaldos-retiro/e/u/acta.pdf',
        )

    def test_exists_es_falso_si_el_objeto_no_esta(self):
        with patch('config.almacenamiento.peticiones.urlopen') as urlopen:
            urlopen.return_value = RespuestaFalsa(404)
            self.assertFalse(_almacenamiento().exists('e/u/acta.pdf'))

    def test_size_lee_el_tamano_de_las_cabeceras(self):
        with patch('config.almacenamiento.peticiones.urlopen') as urlopen:
            urlopen.return_value = RespuestaFalsa(200, cabeceras={'Content-Length': '2048'})
            self.assertEqual(_almacenamiento().size('e/u/acta.pdf'), 2048)


class EnlaceFirmadoTest(SimpleTestCase):
    def test_convierte_la_ruta_relativa_de_supabase_en_una_url_completa(self):
        # Supabase responde con una ruta relativa a /storage/v1; devolverla tal
        # cual daria un enlace que no abre en ninguna parte.
        cuerpo = json.dumps({
            'signedURL': '/object/sign/respaldos-retiro/e/u/acta.pdf?token=abc',
        }).encode()
        with patch('config.almacenamiento.peticiones.urlopen') as urlopen:
            urlopen.return_value = RespuestaFalsa(200, cuerpo)
            url = _almacenamiento().enlace_firmado('e/u/acta.pdf')

        self.assertEqual(
            url,
            'https://proyecto.supabase.co/storage/v1/object/sign/'
            'respaldos-retiro/e/u/acta.pdf?token=abc',
        )

    def test_pide_la_caducidad_configurada(self):
        cuerpo = json.dumps({'signedURL': '/object/sign/b/x?token=t'}).encode()
        with patch('config.almacenamiento.peticiones.urlopen') as urlopen:
            urlopen.return_value = RespuestaFalsa(200, cuerpo)
            _almacenamiento().enlace_firmado('e/u/acta.pdf', ttl=60)

        self.assertEqual(json.loads(urlopen.call_args[0][0].data), {'expiresIn': 60})

    def test_url_devuelve_siempre_un_enlace_firmado(self):
        # `.url` es lo que llama Django para cualquier FileField: si aqui
        # saliera una ruta permanente, el bucket privado dejaria de serlo.
        cuerpo = json.dumps({'signedURL': '/object/sign/b/x?token=t'}).encode()
        with patch('config.almacenamiento.peticiones.urlopen') as urlopen:
            urlopen.return_value = RespuestaFalsa(200, cuerpo)
            url = _almacenamiento().url('e/u/acta.pdf')

        self.assertIn('token=t', url)
        self.assertIn('/object/sign/', urlopen.call_args[0][0].full_url)

    def test_una_firma_vacia_no_se_da_por_buena(self):
        with patch('config.almacenamiento.peticiones.urlopen') as urlopen:
            urlopen.return_value = RespuestaFalsa(200, json.dumps({'signedURL': ''}).encode())
            with self.assertRaises(ErrorDeAlmacenamiento):
                _almacenamiento().enlace_firmado('e/u/acta.pdf')
