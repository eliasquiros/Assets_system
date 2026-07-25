"""Bajas / retiros de activos (RN-002, DA11-DA15).

Expone el contrato que ya consume el frontend de historial (frontend/src/api/
bajas.js, views/historial/*):

    GET  /api/bajas/                -> lista de bajas (mas reciente primero)
    POST /api/bajas/                -> registra una baja (multipart, con archivo)
    POST /api/bajas/<id>/revertir/  -> revierte una baja dentro del periodo de gracia

Autenticacion/permiso heredados de la config global (CookieJWTAuthentication +
IsAuthenticated); el aislamiento entre empresas lo da el schema fijado por
TenantMainMiddleware antes de llegar aca, igual que el resto de vistas.

Cada operacion escribe en una sola transaccion la fila `retiro` y su `movimiento`
correspondiente (BAJA / REVERSION_BAJA), como hace la edicion de activos. El
corte de depreciacion NO se aplica al registrar: solo cuando la baja se vuelve
DEFINITIVA (DA14), lo cual hace la tarea programada `promover_retiros_definitivos`.
"""
from datetime import date, timedelta

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Activo, Movimiento, Retiro

# Periodo de gracia antes de que una baja sea definitiva (RN-002.4).
GRACIA = timedelta(days=2)

# El frontend envia el motivo como etiqueta en espanol; se acepta tambien el
# codigo directo por robustez. Ambos se normalizan al codigo del modelo.
_MAPA_MOTIVO = {etiqueta: codigo for codigo, etiqueta in Retiro.MOTIVO_CHOICES}
_MAPA_MOTIVO.update({codigo: codigo for codigo, _ in Retiro.MOTIVO_CHOICES})


def _vence_ts(retiro):
    """Fin del periodo de gracia en epoch ms: mueve el contador de la BajaCard."""
    vence = retiro.fecha_registro + GRACIA
    return int(vence.timestamp() * 1000)


def serializar_retiro(retiro):
    """Emite el objeto EXACTO que consumen BajaCard/HistorialView/RevertModal:
    `estado` en Title Case, `motivo` como etiqueta legible, fechas ISO y
    `venceTs` (epoch ms) para el contador del periodo de gracia."""
    return {
        'id': retiro.id,
        'activoNum': retiro.activo.numero_activo,
        'activoNombre': retiro.activo.nombre,
        'motivo': retiro.get_motivo_display(),
        'desc': retiro.descripcion,
        'estado': retiro.get_estado_display(),  # 'Pendiente'|'Revertida'|'Definitiva'
        'fechaEfectiva': retiro.fecha_efectiva.isoformat(),
        'fechaRegistro': retiro.fecha_registro.isoformat(),
        'user': retiro.usuario.username,
        'venceTs': _vence_ts(retiro),
    }


class RetiroListCreateView(APIView):
    """GET lista de bajas del schema actual; POST registra una nueva baja."""
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        retiros = Retiro.objects.select_related('activo', 'usuario').all()
        return Response([serializar_retiro(r) for r in retiros])

    def post(self, request):
        datos = request.data

        activo_num = (datos.get('activoNum') or '').strip()
        motivo_raw = (datos.get('motivo') or '').strip()
        descripcion = (datos.get('desc') or '').strip()
        fecha_raw = (datos.get('fechaEfectiva') or '').strip()
        archivo = request.FILES.get('archivo')

        errores = {}
        if not activo_num:
            errores['activoNum'] = 'Selecciona un activo.'
        motivo = _MAPA_MOTIVO.get(motivo_raw)
        if not motivo:
            errores['motivo'] = 'Selecciona un motivo válido.'
        if not descripcion:
            errores['desc'] = 'Ingresa una descripción.'
        fecha_efectiva = None
        if not fecha_raw:
            errores['fechaEfectiva'] = 'Ingresa la fecha efectiva.'
        else:
            try:
                fecha_efectiva = date.fromisoformat(fecha_raw)
            except ValueError:
                errores['fechaEfectiva'] = 'Fecha inválida.'
            else:
                if fecha_efectiva > date.today():
                    errores['fechaEfectiva'] = 'La fecha efectiva no puede ser futura.'
        if archivo is None:
            errores['archivo'] = 'Adjunta un archivo de respaldo.'
        if errores:
            return Response(errores, status=status.HTTP_400_BAD_REQUEST)

        activo = Activo.objects.filter(numero_activo=activo_num).first()
        if activo is None:
            return Response(
                {'activoNum': 'Activo no encontrado.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # A lo sumo una baja "activa" (no revertida) por activo (RN-002.4/DA12).
        # El indice unico parcial lo garantiza; aqui damos un mensaje claro.
        if activo.retiros.exclude(estado=Retiro.REVERTIDA).exists():
            return Response(
                {'activoNum': 'El activo ya tiene una baja registrada.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            retiro = Retiro.objects.create(
                activo=activo, motivo=motivo, descripcion=descripcion,
                fecha_efectiva=fecha_efectiva, archivo_respaldo=archivo,
                usuario=request.user,
            )
            # Movimiento BAJA: registra el evento en el historial inmutable. El
            # estado_depreciacion no cambia todavia (el corte se aplica al pasar
            # a DEFINITIVA, DA14); se guarda el estado actual en ambos lados.
            Movimiento.objects.create(
                activo=activo, tipo_evento=Movimiento.BAJA,
                fecha_efectiva=fecha_efectiva, usuario=request.user, retiro=retiro,
                valor_anterior={'estado_depreciacion': activo.estado_depreciacion},
                valor_nuevo={'estado_depreciacion': activo.estado_depreciacion},
                nota=retiro.get_motivo_display(),
            )

        return Response(serializar_retiro(retiro), status=status.HTTP_201_CREATED)


class RetiroRevertirView(APIView):
    """POST /api/bajas/<id>/revertir/ — revierte una baja pendiente dentro de la
    gracia (RN-002.4). Deja el activo como vigente y registra REVERSION_BAJA."""

    def post(self, request, id):
        retiro = get_object_or_404(
            Retiro.objects.select_related('activo', 'usuario'), pk=id,
        )
        # Solo se revierte lo que sigue pendiente y dentro del periodo de gracia,
        # sin depender de que la tarea de promocion ya haya corrido (RN-002.4/.6).
        # Comparacion por instante exacto (timezone.now(), no date.today()): igual
        # criterio que usa promover_retiros_definitivos (fecha_registro + GRACIA),
        # para que este chequeo y la promocion definan el mismo limite al segundo.
        # Truncar a .date() dejaba revertir hasta casi 24h despues del vencimiento
        # real si el cron de promocion aun no habia corrido.
        vencido = timezone.now() >= retiro.fecha_registro + GRACIA
        if retiro.estado != Retiro.PENDIENTE or vencido:
            return Response(
                {'detail': 'La baja ya no puede revertirse.'},
                status=status.HTTP_409_CONFLICT,
            )

        with transaction.atomic():
            retiro.estado = Retiro.REVERTIDA
            retiro.save(update_fields=['estado'])
            Movimiento.objects.create(
                activo=retiro.activo, tipo_evento=Movimiento.REVERSION_BAJA,
                fecha_efectiva=date.today(), usuario=request.user, retiro=retiro,
                valor_anterior={'estado_depreciacion': retiro.activo.estado_depreciacion},
                valor_nuevo={'estado_depreciacion': retiro.activo.estado_depreciacion},
                nota='Reversión de la baja dentro del periodo de gracia.',
            )

        return Response(serializar_retiro(retiro))
