================================================================================
INFORME RESUMEN: INCUBADORA DE PROYECTOS FISCALES HACIENDA (VERIFACTU & B2B)
# Análisis de Viabilidad, Costes y Hoja de Ruta - Junio 2026

Este documento consolida la información técnica, legal y financiera de las cuatro
ideas de proyecto generadas para el cumplimiento de las normativas de facturación
de la Agencia Tributaria (AEAT) en España y las haciendas forales vascas.
## 
## 1. MATRIZ COMPARATIVA DE PROYECTOS

| Proyecto | Público Objetivo | Inversión Dev. | Coste SaaS/Mes | Margen SaaS | Dificultad | Plazo Urgencia |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| 1. SaaS FacturaFácil | Autónomos, Micro-PYMEs | ~4.000€ - 6.000€ | ~50€ | Alto (>90%) | Media-Baja | Julio 2027 (Autónomos) |
| 2. API Middleware | Casas de software, ERPs | ~8.000€ - 12.000€ | ~220€ | Muy Alto | Media-Alta | Enero 2027 (Sociedades)|
| 3. Portal Crea y Crece | B2B (Pymes, Autónomos) | ~10.000€ - 15.000€| ~229€ | Medio-Alto | Alta | Mediados 2027/28 (B2B) |
| 4. Conector Fiscal | Franquicias, Corporativo | ~18.000€ - 25.000€| ~320€ - 1.810€| Excelente | Muy Alta | Inmediata (TicketBAI) |
## 
## 2. ANÁLISIS DETALLADO DE OPORTUNIDAD

A) PROYECTO 1: SaaS FacturaFácil VeriFactu (SaaS B2C/B2B de bajo coste)
   *   Oportunidad: El mercado es gigantesco (más de 3 millones de autónomos en España).
       Muchos usan soluciones obsoletas (Excel, Word) que serán ilegales a partir del
       1 de julio de 2027.
   *   Viabilidad Financiera: Muy alta. Con una suscripción media de 12€/mes, se
       alcanza el punto de equilibrio operativo con solo 5 clientes.
   *   Riesgo: Mucha competencia de actores grandes (FacturaDirecta, Anfix, Quipu),
       por lo que requiere diferenciarse con una interfaz ultra-sencilla y precio
       competitivo.

B) PROYECTO 2: API VeriFactu Link (Middleware B2B para programadores)
   *   Oportunidad: Hay cientos de pequeños ERPs sectoriales (para hostelería, talleres,
       clínicas dentales) creados por programadores locales o pequeñas agencias que no
       tienen el tiempo ni el conocimiento criptográfico para adaptar su código a
       Verifactu antes de enero de 2027.
   *   Viabilidad Financiera: Excelente. Un desarrollador de software pagará de
       buena gana 99€/mes para que todas sus instalaciones cumplan la ley a través de
       una llamada a API.
   *   Riesgo: Requiere dar un soporte técnico ágil y mantener un SLA del 99.9%.

C) PROYECTO 3: Plataforma Crea y Crece B2B (E-Invoicing con estados)
   *   Oportunidad: El intercambio obligatorio de facturas electrónicas (en XML o UBL)
       y el reporte de los estados de pago (para controlar la morosidad comercial) es el
       mayor cambio administrativo en España en décadas.
   *   Viabilidad Financiera: Buena, pero depende de la conexión con redes (PEPPOL)
       y de agregadores bancarios (PSD2) que tienen costes de transacción marginales.
   *   Riesgo: La ley está pendiente de la publicación de la Orden Ministerial para
       iniciar los plazos exactos.

D) PROYECTO 4: Conector Fiscal Multiterritorial (Solución Enterprise)
   *   Oportunidad: Grandes marcas, cadenas comerciales y franquiciadoras nacionales
       que facturan en todo el territorio español y necesitan centralizar su reporting a
       la AEAT (SII y Verifactu) y a las Diputaciones Forales Vascas (TicketBAI) en un
       único servicio robusto.
   *   Viabilidad Financiera: Máximo retorno por cliente (tickets de >5.000€ en licencias).
   *   Riesgo: El ciclo de venta corporativo es largo (entre 3 y 9 meses) y requiere
       mucha seguridad física de certificados (HSM).
## 
## 3. RECOMENDACIÓN DE LA INCUBADORA: ¿POR DÓNDE EMPEZAR?
Se recomienda seguir una estrategia de desarrollo escalonada para maximizar el
aprovechamiento de código y mitigar riesgos financieros:

1.  **FASE 1: Desarrollar el Proyecto 2 (API VeriFactu Link)**
    *   *Razón:* Es el núcleo criptográfico del sistema. Al desarrollar la API de firma,
        encadenamiento hash SHA-256 y envío SOAP/REST a la AEAT, habrás construido el
        80% del motor técnico requerido para todos los demás proyectos.
    *   *Salida al mercado:* Rápida y dirigida a desarrolladores (menor coste de
        marketing).

2.  **FASE 2: Desarrollar el Proyecto 1 (SaaS FacturaFácil)**
    *   *Razón:* Reutilizando al 100% la API construida en la Fase 1, solo tendrás
        que diseñar una interfaz web bonita y simple (Next.js) para que los autónomos
        puedan registrarse y facturar directamente en la nube.
    *   *Diferenciador:* Tu SaaS llamará a tu propia API Middleware.

3.  **FASE 3: Ampliación al Proyecto 3 (Crea y Crece B2B)**
    *   *Razón:* Una vez asegurada la cuota de mercado de Verifactu, la plataforma se
        actualiza con la conversión a Facturae XML y la agregación bancaria PSD2 para
        el control automático de cobros.
## 
## 4. CHECKLIST DE CUMPLIMIENTO LEGAL MÍNIMO ANTE LA AEAT
Para que cualquiera de los proyectos sea viable comercialmente, se debe realizar el
siguiente trámite administrativo:
*   [ ] Declaración Responsable: Los fabricantes de software Verifactu deben incluir
        en el código y en el contrato una declaración formal firmada electrónicamente
        que certifique que el sistema cumple con la Ley Antifraude y la Orden HAC/1177/2024.
*   [ ] Homologación: Aunque Hacienda no "certifica" de manera proactiva e individual
        cada programa, sí publica una lista en su web de "Sistemas Veri*factu declarados".
        Es obligatorio inscribir el software en dicho listado.
*   [ ] Formato QR Legible: Validar que el QR generado en los PDFs de prueba es
        fácilmente legible por dispositivos móviles y redirige correctamente a la
        URL de verificación de la AEAT.
*   [ ] Registro de Eventos (Traceability Log): Implementar una tabla específica en la
        base de datos que registre cualquier evento del sistema (inicio de sesión, fallos de
        red, modificaciones de configuración), la cual no pueda ser modificada por
        ningún usuario (incluso administradores).