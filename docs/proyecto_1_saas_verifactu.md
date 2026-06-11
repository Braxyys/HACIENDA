================================================================================
PROYECTO 1: SAAS FACTURAFÁCIL VERIFACTU
# SaaS de Facturación Ligera para Autónomos y Micro-PYMEs

## 1. DESCRIPCIÓN GENERAL Y PROPUESTA DE VALOR
SaaS FacturaFácil VeriFactu es una plataforma web (software como servicio) diseñada
específicamente para cubrir las necesidades de autónomos y micro-PYMEs españolas que
deben adaptarse obligatoriamente al nuevo sistema informático de facturación
(reglamento Veri*factu).

Muchos softwares tradicionales son caros o complejos para autónomos. Este SaaS
ofrecerá una interfaz minimalista, moderna y de bajo coste, cuyo principal pilar
es el cumplimiento automático de la ley sin requerir conocimientos técnicos del
usuario.

## 2. MARCO LEGAL Y NORMATIVA VIGENTE (ACTUALIZADO 2026)
*   Norma Principal: Ley 11/2021 (Ley Antifraude), desarrollada por el Real
    Decreto 1007/2023 y la Orden Ministerial HAC/1177/2024 (publicada en el BOE el
    28 de octubre de 2024).
*   Plazos de Obligatoriedad (Modificados en 2025/2026):
    *   Sociedades (Impuesto sobre Sociedades): Obligatorio antes del 1 de enero
        de 2027.
    *   Autónomos y profesionales físicos: Obligatorio antes del 1 de julio de
        2027.
*   Obligaciones Legales del Software:
    *   Imposibilidad de borrar o modificar facturas registradas (prevención de
        "software de doble uso").
    *   Generación de un registro de facturación de alta (u modificación) por cada
        operación.
    *   Encadenamiento criptográfico (hash) de la factura actual con la anterior.
    *   Firma digital integrada de los registros de facturación.
    *   Inclusión de un código QR y la leyenda "VERIFACTU" en la factura física o PDF.
    *   Remisión inmediata y automática de los registros a los servidores de la
        Agencia Tributaria (AEAT) al expedir la factura.

## 3. REQUISITOS TÉCNICOS Y FUNCIONALES
A) Registro de Facturación: Debe ser inalterable. Si hay un error, se debe emitir
   una factura rectificativa; nunca modificar o eliminar el registro original.
B) Encadenamiento Criptográfico (Hash Chaining):
   El campo "Huella" (Hash SHA-256) de la factura actual se calcula concatenando:
   - NIF del emisor.
   - Número y serie de la factura.
   - Fecha de expedición.
   - Hash de la factura inmediatamente anterior.
C) Firma Digital: Cada registro enviado debe firmarse con un certificado digital
   reconocido (X.509) compatible con XAdES o JSON Web Signatures (JWS).
D) Código QR de Verificación: Debe contener una URL oficial de la AEAT con la
   siguiente estructura de parámetros mínimos:
   https://www2.agenciatributaria.gob.es/wlpl/TBAI-VFCT/QR?nif=...&numserie=...&fecha=...&importe=...&hash=...

## 4. ARQUITECTURA DE SOFTWARE E INFRAESTRUCTURA CLOUD RECOMENDADA
*   Frontend: React / Next.js (desplegado en Vercel o Netlify para carga rápida y
    SEO excelente).
*   Backend: Node.js (TypeScript) sobre AWS Lambda o Google Cloud Run (serverless,
    pago por uso, escala a cero si no hay actividad).
*   Base de Datos: Supabase / PostgreSQL con activación de "Row Level Security"
    (RLS) y tablas con restricciones de lectura/escritura (Audit Logs bloqueados,
    solo inserciones).
*   Criptografía y Firmas: AWS KMS (Key Management Service) o HashiCorp Vault para
    almacenar de forma segura el certificado digital de facturación del SaaS y
    realizar las firmas del lado del servidor sin exponer claves privadas.
*   Generador de PDF y QR: Librería jsPDF o Puppeteer en Lambda, integrada con
    qrcode.js.
*   Cola de Mensajería: BullMQ (con Redis) o AWS SQS para encolar los envíos a la
    AEAT en caso de caída temporal del servidor de Hacienda.

## 5. EJEMPLO PRÁCTICO (FORMATO DE DATOS)
A continuación se detalla el esquema JSON que el backend procesa para generar el
registro VeriFactu que se remite a la AEAT:

```json
{
  "cabecera": {
    "obligadoTi": "A1234567B",
    "nombreRazon": "Juan Pérez Lorenzo S.L.",
    "version": "1.0"
  },
  "registroFactura": {
    "numSerieFactura": "FAC-2026-0089",
    "fechaExpedicionFactura": "2026-06-04",
    "horaExpedicionFactura": "15:07:23",
    "tipoFactura": "F1",
    "destinatario": {
      "nif": "B98765432",
      "nombreRazon": "Distribuciones Bahía S.L."
    },
    "desgloseSujeta": {
      "iva": [
        {
          "tipoImpositivo": 21.00,
          "baseImponible": 1000.00,
          "cuotaRepercutida": 210.00
        }
      ]
    },
    "importeTotal": 1210.00,
    "huellaRegistroAnterior": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "huellaActual": "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92"
  }
}
```

Algoritmo conceptual para el cálculo de la huella actual:
HuellaActual = SHA256(
  NIFEmisor + "|" + SerieNumero + "|" + FechaExp + "|" + Importe + "|" + HuellaAnterior
)

Ejemplo de URL para el código QR:
https://www2.agenciatributaria.gob.es/wlpl/TBAI-VFCT/QR?nif=A1234567B&numserie=FAC-2026-0089&fecha=04-06-2026&importe=1210.00&hash=8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92

## 6. ESTIMACIÓN DE COSTES DE LANZAMIENTO Y OPERACIÓN
Este proyecto se puede lanzar con costes fijos extremadamente bajos apoyándose en
servicios Cloud "Serverless" y capas gratuitas (Free Tier):

A) Infraestructura y SaaS (Mensual):
   *   Hosting Frontend (Vercel Pro): 20 USD/mes (Capacidad para múltiples clientes).
   *   Base de datos (Supabase Pro): 25 USD/mes (Suficiente para >500 clientes activos).
   *   Firmado y Claves (AWS KMS): ~5 USD/mes (Aprox. 0.03$ por cada 10.000 operaciones).
   *   Servidor Serverless (AWS Lambda): ~0 USD (La capa gratuita cubre hasta 1 millón de peticiones al mes).
   *   Dominio Web (.com o .es): 12 USD/año.
   *   Certificado SSL: Gratis (a través de Let's Encrypt / Vercel).
   *   Certificado Digital de Empresa (FNMT/Camerfirma) para firma de pruebas: 15 USD/año.
   *   TOTAL ESTIMADO OPERACIÓN: ~50 USD/mes en etapa inicial.

B) Costes de Desarrollo:
   *   Estimación de horas: 120 horas de desarrollo (1 programador Full Stack durante 1 mes).
   *   Costo de desarrollo estimado: ~4.000 EUR a ~6.000 EUR (si se subcontrata).

## 7. ESTRATEGIA DE MONETIZACIÓN Y VIABILIDAD
*   Modelo SaaS por suscripción recurrente mensual/anual:
    *   Plan Freelance: 9€/mes (Hasta 50 facturas/mes).
    *   Plan Pyme: 19€/mes (Facturas ilimitadas, múltiples usuarios, soporte prioritario).
*   Punto de Equilibrio (Break-Even): Con solo 6 clientes de pago en el Plan Pyme se
    cubren los costes de infraestructura del servidor.
*   Viabilidad: Muy alta. La ley obliga a cientos de miles de autónomos a contratar
    un software que cumpla con Veri*factu antes de julio de 2027. Muchos de ellos
    usan Excel o plantillas Word y buscarán la opción más barata y sencilla del mercado.