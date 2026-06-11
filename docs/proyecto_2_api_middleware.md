================================================================================
PROYECTO 2: API VERIFACTU LINK
# Middleware API para Integración y Adaptación de Software Heredado (ERPs)

## 1. DESCRIPCIÓN GENERAL Y PROPUESTA DE VALOR
API VeriFactu Link es una solución B2B en formato Middleware (API Web). Su objetivo
es permitir que desarrolladores de ERPs tradicionales, programas de escritorio y
sistemas de gestión empresarial (CRM, TPVs locales) cumplan con la normativa
Veri*factu de forma inmediata sin tener que reescribir su lógica interna de base de
datos, implementar criptografía compleja o gestionar envíos mTLS a la AEAT.

Los desarrolladores solo tienen que realizar una llamada HTTP POST en JSON a la API.
La API se encarga de:
- Mantener la base de datos de encadenamiento (hashes).
- Firmar digitalmente el registro con el certificado del cliente.
- Generar el código QR oficial.
- Comunicarse de forma síncrona/asíncrona con la Agencia Tributaria.
- Devolver el PDF listo para imprimir o el fragmento del QR para su inclusión.

## 2. MARCO LEGAL Y NORMATIVA VIGENTE (ACTUALIZADO 2026)
*   Norma Principal: Real Decreto 1007/2023 y Orden HAC/1177/2024.
*   Plazos: 1 de enero de 2027 (sociedades desarrolladoras y clientes) y 1 de julio de 2027 (autónomos).
*   Responsabilidad Legal: La ley estipula que los fabricantes de software deben
    firmar una "Declaración Responsable" de cumplimiento. Si una empresa usa un
    ERP no adaptado, se expone a multas de hasta 50.000 EUR. Si un desarrollador
    vende software de doble uso o que permita ocultar ventas, la multa puede
    ascender a 150.000 EUR.
*   Este middleware permite a las casas de software locales certificar sus sistemas
    rápidamente delegando la complejidad técnica en un proveedor especializado.

## 3. REQUISITOS TÉCNICOS Y FUNCIONALES
A) Autenticación mTLS (Mutua TLS): La comunicación con la AEAT requiere el uso de
   certificados digitales de sello de empresa o de representante de persona jurídica
   instalados en el canal HTTPS de cliente.
B) Firma XAdES (XML Advanced Electronic Signatures): El formato oficial de
   intercambio con Hacienda es XML firmado bajo el estándar XAdES-BES.
C) Caching y Cola de Reintentos: En caso de caída de los servidores de la AEAT, el
   software debe almacenar el registro de facturación de forma local y reintentar
   el envío en segundo plano, informando al ERP que la factura ha sido registrada
   criptográficamente ("Veri*factu no enviado aún").
D) Aislamiento de Datos por Cliente (Multi-tenancy): Cada desarrollador o ERP
   registrado tiene sus propios "tenants" que representan a sus clientes emisores.
   Cada emisor tiene sus propios certificados cargados y su propia cadena de hashes.

## 4. ARQUITECTURA DE SOFTWARE E INFRAESTRUCTURA CLOUD RECOMENDADA
*   Backend API: Go (Golang) o Rust. Se recomiendan estos lenguajes por su alta
    velocidad de procesamiento de firmas XMLDSig/XAdES y su consumo ultra-bajo de
    memoria y CPU, clave para una API que procesará millones de facturas diarias.
*   Gestor de Certificados Seguros: HashiCorp Vault. Almacena de forma cifrada en
    hardware/software los certificados digitales (.p12 / .pfx) de todos los clientes
    y expone endpoints seguros de firma.
*   Base de Datos / Cache: Redis Enterprise (para mantener el último hash generado
    por emisor de forma ultra-rápida en memoria) y PostgreSQL (para el log de auditoría
    y persistencia a largo plazo de las facturas enviadas).
*   Encolamiento: RabbitMQ para procesar de manera asíncrona los reintentos a la
    AEAT.

## 5. EJEMPLO PRÁCTICO (FORMATO DE ENTRADA Y SALIDA DE LA API)
El ERP local envía una petición HTTP POST a la API:

**Endpoint:** `POST https://api.verifactulink.es/v1/facturas`
**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer api_key_test_12345`
- `X-Emisor-NIF: A1234567B`

**Payload de Entrada (JSON enviado por el ERP heredado):**
```json
{
  "serie": "A",
  "numero": "2026-104",
  "fecha": "2026-06-04",
  "hora": "15:10:00",
  "cliente_nif": "B87654321",
  "cliente_razon_social": "Suministros Lorenzo S.A.",
  "base_imponible": 500.00,
  "tipo_iva": 21.00,
  "importe_total": 605.00
}
```

**Payload de Salida (Respuesta de la API al ERP):**
```json
{
  "status": "success",
  "aeat_status": "accepted",
  "factura_id": "vf_98a7c2b3d4e5",
  "fecha_registro": "2026-06-04T15:10:02Z",
  "huella_calculada": "c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9",
  "codigo_qr_url": "https://www2.agenciatributaria.gob.es/wlpl/TBAI-VFCT/QR?nif=A1234567B&numserie=A-2026-104&fecha=04-06-2026&importe=605.00&hash=c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9",
  "texto_legal": "Factura verificable en la sede electrónica de la AEAT - VERIFACTU",
  "xml_firmado_base64": "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c2lnbmVkX2RhdGE+..."
}
```

## 6. ESTIMACIÓN DE COSTES DE LANZAMIENTO Y OPERACIÓN
Este proyecto está enfocado a entornos de alta disponibilidad, por lo que requiere
servidores dedicados o servicios gestionados estables.

A) Infraestructura y SaaS (Mensual):
   *   Servidor API (AWS EC2 / DigitalOcean Droplet - 2x Nodos para HA): 80 USD/mes.
   *   Base de datos Relacional (AWS RDS PostgreSQL): 50 USD/mes.
   *   Redis Managed (Aiven / Redis Labs): 30 USD/mes.
   *   HashiCorp Vault (AWS KMS Backed o Cloud Vault): 40 USD/mes (cifrado de certificados).
   *   Balanceador de Carga (AWS ALB): 20 USD/mes.
   *   TOTAL ESTIMADO OPERACIÓN: ~220 USD/mes.

B) Costes de Desarrollo:
   *   Estimación de horas: 200 horas de desarrollo (debido a la complejidad criptográfica
       de firma XAdES y gestión segura de certificados en Vault).
   *   Costo de desarrollo estimado: ~8.000 EUR a ~12.000 EUR.

## 7. ESTRATEGIA DE MONETIZACIÓN Y VIABILIDAD
*   Modelo SaaS basado en volumen de peticiones (API billing):
    *   Plan Starter: 49€/mes (Hasta 2.500 facturas/mes).
    *   Plan Growth: 99€/mes (Hasta 10.000 facturas/mes).
    *   Plan Enterprise: 299€/mes (Hasta 50.000 facturas/mes, +0.005€ por factura adicional).
*   Punto de Equilibrio: Con 3 clientes en el plan Growth o 5 en el plan Starter ya
    se cubren los costes mensuales de infraestructura.
*   Viabilidad: Excelente y con menor competencia directa. Desarrollar un módulo
    Verifactu desde cero es extremadamente costoso para un desarrollador local
    que vende TPVs o ERPs para pequeños nichos (talleres, peluquerías, panaderías).
    Pagar 49€/mes y subcontratar toda la complejidad legal y técnica por API es una
    propuesta de valor muy atractiva.