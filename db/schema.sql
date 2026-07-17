-- =====================================================================
-- Sistema de Gestion de Activos Fijos
-- Esquema de base de datos -- PostgreSQL
-- =====================================================================
--
-- En produccion, la creacion real de cada schema de empresa la gestiona
-- django-tenants a traves de las migraciones de Django, no este archivo.
-- Este script sirve para (a) documentar la estructura fisica exacta que
-- deben producir esas migraciones, y (b) recrear rapidamente un schema
-- de empresa en desarrollo o pruebas.
--
-- Uso con psql (recomendado):
--   psql -v tenant_schema=empresa_demo -d nombre_bd -f schema.sql
--
-- Si se usa una herramienta sin soporte de variables psql (pgAdmin, DBeaver,
-- etc.), reemplazar manualmente ':tenant_schema' por el nombre real del
-- schema antes de ejecutar, o dejar el valor por defecto definido abajo.
--
-- Este script SI incluye: tablas, columnas, PK/FK, CHECK constraints,
-- indices unicos de integridad (no de rendimiento) y comentarios.
-- Este script NO incluye todavia (pendiente, decision explicita):
--   - Indices de rendimiento (activo.localizacion_id, activo.categoria_id,
--     movimiento(activo_id, fecha_efectiva)).
--   - Trigger de guardia sobre `retiro` que impida editarlo tras DEFINITIVA.
-- Ver la seccion "PENDIENTE" al final de este archivo y el diccionario de
-- datos para el detalle de por que se pospusieron.
-- =====================================================================


-- =====================================================================
-- SCHEMA PUBLICO
-- =====================================================================

DROP TABLE IF EXISTS public.empresa CASCADE;

CREATE TABLE public.empresa (
    id              BIGSERIAL       PRIMARY KEY,
    nombre          VARCHAR(200)    NOT NULL,
    schema_name     VARCHAR(63)     NOT NULL,
    dominio         VARCHAR(255)    NOT NULL,
    activa          BOOLEAN         NOT NULL DEFAULT TRUE,
    fecha_alta      TIMESTAMPTZ     NOT NULL DEFAULT now(),

    CONSTRAINT uq_empresa_schema_name UNIQUE (schema_name),
    CONSTRAINT uq_empresa_dominio UNIQUE (dominio)
);

COMMENT ON TABLE public.empresa IS
    'Registro de empresas cliente (tenants). Vive en el schema publico porque '
    'debe consultarse antes de saber a que schema de empresa dirigir cada '
    'solicitud (DA01, DA02). RS-002 exige aislamiento total entre empresas; '
    'ese aislamiento lo da el schema propio de cada una, no una columna aqui.';

COMMENT ON COLUMN public.empresa.schema_name IS
    'Nombre fisico del schema de PostgreSQL de esta empresa (usado por django-tenants).';

COMMENT ON COLUMN public.empresa.dominio IS
    'Dominio o identificador usado para enrutar cada solicitud a su schema (DA01).';


-- =====================================================================
-- SCHEMA POR EMPRESA (plantilla, se aplica una vez por cada empresa)
-- =====================================================================

\if :{?tenant_schema}
\else
    \set tenant_schema empresa_demo
\endif

CREATE SCHEMA IF NOT EXISTS :tenant_schema;
SET search_path TO :tenant_schema, public;

-- ---------------------------------------------------------------------
-- Drops (orden inverso a las dependencias, por si se recarga el schema)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS movimiento CASCADE;
DROP TABLE IF EXISTS retiro CASCADE;
DROP TABLE IF EXISTS activo CASCADE;
DROP TABLE IF EXISTS catalogo_modelos CASCADE;
DROP TABLE IF EXISTS catalogo_origenes CASCADE;
DROP TABLE IF EXISTS catalogo_marcas CASCADE;
DROP TABLE IF EXISTS catalogo_categorias CASCADE;
DROP TABLE IF EXISTS catalogo_proveedores CASCADE;
DROP TABLE IF EXISTS catalogo_localizaciones CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;


-- ---------------------------------------------------------------------
-- usuario
-- ---------------------------------------------------------------------
CREATE TABLE usuario (
    id              BIGSERIAL       PRIMARY KEY,
    username        VARCHAR(150)    NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    activo          BOOLEAN         NOT NULL DEFAULT TRUE,
    fecha_creacion  TIMESTAMPTZ     NOT NULL DEFAULT now(),
    ultimo_acceso   TIMESTAMPTZ,

    CONSTRAINT uq_usuario_username UNIQUE (username)
);

COMMENT ON TABLE usuario IS
    'Usuarios con acceso al sistema, aislados dentro del schema de su propia '
    'empresa (DA03). Sostiene RF-006 (inicio de sesion) y RS-001 (contrasenas '
    'nunca en texto plano: password_hash guarda el resultado de un hash '
    'seguro, nunca la contrasena en si). No guarda nombre completo ni correo '
    'por decision explicita de producto: el MVP no los necesita.';

COMMENT ON COLUMN usuario.password_hash IS
    'Resultado de un hash seguro (ej. PBKDF2/Argon2), nunca la contrasena en texto plano (RS-001).';


-- ---------------------------------------------------------------------
-- catalogo_localizaciones
-- ---------------------------------------------------------------------
CREATE TABLE catalogo_localizaciones (
    id              BIGSERIAL       PRIMARY KEY,
    nombre          VARCHAR(150)    NOT NULL,
    descripcion     TEXT,
    activa          BOOLEAN         NOT NULL DEFAULT TRUE
);

-- Indice unico de integridad (evita duplicados por mayusculas/espacios,
-- ej. "Bodega Central" vs "bodega central "). No es un indice de
-- rendimiento; ver diccionario de datos, seccion de restricciones.
CREATE UNIQUE INDEX uq_localizacion_nombre_norm
    ON catalogo_localizaciones (lower(btrim(nombre)));

COMMENT ON TABLE catalogo_localizaciones IS
    'Catalogo cerrado de areas/ubicaciones internas de la empresa (ej. '
    '"Bodega Central"). RF-001.1 define el concepto de "area"; se modela '
    'como catalogo propio y no como texto libre para sostener el filtrado '
    'y los totales por area que exige RF-003.';


-- ---------------------------------------------------------------------
-- catalogo_proveedores
-- ---------------------------------------------------------------------
CREATE TABLE catalogo_proveedores (
    id                      BIGSERIAL       PRIMARY KEY,
    nombre                  VARCHAR(200)    NOT NULL,
    activo                  BOOLEAN         NOT NULL DEFAULT TRUE
);

CREATE UNIQUE INDEX uq_proveedor_nombre_norm
    ON catalogo_proveedores (lower(btrim(nombre)));

COMMENT ON TABLE catalogo_proveedores IS
    'Catalogo de proveedores que suministraron los activos. No corresponde '
    'a un requerimiento funcional explicito (no aparece en RF-001..RF-007); '
    'se incluye como catalogo propio, separado, para normalizar la '
    'trazabilidad de compras sin acoplarla a activo con texto libre.';


-- ---------------------------------------------------------------------
-- catalogo_categorias
-- ---------------------------------------------------------------------
CREATE TABLE catalogo_categorias (
    id              BIGSERIAL       PRIMARY KEY,
    nombre          VARCHAR(150)    NOT NULL,
    descripcion     TEXT,
    activa          BOOLEAN         NOT NULL DEFAULT TRUE
);

CREATE UNIQUE INDEX uq_categoria_nombre_norm
    ON catalogo_categorias (lower(btrim(nombre)));

COMMENT ON TABLE catalogo_categorias IS
    'Catalogo cerrado de tipo/categoria de activo. RF-001.1 (dato obligatorio '
    'al registrar) y RF-003.1 (filtrado y totales por tipo).';


-- ---------------------------------------------------------------------
-- catalogo_marcas
-- ---------------------------------------------------------------------
CREATE TABLE catalogo_marcas (
    id              BIGSERIAL       PRIMARY KEY,
    nombre          VARCHAR(150)    NOT NULL,
    activa          BOOLEAN         NOT NULL DEFAULT TRUE
);

CREATE UNIQUE INDEX uq_marca_nombre_norm
    ON catalogo_marcas (lower(btrim(nombre)));

COMMENT ON TABLE catalogo_marcas IS
    'Catalogo de marcas de activos (RF-001.1). Separado de catalogo_modelos '
    'a proposito: una marca tiene muchos modelos (1:N), ver catalogo_modelos.';


-- ---------------------------------------------------------------------
-- catalogo_modelos
-- ---------------------------------------------------------------------
CREATE TABLE catalogo_modelos (
    id              BIGSERIAL       PRIMARY KEY,
    nombre          VARCHAR(150)    NOT NULL,
    marca_id        BIGINT          NOT NULL REFERENCES catalogo_marcas(id) ON DELETE RESTRICT,
    activa          BOOLEAN         NOT NULL DEFAULT TRUE,

    -- Clave compuesta (ademas de la PK simple): necesaria para que
    -- `activo` pueda referenciar (modelo_id, marca_id) como FK compuesta
    -- y asi la base de datos garantice que la marca de un activo coincide
    -- siempre con la marca real de su modelo.
    CONSTRAINT uq_modelo_id_marca UNIQUE (id, marca_id)
);

CREATE UNIQUE INDEX uq_modelo_marca_nombre_norm
    ON catalogo_modelos (marca_id, lower(btrim(nombre)));

COMMENT ON TABLE catalogo_modelos IS
    'Catalogo de modelos, cada uno asociado a una unica marca (1:N marca -> '
    'modelo). Se separo de catalogo_marcas para evitar la dependencia '
    'transitiva marca-modelo dentro de activo; ver la FK compuesta '
    'fk_activo_modelo_marca en la tabla activo.';


-- ---------------------------------------------------------------------
-- catalogo_origenes
-- ---------------------------------------------------------------------
CREATE TABLE catalogo_origenes (
    id              BIGSERIAL       PRIMARY KEY,
    nombre          VARCHAR(150)    NOT NULL,
    activo          BOOLEAN         NOT NULL DEFAULT TRUE
);

CREATE UNIQUE INDEX uq_origen_nombre_norm
    ON catalogo_origenes (lower(btrim(nombre)));

COMMENT ON TABLE catalogo_origenes IS
    'Catalogo del origen del activo (ej. compra, donacion). RF-001.1.';


-- ---------------------------------------------------------------------
-- activo
-- ---------------------------------------------------------------------
CREATE TABLE activo (
    id                              BIGSERIAL       PRIMARY KEY,
    numero_activo                   VARCHAR(50)     NOT NULL,
    nombre                          VARCHAR(200)    NOT NULL,
    costo_original                  NUMERIC(14,2)   NOT NULL,
    fecha_adquisicion               DATE            NOT NULL,
    fecha_inicio                    DATE            NOT NULL,
    vida_util_anios                 INTEGER         NOT NULL,
    estado_depreciacion             VARCHAR(30)     NOT NULL,
    valor_libros_actual             NUMERIC(14,2)   NOT NULL,
    depreciacion_acumulada_actual   NUMERIC(14,2)   NOT NULL,
    serie                           VARCHAR(100),
    factura                         VARCHAR(100),
    localizacion_id                 BIGINT          NOT NULL REFERENCES catalogo_localizaciones(id) ON DELETE RESTRICT,
    categoria_id                    BIGINT          NOT NULL REFERENCES catalogo_categorias(id) ON DELETE RESTRICT,
    marca_id                        BIGINT          REFERENCES catalogo_marcas(id) ON DELETE RESTRICT,
    modelo_id                       BIGINT          REFERENCES catalogo_modelos(id) ON DELETE RESTRICT,
    origen_id                       BIGINT          REFERENCES catalogo_origenes(id) ON DELETE RESTRICT,
    proveedor_id                    BIGINT          REFERENCES catalogo_proveedores(id) ON DELETE RESTRICT,
    fecha_creacion                  TIMESTAMPTZ     NOT NULL DEFAULT now(),

    CONSTRAINT uq_activo_numero_activo UNIQUE (numero_activo),
    CONSTRAINT ck_activo_costo_original_positivo CHECK (costo_original > 0),
    CONSTRAINT ck_activo_fecha_inicio_valida CHECK (fecha_inicio >= fecha_adquisicion),
    CONSTRAINT ck_activo_vida_util_positiva CHECK (vida_util_anios > 0),
    CONSTRAINT ck_activo_estado_depreciacion CHECK (
        estado_depreciacion IN ('DEPRECIANDO', 'TOTALMENTE_DEPRECIADO')
    ),
    CONSTRAINT ck_activo_valor_libros_no_negativo CHECK (valor_libros_actual >= 0),
    CONSTRAINT ck_activo_depreciacion_acumulada_no_negativa CHECK (depreciacion_acumulada_actual >= 0),
    CONSTRAINT ck_activo_depreciacion_no_supera_costo CHECK (depreciacion_acumulada_actual <= costo_original),

    -- FK compuesta: si se informa modelo_id, su marca real debe coincidir
    -- con marca_id (MATCH SIMPLE por defecto: si modelo_id es NULL esta
    -- restriccion no aplica, permitiendo "marca conocida, modelo aun no").
    CONSTRAINT fk_activo_modelo_marca FOREIGN KEY (modelo_id, marca_id)
        REFERENCES catalogo_modelos (id, marca_id) ON DELETE RESTRICT
);

COMMENT ON TABLE activo IS
    'Tabla nucleo: activos fijos de la empresa (RF-001). Nunca se elimina ni '
    'cambia de tabla al darse de baja (DA11); su condicion de "pendiente de '
    'baja" NO se guarda aqui, se deriva de la existencia de un retiro '
    'pendiente (DA15), para no mezclarla con estado_depreciacion (RN-001.7).';

COMMENT ON COLUMN activo.fecha_inicio IS
    'Fecha real de inicio de uso; el calculo de depreciacion siempre usa '
    'esta fecha, nunca fecha_adquisicion (RN-001.2). No puede ser anterior '
    'a fecha_adquisicion (RF-001.2).';

COMMENT ON COLUMN activo.valor_libros_actual IS
    'Atajo de lectura derivado del historial en movimiento, no fuente de '
    'verdad (DA05). Se reconcilia periodicamente contra movimiento; ver '
    'politica operativa en el diccionario de datos.';

COMMENT ON COLUMN activo.depreciacion_acumulada_actual IS
    'Atajo de lectura derivado del historial (DA05). Nunca puede superar '
    'costo_original (RN-001.6); ver ck_activo_depreciacion_no_supera_costo.';

COMMENT ON CONSTRAINT fk_activo_modelo_marca ON activo IS
    'Evita que un activo quede con un modelo de una marca y un marca_id de otra.';


-- ---------------------------------------------------------------------
-- retiro
-- ---------------------------------------------------------------------
CREATE TABLE retiro (
    id                  BIGSERIAL       PRIMARY KEY,
    activo_id           BIGINT          NOT NULL REFERENCES activo(id) ON DELETE RESTRICT,
    motivo              VARCHAR(30)     NOT NULL,
    descripcion         TEXT            NOT NULL,
    fecha_efectiva      DATE            NOT NULL,
    archivo_respaldo    TEXT            NOT NULL,
    estado              VARCHAR(20)     NOT NULL DEFAULT 'PENDIENTE',
    fecha_registro      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    usuario_id          BIGINT          NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,

    CONSTRAINT ck_retiro_motivo CHECK (motivo IN ('VENTA', 'DESECHO', 'ROBO_PERDIDA')),
    CONSTRAINT ck_retiro_estado CHECK (estado IN ('PENDIENTE', 'REVERTIDA', 'DEFINITIVA'))
);

-- A lo sumo un retiro "activo" (no revertido) por activo a la vez.
-- Esta restriccion ya formaba parte del diseno original (RN-002.4/DA12),
-- no es uno de los indices de rendimiento pospuestos.
CREATE UNIQUE INDEX uq_retiro_activo_no_revertido
    ON retiro (activo_id)
    WHERE estado <> 'REVERTIDA';

COMMENT ON TABLE retiro IS
    'Baja de un activo. Fila propia y mutable unicamente durante el periodo '
    'de gracia de 2 dias (RN-002.4, DA12). Una vez DEFINITIVA, RN-002.6 '
    'exige que ya no cambie ni se borre; esa garantia requeriria un trigger '
    'BEFORE UPDATE que aun no esta implementado (ver seccion PENDIENTE). '
    'archivo_respaldo es obligatorio para cualquier motivo (RN-002.2).';

COMMENT ON COLUMN retiro.fecha_efectiva IS
    'Fecha real en que se perdio el uso/control del activo. La depreciacion '
    'se corta desde esta fecha, no desde fecha_registro (RN-002.3), y solo '
    'cuando el retiro pasa a DEFINITIVA (DA14).';

COMMENT ON COLUMN retiro.estado IS
    'PENDIENTE al crearse; puede pasar a REVERTIDA dentro del periodo de '
    'gracia, o a DEFINITIVA una vez transcurrido (RN-002.4).';


-- ---------------------------------------------------------------------
-- movimiento
-- ---------------------------------------------------------------------
CREATE TABLE movimiento (
    id              BIGSERIAL       PRIMARY KEY,
    activo_id       BIGINT          NOT NULL REFERENCES activo(id) ON DELETE RESTRICT,
    tipo_evento     VARCHAR(30)     NOT NULL,
    valor_anterior  JSONB,
    valor_nuevo     JSONB,
    fecha_efectiva  DATE            NOT NULL,
    fecha_registro  TIMESTAMPTZ     NOT NULL DEFAULT now(),
    usuario_id      BIGINT          NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    retiro_id       BIGINT          REFERENCES retiro(id) ON DELETE RESTRICT,

    CONSTRAINT ck_movimiento_tipo_evento CHECK (
        tipo_evento IN (
            'ALTA', 'CAMBIO_COSTO', 'CAMBIO_VIDA_UTIL',
            'CAMBIO_AREA_TIPO', 'BAJA', 'REVERSION_BAJA'
        )
    ),

    -- Valida que la forma del JSON corresponda al tipo_evento (item 2 de
    -- la revision de esquema). El ELSE FALSE es deliberado: sin el, un
    -- tipo_evento inesperado haria que el CASE devolviera NULL, y Postgres
    -- trata NULL como "la fila SI cumple el CHECK", lo que dejaria pasar
    -- filas mal formadas en silencio.
    CONSTRAINT ck_movimiento_forma_json CHECK (
        CASE
            WHEN tipo_evento = 'ALTA' THEN
                valor_anterior IS NULL
                AND valor_nuevo ?& ARRAY['costo_original', 'vida_util_anios', 'fecha_inicio', 'localizacion_id', 'categoria_id']
            WHEN tipo_evento = 'CAMBIO_COSTO' THEN
                valor_anterior ? 'costo_original' AND valor_nuevo ? 'costo_original'
            WHEN tipo_evento = 'CAMBIO_VIDA_UTIL' THEN
                valor_anterior ? 'vida_util_anios' AND valor_nuevo ? 'vida_util_anios'
            WHEN tipo_evento = 'CAMBIO_AREA_TIPO' THEN
                (valor_anterior ? 'localizacion_id' OR valor_anterior ? 'categoria_id')
                AND (valor_nuevo ? 'localizacion_id' OR valor_nuevo ? 'categoria_id')
            WHEN tipo_evento IN ('BAJA', 'REVERSION_BAJA') THEN
                valor_anterior ? 'estado_depreciacion' AND valor_nuevo ? 'estado_depreciacion'
                AND retiro_id IS NOT NULL
            ELSE FALSE
        END
    )
);

COMMENT ON TABLE movimiento IS
    'Historial inmutable de todo evento que afecta el valor o clasificacion '
    'de un activo (RF-007.1). Unica fuente de verdad para el calculo de '
    'depreciacion (DA04) y para reconstruir el estado a una fecha pasada '
    '(RF-007.3). Solo INSERT: ver politica de acceso al final de este '
    'archivo (REVOKE UPDATE, DELETE), que sostiene RF-007.2 y RS-004.';

COMMENT ON COLUMN movimiento.valor_anterior IS
    'JSON con la forma correspondiente a tipo_evento (ver ck_movimiento_forma_json '
    'y el diccionario de datos). NULL unicamente cuando tipo_evento = ALTA.';

COMMENT ON COLUMN movimiento.retiro_id IS
    'Solo se informa cuando tipo_evento es BAJA o REVERSION_BAJA. El motor '
    'de depreciacion lee la fecha de corte desde aqui, nunca desde retiro '
    'directamente, para evitar una dependencia circular entre assets y '
    'disposals (DA13).';

RESET search_path;


-- =====================================================================
-- POLITICA DE ACCESO -- Inmutabilidad de `movimiento`
-- =====================================================================
-- Descomentar y ajustar el nombre del rol una vez que exista el rol de
-- aplicacion en este entorno (ej. el rol con el que Django se conecta).
-- Deja movimiento en solo INSERT + SELECT a nivel de motor, no solo de
-- disciplina de la aplicacion (ver diccionario de datos, politica 3).
--
-- REVOKE UPDATE, DELETE ON :tenant_schema.movimiento FROM nombre_rol_aplicacion;


-- =====================================================================
-- PENDIENTE (decision explicita, no implementado en este archivo)
-- =====================================================================
-- 1. Trigger BEFORE UPDATE sobre `retiro` que rechace cambios cuando
--    OLD.estado ya sea DEFINITIVA o REVERTIDA (sostiene RN-002.6).
-- 2. Indices de rendimiento:
--      - activo.localizacion_id, activo.categoria_id (RF-003, RP-001)
--      - movimiento(activo_id, fecha_efectiva) (RF-007.3, DA04)
-- Ver docs/arquitectura y db/diccionario_datos.md para la justificacion
-- de por que se posponen y cuando conviene retomarlos.
