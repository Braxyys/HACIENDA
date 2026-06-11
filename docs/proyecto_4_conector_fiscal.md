================================================================================
PROYECTO 4: CONECTOR FISCAL MULTITERRITORIAL
# Módulo de Integración para TicketBAI, SII y VeriFactu

## 1. DESCRIPCIÓN GENERAL Y PROPUESTA DE VALOR
El Conector Fiscal Multiterritorial es una solución de infraestructura de software
(en forma de microservicio autohospedable o SaaS Enterprise) diseñada para medianas
empresas, franquicias con presencia en diversas comunidades autónomas, y grandes
desarrolladores de software que necesitan cumplir con los tres grandes sistemas fiscales
coexistentes en España:
1.  **TicketBAI:** Obligatorio en el País Vasco (Bizkaia, Gipuzkoa y Álava), cada
    provincia con su propio software garante y especificaciones de envío.
2.  **SII (Suministro Inmediato de Información):** Obligatorio a nivel nacional
    para empresas que facturan más de 6 millones de euros anuales, grupos de IVA y
    aquellas inscritas en el REDEME.
3.  **Veri*factu:** El nuevo estándar para el resto del territorio español para
    empresas no obligadas al SII.

Este conector actúa como un "router inteligente fiscal". El sistema cliente envía
la factura sin preocuparse de la provincia del emisor. El conector analiza el NIF,
el código postal y el nivel de facturación, formatea el fichero (XML o JSON), lo
firma con el certificado correspondiente de la empresa o delegación y lo envía a la
hacienda foral o estatal correspondiente.

## 2. MARCO LEGAL Y NORMATIVA VIGENTE (ACTUALIZADO 2026)
*   **TicketBAI:** Regulado por las Normas Forales específicas de cada territorio
    histórico (Álava, Bizkaia, Gipuzkoa). Completamente vigente y obligatorio
    desde 2022-2024. Exige firmar con certificado del dispositivo o de empresa
    y encadenar ficheros XML (firmados en formato XAdES).
*   **SII (Suministro Inmediato de Información):** Regulado por el Real Decreto
    596/2016. Obliga a enviar el detalle de las facturas emitidas y recibidas en
    un plazo máximo de 4 días hábiles desde su emisión a la sede electrónica de la
    AEAT en formato XML SOAP.
*   **Veri*factu:** Desarrollado bajo la Orden HAC/1177/2024. Exige remisión
    inmediata en formato JSON/XML.
*   *Nota Crítica:* Las empresas obligadas al SII quedan exentas de Veri*factu. Sin
    embargo, si operan en el País Vasco, sí están obligadas a TicketBAI (salvo
    ciertas excepciones de Bizkaia LROE). El conector gestiona estas exclusiones
    y solapamientos de forma automática.

## 3. REQUISITOS TÉCNICOS Y FUNCIONALES
A) Enrutamiento Dinámico de Destino: Clasificación automática según reglas fiscales:
   *   Si emisor.Provincia IN ('Vizcaya', 'Guipúzcoa', 'Álava') -> Aplicar reglas
       y esquemas de TicketBAI correspondientes.
   *   Si emisor.ObligadoSII == True -> Aplicar esquema XML SII AEAT (envío en 4 días).
   *   Si no aplica lo anterior -> Aplicar formato Veri*factu AEAT (envío inmediato).
B) Gestión Multicertificado: Almacenamiento seguro y selección automática de firmas
   según el NIF del emisor y la diputación foral correspondiente.
C) Normalización de Respuestas: Conversión de las respuestas heterogéneas de cada
   Hacienda (errores SOAP de Álava, respuestas JSON de Bizkaia LROE, respuestas XML
   de AEAT) en una única estructura JSON unificada legible para el ERP cliente.

## 4. ARQUITECTURA DE SOFTWARE E INFRAESTRUCTURA CLOUD RECOMENDADA
*   Lenguaje: Java (Spring Boot) o C# (.NET Core). Son las tecnologías estándar
    en grandes empresas y corporaciones (Target de este producto), lo que facilita
    su integración en infraestructuras on-premise si es requerido.
*   Base de Datos: PostgreSQL con replicación de datos para auditorías severas.
*   Mensajería y Colas: Apache Kafka o AWS SQS. Dado el volumen empresarial, se
    requiere tolerancia a fallos extrema y procesamiento de eventos en tiempo real.
*   Seguridad Criptográfica: HSM físico o virtual (Hardware Security Module) tipo
    AWS CloudHSM, requerido para custodiar de forma ultra-segura los certificados
    de representación de grandes corporaciones.

## 5. EJEMPLO PRÁCTICO (CÓDIGO DE ENRUTAMIENTO FISCAL)
A continuación se muestra un fragmento conceptual en Python de cómo el conector
decide el canal de envío y aplica las normativas según el origen del emisor:

```python
def enrutar_factura_fiscal(factura_data, emisor_profile):
    """
    Decide el destino fiscal y formatea la petición según la provincia y obligaciones.
    """
    provincia = emisor_profile.get("provincia").upper()
    es_obligado_sii = emisor_profile.get("obligado_sii", False)
    
    # 1. Enrutamiento a Haciendas Forales Vascas (TicketBAI)
    if provincia in ["BIZKAIA", "VIZCAYA"]:
        return procesar_ticketbai_bizkaia(factura_data, emisor_profile)
    elif provincia in ["GIPUZKOA", "GUIPUZCOA"]:
        return procesar_ticketbai_gipuzkoa(factura_data, emisor_profile)
    elif provincia in ["ARABA", "ALAVA"]:
        return procesar_ticketbai_alava(factura_data, emisor_profile)
        
    # 2. Enrutamiento a la AEAT Nacional (SII vs Verifactu)
    if es_obligado_sii:
        # Envío al SII (Suministro Inmediato de Información)
        return procesar_sii_nacional(factura_data, emisor_profile)
    else:
        # Envío al nuevo sistema VERIFACTU
        return procesar_verifactu_nacional(factura_data, emisor_profile)

def procesar_verifactu_nacional(factura, emisor):
    # Lógica para firmar en JWS/XAdES y enviar a la AEAT
    url_endpoint = "https://www2.agenciatributaria.gob.es/wlpl/TBAI-VFCT/WD/Verifactu"
    print(f"Enviando factura {factura['id']} a Verifactu con certificado de {emisor['razon_social']}")
    # Retorna la estructura JSON unificada para el ERP
    return {
        "sistema": "VERIFACTU",
        "endpoint": url_endpoint,
        "firmada": True,
        "estado": "PENDIENTE_ENVIO"
    }
```

## 6. ESTIMACIÓN DE COSTES DE LANZAMIENTO Y OPERACIÓN
Este conector suele desplegarse en modo híbrido o SaaS corporativo con altos niveles de
acuerdo de nivel de servicio (SLA).

A) Infraestructura Cloud (Mensual):
   *   Servidores de Aplicación (AWS EKS - Kubernetes Cluster con escalado automático):
       150 USD/mes.
   *   Base de datos Multi-AZ (AWS RDS PostgreSQL redundante): 100 USD/mes.
   *   Cola de Mensajes Empresarial (AWS Managed Kafka / Amazon MSK): 60 USD/mes.
   *   Módulo de Criptografía (AWS CloudHSM para custodia empresarial): 1.500 USD/mes.
       *Nota: El HSM es opcional si se opta por cifrado por software en AWS KMS (~10 USD/mes),
       pero recomendado legalmente para corporaciones financieras.*
   *   TOTAL ESTIMADO OPERACIÓN: ~320 USD/mes (Software KMS) o ~1.810 USD/mes (Hardware HSM).

B) Costes de Desarrollo:
   *   Estimación de horas: 400 horas de desarrollo (requiere estudiar y programar
       múltiples protocolos: SOAP del SII, formatos XML firmados de TicketBAI, REST de
       Verifactu, y configurar HSMs).
   *   Costo de desarrollo estimado: ~18.000 EUR a ~25.000 EUR.

## 7. ESTRATEGIA DE MONETIZACIÓN Y VIABILIDAD
*   Venta de Licencias Corporativas (On-premise / Private Cloud):
    *   Licencia única de instalación: 5.000 EUR a 15.000 EUR.
    *   Soporte y mantenimiento anual (SLA 24/7): 20% del valor de la licencia/año.
*   Modelo SaaS Enterprise (Multi-tenant):
    *   Suscripción mensual por volumen de empresas filiales: Desde 499€/mes para hasta
        20 empresas bajo el mismo grupo, con soporte técnico prioritario.
*   Viabilidad: Alta rentabilidad, aunque volumen de clientes menor. Hay miles de
    franquicias de restauración, retail o clínicas médicas en España con tiendas en
    Bilbao, Madrid y Barcelona. Su ERP central no puede implementar de manera nativa y
    eficiente tres sistemas de facturación fiscal a la vez. Pagarán con gusto por un
    conector fiscal pre-certificado llave en mano.