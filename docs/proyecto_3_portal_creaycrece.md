================================================================================
PROYECTO 3: PLATAFORMA CREA Y CRECE B2B
# Portal de Intercambio de Factura Electrónica y Control de Estados de Pago

## 1. DESCRIPCIÓN GENERAL Y PROPUESTA DE VALOR
La Plataforma Crea y Crece B2B es un portal en la nube enfocado al cumplimiento de la
ley de factura electrónica obligatoria entre empresas y profesionales (B2B) en España.
A diferencia de Verifactu, que controla la relación fiscal con Hacienda, esta ley
regula la relación comercial entre empresas, prohibiendo el uso de PDFs simples por
correo electrónico y obligando a utilizar formatos estructurados intercambiables
con reporte de estados.

La plataforma servirá como "buzón de facturas electrónicas" para recibir, validar,
firmar, emitir y reportar el estado de cada factura (aceptada, rechazada, pagada).
Su valor diferencial será la automatización bancaria: conectarse al banco de la
empresa para detectar el pago y reportarlo automáticamente a la plataforma estatal
sin intervención manual.

## 2. MARCO LEGAL Y NORMATIVA VIGENTE (ACTUALIZADO 2026)
*   Norma Principal: Ley 18/2022 (Ley Crea y Crece) y su Reglamento de desarrollo,
    el Real Decreto 238/2026, publicado en el BOE en marzo de 2026.
*   Plazos de Obligatoriedad (Empiezan a contar desde la inminente Orden Ministerial
    técnica):
    *   Empresas con facturación anual > 8 Millones de Euros: Obligatorio a los
        12 meses de la orden (Previsión: mediados de 2027).
    *   Resto de empresas y autónomos: Obligatorio a los 24 meses de la orden
        (Previsión: mediados/finales de 2028).
*   Obligaciones Legales Clave:
    *   Uso obligado de formatos estructurados: Facturae 3.2.x, UBL, CII o EDIFACT.
    *   Obligación del receptor de reportar el estado de la factura de forma gratuita.
    *   Estados obligatorios a reportar:
        *   Aceptación o rechazo comercial de la factura (y su fecha).
        *   Pago efectivo completo o parcial de la factura (y su fecha de pago real).
        *   Este último punto es clave para vigilar los plazos de morosidad comercial
            (máximo legal de 60 días).

## 3. REQUISITOS TÉCNICOS Y FUNCIONALES
A) Generador de XML Facturae / UBL: Capacidad para serializar facturas en el formato
   oficial español (Facturae versión 3.2.2 o superior) que es un esquema XML específico, o
   en el estándar europeo UBL 2.1 (Common Procurement Vocabulary).
B) Conexión a Redes de Distribución: Integración con la Red Estatal Pública de Factura
   Electrónica (AEAT) y con redes privadas internacionales (PEPPOL) mediante protocolo AS4.
C) Firma Electrónica Delegada o Propia: Firmado digital de los documentos XML con
   certificado de sello de la plataforma (firma por cuenta de terceros) o con certificado
   del propio emisor.
D) API de Estados de Factura: Endpoints para recibir y enviar los cambios de estado:
   `SUBMITTED` -> `RECEIVED` -> `ACCEPTED/REJECTED` -> `PAID`.
E) Integración PSD2 (Open Banking): Conexión con APIs bancarias para conciliar los pagos
   recibidos por transferencia bancaria con las facturas emitidas, automatizando el
   reporte legal de la fecha de pago real.

## 4. ARQUITECTURA DE SOFTWARE E INFRAESTRUCTURA CLOUD RECOMENDADA
*   Backend: Python (FastAPI o Django) debido a su excelente ecosistema para procesar
    e inspeccionar ficheros XML de gran tamaño de manera rápida, además de contar con
    buenas librerías para validación de esquemas XSD.
*   Base de Datos: PostgreSQL para almacenar la relación relacional compleja de clientes,
    facturas, ítems, impuestos, y el historial detallado de estados.
*   Automatización Bancaria (PSD2): Integración de SaaS de agregación bancaria de
    terceros como Gocardless (anteriormente Nordigen) o Tink, que permiten consultar
    movimientos bancarios de forma segura por un coste muy bajo.
*   Servicios Cloud: AWS (ECS Fargate para contenerizar la aplicación, RDS para base de
    datos y S3 para almacenamiento en frío de las facturas XML firmadas que deben
    conservarse por ley durante un mínimo de 4 años).

## 5. EJEMPLO PRÁCTICO (FORMATO XML FACTURAE 3.2.2 Y FLUJO DE ESTADOS)
Las facturas se transforman a XML estructurado. A continuación se muestra un fragmento
esencial de cabecera de Facturae 3.2.2:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<fe:Facturae xmlns:fe="http://www.facturae.es/Facturae/2014/v3.2.2/Facturae">
  <FileHeader>
    <SchemaVersion>3.2.2</SchemaVersion>
    <Modality>I</Modality>
    <Batch>
      <BatchIdentifier>BATCH-2026-9923</BatchIdentifier>
      <InvoicesCount>1</InvoicesCount>
      <TotalInvoicesAmount>
        <TotalAmount>121.00</TotalAmount>
      </TotalInvoicesAmount>
    </Batch>
  </FileHeader>
  <Parties>
    <SellerParty>
      <TaxIdentification>
        <PersonTypeCode>J</PersonTypeCode>
        <ResidenceTypeCode>R</ResidenceTypeCode>
        <TaxIdentificationNumber>B12345678</TaxIdentificationNumber>
      </TaxIdentification>
      <LegalEntity>
        <CorporateName>Hacienda Solutions S.L.</CorporateName>
        <AddressInSpain>
          <Address>Calle Falsa 123</Address>
          <PostCode>36201</PostCode>
          <Town>Vigo</Town>
          <Province>Pontevedra</Province>
        </AddressInSpain>
      </LegalEntity>
    </SellerParty>
    <BuyerParty>
      <!-- Datos del comprador similares -->
    </BuyerParty>
  </Parties>
</fe:Facturae>
```

Flujo Obligatorio de Estados de Pago en la Base de Datos:
[EMITIDA] (Creado XML)
   │
   ▼
[RECIBIDA EN DESTINO] (Confirmado por el Access Point receptor)
   │
   ├──────────────────────────────┐
   ▼                              ▼
[ACEPTADA comercialmente]     [RECHAZADA] (Con motivo de rechazo en XML)
   │
   ▼
[PAGADA] (Se registra fecha de cobro efectivo y método de pago. Obligatorio reportar a la AEAT/Cliente)

## 6. ESTIMACIÓN DE COSTES DE LANZAMIENTO Y OPERACIÓN
Este proyecto tiene costes adicionales de conectores y APIs financieras:

A) Infraestructura y SaaS (Mensual):
   *   Hosting de Servidores (AWS ECS Fargate): 60 USD/mes.
   *   Base de datos Relacional (AWS RDS PostgreSQL): 50 USD/mes.
   *   Almacenamiento XML Seguro (AWS S3 con retención legal locked): 10 USD/mes.
   *   Acceso a PEPPOL (SaaS Access Point Provider / e-Delivery API como Storecove):
       ~90 USD/mes (incluye una cuota fija y coste marginal por factura enviada).
   *   API de Agregación Bancaria (Gocardless/Nordigen para 100 bancos conectados):
       ~19 USD/mes.
   *   TOTAL ESTIMADO OPERACIÓN: ~229 USD/mes.

B) Costes de Desarrollo:
   *   Estimación de horas: 250 horas de desarrollo (por la integración del conector
       AS4/PEPPOL, la pasarela PSD2 y los mapeos XML complejos).
   *   Costo de desarrollo estimado: ~10.000 EUR a ~15.000 EUR.

## 7. ESTRATEGIA DE MONETIZACIÓN Y VIABILIDAD
*   Modelo Freemium para receptores y Planes de Pago para emisores:
    *   Plan Recepción: Gratis (Permite recibir facturas electrónicas y cambiar sus
        estados manualmente como exige la ley).
    *   Plan Emisión Lite: 15€/mes (Hasta 100 facturas emitidas y firmadas).
    *   Plan Conciliación Pro: 35€/mes (Emisión ilimitada + conexión bancaria PSD2
        para auto-conciliación de cobros y reporte automático de estados).
*   Punto de Equilibrio: Con 15 clientes en el Plan Conciliación Pro se cubren holgadamente
    los costes de servidor, PEPPOL y API Bancaria.
*   Viabilidad: Crítica. La Ley Crea y Crece obliga a que el 100% de las transacciones
    comerciales en España utilicen este sistema. Dado que el software estatal público
    será básico, las empresas que deseen automatizar el proceso (especialmente la
    tediosa tarea de reportar cuándo se pagan las facturas) pagarán con gusto una cuota
    mensual para evitar sanciones por morosidad y ahorrar horas de administración.