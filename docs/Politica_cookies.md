# Política de Cookies — Acticr

> **Nota de uso interno (eliminar antes de publicar).** El listado de cookies de la sección 3 refleja lo que existe hoy en el código (autenticación y CSRF), verificado directamente contra `frontend/src/api/client.js`. Si en el futuro se incorpora analítica, mercadeo u otra herramienta de terceros, **esta tabla debe actualizarse antes de activarla**, y el banner de consentimiento (sección 5) debe bloquear esas cookies hasta que la persona usuaria las acepte. No es válido instalar una herramienta nueva y "regularizarla después" en este documento. Revisar con un abogado costarricense colegiado antes de publicar.
>
> Última actualización del borrador: 26 de julio de 2026.

---

## 1. Qué son las cookies

Las cookies son pequeños archivos de texto que un sitio web almacena en el navegador de la persona visitante para recordar información entre solicitudes (por ejemplo, mantener una sesión iniciada). Esta política aplica al sitio público `www.acticr.com` y a la aplicación autenticada bajo los subdominios de cada empresa cliente (`[subdominio].acticr.com`).

## 2. Base legal

De acuerdo con la Ley N.º 8968 y su Reglamento, toda cookie que no sea estrictamente necesaria para el funcionamiento del sitio requiere **consentimiento previo, informado y expreso** de la persona visitante antes de instalarse. Las cookies estrictamente necesarias no requieren consentimiento, pero sí deben informarse.

## 3. Cookies utilizadas actualmente

| Nombre | Finalidad | Tipo | Duración | ¿Requiere consentimiento? |
|---|---|---|---|---|
| Cookie de sesión (JWT de acceso), `HttpOnly` | Mantener la sesión autenticada de la persona usuaria dentro de la aplicación. No es accesible mediante JavaScript, lo que reduce el riesgo de robo de sesión (XSS). | Estrictamente necesaria | Minutos (vida corta, renovación automática) | No |
| Cookie de sesión (JWT de refresco), `HttpOnly` | Permitir renovar la sesión sin solicitar nuevamente las credenciales. | Estrictamente necesaria | 1 día | No |
| `csrftoken` | Proteger los formularios y solicitudes del sistema contra ataques de falsificación de solicitudes entre sitios (CSRF). Es legible por el frontend para incluirse en el encabezado `X-CSRFToken` de cada solicitud que modifica datos. | Estrictamente necesaria (seguridad) | Sesión / según configuración del servidor | No |

**Actualmente Acticr no utiliza cookies de analítica, publicidad ni rastreo de terceros.** Si esto cambia, se actualizará esta tabla y se activará el banner de consentimiento correspondiente antes de instalar cualquier cookie nueva de ese tipo.

## 4. Cookies de terceros

Si en el futuro se incorporan herramientas de terceros (por ejemplo, analítica de uso del sitio público, mapas, chat de soporte), se documentarán aquí antes de su activación, indicando el proveedor, la finalidad y el enlace a su propia política de privacidad.

## 5. Cómo gestionar o rechazar cookies

- **Cookies estrictamente necesarias:** no pueden desactivarse sin afectar el funcionamiento básico del sistema (por ejemplo, no sería posible mantener la sesión iniciada).
- **Cookies no esenciales (cuando existan):** se solicitará consentimiento mediante un aviso visible al ingresar por primera vez al sitio público, con opciones para aceptar o rechazar. La persona visitante puede cambiar su decisión en cualquier momento desde el propio aviso o eliminando las cookies desde la configuración de su navegador.
- La eliminación de las cookies estrictamente necesarias desde el navegador cerrará la sesión activa y requerirá iniciar sesión nuevamente.

## 6. Cambios a esta política

Esta política se actualizará cada vez que se incorpore una nueva cookie o tecnología de rastreo al sitio o a la aplicación. La fecha de última actualización se indica al inicio de este documento.

## 7. Contacto

Para consultas sobre el uso de cookies: eliasquial24@gmail.com.
