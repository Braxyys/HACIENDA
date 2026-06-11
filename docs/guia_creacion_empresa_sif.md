================================================================================
GUÍA ESTRUCTURAL: LANZAMIENTO DEL PROYECTO HACIENDA (VERIFACTU & B2B)
# Plan de Negocio, Costes, Legalidad y Organización de Personal (2 Socios)

Este documento detalla los pasos administrativos, legales, de infraestructura y 
de organización interna necesarios para constituir una nueva empresa tecnológica 
en España orientada a la venta de software de facturación Veri*factu y B2B.
## 
## 1. CONSTITUCIÓN SOCIETARIA Y LEGALIDAD (Evitar multas de Hacienda y LOPD)
Para vender un software de facturación a empresas en España, es fundamental operar
dentro de la más estricta legalidad. Un error en la configuración del software o
la falta de documentación oficial puede derivar en multas millonarias.

A) Forma Jurídica: Sociedad Limitada (S.L.)
   *   ¿Por qué? Limita la responsabilidad patrimonial de los socios al capital 
       de la empresa. Si el software falla y Hacienda impone una multa a un 
       cliente que luego nos demanda, responderá la S.L. con sus bienes, 
       salvaguardando vuestras viviendas y ahorros personales.
   *   Capital Mínimo: La Ley Crea y Crece permite constituir la S.L. con 1 € de
       capital social inicial (aunque es aconsejable aportar 3.000 € para cubrir
       gastos notariales y dar una mejor imagen financiera).
   *   CNAE Actividad: CNAE 6201 (Actividades de programación informática) o
       CNAE 6202 (Consultoría informática).

B) La Responsabilidad Legal del Desarrollador (Crítico para evitar multas)
   *   La Ley Antifraude estipula que los fabricantes de software son responsables
       de lo que programan.
   *   Multa por doble uso: Si programáis cualquier opción que permita borrar,
       modificar u ocultar registros de facturas (el famoso "botón oculto para 
       borrar un ticket"), la multa a la empresa de software es de **150.000 € por 
       cada año o programa vendido**.
   *   Declaración Responsable: Vuestro software debe incluir contractualmente y 
       en su código una "Declaración Responsable" donde certifiquéis legalmente 
       que el programa cumple con el Real Decreto 1007/2023 y la Orden HAC/1177/2024.
       No disponer de ella se sanciona con hasta 50.000 €.

C) Protección de Datos (LOPD) y Firma Digital
   *   El software manejará certificados digitales X.509 de los clientes para firmar
       sus facturas ante Hacienda. La custodia de estas claves privadas es de 
       máxima seguridad.
   *   Contrato de Encargado de Tratamiento (Art. 28 del RGPD): Debéis firmar un 
       contrato con cada cliente que estipule que solo procesáis sus datos para 
       firmar y enviar a la AEAT, garantizando que están cifrados y a salvo de 
       accesos no autorizados.
## 
## 2. ORGANIZACIÓN DEL PERSONAL (Equipo de 2 socios técnicos)
Al ser un equipo de 2 personas hábiles en desarrollo ("buenos"), debéis dividir
el trabajo de forma estricta para no duplicar esfuerzos ni dejar áreas descuidadas.
Un error común en equipos técnicos es que ambos programen todo y descuiden la venta
y el soporte.

*   SOCIO A: Director de Tecnología (CTO) / Especialista Backend y Seguridad
    *   Tareas principales:
        *   Programación y mantenimiento del motor de firmas criptográficas (XAdES).
        *   Gestión de la base de datos (PostgreSQL inalterable, Redis para hashes).
        *   Seguridad del servidor y custodia cifrada de certificados en la nube.
        *   Conexión con los endpoints SOAP de la AEAT y Haciendas Forales.
        *   Mantenimiento del código de la API Middleware.

*   SOCIO B: Director de Producto y Operaciones (CPO/COO) / Frontend y Negocio
    *   Tareas principales:
        *   Desarrollo de la interfaz de usuario (Next.js/React) del SaaS para PYMEs.
        *   Integración de pasarelas de pago (Stripe) y conexiones bancarias (PSD2).
        *   Marketing digital, captación de clientes y red de afiliación de gestorías.
        *   Soporte técnico de primer nivel a clientes (resolución de dudas).
        *   Redacción de contratos legales y cumplimiento normativo de la S.L.
## 
## 3. ALOJAMIENTO E INFRAESTRUCTURA CLOUD (Seguridad Europea)
Para cumplir con el RGPD y dar confianza a empresas de que sus datos de facturación
no salen de la UE, todo el sistema debe alojarse en servidores europeos.

*   Proveedor Recomendado: **Amazon Web Services (AWS)** (Región España `eu-south-2`
    en Aragón, o Región Europa `eu-west-3` en París).
*   Arquitectura y Componentes:
    1.  **Backend (Lógica API)**: AWS Lambda o AWS ECS Fargate. Serverless: si no
        hay clientes facturando de noche, el coste de computación baja a casi cero.
    2.  **Base de Datos**: AWS RDS PostgreSQL. Configurada en modo redundante
        para evitar pérdidas de datos ante un desastre en el servidor.
    3.  **Almacenamiento de Historial XML**: AWS S3. Se debe activar la opción
        **"Object Lock"** en modo cumplimiento (Compliance). Esto aplica una
        política inalterable: ni vosotros, con acceso de administrador, podréis
        borrar o modificar los ficheros XML firmados durante los 4 años exigidos
        por ley.
    4.  **Criptografía Segura**: AWS KMS (Key Management Service) para cifrar los
        certificados digitales de los clientes mediante claves maestras de hardware.
## 
## 4. PRESUPUESTO DEL PROYECTO Y PLAN FINANCIERO INICIAL
El proyecto se puede iniciar en modalidad "Bootstrapping" (financiación propia de
bajo coste inicial) gracias a la infraestructura en la nube.

A) Costes de Lanzamiento (Única vez):
   *   Constitución de la S.L. (Gastos notariales, Registro Mercantil, nombre): ~350 €
       (si se realiza a través de un punto PAE con estatutos estándar).
   *   Capital Social Inicial: Mínimo 1 € (Recomendado 3.000 € para tesorería inicial).
   *   Alta de marca comercial en la OEPM (Oficina de Patentes): ~150 €.
   *   TOTAL INVERSIÓN INICIAL MÍNIMA: ~500 € a 3.500 €.

B) Costes Fijos de Operación (Mensuales):
   *   Servidores y Base de datos (AWS RDS + S3 + Lambda + KMS): ~180 €/mes.
   *   Seguro de Responsabilidad Civil Profesional Tecnológico: ~35 €/mes (~420€/año).
       *(Crítico: te cubre ante reclamaciones de clientes si el software falla y la
       AEAT les sanciona).*
   *   Pasarela bancaria e integraciones (Stripe / Gocardless API): ~30 €/mes.
   *   Gestoría contable externa para la S.L.: ~80 €/mes.
   *   Gastos de Dominio y Google Workspace (Emails corporativos): ~15 €/mes.
   *   TOTAL GASTOS FIJOS: ~340 €/mes.
## 
## 5. CÓMO ADQUIRIR Y GESTIONAR CLIENTES (Estrategia B2B)
Para competir con las grandes marcas de facturación, la estrategia de captación
debe ser inteligente y de bajo coste de adquisición:

*   Estrategia A: Alianza con Gestorías y Asesorías (La clave del volumen)
    *   Las gestorías están agobiadas porque sus clientes autónomos les mandan 
        los tickets en fotos borrosas de WhatsApp o papeles arrugados.
    *   Ofreced a las gestorías una **"Consola de Despacho" gratuita**. Desde ahí,
        pueden ver las facturas de sus clientes en tiempo real y exportarlas a sus
        programas contables (A3, Sage).
    *   Dadles un **15% de comisión recurrente** de por vida sobre la suscripción
        de cada cliente que os traigan. El gestor se convierte en vuestro comercial.

*   Estrategia B: Integración Express de la API para ERPs locales
    *   Contactar con desarrolladores que vendan TPVs para carnicerías, peluquerías
        o farmacias de tu zona. Ofrecedles vuestra API Middleware. En lugar de
        estar 3 meses programando las firmas XAdES y Verifactu, integran vuestra
        API en una tarde y cumplen la ley pagando una suscripción B2B.

*   Estrategia C: Venta Subvencionada mediante el Kit Digital (Bono Gratuito)
    *   Darse de alta como "Agente Digitalizador Adherido" ante Red.es (Gobierno de España).
    *   El gobierno otorga bonos de 2.000€ a 3.000€ a autónomos y micro-pymes para software de facturación.
    *   Podéis ofrecer vuestro SaaS con coste de 0 € para el cliente durante los primeros 12 meses.
    *   El cliente os cede el derecho de cobro del bono, y el Estado os abona directamente a vosotros el importe subvencionado. Esto elimina por completo la barrera del precio y acelera la venta masiva.
## 
## 6. NUESTRA PROPIA FACTURACIÓN DE LA EMPRESA (Ejemplo Práctico)
Dado que nuestra empresa (VerifactuTech S.L.) vende un software de facturación,
**nuestro propio sistema de facturación también debe cumplir con Veri*factu**.

A) Automatización de cobro y emisión:
   1.  El cliente se suscribe en la web a través de Stripe (Plan PYME de 19€/mes).
   2.  Stripe cobra la tarjeta del cliente el día 1 de cada mes.
   3.  Al confirmarse el pago, nuestro backend genera automáticamente una factura
       de servicios SaaS en formato PDF y XML firmado.
   4.  Se calcula la huella criptográfica enlazada y se envía a la AEAT al instante.
   5.  Se envía la factura por email al cliente con el QR y la leyenda de Verifactu.

B) Ejemplo de JSON de nuestra Factura de Venta (Envío a la AEAT):
```json
{
  "Cabecera": {
    "ObligadoEmisor": "B99887766",
    "RazonSocial": "VerifactuTech S.L."
  },
  "RegistroFactura": {
    "IdFactura": {
      "SerieNumeroFactura": "FACT-SAAS-2026-0042",
      "FechaExpedicionFactura": "2026-06-04"
    },
    "HoraExpedicion": "15:38:27",
    "DatosFactura": {
      "TipoFactura": "F1",
      "ClaveRegimenEspecialOTrascendencia": "01",
      "ImporteTotal": "19.00",
      "DescripcionOperacion": "Suscripcion Mensual SaaS Plan PYME - Junio 2026"
    },
    "Destinatario": {
      "NIF": "B87654321",
      "NombreRazonSocial": "Suministros Lorenzo S.A."
    },
    "DesgloseTributario": {
      "Sujeta": {
        "NoExenta": {
          "DetalleIVA": {
            "TipoImpositivo": "21.00",
            "BaseImponible": "15.70",
            "CuotaRepercutida": "3.30"
          }
        }
      }
    },
    "Encadenamiento": {
      "HuellaAnterior": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    },
    "HuellaFacturaActual": "fa6b98e12a4b3d7c5f8e9102c98a34bc762de18765a0b9432d56efb9a32c694a"
  }
}
```

C) Formato de la Factura PDF entregada al Cliente:
   *   Nuestra S.L. emite la factura de 19 € (15.70 € de Base + 3.30 € de IVA).
   *   Lleva impreso el código QR que enlaza a la dirección oficial de consulta
       de la AEAT con nuestro NIF, serie y número, importe de 19.00 e IVA al 21%.
   *   Incluye de manera legible la frase: *"Factura verificable en la sede electrónica de la AEAT - VERIFACTU"*.
   *   Garantiza que somos un ejemplo de transparencia para el cliente: vendemos
# cumplimiento legal y lo aplicamos en nuestra propia casa.