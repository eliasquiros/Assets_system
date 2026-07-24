# Diccionario de Datos — Sistema de Gestión de Activos Fijos

Este documento explica cada tabla y cada atributo del esquema físico definido en `db/schema.sql`, y justifica las decisiones de diseño contra los requerimientos (`RF-XXX`, `RL-XXX`, `RS-XXX`, `RP-XXX`, en `docs/Requerimientos.md`), las reglas de negocio (`RN-XXX`, en `docs/Reglas_negocio.md`) y las decisiones de arquitectura (`DAXX`, en `docs/arquitectura/Decisiones_arquitectura.md`).

## Cómo leer este documento

El sistema es multi-tenant por schema de PostgreSQL (DA01): existe un schema **público** compartido con una sola tabla (`empresa`), y cada empresa cliente tiene su propio schema físico con una copia idéntica de las demás tablas. No hay columna `empresa_id` en ninguna tabla de negocio — el aislamiento lo garantiza el motor de base de datos separando físicamente los datos por schema, no una relación lógica (RS-002).

Todo tipo de dato, restricción y motivo de diseño aquí descrito corresponde exactamente a lo implementado en `db/schema.sql`.

---

## Schema público

### `empresa`

| Atributo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `BIGSERIAL` | PK | |
| `nombre` | `VARCHAR(200)` | NOT NULL | Razón social de la empresa cliente |
| `schema_name` | `VARCHAR(63)` | NOT NULL, UNIQUE | Nombre físico del schema de PostgreSQL (límite de 63 por ser el máximo de un identificador de Postgres) |
| `activa` | `BOOLEAN` | NOT NULL, default `true` | Baja lógica del cliente, nunca se borra la fila |
| `fecha_alta` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |

**Por qué existe y por qué está en el schema público.** El sistema necesita saber a qué empresa pertenece una solicitud *antes* de poder decidir a qué schema dirigirla — por definición esa información no puede vivir dentro del schema de ninguna empresa individual (DA02). `schema_name` es la base del enrutamiento de `django-tenants` (DA01), que a su vez es la pieza que sostiene RS-002 (aislamiento total entre empresas) y RP-003 (que el rendimiento de una empresa no dependa de cuántas otras usan el sistema).

### `domain`

| Atributo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `BIGSERIAL` | PK | |
| `domain` | `VARCHAR(253)` | NOT NULL, UNIQUE | Subdominio completo de la empresa (ej. `acme.sistema.com`), usado para enrutar cada solicitud a su schema |
| `tenant_id` | `BIGINT` | NOT NULL, FK → `empresa.id` | Empresa a la que pertenece este dominio |
| `is_primary` | `BOOLEAN` | NOT NULL, default `true` | Dominio principal de la empresa (django-tenants admite varios por tenant) |

**Por qué existe como tabla propia y no como columna de `empresa`.** DA16 decidió que cada empresa recibe un subdominio propio bajo un único dominio de marca (ej. `acme.sistema.com`), resuelto vía DNS wildcard, en vez de un dominio único con un selector de empresa previo al login. `django-tenants` exige modelar el dominio como tabla separada (`TENANT_DOMAIN_MODEL`) para poder soportar varios dominios por tenant; el middleware resuelve el schema directamente a partir del header `Host` de cada petición contra esta tabla — no hace falta ningún endpoint público adicional de "resolución de empresa", que sería una superficie de ataque nueva a proteger.

---

## Schema por empresa

*(se repite idéntico, con datos propios, en el schema de cada empresa cliente)*

### `usuario`

| Atributo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `BIGSERIAL` | PK | |
| `username` | `VARCHAR(150)` | NOT NULL, UNIQUE | |
| `password_hash` | `VARCHAR(255)` | NOT NULL | Nunca la contraseña en texto plano |
| `activo` | `BOOLEAN` | NOT NULL, default `true` | Desactivación lógica, nunca se borra el usuario |
| `fecha_creacion` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |
| `ultimo_acceso` | `TIMESTAMPTZ` | NULL | |

**Por qué existe.** Sostiene RF-006 (inicio de sesión) y RS-001 (manejo seguro de contraseñas: `password_hash` guarda el resultado de un algoritmo de hash reconocido, nunca la contraseña en sí). Vive dentro del schema de su propia empresa, no en una tabla global, para reforzar el aislamiento de DA01 en lugar de introducir una excepción a esa regla (DA03).

**Por qué no tiene `nombre_completo` ni `email`.** Decisión explícita de producto: el MVP no los necesita para ninguno de los requerimientos funcionales actuales, y cada campo de dato personal adicional que se guarde aumenta el alcance de RL-002 (Ley 8968 de protección de datos personales). Se agregan solo si un requerimiento futuro los justifica.

**Por qué no se permite borrar usuarios (`ON DELETE RESTRICT` desde `movimiento` y `retiro`).** Un usuario puede ser el responsable histórico de eventos en `movimiento` o `retiro`. Si se pudiera borrar, esas filas quedarían huérfanas o —peor— se borrarían en cascada, destruyendo historial protegido por RL-001 y RF-007.2. Por eso el ciclo de vida correcto es desactivar (`activo = false`), nunca eliminar.

---

### `catalogo_localizaciones`

| Atributo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `BIGSERIAL` | PK | |
| `nombre` | `VARCHAR(150)` | NOT NULL, único normalizado (ver abajo) | Ej. "Bodega Central" |
| `descripcion` | `TEXT` | NULL | |
| `activa` | `BOOLEAN` | NOT NULL, default `true` | |

**Por qué existe como catálogo y no como texto libre.** RF-001.1 define "área" como una ubicación/unidad organizativa definida libremente por cada empresa. Modelarla como catálogo (en vez de un campo de texto en `activo`) es lo que permite que RF-003.1 (filtrar y agrupar por área) y RF-003.2 (totales por área) den resultados consistentes: un texto libre repetido con pequeñas variaciones fragmentaría esos totales.

**Por qué el índice único es sobre `lower(btrim(nombre))` y no sobre `nombre`.** Un `UNIQUE(nombre)` plano en Postgres distingue mayúsculas y espacios: "Bodega Central", "bodega central" y "Bodega Central " serían tres valores distintos y permitidos. Con varios usuarios creando áreas de forma independiente, eso produce catálogos duplicados con el tiempo, y ese duplicado rompe justo el requerimiento que la tabla existe para sostener (RF-003.2). El índice funcional cierra esa puerta a nivel de motor.

---

### `catalogo_proveedores`

| Atributo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `BIGSERIAL` | PK | |
| `nombre` | `VARCHAR(200)` | NOT NULL, único normalizado | |
| `activo` | `BOOLEAN` | NOT NULL, default `true` | |

**Por qué existe.** No corresponde a ningún requerimiento funcional explícito (no aparece en RF-001 a RF-007); es una normalización propuesta para trazabilidad de compras. Se decidió mantenerlo como catálogo separado (en vez de omitirlo) porque, si se incluye, debe seguir la misma regla que el resto de catálogos: nunca texto libre repetido en `activo`. Se simplificó a solo `nombre`/`activo`: `identificacion_fiscal` y `contacto` se quitaron por no ser necesarios para ningún requerimiento actual; si se necesitan más adelante (ej. para el reporte de auditoría), se agregan como columnas nuevas sin afectar el resto del esquema.

---

### `catalogo_categorias`

| Atributo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `BIGSERIAL` | PK | |
| `nombre` | `VARCHAR(150)` | NOT NULL, único normalizado | |
| `descripcion` | `TEXT` | NULL | |
| `activa` | `BOOLEAN` | NOT NULL, default `true` | |

**Por qué existe.** Es el "tipo/categoría" de RF-001.1 (dato obligatorio al registrar un activo) y el segundo eje de filtrado de RF-003.1/RF-003.2.

---

### `catalogo_marcas` y `catalogo_modelos`

**`catalogo_marcas`**

| Atributo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `BIGSERIAL` | PK | |
| `nombre` | `VARCHAR(150)` | NOT NULL, único normalizado | |
| `activa` | `BOOLEAN` | NOT NULL, default `true` | |

**`catalogo_modelos`**

| Atributo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `BIGSERIAL` | PK | |
| `nombre` | `VARCHAR(150)` | NOT NULL | |
| `marca_id` | `BIGINT` | FK → `catalogo_marcas.id` ON DELETE RESTRICT, NOT NULL | Un modelo pertenece a una sola marca |
| `activa` | `BOOLEAN` | NOT NULL, default `true` | |
| — | — | UNIQUE(`marca_id`, `lower(btrim(nombre))`) | Un modelo no se repite dentro de la misma marca |
| — | — | UNIQUE(`id`, `marca_id`) | Clave compuesta, ver más abajo |

**Por qué `modelo` es un catálogo separado de `marca`, y no una columna de texto dentro de `marca` o dentro de `activo`.** Un modelo pertenece siempre a exactamente una marca — es una relación 1:N real (una marca tiene muchos modelos). Separarlos en dos catálogos, con `catalogo_modelos.marca_id` como FK, deja que la base de datos exprese esa jerarquía directamente, en vez de duplicar el nombre de la marca dentro de cada fila de modelo o depender de que la aplicación mantenga esa relación coherente por su cuenta.

**Por qué `catalogo_modelos` tiene una clave única compuesta `(id, marca_id)` además de su PK simple.** Es el mecanismo que permite que `activo` declare una **FK compuesta** `(modelo_id, marca_id) → catalogo_modelos(id, marca_id)` (ver la tabla `activo` más abajo). Sin esta clave compuesta, Postgres no permite que una FK apunte a esas dos columnas juntas.

---

### `catalogo_origenes`

| Atributo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `BIGSERIAL` | PK | |
| `nombre` | `VARCHAR(150)` | NOT NULL, único normalizado | |
| `activo` | `BOOLEAN` | NOT NULL, default `true` | |

**Por qué existe.** Es el "origen" de RF-001.1. Se implementó como catálogo (no como `enum` fijo) para mantener la misma consistencia que el resto de campos clasificatorios de `activo`; si en el futuro se confirma que el conjunto de orígenes es realmente fijo y no cambia nunca, este es el único catálogo donde valdría la pena reconsiderar un `enum` en vez de una tabla — queda como punto abierto, no cerrado por completo.

---

### `activo`

| Atributo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `BIGSERIAL` | PK | |
| `numero_activo` | `VARCHAR(50)` | NOT NULL, UNIQUE | RF-001.1 |
| `nombre` | `VARCHAR(200)` | NOT NULL | Nombre/descripción del activo |
| `costo_original` | `NUMERIC(14,2)` | NOT NULL, `CHECK > 0` | RN-001.6 |
| `fecha_adquisicion` | `DATE` | NOT NULL | Cuándo la empresa obtuvo el activo |
| `fecha_inicio` | `DATE` | NOT NULL, `CHECK ≥ fecha_adquisicion` | Cuándo comenzó a usarse; el cálculo de depreciación usa siempre esta fecha (RN-001.2, RF-001.2) |
| `vida_util_anios` | `INTEGER` | NOT NULL, `CHECK ≥ 0` | Ingresada a mano (RN-001.4). `0` es válido: registra un activo ya totalmente depreciado |
| `estado_depreciacion` | `VARCHAR(30)` | NOT NULL, `CHECK IN ('DEPRECIANDO','TOTALMENTE_DEPRECIADO')` | RN-001.7 |
| `valor_libros_actual` | `NUMERIC(14,2)` | NOT NULL, `CHECK ≥ 0` | Atajo de lectura (DA05) |
| `depreciacion_acumulada_actual` | `NUMERIC(14,2)` | NOT NULL, `CHECK ≥ 0` y `CHECK ≤ costo_original` | Atajo de lectura (DA05); el segundo `CHECK` implementa RN-001.6 directamente en el motor |
| `serie` | `VARCHAR(100)` | NULL | Número de serie físico |
| `factura` | `VARCHAR(100)` | NULL | Referencia de factura |
| `localizacion_id` | `BIGINT` | FK → `catalogo_localizaciones.id` ON DELETE RESTRICT, NOT NULL | |
| `categoria_id` | `BIGINT` | FK → `catalogo_categorias.id` ON DELETE RESTRICT, NOT NULL | |
| `marca_id` | `BIGINT` | FK → `catalogo_marcas.id` ON DELETE RESTRICT, NULL | |
| `modelo_id` | `BIGINT` | FK → `catalogo_modelos.id` ON DELETE RESTRICT, NULL | |
| `origen_id` | `BIGINT` | FK → `catalogo_origenes.id` ON DELETE RESTRICT, NULL | |
| `proveedor_id` | `BIGINT` | FK → `catalogo_proveedores.id` ON DELETE RESTRICT, NULL | |
| `fecha_creacion` | `TIMESTAMPTZ` | NOT NULL, default `now()` | |
| — | — | FK compuesta `(modelo_id, marca_id) → catalogo_modelos(id, marca_id)` ON DELETE RESTRICT | Ver justificación abajo |

**Por qué el activo nunca se elimina ni cambia de tabla al darse de baja.** DA11: debe seguir siendo consultable durante todo el plazo de retención legal (RL-001), debe aparecer en el reporte de auditoría con su historial completo (RF-004), y debe poder consultarse a cualquier fecha pasada, incluso anterior a su baja (RF-007.3). Por eso todas las FK que apuntan hacia `activo` (desde `movimiento` y `retiro`) usan `ON DELETE RESTRICT`: la base de datos impide borrar un activo que tenga historial, en vez de confiar solo en que la aplicación nunca lo intente.

**Por qué no existe un campo "pendiente de baja".** DA15: mezclar esa condición con `estado_depreciacion` introduciría un tercer valor no contemplado por RN-001.7. La condición de "pendiente de baja" se deriva, al momento de leer, de la existencia de una fila en `retiro` con `estado = 'PENDIENTE'` para ese activo.

**Por qué `marca_id` y `modelo_id` coexisten, con una FK compuesta encima.** Sin la FK compuesta, nada impedía guardar un `modelo_id` de la marca X junto con un `marca_id` que dijera Y — una combinación imposible que ningún reporte por marca (RF-003) podría detectar. La FK compuesta `(modelo_id, marca_id) → catalogo_modelos(id, marca_id)` obliga a que, si se informa un modelo, su marca coincida exactamente. Se mantiene además la FK simple `marca_id → catalogo_marcas.id` porque, por el comportamiento estándar de Postgres (`MATCH SIMPLE`), la FK compuesta *no se evalúa* cuando `modelo_id` es `NULL` — así se sigue permitiendo el caso legítimo de "se conoce la marca pero todavía no el modelo exacto".

**Por qué `valor_libros_actual` y `depreciacion_acumulada_actual` existen si `movimiento` ya tiene toda la información.** Son un atajo de lectura (DA05): recalcular desde el historial completo en cada consulta de un listado de miles de activos sería costoso frente al límite de 3 segundos de RP-001. El historial en `movimiento` sigue siendo la única fuente de verdad — estos dos campos son enteramente derivables de él. Como son una copia, existe el riesgo de que diverjan del historial si algún día se actualizan sin el `INSERT` correspondiente en `movimiento`; la mitigación (sin usar triggers, para no contradecir DA04) es una **reconciliación periódica**: el mismo cron diario que ya existe para avanzar estos campos con el paso del tiempo (DA06) debe, además, recalcular desde cero y comparar contra el valor guardado, alertando ante cualquier discrepancia.

---

### `retiro`

| Atributo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `BIGSERIAL` | PK | |
| `activo_id` | `BIGINT` | FK → `activo.id` ON DELETE RESTRICT, NOT NULL | |
| `motivo` | `VARCHAR(30)` | NOT NULL, `CHECK IN ('VENTA','DESECHO','ROBO_PERDIDA')` | RN-002.1 |
| `descripcion` | `TEXT` | NOT NULL | RN-002.2 |
| `fecha_efectiva` | `DATE` | NOT NULL | Corta la depreciación (RN-002.3), solo cuando el retiro se vuelve definitivo (DA14) |
| `archivo_respaldo` | `TEXT` | NOT NULL | Obligatorio para cualquier motivo (RN-002.2); enlace privado (RS-005) |
| `estado` | `VARCHAR(20)` | NOT NULL, default `'PENDIENTE'`, `CHECK IN ('PENDIENTE','REVERTIDA','DEFINITIVA')` | |
| `fecha_registro` | `TIMESTAMPTZ` | NOT NULL, default `now()` | Arranca el reloj de 2 días de gracia (RN-002.4) |
| `usuario_id` | `BIGINT` | FK → `usuario.id` ON DELETE RESTRICT, NOT NULL | RS-004 |
| — | — | Índice único parcial `(activo_id) WHERE estado <> 'REVERTIDA'` | Ver justificación abajo |

**Por qué `retiro` es una fila propia y no solo un evento dentro de `movimiento`.** RN-002.4 exige que la baja quede "pendiente" 2 días y pueda revertirse en ese plazo — es decir, exige que algo *mute*. RF-007.2 exige, al mismo tiempo, que `movimiento` sea permanente e inalterable. Modelar la baja únicamente dentro de `movimiento` pondría esas dos reglas en conflicto directo. Separarlas (DA12) permite que cada tabla cumpla su propia regla: `retiro` muta durante un plazo acotado por la regla de negocio misma; `movimiento` nunca muta.

**Por qué el índice único parcial solo excluye `REVERTIDA`.** La regla de negocio real es "a lo sumo un retiro *activo* (pendiente o definitivo) por activo a la vez" — un retiro revertido no cuenta, porque deja al activo libre para un futuro intento de baja. Por eso la relación `activo → retiro` es 1:N y no 1:1: un mismo activo puede acumular varios retiros a lo largo del tiempo (uno revertido, luego otro que sí prospera), y esta restricción es la que impide que dos retiros activos coexistan por error o por una condición de carrera al hacer doble clic en "dar de baja".

**Qué queda pendiente sobre esta tabla.** RN-002.6 exige que, una vez `DEFINITIVA`, ni la fila ni el archivo adjunto se puedan modificar. Hoy esa regla la hace cumplir solo la aplicación. La única forma de garantizarla también a nivel de motor es un trigger `BEFORE UPDATE` que rechace cualquier cambio si `OLD.estado` ya es `DEFINITIVA` o `REVERTIDA` — deliberadamente **no implementado todavía** en este esquema, por instrucción explícita, ya que introduce una excepción puntual a la preferencia de "cero lógica de negocio en la base de datos" que fija DA04 (esa decisión estaba acotada al cálculo de depreciación, no a guardas de integridad, pero la tensión es real y queda como decisión pendiente de tomar conscientemente).

---

### `movimiento`

| Atributo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `BIGSERIAL` | PK | |
| `activo_id` | `BIGINT` | FK → `activo.id` ON DELETE RESTRICT, NOT NULL | |
| `tipo_evento` | `VARCHAR(30)` | NOT NULL, `CHECK IN (...)` | Los 6 tipos de RF-007.1 |
| `valor_anterior` | `JSONB` | NULL, forma validada por `tipo_evento` | Ver tabla de formas abajo |
| `valor_nuevo` | `JSONB` | forma validada por `tipo_evento` | |
| `fecha_efectiva` | `DATE` | NOT NULL | Cuándo aplica realmente el cambio |
| `fecha_registro` | `TIMESTAMPTZ` | NOT NULL, default `now()` | Cuándo se registró en el sistema |
| `usuario_id` | `BIGINT` | FK → `usuario.id` ON DELETE RESTRICT, NOT NULL | Responsable del evento (RF-007.1, RS-004) |
| `retiro_id` | `BIGINT` | FK → `retiro.id` ON DELETE RESTRICT, NULL; `CHECK` NOT NULL cuando `tipo_evento ∈ {BAJA, REVERSION_BAJA}` | |

**Por qué existe una sola tabla de historial, compartida entre altas, cambios y bajas.** RS-004 pide explícitamente evitar construir dos sistemas de historial separados; DA10 lo resuelve con una única tabla de solo escritura donde tanto `activo` como `retiro` registran sus eventos relevantes, evitando que dos historiales paralelos puedan desincronizarse entre sí.

**Por qué `valor_anterior`/`valor_nuevo` son `JSONB` y no texto plano.** El historial de `movimiento` no es solo una bitácora para lectura humana: es la entrada del cálculo de depreciación (DA04, función pura reconstruible desde el historial) y de los reportes exportables a cualquier fecha de corte (RF-007.3, RF-004, RF-005). Extraer una cifra exacta desde un texto libre tipo "de ₡500,000 a ₡450,000" requiere parsear con regex, algo frágil para un sistema contable con retención legal de 4+ años (RL-001). `JSONB` permite leer el valor exacto y tipado directamente, y como los 6 tipos de evento tienen formas distintas (dinero, años, referencias a catálogos, snapshot completo en `ALTA`), una sola columna `JSONB` cubre esa heterogeneidad sin necesitar una tabla por tipo de evento.

**Forma del JSON por `tipo_evento`** (validada por el `CHECK ck_movimiento_forma_json` en `schema.sql`):

| `tipo_evento` | `valor_anterior` debe contener | `valor_nuevo` debe contener |
|---|---|---|
| `ALTA` | debe ser `NULL` | `costo_original`, `vida_util_anios`, `fecha_inicio`, `localizacion_id`, `categoria_id` |
| `CAMBIO_COSTO` | `costo_original` | `costo_original` |
| `CAMBIO_VIDA_UTIL` | `vida_util_anios` | `vida_util_anios` |
| `CAMBIO_AREA_TIPO` | `localizacion_id` y/o `categoria_id` | `localizacion_id` y/o `categoria_id` |
| `BAJA` | `estado_depreciacion` | `estado_depreciacion` |
| `REVERSION_BAJA` | `estado_depreciacion` | `estado_depreciacion` |

Convenciones: solo se incluyen las claves que realmente cambiaron (excepto `ALTA`, que es un snapshot inicial completo por no tener "antes"); los montos de dinero se guardan como texto con 2 decimales (ej. `"500000.00"`), nunca como número JSON, para no dejar que el redondeo binario de JSON contamine cifras contables; las referencias a catálogos van como `_id`, nunca el nombre embebido, porque los catálogos usan baja lógica y no borrado, así que el id sigue siendo válido para siempre.

**Por qué el `CHECK` de forma incluye un `ELSE FALSE` explícito.** Sin él, un `tipo_evento` fuera de los 6 esperados haría que el `CASE` devolviera `NULL`, y Postgres trata un `CHECK` que evalúa a `NULL` como si la fila *sí* cumpliera la restricción — dejando pasar filas mal formadas en silencio, justo en la única tabla del sistema donde un error de forma es irreparable después del hecho (no se puede editar, solo agregar una corrección nueva).

**Por qué `retiro_id` es obligatorio solo para `BAJA`/`REVERSION_BAJA`.** Es la única forma en que el motor de depreciación puede encontrar la fecha de corte de una baja definitiva consultando `movimiento` en vez de `retiro` directamente, evitando que `assets` dependa circularmente de `disposals` (DA13).

**Por qué esta tabla es de solo inserción y qué la hace cumplir.** RF-007.2 y RN-002.6 exigen inmutabilidad. Que el código de la aplicación "no ofrezca el botón de editar" no es una garantía suficiente para un historial con obligación legal de retención — un acceso directo a la base (consola de admin, script de mantenimiento) podría violarlo igual. Por eso, además de no declarar ningún camino de `UPDATE`/`DELETE` en la aplicación, `schema.sql` incluye (comentado, a activar cuando exista el rol de aplicación del entorno) la instrucción `REVOKE UPDATE, DELETE ON movimiento FROM <rol>` — la inmutabilidad queda garantizada por el motor de permisos de PostgreSQL, no solo por disciplina de código.

---

## Relaciones y cardinalidad

| Relación | Cardinalidad | Justificación |
|---|---|---|
| `empresa` — (todo el schema) | implícita por schema | DA01/DA03: aislamiento físico, sin FK |
| `catalogo_localizaciones` → `activo` | 1:N | Un área agrupa muchos activos |
| `catalogo_proveedores` → `activo` | 1:N | Un proveedor surte muchos activos |
| `catalogo_categorias` → `activo` | 1:N | Una categoría clasifica muchos activos |
| `catalogo_marcas` → `activo` | 1:N | Una marca aplica a muchos activos |
| `catalogo_marcas` → `catalogo_modelos` | 1:N | Una marca tiene muchos modelos |
| `catalogo_modelos` → `activo` | 1:N | Un modelo aplica a muchos activos |
| `catalogo_origenes` → `activo` | 1:N | Un origen aplica a muchos activos |
| `activo` → `movimiento` | 1:N | Un activo acumula muchos eventos a lo largo de su vida |
| `activo` → `retiro` | 1:N | Varias bajas en el tiempo (una revertida, luego otra definitiva); a lo sumo una activa a la vez |
| `usuario` → `movimiento` | 1:N | Un usuario es responsable de muchos eventos |
| `usuario` → `retiro` | 1:N | Un usuario registra muchas bajas |
| `retiro` → `movimiento` | 1:N | Una baja genera hasta 2 eventos inmutables (BAJA y, si aplica, REVERSION_BAJA) |

No existe ninguna relación N:M en el alcance actual del MVP — toda clasificación es "un activo → un valor de catálogo". Los candidatos a N:M (roles de usuario, múltiples adjuntos por baja) están fuera de alcance hoy.

---

## Restricciones de integridad aplicadas en este esquema

Cambios aplicados sobre el modelo lógico original, producto de una revisión de diseño enfocada en pérdida de datos, escalabilidad, duplicidad y anomalías:

1. **`ON DELETE RESTRICT` en todas las FK** hacia `activo`, `usuario`, `retiro` y los catálogos. Sin esto, un `DELETE` accidental sobre cualquiera de estas tablas podía arrastrar en cascada historial protegido por RL-001/RF-007.2, o dejar huérfanas filas referenciadas. Convierte un borrado accidental en un error de base de datos en vez de una pérdida silenciosa.
2. **`CHECK` de forma del JSON en `movimiento`**, según `tipo_evento`. Como `movimiento` es insert-only, un JSON mal formado sería irreparable; el `CHECK` es una segunda línea de defensa detrás de la validación de la aplicación.
3. **Política de `REVOKE UPDATE, DELETE` sobre `movimiento`** a nivel de rol de base de datos (documentada en `schema.sql`, a activar según el entorno). Convierte la inmutabilidad de RF-007.2 en una garantía del motor, no solo de la aplicación.
4. **FK compuesta `(modelo_id, marca_id)` en `activo`**, apoyada en `UNIQUE(id, marca_id)` en `catalogo_modelos`. Cierra una dependencia transitiva que antes permitía guardar un modelo y una marca inconsistentes entre sí.
5. **Índices únicos funcionales `lower(btrim(nombre))`** en los seis catálogos. Evita duplicados por mayúsculas/espacios que fragmentarían los totales por categoría/área que exige RF-003.2.

---

## Políticas operativas (no forman parte del DDL de tablas)

- **Reconciliación del atajo de lectura en `activo`.** `valor_libros_actual` y `depreciacion_acumulada_actual` (DA05) deben verificarse periódicamente contra un recálculo desde cero a partir de `movimiento`, aprovechando el cron diario ya existente (DA06), para detectar divergencias sin necesidad de un trigger (que contradiría DA04).
- **Convención de zona horaria.** Toda comparación de cierre de periodo fiscal (30 de setiembre, RF-007.3) y cualquier lógica sobre "qué día fue" opera exclusivamente sobre columnas `DATE` (`fecha_efectiva`), nunca derivando una fecha desde una columna `TIMESTAMPTZ` bajo una zona horaria implícita. Las columnas `TIMESTAMPTZ` (`fecha_registro`, `fecha_creacion`, `ultimo_acceso`) almacenan en UTC de forma nativa; la conversión a `America/Costa_Rica` ocurre solo en la capa de presentación y de reportes.

---

## Pendiente / fuera de alcance de este archivo

- **Trigger `BEFORE UPDATE` sobre `retiro`**, para impedir a nivel de motor cualquier cambio una vez que `estado` es `DEFINITIVA` o `REVERTIDA` (RN-002.6). Pospuesto por decisión explícita.
- **Índices de rendimiento**: `activo.localizacion_id`, `activo.categoria_id` (para RF-003, RP-001) y `movimiento(activo_id, fecha_efectiva)` (para RF-007.3, DA04). Pospuestos por decisión explícita; no afectan corrección, solo velocidad de consulta a medida que crece el volumen de datos.
- **Nombre real del rol de aplicación** para activar el `REVOKE` de la sección de políticas — depende del entorno de despliegue (Supabase/Django) y se define al provisionar cada ambiente.
- **`catalogo_origenes` como catálogo vs. `enum` fijo**: se implementó como catálogo por consistencia con el resto de campos clasificatorios; queda abierto si en el futuro se confirma que el conjunto de orígenes nunca cambia.
