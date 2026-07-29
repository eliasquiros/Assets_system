import { Link } from 'react-router-dom'
import { LegalLayout } from './LegalLayout'
import s from './LegalLayout.module.css'

export function PoliticaPrivacidadView() {
  return (
    <LegalLayout
      titulo="Política de Privacidad y Protección de Datos Personales"
      actualizado="26 de julio de 2026"
    >
      <section>
        <h2>1. Identificación del responsable</h2>
        <dl className={s.identBox}>
          <dt>Nombre comercial</dt>
          <dd>Acticr — sistema de gestión de activos fijos</dd>
          <dt>Titular</dt>
          <dd>Despacho Álvarez Corella</dd>
          <dt>Persona responsable ante PRODHAB</dt>
          <dd>Elías Quirós Álvarez, cédula física 1-1993-0352</dd>
          <dt>Domicilio</dt>
          <dd>San Rafael, La Unión, Cartago, Costa Rica</dd>
          <dt>Correo de contacto</dt>
          <dd><a href="mailto:eliasquial24@gmail.com">eliasquial24@gmail.com</a></dd>
        </dl>
        <p>
          Para efectos de la Ley N.º 8968, Ley de Protección de la Persona frente al
          Tratamiento de sus Datos Personales, y su Reglamento (Decreto Ejecutivo N.º
          37554-JP), Acticr actúa en dos calidades distintas según el dato de que se
          trate. Esta distinción se explica en la sección 5 y es el eje central de
          esta política.
        </p>
      </section>

      <section>
        <h2>2. Objeto y ámbito de aplicación</h2>
        <p>Esta política describe:</p>
        <ul>
          <li>Qué datos personales recopila Acticr, con qué fin, bajo qué base legal y por cuánto tiempo los conserva.</li>
          <li>Qué responsabilidad asume Acticr frente a los datos que procesa por cuenta propia y frente a los que las empresas cliente ingresan al sistema en el ejercicio de su propia actividad.</li>
          <li>Los derechos que la Ley 8968 reconoce a toda persona sobre sus datos personales, y el procedimiento para ejercerlos.</li>
          <li>El régimen de propiedad intelectual sobre el software, la marca y los datos generados por su uso.</li>
        </ul>
        <p>
          Aplica al sitio público <strong>www.acticr.com</strong>, a la aplicación
          SaaS multiempresa a la que cada empresa cliente accede mediante su
          subdominio propio, y a cualquier canal de contacto comercial o soporte
          asociado al producto.
        </p>
      </section>

      <section>
        <h2>3. Definiciones</h2>
        <p>Conforme al artículo 3 de la Ley 8968 y su Reglamento:</p>
        <ul>
          <li><strong>Dato personal:</strong> cualquier dato capaz de identificar o hacer identificable a una persona física.</li>
          <li><strong>Datos sensibles:</strong> datos que revelan origen étnico, opiniones políticas, convicciones religiosas, salud, vida sexual u otros que puedan dar lugar a discriminación. Acticr no está diseñado para recopilar datos sensibles.</li>
          <li><strong>Titular:</strong> la persona física a quien pertenecen los datos personales.</li>
          <li><strong>Responsable del tratamiento:</strong> quien decide sobre la finalidad, contenido y uso del tratamiento.</li>
          <li><strong>Encargado del tratamiento:</strong> quien trata datos personales por cuenta del responsable, únicamente conforme a sus instrucciones.</li>
          <li><strong>Consentimiento informado:</strong> autorización previa, expresa e inequívoca del titular, luego de haber sido informado con claridad sobre su alcance.</li>
          <li><strong>PRODHAB:</strong> Agencia de Protección de Datos de los Habitantes, autoridad de control en Costa Rica.</li>
          <li><strong>RNBD:</strong> Registro Nacional de Bases de Datos administrado por PRODHAB.</li>
          <li><strong>Derechos ARCO:</strong> acceso, rectificación, cancelación (eliminación) y oposición.</li>
        </ul>
      </section>

      <section>
        <h2>4. Marco legal aplicable</h2>
        <ul>
          <li>Ley N.º 8968, Ley de Protección de la Persona frente al Tratamiento de sus Datos Personales (2011).</li>
          <li>Decreto Ejecutivo N.º 37554-JP, Reglamento a la Ley N.º 8968 (2013).</li>
          <li>Ley N.º 8454, Ley de Certificados, Firmas Digitales y Documentos Electrónicos, en cuanto a integridad y valor probatorio de los registros electrónicos del sistema.</li>
          <li>Código de Comercio de Costa Rica, en cuanto a los plazos de conservación de registros contables que el sistema genera para las empresas cliente.</li>
          <li>Ley N.º 6683, Ley de Derechos de Autor y Derechos Conexos.</li>
          <li>Reglamentos y criterios emitidos por PRODHAB, como autoridad de aplicación e interpretación de la Ley 8968.</li>
        </ul>
      </section>

      <section>
        <h2>5. Dos roles de tratamiento: sitio web vs. plataforma SaaS</h2>
        <p>
          Esta distinción es la misma que aplican otras plataformas ERP y
          financieras y es esencial para entender la responsabilidad real de Acticr.
        </p>
        <h3>5.1 Acticr como responsable del tratamiento</h3>
        <p>Aplica a los datos que Acticr recopila por cuenta propia:</p>
        <ul>
          <li>Datos de visitantes del sitio público (analítica, cookies, formularios de contacto).</li>
          <li>Datos de las personas usuarias que crean una cuenta para acceder al sistema.</li>
          <li>Datos de la empresa cliente como entidad contratante.</li>
          <li>Registros técnicos de seguridad (dirección IP, encabezados de solicitud, marcas de tiempo de inicio de sesión, intentos fallidos, tokens de sesión).</li>
        </ul>
        <h3>5.2 Acticr como encargado del tratamiento</h3>
        <p>
          Aplica a los datos operativos que la empresa cliente ingresa al sistema en
          el ejercicio de su propia gestión de activos fijos: por ejemplo, nombres
          de personas colaboradoras registradas como custodias de un activo.
        </p>
        <ul>
          <li>La empresa cliente es la responsable del tratamiento de esos datos frente a sus propias personas colaboradoras o terceros.</li>
          <li>Acticr actúa únicamente como encargado del tratamiento, procesando esos datos solo para prestar el servicio contratado.</li>
          <li>El aislamiento multiempresa del sistema (un esquema de base de datos independiente por empresa) impide que una empresa cliente acceda a los datos de otra.</li>
          <li>Es responsabilidad de cada empresa cliente contar con base legal propia para los datos personales de terceros que decida ingresar al sistema.</li>
        </ul>
      </section>

      <section>
        <h2>6. Datos que el sistema recopila</h2>
        <table>
          <thead>
            <tr><th>Categoría</th><th>Datos concretos</th><th>Origen</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Cuenta de usuario</td>
              <td>Nombre de usuario, correo electrónico (opcional), contraseña cifrada (hash), fecha de creación, fecha de último acceso</td>
              <td>Persona usuaria o administrador de la empresa cliente</td>
            </tr>
            <tr>
              <td>Empresa cliente (tenant)</td>
              <td>Nombre comercial, subdominio asignado, fecha de alta, estado activo/inactivo</td>
              <td>Proceso de alta comercial</td>
            </tr>
            <tr>
              <td>Datos operativos del tenant</td>
              <td>Activos fijos, valores contables, depreciación, ubicaciones y, si la empresa cliente lo decide, nombres de custodios</td>
              <td>Ingresados por la empresa cliente bajo su propia responsabilidad</td>
            </tr>
            <tr>
              <td>Seguridad y sesión</td>
              <td>Dirección IP, user-agent, marcas de tiempo de acceso, tokens de sesión, registros de intentos fallidos</td>
              <td>Generados automáticamente por el sistema</td>
            </tr>
            <tr>
              <td>Sitio público / mercadeo</td>
              <td>Datos de formularios de contacto, cookies de navegación</td>
              <td>Visitante del sitio</td>
            </tr>
          </tbody>
        </table>
        <p>Acticr no recopila intencionalmente datos sensibles ni datos de menores de edad.</p>
      </section>

      <section>
        <h2>7. Finalidades del tratamiento</h2>
        <ul>
          <li>Crear y administrar la cuenta de la persona usuaria y de la empresa cliente.</li>
          <li>Autenticar el acceso de forma segura y mantener la sesión.</li>
          <li>Prestar el servicio contratado: registro, control y cálculo de depreciación de activos fijos.</li>
          <li>Prevenir accesos no autorizados, fraude o abuso del servicio.</li>
          <li>Cumplir obligaciones legales y contables derivadas del servicio.</li>
          <li>Comunicarse sobre cambios al servicio, incidentes de seguridad o esta política.</li>
          <li>Con consentimiento expreso y separado, enviar comunicación comercial.</li>
        </ul>
        <p>Acticr no vende ni alquila datos personales a terceros, ni los utiliza con fines distintos a los aquí descritos.</p>
      </section>

      <section>
        <h2>8. Base legal y consentimiento</h2>
        <p>
          Conforme al artículo 5 de la Ley 8968, todo tratamiento requiere
          consentimiento previo, informado, expreso e inequívoco del titular, salvo
          las excepciones que la propia ley contempla.
        </p>
        <ul>
          <li><strong>Datos de cuenta y del servicio contratado:</strong> base legal es la ejecución del contrato de prestación del servicio.</li>
          <li><strong>Datos operativos del tenant:</strong> base legal propia de la empresa cliente frente a sus titulares.</li>
          <li><strong>Comunicación comercial:</strong> requiere consentimiento independiente, revocable en cualquier momento.</li>
          <li><strong>Cookies no esenciales:</strong> requieren consentimiento previo mediante el banner descrito en la <Link to="/cookies">Política de Cookies</Link>.</li>
        </ul>
      </section>

      <section>
        <h2>9. Plazos de conservación</h2>
        <table>
          <thead><tr><th>Dato</th><th>Plazo</th></tr></thead>
          <tbody>
            <tr><td>Cuenta de usuario y credenciales</td><td>Mientras la cuenta esté activa, más 30 días tras la solicitud de eliminación</td></tr>
            <tr><td>Datos operativos del tenant</td><td>Mientras dure la relación comercial y el plazo contable que la propia empresa cliente determine (ref. 5 años, Código de Comercio)</td></tr>
            <tr><td>Registros de seguridad</td><td>Máximo 12 meses, salvo investigación en curso</td></tr>
            <tr><td>Tokens de sesión (JWT)</td><td>Minutos (acceso) / 1 día (refresco)</td></tr>
            <tr><td>Datos de mercadeo con consentimiento</td><td>Hasta la revocación o 24 meses de inactividad</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>10. Encargados de tratamiento, proveedores y transferencias internacionales</h2>
        <p>Acticr utiliza proveedores de infraestructura que actúan como subencargados de tratamiento, entre ellos Supabase (base de datos y almacenamiento de archivos), con posible migración futura a AWS conforme crezca el volumen de empresas cliente. Estos proveedores procesan datos fuera de Costa Rica.</p>
        <ul>
          <li>Se informa expresamente que los datos pueden almacenarse y procesarse en servidores ubicados fuera de Costa Rica.</li>
          <li>Se exige contractualmente a estos proveedores garantías de seguridad y confidencialidad equivalentes a las exigidas por la Ley 8968.</li>
          <li>No se transfieren datos a ningún otro tercero salvo obligación legal, orden de autoridad competente, o consentimiento expreso del titular.</li>
        </ul>
      </section>

      <section>
        <h2>11. Medidas de seguridad</h2>
        <ul>
          <li>Aislamiento multiempresa real: cada empresa cliente opera en un esquema de base de datos independiente.</li>
          <li>Identidad de la empresa fijada en el token de sesión firmado, nunca derivada del subdominio de la solicitud.</li>
          <li>Contraseñas almacenadas exclusivamente como hash, nunca en texto plano.</li>
          <li>Tokens de sesión de vida corta: acceso en minutos, refresco en 1 día.</li>
          <li>Limitación de tasa en el inicio de sesión para mitigar fuerza bruta y suplantación.</li>
          <li>Cifrado en tránsito (HTTPS/TLS) y en reposo.</li>
          <li>Acceso a archivos mediante enlaces firmados y temporales.</li>
          <li>Principio de mínimo privilegio en el acceso interno a producción.</li>
        </ul>
      </section>

      <section>
        <h2>12. Derechos de las personas titulares (derechos ARCO)</h2>
        <ul>
          <li><strong>Acceso:</strong> conocer qué datos personales suyos se tratan.</li>
          <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
          <li><strong>Cancelación:</strong> solicitar la supresión de sus datos.</li>
          <li><strong>Oposición:</strong> oponerse al tratamiento para finalidades específicas, en particular mercadeo directo.</li>
          <li><strong>Revocar el consentimiento</strong> en cualquier momento, sin efectos retroactivos.</li>
        </ul>
        <p>
          La solicitud debe dirigirse a <a href="mailto:eliasquial24@gmail.com">eliasquial24@gmail.com</a>,
          identificando al titular y el derecho que ejerce. Se responderá en un
          plazo máximo de 5 días hábiles, prorrogable conforme lo permita la Ley
          8968. Si el dato pertenece a un tenant de una empresa cliente, Acticr
          remitirá la solicitud a dicha empresa por ser ella la responsable, y
          colaborará técnicamente para atenderla. Si la respuesta no satisface al
          titular, puede presentar su reclamo ante PRODHAB.
        </p>
      </section>

      <section>
        <h2>13. Menores de edad</h2>
        <p>El sitio y el sistema no están dirigidos a personas menores de edad. Si se detecta que se recopilaron datos de una persona menor sin la autorización de su representante legal, se procederá a su eliminación inmediata.</p>
      </section>

      <section>
        <h2>14. Gestión de incidentes y brechas de seguridad</h2>
        <ol>
          <li>Contención del incidente y evaluación de su alcance en el menor tiempo posible.</li>
          <li>Notificación a las empresas cliente afectadas y, cuando corresponda, a PRODHAB, sin dilación indebida.</li>
          <li>Información a los titulares afectados cuando exista un riesgo real para sus derechos.</li>
          <li>Documentación del incidente, sus causas y las medidas correctivas adoptadas.</li>
        </ol>
      </section>

      <section>
        <h2>15. Inscripción ante PRODHAB</h2>
        <p>
          El artículo 16 de la Ley 8968 exige que toda base de datos de carácter
          comercial se inscriba en el Registro Nacional de Bases de Datos (RNBD).
          Despacho Álvarez Corella se encuentra en proceso de inscripción de las
          bases de datos que trata como responsable. Cada empresa cliente, como
          responsable de los datos que ingresa a su propio tenant, es responsable
          de inscribir su propia base de datos ante PRODHAB si corresponde según su
          actividad.
        </p>
      </section>

      <section>
        <h2>16. Propiedad intelectual y derechos de autor</h2>
        <ul>
          <li>El software de Acticr (código fuente, arquitectura, diseño de base de datos, interfaces, componentes visuales) es propiedad de Despacho Álvarez Corella, protegido por la Ley N.º 6683. Queda prohibida su reproducción, descompilación, ingeniería inversa o distribución no autorizada.</li>
          <li>El nombre "Acticr", su logotipo y demás signos distintivos son marcas utilizadas por Despacho Álvarez Corella, sin perjuicio de los registros marcarios que se tramiten a futuro ante el Registro de la Propiedad Industrial.</li>
          <li>Los datos operativos que cada empresa cliente ingresa al sistema son y seguirán siendo propiedad exclusiva de esa empresa cliente. Acticr no reclama derecho de propiedad alguno sobre ellos.</li>
          <li>Al finalizar la relación contractual, Acticr pondrá a disposición de la empresa cliente sus datos en un formato exportable durante un plazo razonable, y luego procederá a su eliminación segura.</li>
        </ul>
      </section>

      <section>
        <h2>17. Cookies y tecnologías de rastreo en el sitio público</h2>
        <p>Ver el detalle completo en la <Link to="/cookies">Política de Cookies</Link>. En resumen: solo se usan cookies estrictamente necesarias para el funcionamiento del sistema; cualquier cookie no esencial futura requerirá consentimiento previo mediante un aviso visible.</p>
      </section>

      <section>
        <h2>18. Cambios a esta política</h2>
        <p>Esta política puede actualizarse para reflejar cambios normativos, técnicos u operativos. Los cambios sustanciales se comunicarán con al menos 15 días de anticipación por correo electrónico o aviso dentro de la plataforma.</p>
      </section>

      <section>
        <h2>19. Legislación aplicable y resolución de conflictos</h2>
        <p>Esta política se rige por las leyes de la República de Costa Rica. Cualquier controversia relacionada con el tratamiento de datos personales podrá someterse a PRODHAB como autoridad administrativa competente, sin perjuicio de la vía judicial ante los tribunales de la provincia de Cartago, Costa Rica.</p>
      </section>

      <section>
        <h2>20. Contacto</h2>
        <dl className={s.identBox}>
          <dt>Correo</dt>
          <dd><a href="mailto:eliasquial24@gmail.com">eliasquial24@gmail.com</a></dd>
          <dt>Responsable de atención de solicitudes de datos</dt>
          <dd>Elías Quirós Álvarez</dd>
          <dt>Domicilio</dt>
          <dd>San Rafael, La Unión, Cartago, Costa Rica</dd>
        </dl>
      </section>
    </LegalLayout>
  )
}
