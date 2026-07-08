# Requerimientos  Sistema de Gestión de Activos Fijos
 
## Introducción
 
Este documento traduce las reglas de negocio (`RN-001`, `RN-002`) y las necesidades planteadas por el Product Owner en requerimientos concretos: qué debe poder hacer el sistema, y bajo qué condiciones de seguridad, cumplimiento legal y rendimiento debe funcionar.
 
Cada requerimiento tiene un identificador (`RF-XXX` para funcionales, `RL-XXX` para legales, `RS-XXX` para seguridad, `RP-XXX` para rendimiento) para mantener trazabilidad hacia el backlog y el código.
 
Los puntos marcados como **Información importante** son detalles que se conciben fuera del requerimiento para no afectar el qué, sin embargo proporcionan información importante para su cumplimiento preciso.

Asimismo, los puntos marcados como **⚠️ Supuesto** son decisiones razonables que se tomaron en base a la información actual del proyecto, pero pueden variar a lo largo del ciclo de su desarrollo. 

---
 
## Requerimientos Funcionales
 
### RF-001: Registro de activos
 
**RF-001.1: Datos obligatorios al ingresar un activo**
El sistema debe permitir registrar un nuevo activo capturando, como mínimo: numero de activo,nombre/descripción del activo, costo original, valor en libros, depreciación acumulada fecha de adquisición, fecha de inicio de uso, vida útil (en años),estado del activo(Depreciando, totalmente depreciado), origen, área a la que pertenece, tipo/categoría del activo, serie, modelo, marca y factura. *(Referencia: RN-001.2, RN-001.4)*

**Información importante** el concepto de "área" se entiende como una ubicación o unidad organizativa interna definida libremente por cada empresa (ej. "Bodega Central", "Administración"), no una lista fija predefinida por el sistema. Confirmar si esto es correcto o si debe ser una lista cerrada.
 
**RF-001.2: Validaciones al registrar**
El sistema debe impedir guardar un activo si la fecha de inicio es anterior a la fecha de adquisición, o si falta cualquiera de los datos obligatorios listados en RF-001.1. *(Referencia: RN-001.2)*
 

 
---
 
### RF-002: Cálculo automático de depreciación
 
**RF-002.1: Cálculo sin intervención manual**
El sistema debe calcular la depreciación de cada activo automáticamente, sin que el usuario tenga que ejecutar la operación manualmente, aplicando el método y la precisión definidos en `RN-001`.

**RF-002.2: Consulta de depreciación a una fecha específica**
El usuario debe poder consultar cuánto se ha depreciado un activo y cuál es su valor en libros a una fecha determinada (por ejemplo, "al día de hoy" o "al cierre del mes pasado").
 
**RF-002.3: Valor en libros y depreciación acumulada visibles en el activo**
Cada activo debe mostrar en todo momento su valor en libros actual, su depreciación acumulada actual, y su estado ("depreciando" / "totalmente depreciado"), sin que el usuario tenga que solicitar un cálculo aparte. *(Referencia: RN-001.7)*

 
---
 
### RF-003: Visualización de activos por área o tipo

**RF-003.1: Filtro de visualización**
El sistema debe permitir al usuario filtrar y visualizar el listado de activos agrupados o filtrados por área y por tipo/categoría de activo.

**RF-003.2: Datos para análisis**
El sistema debe permitir ver el total de activos por valor monetario y por cantidad de activos por cada filtro.(ej. "valor total de activos en Bodega Central", cantidad activos : 40). 

 
---
 
### RF-004: Reporte de activos para auditoría

**RF-004.1: Exportación de reporte de auditoria**
El sistema debe generar un reporte exportable en formato xlsx con el listado completo de activos, incluyendo su historial relevante para revisión externa según los atributos establecidos para registrar un activo.  *(Referencia: RN-002.2, RN-002.6)*
 
---
 
### RF-005: Reporte de activos para información financiera

**RF-005.1: Exportación de reporte financiero**
El sistema debe generar un reporte con el valor en libros y la depreciación acumulada de todos los activos activos (no dados de baja), útil para la elaboración de estados financieros de la empresa.
 
> **Información importante:** este reporte se genera "a una fecha de corte" que el usuario elige (ej. fin de mes o fin de año), no solo "a hoy". 
 
---
 
### RF-006: Inicio de sesión (autenticación)

**RF-006.1: Inicio de sesión**
El sistema debe permitir que un usuario ingrese con su usuario y contraseña para acceder; no debe existir acceso a información de activos sin haber iniciado sesión previamente. *(Ver también RS-001, RS-002)*
 
### RF-007: Historial de movimientos de activos

**RF-007.1: Registro de eventos relevantes**
El sistema debe registrar, para cada activo, todo evento que afecte su valor o clasificación: alta, cambio de costo, cambio de vida útil, cambio de área/tipo, baja y reversión de baja. Cada registro debe indicar el valor anterior, el valor nuevo, la fecha en que el cambio aplica realmente, la fecha en que se registró en el sistema, y el usuario responsable.

**RF-007.2: Historial permanente e inalterable**
Ningún registro del historial puede editarse ni eliminarse una vez guardado. Si se necesita corregir algo, se agrega un nuevo registro que refleje la corrección, sin borrar el original. *(Referencia: RL-001, RN-002.6)*

**RF-007.3: Consulta de estado histórico y reportes por periodo**
El usuario debe poder consultar el estado y la depreciación de un activo en cualquier fecha pasada dentro del periodo fiscal actual, así como generar reportes (incluyendo exportación a Excel) con corte a cualquier fecha, incluyendo el cierre de un periodo fiscal (30 de setiembre). Estos reportes se generan a partir del historial de movimientos, no de archivos guardados aparte.

---
 
## Requerimientos Legales
 
**RL-001: Retención de historial contable**
El sistema debe conservar el historial completo de activos, depreciaciones y bajas por, al menos, el plazo de prescripción que establece el Código de Normas y Procedimientos Tributarios de Costa Rica.
 
> **Información importante:** el plazo establecido de vigencia de los activos según la legislación es de 4 años, por lo que se debe gestionar el almacenamiento para al menos ese tiempo.
 
**RL-002: Protección de datos personales**
Dado que el sistema almacena datos de usuarios (para el inicio de sesión) y podría almacenar datos personales adicionales en el futuro (ej. si se retoma el registro de comprador/beneficiario en bajas), debe cumplir con la Ley de Protección de la Persona frente al Tratamiento de sus Datos Personales (Ley 8968).
 
> ⚠️ **Pendiente:** definir formalmente, con asesoría legal, la política de privacidad, el propósito declarado de cada dato recolectado, y el mecanismo para que un usuario solicite acceso, corrección o eliminación de sus datos personales, antes de la comercialización del sistema.
 
---
 
## Requerimientos de Seguridad
 
**RS-001: Manejo seguro de contraseñas**
Las contraseñas de los usuarios nunca deben almacenarse en texto plano; deben protegerse mediante un mecanismo de cifrado/hash reconocido como seguro (o delegarse completamente a un proveedor de autenticación externo, como el que ya forma parte del stack del proyecto).
 
**RS-002: Aislamiento de datos entre empresas**
Un usuario de una empresa cliente nunca debe poder acceder, ver o modificar datos (activos, reportes, archivos) que pertenezcan a otra empresa cliente, bajo ninguna circunstancia, incluso ante errores de otras partes del sistema.
 
**RS-003: Comunicación cifrada**
Toda comunicación entre el navegador del usuario y el sistema debe viajar cifrada (HTTPS), sin excepción, incluso en ambientes de prueba.
 
**RS-004: Registro de acciones sensibles**
El sistema debe llevar un registro de quién realizó cada acción sensible y cuándo (ej. registrar un activo, dar de baja un activo, revertir una baja), de forma que ese historial no pueda alterarse posteriormente. *(Referencia: RN-002.6)*

*(Nota: este requisito se cumple mediante el mismo mecanismo descrito en RF-007, evitando construir dos sistemas de historial separados.)*
 
**RS-005: Protección de archivos adjuntos**
Los documentos de respaldo de una baja (facturas, denuncias, actas) deben almacenarse de forma privada, accesibles únicamente mediante enlaces temporales autorizados, nunca de forma pública o directa. *(Referencia: RN-002.2)*
 
**RS-006: Respaldo de datos**
El sistema debe contar con respaldos automáticos periódicos de la información, de forma que una falla técnica no implique pérdida de datos contables de ningún cliente.
 
> ⚠️ **Supuesto:** se asume que el respaldo automático que ofrece el proveedor de base de datos actual es suficiente para el MVP, sin necesidad de un mecanismo de respaldo adicional construido a medida. 
 
---
 
## Requerimientos de Rendimiento
 
**RP-001: Tiempo de respuesta en operaciones comunes**
Consultar el listado de activos o el detalle de un activo individual debe completarse en un tiempo referencia de menos 3 segundos, considerando el volumen actual de datos (del orden de miles de activos por empresa, no millones).
 
**RP-002: Tiempo de generación de reportes**
La generación de los reportes de auditoría y financieros (RF-004, RF-005) debe completarse en un tiempo referencia de menos de 15 segundos para el volumen de datos actual, sin requerir procesamiento en segundo plano.
 
**RP-003: Escalabilidad multi-empresa sin degradación**
El rendimiento del sistema para una empresa cliente no debe verse afectado de forma perceptible por la cantidad de otras empresas que también usan el sistema.
 
> ⚠️ **Supuesto:** no se define todavía un número objetivo de empresas simultáneas ni un compromiso formal de disponibilidad (SLA) para el MVP, ya que el sistema aún no está en etapa de venta comercial activa. 


 

 
