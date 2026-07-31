import { LegalLayout } from './LegalLayout'

export function PoliticaCookiesView() {
  return (
    <LegalLayout
      titulo="Política de Cookies"
      descripcion="Qué cookies utiliza Acticr, para qué sirven y cómo se gestionan. Solo se emplean cookies estrictamente necesarias para la sesión."
      actualizado="26 de julio de 2026"
    >
      <section>
        <h2>1. Qué son las cookies</h2>
        <p>Las cookies son pequeños archivos de texto que un sitio web almacena en el navegador de la persona visitante para recordar información entre solicitudes. Esta política aplica al sitio público <strong>www.acticr.com</strong> y a la aplicación autenticada bajo los subdominios de cada empresa cliente.</p>
      </section>

      <section>
        <h2>2. Base legal</h2>
        <p>De acuerdo con la Ley N.º 8968 y su Reglamento, toda cookie que no sea estrictamente necesaria para el funcionamiento del sitio requiere consentimiento previo, informado y expreso de la persona visitante antes de instalarse. Las cookies estrictamente necesarias no requieren consentimiento, pero sí deben informarse.</p>
      </section>

      <section>
        <h2>3. Cookies utilizadas actualmente</h2>
        <table>
          <thead>
            <tr><th>Nombre</th><th>Finalidad</th><th>Tipo</th><th>Duración</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Cookie de sesión (JWT de acceso), <code>HttpOnly</code></td>
              <td>Mantener la sesión autenticada. No es accesible mediante JavaScript, lo que reduce el riesgo de robo de sesión (XSS).</td>
              <td>Estrictamente necesaria</td>
              <td>Minutos</td>
            </tr>
            <tr>
              <td>Cookie de sesión (JWT de refresco), <code>HttpOnly</code></td>
              <td>Renovar la sesión sin solicitar nuevamente las credenciales.</td>
              <td>Estrictamente necesaria</td>
              <td>1 día</td>
            </tr>
            <tr>
              <td><code>csrftoken</code></td>
              <td>Proteger los formularios y solicitudes del sistema contra falsificación de solicitudes entre sitios (CSRF).</td>
              <td>Estrictamente necesaria (seguridad)</td>
              <td>Según configuración del servidor</td>
            </tr>
          </tbody>
        </table>
        <p>Actualmente Acticr no utiliza cookies de analítica, publicidad ni rastreo de terceros. Si esto cambia, se actualizará esta tabla y se activará el banner de consentimiento correspondiente antes de instalar cualquier cookie nueva de ese tipo.</p>
      </section>

      <section>
        <h2>4. Cookies de terceros</h2>
        <p>Si en el futuro se incorporan herramientas de terceros (por ejemplo, analítica del sitio público, chat de soporte), se documentarán aquí antes de su activación, indicando el proveedor, la finalidad y el enlace a su propia política de privacidad.</p>
      </section>

      <section>
        <h2>5. Cómo gestionar o rechazar cookies</h2>
        <ul>
          <li><strong>Cookies estrictamente necesarias:</strong> no pueden desactivarse sin afectar el funcionamiento básico del sistema (por ejemplo, no sería posible mantener la sesión iniciada).</li>
          <li><strong>Cookies no esenciales (cuando existan):</strong> se solicitará consentimiento mediante un aviso visible al ingresar por primera vez al sitio público, con opciones para aceptar o rechazar.</li>
        </ul>
        <p>La eliminación de las cookies estrictamente necesarias desde el navegador cerrará la sesión activa y requerirá iniciar sesión nuevamente.</p>
      </section>

      <section>
        <h2>6. Cambios a esta política</h2>
        <p>Esta política se actualizará cada vez que se incorpore una nueva cookie o tecnología de rastreo al sitio o a la aplicación.</p>
      </section>

      <section>
        <h2>7. Contacto</h2>
        <p>Para consultas sobre el uso de cookies: <a href="mailto:eliasquial24@gmail.com">eliasquial24@gmail.com</a>.</p>
      </section>
    </LegalLayout>
  )
}
