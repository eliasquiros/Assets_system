# Reglas de Negocio Sistema de Gestión de Activos Fijos
 
## Introducción
 
Este documento reúne las reglas de negocio que rigen el cálculo de depreciación y el proceso de baja de activos fijos dentro del sistema. Cada regla tiene un identificador único (por ejemplo, `RN-001.3`) que se usa para dar seguimiento a lo largo de todo el proyecto: desde el requerimiento que la originó, hasta el código que la implementa y las pruebas que la validan.
 
Está escrito en lenguaje simple, sin términos técnicos de programación, para que cualquier persona del negocio —sin importar su experiencia técnica— pueda leerlo, entenderlo y validar que refleja correctamente cómo debe funcionar el sistema.
 
Este documento es un punto de partida vivo: algunas reglas están completamente definidas, y otras quedan marcadas explícitamente como **pendientes** porque todavía falta información del negocio o de un asesor externo (contable/fiscal) para cerrarlas con seguridad.
 
---
 
## RN-001: Cálculo de Depreciación de Activos
 
**RN-001.1  Método de cálculo**
La depreciación de todos los activos se calcula usando el método de **línea recta**, es decir, el valor del activo se distribuye en partes proporcionales a lo largo de su vida útil, sin acelerar ni retrasar el gasto en ningún año en particular.
 
**RN-001.2  Qué fecha se usa para calcular**
Todo activo tiene dos fechas distintas:
- **Fecha de adquisición**: cuándo la empresa obtuvo el activo.
- **Fecha de inicio**: cuándo el activo realmente comenzó a usarse.
El cálculo de depreciación **siempre usa la fecha de inicio**, nunca la fecha de adquisición. La fecha de inicio no puede ser anterior a la fecha de adquisición.
 
**RN-001.3  Precisión del cálculo: días, no solo meses**
El sistema calcula la depreciación considerando los días exactos de uso, no solo meses completos. Esto significa que si un activo comienza a usarse a mitad de mes, ese mes se depreciará de forma proporcional a los días realmente utilizados, en lugar de contarlo como un mes completo o no contarlo en absoluto.
 
**RN-001.4  Vida útil ingresada manualmente**
La vida útil de cada activo (en años) la define la persona que lo registra en el sistema; no existe todavía una tabla oficial precargada que sugiera automáticamente la vida útil según el tipo de activo.
 
> ⚠️ **Pendiente:** se evaluará agregar una guía de referencia (no obligatoria) con rangos típicos de vida útil por categoría de activo, para reducir el riesgo de error humano al definir este valor.
 
**RN-001.5  Un solo cálculo para uso interno y fiscal**
El sistema mantiene un único cálculo de depreciación, que se usa tanto para reportes internos de la empresa como para efectos fiscales (declaración de renta).
 
 
**RN-001.6  El monto depreciado nunca puede superar el valor del activo**
En ningún caso la suma de la depreciación acumulada de un activo puede ser mayor a su costo original, ni puede quedar en un valor negativo. Si por el cálculo detallado en días queda una pequeña diferencia acumulada a lo largo de los años, esa diferencia se ajusta únicamente en la última cuota, de forma que el total nunca se pase del límite.

**RN-001.7  Estado de depreciación del activo**
Todo activo debe reflejar en todo momento uno de dos estados: **"depreciando"** (mientras su valor en libros sea mayor a cero) o **"totalmente depreciado"** (cuando su valor en libros llega exactamente a cero). Este cambio de estado ocurre automáticamente; ningún usuario debe marcarlo manualmente.

Cuando un activo alcanza el estado "totalmente depreciado", su depreciación acumulada debe ser exactamente igual a su costo original — ni más, ni menos. *(Esta regla es una extensión directa de RN-001.6: el ajuste de redondeo en la última cuota es precisamente lo que garantiza que este punto se cumpla con exactitud.)*
 
---
 
## RN-002: Baja de Activos (Retiro)
 
**RN-002.1  Motivos de baja permitidos**
Un activo puede darse de baja del sistema únicamente por uno de estos motivos:
- Venta
- Desecho u obsolescencia
- Robo o pérdida

 
**RN-002.2  Información requerida al registrar una baja**
Al dar de baja un activo, el sistema siempre solicita:
- El motivo de la baja (de la lista anterior)
- Una descripción breve de lo ocurrido
- La fecha efectiva en que el activo dejó de estar en uso o bajo control de la empresa
- Un archivo que respalde el motivo (por ejemplo: comprobante de venta, denuncia, acta de desecho)
El archivo de respaldo es obligatorio para cualquier motivo de baja.
 
**RN-002.3  Qué fecha se usa para cortar la depreciación**
La depreciación de un activo deja de calcularse a partir de su **fecha efectiva** de baja (la fecha real en que se perdió el uso o control del activo), y no a partir de la fecha en que la baja se registra en el sistema.
 
**RN-002.4  Periodo de gracia antes de que la baja sea definitiva**
Toda baja registrada queda en estado "pendiente" durante **2 días** antes de considerarse oficial. Durante ese período, la baja puede revertirse si se determina que fue un error. Pasados los 2 días sin que se haya revertido, la baja se vuelve definitiva.
 
**RN-002.5  Visibilidad durante el periodo de gracia**
Desde el momento en que se registra la solicitud de baja —y no solo cuando se vuelve definitiva—, el activo se muestra en los listados y reportes con el estado **"pendiente de baja"**, para que cualquier persona que consulte el sistema tenga visibilidad inmediata de que ese activo está en proceso de retiro.
 
**RN-002.6  Una vez oficial, la baja no se puede editar ni eliminar**
Después de que una baja se vuelve definitiva (pasado el periodo de gracia), su información y el archivo adjunto no pueden modificarse ni borrarse. Si se detecta un error después de este punto, la corrección se hace mediante un nuevo registro que explique la corrección, de manera que el historial completo quede siempre disponible para consulta o auditoría.
 
**RN-002.7  Datos de terceros no se registran en el MVP**
El sistema no registra información del comprador, beneficiario ni de ninguna otra persona o empresa involucrada en la baja (por ejemplo, quién compró el activo). Solo se conserva el motivo, la descripción, la fecha y el archivo de respaldo.
 
> ⚠️ **Pendiente:** si en el futuro se decide registrar información de terceros (comprador, beneficiario de donación), se deberá definir junto con esa decisión una política de protección de esos datos personales, conforme a la Ley de Protección de la Persona frente al tratamiento de sus datos personales (Ley 8968).
 
---
 
## Resumen de puntos pendientes
 
| Referencia | Pendiente | Depende de |
|---|---|---|
| RN-001.4 | Guía de referencia de vida útil por tipo de activo | Decisión de producto |
| RN-002.7 | Política de datos personales de terceros | Decisión futura + Ley 8968 |