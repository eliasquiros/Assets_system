import { Link } from 'react-router-dom'
import { LegalLayout } from './LegalLayout'
import s from './LegalLayout.module.css'

export function TerminosServicioView() {
  return (
    <LegalLayout
      titulo="Términos y Condiciones de Servicio"
      actualizado="26 de julio de 2026"
    >
      <section>
        <h2>1. Objeto y aceptación</h2>
        <p>
          Estos Términos y Condiciones de Servicio ("Términos") regulan el acceso y
          uso de Acticr, sistema de gestión de activos fijos ofrecido bajo la
          modalidad de software como servicio (SaaS) por <strong>Despacho Álvarez
          Corella</strong> (responsable: Elías Quirós Álvarez, cédula física
          1-1993-0352, domicilio en San Rafael, La Unión, Cartago, Costa Rica), por
          parte de empresas clientes y de las personas usuarias que estas
          autoricen.
        </p>
        <div className={s.note}>
          Al crear una cuenta, acceder o utilizar el sistema de cualquier forma, la
          empresa cliente y la persona que actúa en su representación aceptan
          íntegramente estos Términos y la <Link to="/privacidad">Política de
          Privacidad</Link>, que se incorpora por referencia como parte integral de
          este contrato. El uso del sistema, por sí solo, constituye aceptación de
          estos Términos.
        </div>
        <p>Si la empresa cliente no está de acuerdo con estos Términos, no debe registrarse ni utilizar el sistema.</p>
      </section>

      <section>
        <h2>2. Definiciones</h2>
        <ul>
          <li><strong>"Acticr":</strong> el sistema y la marca operados por Despacho Álvarez Corella.</li>
          <li><strong>"Empresa cliente" o "Cliente":</strong> la persona jurídica que contrata el servicio y a cuyo nombre se crea un tenant.</li>
          <li><strong>"Persona usuaria":</strong> cualquier persona autorizada por la empresa cliente para acceder al sistema.</li>
          <li><strong>"Tenant":</strong> el espacio de datos aislado asignado a cada empresa cliente.</li>
          <li><strong>"Datos del Cliente":</strong> toda la información que la empresa cliente ingresa al sistema.</li>
        </ul>
      </section>

      <section>
        <h2>3. Descripción del servicio</h2>
        <p>Acticr provee una plataforma web multiempresa para el registro, control y cálculo de depreciación de activos fijos, a través de un subdominio exclusivo asignado a cada empresa cliente. El alcance funcional específico del plan contratado se detalla en la propuesta comercial correspondiente.</p>
      </section>

      <section>
        <h2>4. Registro de la cuenta y de la empresa cliente</h2>
        <ul>
          <li>La empresa cliente debe proporcionar información veraz, completa y actualizada.</li>
          <li>La empresa cliente designa a la(s) persona(s) administradora(s) de su cuenta y a las personas usuarias adicionales que autorice.</li>
          <li>Las credenciales de acceso son personales e intransferibles; la empresa cliente responde por toda actividad realizada bajo ellas.</li>
          <li>Debe notificarse a Acticr de inmediato ante cualquier sospecha de acceso no autorizado.</li>
        </ul>
      </section>

      <section>
        <h2>5. Obligaciones de la empresa cliente</h2>
        <ul>
          <li>Utilizar el sistema únicamente para fines lícitos conforme a su actividad comercial legítima.</li>
          <li>No ingresar datos personales sensibles sin base legal propia y sin comunicarlo previamente a Acticr.</li>
          <li>Contar con base legal propia para todo dato personal de terceros que decida ingresar al sistema.</li>
          <li>Pagar oportunamente las tarifas correspondientes al plan contratado.</li>
          <li>No intentar vulnerar la seguridad del sistema ni acceder a datos de otras empresas clientes.</li>
        </ul>
      </section>

      <section>
        <h2>6. Obligaciones de Acticr</h2>
        <ul>
          <li>Prestar el servicio conforme al plan contratado, con el nivel de disponibilidad razonable descrito en la sección 13.</li>
          <li>Aplicar las medidas de seguridad técnicas y organizativas descritas en la <Link to="/privacidad">Política de Privacidad</Link>.</li>
          <li>Actuar como encargado del tratamiento respecto de los Datos del Cliente.</li>
          <li>Notificar oportunamente cambios significativos al servicio o a estos Términos.</li>
        </ul>
      </section>

      <section>
        <h2>7. Uso aceptable del sistema</h2>
        <p>Queda prohibido:</p>
        <ul>
          <li>Almacenar o transmitir contenido ilícito, difamatorio o que infrinja derechos de terceros.</li>
          <li>Intentar acceder, sin autorización, a datos, cuentas o tenants de otras empresas clientes.</li>
          <li>Sobrecargar deliberadamente la infraestructura del sistema.</li>
          <li>Revender, sublicenciar o poner el sistema a disposición de terceros no autorizados, salvo pacto expreso.</li>
        </ul>
        <p>El incumplimiento de esta sección faculta a Acticr para suspender el acceso de forma inmediata, sin perjuicio de otras acciones legales que correspondan.</p>
      </section>

      <section>
        <h2>8. Propiedad intelectual y licencia de uso</h2>
        <ul>
          <li>El software Acticr es propiedad de Despacho Álvarez Corella, protegido por la Ley N.º 6683.</li>
          <li>Se otorga a la empresa cliente una licencia de uso no exclusiva, intransferible y revocable, limitada a la vigencia del contrato.</li>
          <li>Esta licencia no incluye derecho de reproducción, modificación, descompilación, ingeniería inversa, distribución del software, ni creación de productos derivados o competidores.</li>
          <li>Los Datos del Cliente son y seguirán siendo propiedad exclusiva de la empresa cliente.</li>
        </ul>
      </section>

      <section>
        <h2>9. Planes, precios y facturación</h2>
        <p>Las tarifas aplicables, la periodicidad de facturación, la moneda y los medios de pago aceptados se establecen en la propuesta comercial o formulario de contratación suscrito con cada empresa cliente. Los precios pueden actualizarse con una notificación previa de al menos 30 días para contratos en curso. Salvo pacto expreso en contrario, las tarifas no incluyen impuestos aplicables, que se facturan por separado conforme a la legislación costarricense vigente.</p>
      </section>

      <section>
        <h2>10. Suspensión y terminación por impago</h2>
        <p>Esta sección regula qué ocurre cuando la empresa cliente deja de pagar el servicio sin haber notificado la terminación del contrato:</p>
        <ol>
          <li><strong>Período de gracia:</strong> vencida la fecha de pago, se notificará el atraso. Durante los siguientes 10 días naturales, el servicio permanece activo sin restricciones.</li>
          <li><strong>Suspensión de acceso:</strong> transcurrido el período de gracia sin regularizarse el pago, Acticr podrá suspender el acceso. Los Datos del Cliente se conservan intactos y el acceso se restablece de inmediato al regularizarse el pago.</li>
          <li><strong>Plazo de conservación durante la suspensión:</strong> los Datos del Cliente se conservan, en estado de suspensión, durante un máximo de 60 días naturales.</li>
          <li><strong>Terminación por impago prolongado:</strong> si el impago persiste más allá de ese plazo, el contrato se tendrá por terminado por incumplimiento. Se notificará con al menos 15 días de anticipación a la eliminación definitiva de los datos, para permitir su exportación.</li>
          <li><strong>No retención indefinida:</strong> los Datos del Cliente no se conservan de forma indefinida como medio de presión para el cobro. Vencidos los plazos anteriores, se eliminan de forma segura.</li>
          <li>Esta cláusula no limita el derecho de Acticr a exigir judicialmente el pago de las sumas adeudadas hasta la fecha de suspensión.</li>
        </ol>
      </section>

      <section>
        <h2>11. Terminación del contrato por otras causas</h2>
        <ul>
          <li>Mutuo acuerdo entre las partes.</li>
          <li>Voluntad de la empresa cliente, con al menos 30 días de anticipación, sin perjuicio del pago de las sumas ya devengadas.</li>
          <li>Incumplimiento grave de estos Términos, mediante notificación escrita con oportunidad de subsanar en un plazo razonable.</li>
          <li>Cese de operaciones de Acticr, notificado con la mayor anticipación posible, garantizando la exportación de datos antes del cierre.</li>
        </ul>
      </section>

      <section>
        <h2>12. Efectos de la terminación: exportación y eliminación de datos</h2>
        <p>Al terminar el contrato, la empresa cliente podrá solicitar la exportación de sus Datos del Cliente en un formato de uso común durante 30 días posteriores a la terminación. Vencido ese plazo, se procederá a su eliminación segura e irreversible, salvo obligación legal de conservación. La terminación no exime a la empresa cliente del pago de las sumas pendientes hasta la fecha efectiva de terminación.</p>
      </section>

      <section>
        <h2>13. Disponibilidad del servicio y mantenimiento</h2>
        <p>Acticr procurará mantener el servicio disponible de forma continua, sin garantizar una disponibilidad del 100%, dado que pueden existir interrupciones por mantenimiento programado, actualizaciones, causas de fuerza mayor o fallas de proveedores de infraestructura. Los mantenimientos programados que impliquen interrupción se notificarán con antelación razonable, salvo urgencias de seguridad.</p>
      </section>

      <section>
        <h2>14. Protección de datos personales</h2>
        <p>El tratamiento de datos personales realizado en virtud de este contrato se rige por la <Link to="/privacidad">Política de Privacidad</Link>, que se incorpora por referencia como parte integral de estos Términos. Ante cualquier contradicción entre ambos documentos en materia de datos personales, prevalece la Política de Privacidad.</p>
      </section>

      <section>
        <h2>15. Limitación de responsabilidad</h2>
        <p>Acticr no será responsable por daños indirectos, lucro cesante, pérdida de datos ocasionada por causas ajenas a su control, o por decisiones contables o fiscales que la empresa cliente adopte con base en la información generada por el sistema. La responsabilidad total de Acticr frente a la empresa cliente no excederá el monto efectivamente pagado por la empresa cliente en los tres meses previos al hecho que origina el reclamo. Nada en esta sección limita la responsabilidad de Acticr en materia de protección de datos personales, ni excluye responsabilidad por dolo o culpa grave, que no es limitable por contrato conforme al derecho costarricense.</p>
      </section>

      <section>
        <h2>16. Indemnización</h2>
        <p>La empresa cliente se compromete a indemnizar a Acticr por cualquier reclamo, sanción o daño derivado de: datos personales de terceros ingresados sin base legal propia; uso del sistema en contravención de estos Términos; o incumplimiento de sus propias obligaciones legales frente a sus personas colaboradoras o clientes.</p>
      </section>

      <section>
        <h2>17. Fuerza mayor</h2>
        <p>Ninguna de las partes será responsable por incumplimientos derivados de causas de fuerza mayor o caso fortuito, incluyendo fallas generalizadas de proveedores de infraestructura, desastres naturales o disposiciones de autoridad competente, mientras dure dicha causa.</p>
      </section>

      <section>
        <h2>18. Modificaciones a estos términos</h2>
        <p>Estos Términos pueden modificarse para reflejar cambios normativos, operativos o comerciales. Los cambios sustanciales se notificarán con al menos 15 días de anticipación. El uso continuado del servicio tras la entrada en vigencia de los cambios constituye aceptación de los mismos.</p>
      </section>

      <section>
        <h2>19. Cesión del contrato</h2>
        <p>La empresa cliente no podrá ceder este contrato a terceros sin autorización previa y escrita de Acticr. Acticr podrá ceder el contrato en el contexto de una fusión, adquisición o venta de activos del negocio, notificando previamente a la empresa cliente.</p>
      </section>

      <section>
        <h2>20. Comunicaciones</h2>
        <p>Todas las notificaciones formales bajo este contrato se dirigirán a los correos electrónicos registrados por cada parte. La empresa cliente es responsable de mantener actualizada su información de contacto.</p>
      </section>

      <section>
        <h2>21. Legislación aplicable y resolución de conflictos</h2>
        <p>Este contrato se rige por las leyes de la República de Costa Rica. Cualquier controversia se someterá a los tribunales de la provincia de Cartago, Costa Rica, sin perjuicio de que las partes pacten expresamente un mecanismo de arbitraje en la propuesta comercial correspondiente.</p>
      </section>

      <section>
        <h2>22. Contacto</h2>
        <dl className={s.identBox}>
          <dt>Correo para asuntos contractuales, de facturación y de privacidad</dt>
          <dd><a href="mailto:eliasquial24@gmail.com">eliasquial24@gmail.com</a></dd>
          <dt>Domicilio</dt>
          <dd>San Rafael, La Unión, Cartago, Costa Rica</dd>
        </dl>
      </section>
    </LegalLayout>
  )
}
