"""Trigger BEFORE UPDATE sobre `retiro` que impide editarlo tras cerrarse.

Sostiene RN-002.6 a nivel de motor (no solo de disciplina de la aplicacion):
una vez que un retiro es DEFINITIVA o REVERTIDA, su fila ya no puede cambiar. La
transicion valida (PENDIENTE -> DEFINITIVA/REVERTIDA) la hacen las vistas; este
trigger es el backstop que rechaza cualquier UPDATE sobre una fila ya cerrada.

Con django_tenants la migracion corre en cada schema de empresa, asi que la
funcion y el trigger quedan definidos dentro de cada schema (sin calificar).
"""
from django.db import migrations


CREAR_TRIGGER = """
CREATE OR REPLACE FUNCTION retiro_no_editable_tras_cierre()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado IN ('DEFINITIVA', 'REVERTIDA') THEN
        RAISE EXCEPTION
            'Un retiro % no puede modificarse ni eliminarse (RN-002.6).', OLD.estado
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_retiro_no_editable
    BEFORE UPDATE ON retiro
    FOR EACH ROW
    EXECUTE FUNCTION retiro_no_editable_tras_cierre();
"""

BORRAR_TRIGGER = """
DROP TRIGGER IF EXISTS trg_retiro_no_editable ON retiro;
DROP FUNCTION IF EXISTS retiro_no_editable_tras_cierre();
"""


class Migration(migrations.Migration):

    dependencies = [
        ('assets', '0007_retiro_movimiento_retiro_retiro_ck_retiro_motivo_and_more'),
    ]

    operations = [
        migrations.RunSQL(sql=CREAR_TRIGGER, reverse_sql=BORRAR_TRIGGER),
    ]
