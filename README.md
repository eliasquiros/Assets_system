# Sistema de Gestión de Activos Fijos
 
Sistema web para el registro, control y depreciación de activos fijos, diseñado inicialmente para empresas costarricenses, con proyección para operar como producto comercial multiempresa.
 
## Objetivo del proyecto
 
Ofrecer a empresas costarricenses una herramienta confiable para administrar su inventario de activos fijos y calcular su depreciación de forma automática, precisa y trazable, reduciendo la dependencia de hojas de cálculo manuales propensas a errores humanos y a pérdida de historial.
 
El sistema busca convertirse en un producto vendible a múltiples empresas, manteniendo desde el diseño inicial los principios de seguridad, integridad contable y escalabilidad necesarios para ese propósito comercial.
 
## Necesidad que resuelve
 
La gestión de activos fijos en muchas pequeñas y medianas empresas costarricenses se realiza todavía en hojas de cálculo, lo que genera varios problemas recurrentes:
 
* Cálculos de depreciación hechos manualmente, con alto riesgo de error humano.
* Ausencia de un historial confiable ante auditorías internas o externas.
* Dificultad para justificar decisiones contables o fiscales tomadas en el pasado.
* Falta de trazabilidad cuando un activo cambia de estado (baja por venta, robo, desecho, entre otros).
Este sistema atiende esas necesidades centralizando la información, aplicando reglas de negocio consistentes y manteniendo un historial permanente de cada activo.

 
### Principios de diseño
 
1. Ningún monto contable se maneja con tipos de punto flotante binario; siempre se usa un tipo decimal exacto, tanto en el código como en la base de datos.
2. El sistema está preparado desde el inicio para operar con múltiples empresas cliente de forma aislada entre sí, aunque el primer despliegue sea para una sola empresa.
3. Cada regla de negocio implementada debe poder rastrearse hasta su documento de origen (ver sección de documentación).
4. Se evita deliberadamente la sobreingeniería: no se incorporan patrones de alta escala (microservicios, procesamiento distribuido, entre otros) hasta que el volumen real de uso lo justifique.
### Tecnologías principales
 
| Componente | Tecnología |
|---|---|
| Backend | Python con Django y Django REST Framework |
| Frontend | React (JavaScript) |
| Base de datos | PostgreSQL, alojada inicialmente en Supabase |
| Migración planificada | AWS RDS, al escalar el volumen de clientes |
| Almacenamiento de archivos | Supabase Storage, con acceso mediante enlaces firmados temporales |
 
## Requerimientos base para desarrollo local
 
Antes de levantar el proyecto en tu máquina, asegúrate de contar con lo siguiente instalado:
 
* Python 3.11 o superior
* Node.js 18 o superior (para el frontend en React)
* Una cuenta de Supabase, o una instancia local de PostgreSQL
* Git
 
## Documentación del proyecto
 
Toda decisión de negocio, arquitectura y requerimiento queda documentada dentro de la carpeta `docs`, siguiendo un esquema de trazabilidad numerado:
 
```
docs/
    reglas_negocio/         Reglas de negocio (identificadas como RN)
    requerimientos/         Requerimientos funcionales y no funcionales (RF, RL, RS, RP, RU, RC, RM)
    arquitectura/           Decisiones de arquitectura y sus justificaciones
```
 
Cada regla o requerimiento tiene un identificador único que se referencia directamente desde el código y desde las tareas del backlog, de forma que sea posible rastrear el porqué de cualquier funcionalidad implementada.
 
## Estado actual
 
El proyecto se encuentra en etapa de diseño y planificación: las reglas de negocio y los requerimientos base ya están definidos y documentados; el desarrollo del modelo de dominio y la implementación técnica están en progreso.
 
## Autor
 
Desarrollado y mantenido por Elías Quirós Álvarez, como Product Owner y desarrollador único del proyecto.
 
## Licencia
 
Proyecto de carácter privado y comercial. Todos los derechos reservados. Uso, copia o distribución sin autorización expresa no está permitido.
 
