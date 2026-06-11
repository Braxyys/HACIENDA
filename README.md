# FacturaFácil - Hacienda Compliance Master Suite 🇪🇸

Este repositorio contiene una suite multiproducto comercial y demostrativa para el cumplimiento de las normativas de facturación vigentes en España (**reglamento Veri*factu, TicketBAI y Ley Crea y Crece**). 

Evolucionado de un portal técnico a un **SaaS comercializable listo para demostraciones de negocio**, el proyecto cuenta con una landing page de venta, simulación de control de accesos (RBAC), gestión de usuarios organizativa e indicadores financieros en vivo.

---

## 📂 Estructura del Repositorio

El proyecto se organiza en una arquitectura limpia, modular y estática de la siguiente manera:

```
/ (raíz del proyecto)
├── index.html                   <-- Landing page SaaS comercial de FacturaFácil + Modal de Login
├── legal/                       <-- Aviso legal, privacidad y cookies (LSSI-CE / RGPD) [completar titular]
├── README.md                    <-- Esta guía explicativa del repositorio
├── .gitignore                   <-- Archivos excluidos de control de versiones
├── apps/                        <-- Aplicaciones frontend de la suite
│   ├── compliance-suite/        <-- Demo Hub Multiproducto de desarrollo y API Playground
│   │   ├── index.html           <-- Marcado HTML
│   │   ├── styles.css           <-- Estilos de panel y vidrio (Glassmorphism)
│   │   └── app.js               <-- Lógica interactiva y simulaciones de integraciones
│   └── facturador-pymes/        <-- Aplicación SaaS FacturaFácil (ERP de Facturación)
│       ├── index.html           <-- Estructura del panel ERP e historial
│       ├── styles.css           <-- Diseño SaaS Slate-Indigo y hojas de impresión oficial A4
│       └── app.js               <-- Lógica de sesión, bases de datos (localStorage) y RBAC
├── scripts/                     <-- Scripts de soporte y generación
│   └── generar_presentacion.py  <-- Generador de PowerPoint adaptado a rutas relativas
├── docs/                        <-- Guías y análisis normativos en Markdown
│   ├── guia_creacion_empresa_sif.md
│   ├── guia_explicativa_hacienda.md
│   ├── proyecto_1_saas_verifactu.md
│   ├── proyecto_2_api_middleware.md
│   ├── proyecto_3_portal_creaycrece.md
│   ├── proyecto_4_conector_fiscal.md
│   └── resumen_comparativo_proyectos.md
└── resources/                   <-- Materiales gráficos y presentaciones PowerPoint
    ├── presentacion_hacienda_facil.pptx
    └── presentacion_hacienda_visual.pptx

> ⚠️ **Naturaleza del proyecto:** esta suite es una **demo comercial** (frontend estático con `localStorage`).
> No es todavía un Sistema Informático de Facturación conforme al RD 1007/2023: para comercializarlo como tal
> es obligatorio implementar la huella, QR y registro de eventos según la **Orden HAC/1177/2024** en un backend
> real, y emitir la **declaración responsable del fabricante**. Los datos precargados son sintéticos (RGPD).
```

---

## 💼 Características del SaaS FacturaFácil

### 1. Landing Page Comercial de Alto Impacto (`index.html`)
- **Estética SaaS Premium**: Diseño claro con tipografía *Inter*, efectos de resplandor radial, tarjetas esmeriladas y cuadrículas de precios interactivas (Planes Autónomo, PYME, Despacho).
- **Acceso Directo para Desarrolladores**: Enlace rápido al portal técnico "API Playground (Compliance Hub)" en cabecera y pie de página.

### 2. Simulador de Autenticación y Perfiles
- **Modal de Login Integrado**: Permite acceder al simulador de facturación seleccionando perfiles corporativos reales:
  - **Brais Pérez** (Administrador)
  - **Clara Trilo** (Empleado - Contable)
  - **Inspector AEAT** (Auditor - Inspector de Hacienda)
- **Persistencia**: La sesión activa se almacena en `localStorage` (`vf_session`) y se destruye de forma segura al pulsar "Salir/Cerrar Sesión" en la barra lateral del ERP.

### 3. Control de Accesos por Rol (RBAC) en el ERP
El sistema adapta dinámicamente sus permisos según el perfil que haya iniciado sesión:
- **Administrador**: Acceso total al facturador, configuración fiscal de la empresa, copias de seguridad de datos e importación/restauración de datos de prueba. Puede dar de alta y baja usuarios en la organización.
- **Empleado**: Autorizado para emitir facturas normales o procesar cargas masivas de la simulación CSV de demostración. Tiene deshabilitadas las opciones de alteración de base de datos (Hacker Mode), eliminación del log de auditoría y gestión de personal.
- **Auditor / Inspector AEAT**: Acceso de **solo lectura**. El formulario para añadir clientes, la emisión de facturas y los campos de configuración fiscal se encuentran bloqueados y atenuados. El panel de alta de usuarios y el simulador de alteración maliciosa quedan completamente ocultos.

### 4. Métricas e Integridad en el Dashboard (`apps/facturador-pymes/`)
- **Gráficos de IVA Repercutido**: Representa en tiempo real mediante barras de porcentaje la carga fiscal acumulada de IVA al 21%, 10% y 4% de las facturas vigentes.
- **Estado de la Cadena Criptográfica**: Compara el encadenamiento criptográfico (`hashFactura` actual concatenado con `hashFactura` anterior) e indica el porcentaje de integridad de la base de datos. Si se simula un hackeo en el historial, el gráfico del dashboard cambia de verde a rojo indicando la brecha.
- **Audit Trail con Identidad**: Cada registro de eventos (log obligatorio Veri*factu) indica con nombre y cargo quién realizó la acción (ej. *"Factura OPS-2026-0001 emitida (Por: Brais Pérez - Administrador)"*).

---

## 🚀 Cómo Empezar

Para garantizar el correcto funcionamiento del almacenamiento local (`localStorage`) y evitar restricciones de seguridad de algunos navegadores web modernos al cargar scripts modularizados locales (`file://`), **se recomienda encarecidamente utilizar un servidor HTTP local**:

1.  **Iniciar el Servidor HTTP Local (Python)**:
    Abre una consola de terminal en la carpeta raíz del proyecto y ejecuta:
    ```bash
    python -m http.server 8000
    ```

2.  **Abrir en el Navegador**:
    Accede al portal principal a través de:
    👉 **[http://localhost:8000/index.html](http://localhost:8000/index.html)**

3.  **Probar el Simulador**:
    - Pulsa en **"Probar Simulador ERP"** en la Landing Page.
    - Elige el perfil de **Administrador** para emitir facturas con firma digital o restaurar la simulación de 19 facturas de prueba.
    - Accede a la sección **Historial de Facturas** y haz clic en **"Simular Alteración (Hacker Mode)"** para alterar el importe de un registro en la base de datos y observar cómo se rompe la cadena criptográfica.
    - Cierra sesión y accede como **Inspector de Hacienda (Auditor)** para comprobar la experiencia de inspección oficial en modo lectura.

4.  **Generación de PowerPoint**:
    Si necesitas regenerar las diapositivas de presentación técnica:
    ```bash
    pip install python-pptx
    python scripts/generar_presentacion.py
    ```
