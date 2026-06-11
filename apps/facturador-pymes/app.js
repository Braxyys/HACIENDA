// --- BASE DE DATOS LOCAL ---
        let appConfig = {
            razon: "Juan Pérez Lorenzo S.L.",
            nif: "A1234567B",
            direccion: "Calle Gran Vía 45",
            cp: "28013",
            ciudad: "Madrid",
            telefono: "600123456"
        };

        let clients = [
            { nif: "B98765432", razon: "Distribuciones Bahía S.L.", direccion: "Calle Bahía 10, Vigo, 36201, Pontevedra", email: "compras@bahiasl.com" },
            { nif: "B87654321", razon: "Suministros Lorenzo S.A.", direccion: "Polígono Industrial La Paz, Parcela 8, Zaragoza, 50012", email: "facturacion@slorenzo.es" }
        ];

        let invoices = [];

        const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

        // --- SESSION AND USERS STATE ---
        let activeSession = {
            name: "Brais Pérez",
            email: "braisperezlorenzo@gmail.com",
            role: "Administrador",
            company: "Mi Negocio S.L.",
            nif: "A1234567B",
            lastLogin: "11/06/2026 13:30",
            statCount: 0,
            statTotal: 0
        };

        let systemUsers = [
            { name: "Brais Pérez", role: "Administrador", status: "Activo" },
            { name: "Clara Trilo", role: "Empleado", status: "Activo" },
            { name: "Inspector AEAT", role: "Auditor", status: "Activo" }
        ];

        // --- AUDIT TRAIL / REGISTRO DE EVENTOS SIF ---
        let auditLogs = [];

        async function inicializarAuditLog() {
            const savedLogs = localStorage.getItem('vf_audit_logs');
            if (savedLogs) {
                auditLogs = JSON.parse(savedLogs);
            } else {
                auditLogs = [];
                await registrarAuditLog('INICIO', 'Sistema de información de facturación FacturaFácil inicializado y listo.');
            }
        }

        async function registrarAuditLog(evento, descripcion) {
            const fecha = new Date().toISOString();
            const ultHash = auditLogs.length > 0 ? auditLogs[auditLogs.length - 1].hashEvento : GENESIS_HASH;
            
            // Append active user to description
            const userSuffix = (typeof activeSession !== 'undefined' && activeSession) 
                ? ` (Por: ${activeSession.name} - ${activeSession.role})` 
                : ' (Sistema)';
            const finalDesc = descripcion + userSuffix;

            const concatStr = `${fecha}|${evento}|${finalDesc}|${ultHash}`;
            const hashEvento = await sha256(concatStr);

            const entry = {
                fecha,
                evento,
                descripcion: finalDesc,
                hashAnterior: ultHash,
                hashEvento
            };

            auditLogs.push(entry);
            localStorage.setItem('vf_audit_logs', JSON.stringify(auditLogs));
        }

        function renderAuditLog() {
            const body = document.getElementById('audit-log-table-body');
            if (!body) return;
            body.innerHTML = '';

            if (auditLogs.length === 0) {
                body.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">No hay eventos de auditoría registrados.</td></tr>';
                return;
            }

            // Mostramos los logs en orden cronológico inverso para que los más recientes salgan arriba
            [...auditLogs].reverse().forEach(log => {
                const tr = document.createElement('tr');
                const localDate = new Date(log.fecha).toLocaleString('es-ES');
                tr.innerHTML = `
                    <td class="font-semibold">${localDate}</td>
                    <td><span class="badge badge-event">${log.evento}</span></td>
                    <td>${log.descripcion}</td>
                    <td><span class="hash-tag" title="${log.hashEvento}">${log.hashEvento.substring(0, 15)}...</span></td>
                `;
                body.appendChild(tr);
            });
        }

        function actualizarDeclaracion() {
            const compNameEl = document.getElementById('decl-user-company');
            const compNifEl = document.getElementById('decl-user-nif');
            if (compNameEl) compNameEl.innerText = appConfig.razon;
            if (compNifEl) compNifEl.innerText = appConfig.nif;
        }

        function imprimirDeclaracionResponsable() {
            document.body.classList.add('print-decl-active');
            window.print();
            setTimeout(() => {
                document.body.classList.remove('print-decl-active');
            }, 1000);
        }

        // --- EXPORTACIÓN E IMPORTACIÓN DE BASE DE DATOS (BACKUP JSON) ---
        function exportarBaseDatosJSON() {
            const dataToExport = {
                config: appConfig,
                clients: clients,
                invoices: invoices,
                auditLogs: auditLogs
            };

            const jsonStr = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            const sanitizedName = appConfig.razon.replace(/[^a-zA-Z0-9]/g, '_');
            a.href = url;
            a.download = `backup_facturafacil_${sanitizedName}_2026.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            registrarAuditLog('CONFIG_GUARDADA', 'Copia de seguridad de la base de datos exportada en formato JSON.');
            showToast("Copia de seguridad exportada con éxito.");
        }

        function importarBaseDatosJSON(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (!data.config || !data.clients || !data.invoices || !data.auditLogs) {
                        alert("El archivo de copia de seguridad no tiene el formato correcto.");
                        return;
                    }

                    if (confirm("⚠️ ADVERTENCIA: Esta acción sobrescribirá todos los datos actuales del facturador por los del archivo de copia de seguridad. ¿Deseas continuar?")) {
                        appConfig = data.config;
                        clients = data.clients;
                        invoices = data.invoices;
                        auditLogs = data.auditLogs;

                        localStorage.setItem('vf_config', JSON.stringify(appConfig));
                        localStorage.setItem('vf_clients', JSON.stringify(clients));
                        localStorage.setItem('vf_invoices', JSON.stringify(invoices));
                        localStorage.setItem('vf_audit_logs', JSON.stringify(auditLogs));

                        await registrarAuditLog('CONFIG_GUARDADA', 'Base de datos restaurada correctamente desde archivo de copia de seguridad JSON.');
                        
                        // Recargar todo
                        document.getElementById('cfg-razon').value = appConfig.razon;
                        document.getElementById('cfg-nif').value = appConfig.nif;
                        document.getElementById('cfg-dir').value = appConfig.direccion;
                        document.getElementById('cfg-cp').value = appConfig.cp;
                        document.getElementById('cfg-ciudad').value = appConfig.ciudad;
                        document.getElementById('cfg-tel').value = appConfig.telefono || '';

                        refrescarCabecerasPerfil();
                        cargarClientesSelect();
                        p1_renderStats();
                        renderTablaClientes();
                        p1_renderHistorial();
                        renderTablaDemoCsv();
                        actualizarDeclaracion();
                        
                        showToast("Base de datos restaurada con éxito.");
                        setTab('dash');
                    }
                } catch (err) {
                    alert("Error al leer el archivo de copia de seguridad: " + err.message);
                }
            };
            reader.readAsText(file);
            event.target.value = ''; // Limpiar input
        }

        // --- EXPORTACIÓN DE FACTURAS EN FORMATO XML XML_FACTURAE (LEY CREA Y CRECE) ---
        function descargarXMLFacturae(id) {
            const inv = invoices.find(i => i.id === id);
            if (!inv) return;

            // Formato básico XML Facturae 3.2.2
            const xmlStr = `<?xml version="1.0" encoding="UTF-8"?>
<fe:Facturae xmlns:fe="http://www.facturae.es/Facturae/2014/v3.2.2/Facturae">
  <FileHeader>
    <SchemaVersion>3.2.2</SchemaVersion>
    <Batch>
      <BatchIdentifier>${inv.id}-BATCH</BatchIdentifier>
      <TotalInvoicesAmount>
        <TotalAmount>${inv.total.toFixed(2)}</TotalAmount>
      </TotalInvoicesAmount>
    </Batch>
  </FileHeader>
  <Parties>
    <SellerParty>
      <TaxIdentificationNumber>${inv.emisor.nif}</TaxIdentificationNumber>
      <CorporateName>${inv.emisor.razon}</CorporateName>
      <AddressInSpain>
        <Address>${inv.emisor.direccion}</Address>
        <PostCode>${inv.emisor.cp}</PostCode>
        <Town>${inv.emisor.ciudad}</Town>
        <Province>${inv.emisor.ciudad}</Province>
        <CountryCode>ESP</CountryCode>
      </AddressInSpain>
    </SellerParty>
    <BuyerParty>
      <TaxIdentificationNumber>${inv.cliente.nif}</TaxIdentificationNumber>
      <CorporateName>${inv.cliente.razon}</CorporateName>
      <AddressInSpain>
        <Address>${inv.cliente.direccion}</Address>
        <CountryCode>ESP</CountryCode>
      </AddressInSpain>
    </BuyerParty>
  </Parties>
  <Invoices>
    <Invoice>
      <InvoiceHeader>
        <InvoiceNumber>${inv.id}</InvoiceNumber>
        <InvoiceDate>${inv.fecha}</InvoiceDate>
      </InvoiceHeader>
      <InvoiceTotals>
        <TotalGrossAmount>${inv.base.toFixed(2)}</TotalGrossAmount>
        <TotalTaxOutputs>
          <Tax>
            <TaxTypeCode>01</TaxTypeCode>
            <TaxRate>${inv.lineas[0].ivaPorcentaje.toFixed(2)}</TaxRate>
            <TaxableBase>
              <Double>${inv.base.toFixed(2)}</Double>
            </TaxableBase>
            <TaxAmount>
              <Double>${inv.iva.toFixed(2)}</Double>
            </TaxAmount>
          </Tax>
        </TotalTaxOutputs>
        <InvoiceTotalAmount>${inv.total.toFixed(2)}</InvoiceTotalAmount>
      </InvoiceTotals>
      <Items>
        ${inv.lineas.map(l => `
        <InvoiceLine>
          <ItemDescription>${l.concepto}</ItemDescription>
          <Quantity>${l.cantidad.toFixed(2)}</Quantity>
          <UnitOfMeasure>01</UnitOfMeasure>
          <UnitPriceWithoutTax>${l.precioUnitario.toFixed(2)}</UnitPriceWithoutTax>
          <TotalAmountWithoutTax>${l.subtotal.toFixed(2)}</TotalAmountWithoutTax>
          <TaxesOutputs>
            <Tax>
              <TaxTypeCode>01</TaxTypeCode>
              <TaxRate>${l.ivaPorcentaje.toFixed(2)}</TaxRate>
              <TaxableBase>
                <Double>${l.subtotal.toFixed(2)}</Double>
              </TaxableBase>
              <TaxAmount>
                <Double>${l.ivaImporte.toFixed(2)}</Double>
              </TaxAmount>
            </Tax>
          </TaxesOutputs>
        </InvoiceLine>
        `).join('')}
      </Items>
    </Invoice>
  </Invoices>
</fe:Facturae>`;

            const blob = new Blob([xmlStr], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `facturae_${inv.id}.xml`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            registrarAuditLog('FACTURA_EMITIDA', `Descargado archivo XML Facturae para la factura ${inv.id}.`);
            showToast(`XML Facturae de la factura ${inv.id} descargado.`);
        }

        // --- BÚSQUEDA, FILTRADO Y EXPORTACIÓN DEL REGISTRO DE EVENTOS (AUDIT TRAIL) ---
        function filtrarAuditLog() {
            const query = document.getElementById('audit-filter-input').value.toLowerCase();
            const type = document.getElementById('audit-filter-type').value;
            const body = document.getElementById('audit-log-table-body');
            if (!body) return;
            body.innerHTML = '';

            const logsFiltrados = auditLogs.filter(log => {
                const matchesQuery = log.descripcion.toLowerCase().includes(query) || log.evento.toLowerCase().includes(query);
                const matchesType = type ? log.evento === type : true;
                return matchesQuery && matchesType;
            });

            if (logsFiltrados.length === 0) {
                body.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">No se encontraron eventos coincidentes.</td></tr>';
                return;
            }

            [...logsFiltrados].reverse().forEach(log => {
                const tr = document.createElement('tr');
                const localDate = new Date(log.fecha).toLocaleString('es-ES');
                tr.innerHTML = `
                    <td class="font-semibold">${localDate}</td>
                    <td><span class="badge badge-event">${log.evento}</span></td>
                    <td>${log.descripcion}</td>
                    <td><span class="hash-tag" title="${log.hashEvento}">${log.hashEvento.substring(0, 15)}...</span></td>
                `;
                body.appendChild(tr);
            });
        }

        function exportarAuditLogCSV() {
            let csvStr = "Fecha_Hora_ISO,Evento,Descripcion,Huella_Anterior,Huella_Digital_SHA256\n";
            auditLogs.forEach(log => {
                const escapedDesc = log.descripcion.replace(/"/g, '""');
                csvStr += `"${log.fecha}","${log.evento}","${escapedDesc}","${log.hashAnterior}","${log.hashEvento}"\n`;
            });

            const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const sanitizedName = appConfig.razon.replace(/[^a-zA-Z0-9]/g, '_');
            a.href = url;
            a.download = `audit_trail_verifactu_${sanitizedName}_2026.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            registrarAuditLog('CONFIG_GUARDADA', 'Historial del registro de eventos de auditoría exportado en formato CSV.');
            showToast("Registro de auditoría exportado con éxito.");
        }

        let originalInvoicesBackup = null;

        function abrirModalTamper() {
            const select = document.getElementById('tamper-inv-select');
            if (!select) return;
            select.innerHTML = '';

            if (invoices.length === 0) {
                alert("No hay facturas registradas para alterar.");
                return;
            }

            invoices.forEach(inv => {
                select.innerHTML += `<option value="${inv.id}">${inv.id} - ${inv.cliente.razon}</option>`;
            });

            actualizarImporteOriginalTamper();
            document.getElementById('tamper-modal').style.display = 'flex';
        }

        function cerrarModalTamper() {
            document.getElementById('tamper-modal').style.display = 'none';
        }

        function actualizarImporteOriginalTamper() {
            const id = document.getElementById('tamper-inv-select').value;
            const inv = invoices.find(i => i.id === id);
            if (inv) {
                document.getElementById('tamper-import-original').value = inv.total.toFixed(2) + " €";
                document.getElementById('tamper-import-alterado').value = (inv.total * 0.6).toFixed(2); // Suggest a 40% reduction
            }
        }

        async function aplicarAlteracionDatos() {
            const id = document.getElementById('tamper-inv-select').value;
            const nuevoTotal = parseFloat(document.getElementById('tamper-import-alterado').value);

            if (isNaN(nuevoTotal) || nuevoTotal < 0) {
                alert("Introduce un importe válido.");
                return;
            }

            const inv = invoices.find(i => i.id === id);
            if (!inv) return;

            // Hacer backup si es la primera vez que alteramos
            if (!originalInvoicesBackup) {
                originalInvoicesBackup = JSON.parse(JSON.stringify(invoices));
            }

            const oldTotal = inv.total;
            inv.total = nuevoTotal;

            // Guardamos temporalmente en la base de datos alterada
            localStorage.setItem('vf_invoices', JSON.stringify(invoices));

            await registrarAuditLog('ALERTA_SEGURIDAD', `¡ALERTA! Se han detectado cambios no autorizados en la base de datos local. Factura ${id} modificada de ${oldTotal.toFixed(2)} € a ${nuevoTotal.toFixed(2)} €.`);

            cerrarModalTamper();
            await renderVisualChain();
            p1_renderStats();
            p1_renderHistorial();
            showToast("⚠️ Simulación de alteración aplicada.");
        }

        async function restaurarIntegridad() {
            if (originalInvoicesBackup) {
                invoices = JSON.parse(JSON.stringify(originalInvoicesBackup));
                originalInvoicesBackup = null;

                localStorage.setItem('vf_invoices', JSON.stringify(invoices));

                await registrarAuditLog('CONFIG_GUARDADA', 'Base de datos restaurada. Integridad de la cadena criptográfica Veri*factu recuperada con éxito.');

                await renderVisualChain();
                p1_renderStats();
                p1_renderHistorial();
                showToast("🛡️ Base de datos restaurada a su estado original.");
            }
        }

        async function verificarIntegridadCadena() {
            let ultHash = GENESIS_HASH;
            let brokenIndex = -1;

            for (let i = 0; i < invoices.length; i++) {
                const inv = invoices[i];
                // Concatenamos con los datos actuales de la factura
                const concatStr = `${inv.emisor.nif}|${inv.id}|${inv.fecha}|${inv.total.toFixed(2)}|${inv.hashAnterior}`;
                const computedHash = await sha256(concatStr);

                if (computedHash !== inv.hashFactura || inv.hashAnterior !== ultHash) {
                    brokenIndex = i;
                    break;
                }
                ultHash = inv.hashFactura;
            }

            return {
                valid: brokenIndex === -1,
                brokenIndex: brokenIndex
            };
        }

        async function renderVisualChain() {
            const container = document.getElementById('visual-chain-container');
            if (!container) return;
            container.innerHTML = '';

            if (invoices.length === 0) {
                container.innerHTML = '<span style="font-size:0.8rem; color:var(--text-muted);">No hay facturas emitidas en la cadena criptográfica.</span>';
                return;
            }

            const integrity = await verificarIntegridadCadena();
            const alertBox = document.getElementById('chain-broken-alert');
            const revertBtn = document.getElementById('btn-revert-tamper');

            if (!integrity.valid) {
                if (alertBox) alertBox.style.display = 'block';
                if (revertBtn) revertBtn.style.display = 'inline-block';
            } else {
                if (alertBox) alertBox.style.display = 'none';
                if (revertBtn) revertBtn.style.display = 'none';
            }

            for (let i = 0; i < invoices.length; i++) {
                const inv = invoices[i];
                const isBrokenBlock = !integrity.valid && i >= integrity.brokenIndex;

                const node = document.createElement('div');
                node.className = `chain-node ${isBrokenBlock ? 'invalid' : 'valid'}`;
                node.onclick = () => mostrarPreviewFactura(inv.id);
                node.innerHTML = `
                    <div class="chain-node-id">${inv.id}</div>
                    <div class="chain-node-total">${inv.total.toFixed(2)} €</div>
                    <span class="chain-node-hash-box" title="${inv.hashFactura}">${inv.hashFactura.substring(0, 10)}...</span>
                `;

                container.appendChild(node);

                // Add arrow connector if it is not the last block
                if (i < invoices.length - 1) {
                    const arrow = document.createElement('div');
                    const isBrokenArrow = !integrity.valid && i >= integrity.brokenIndex;
                    arrow.className = `chain-arrow ${isBrokenArrow ? 'broken' : ''}`;
                    arrow.innerHTML = isBrokenArrow ? '❌' : '⚡';
                    arrow.title = isBrokenArrow ? 'Cadena Rota' : 'Encadenado';
                    container.appendChild(arrow);
                }
            }
        }

        async function cargarBaseDatos() {
            // Load and initialize session and system users
            inicializarSesion();

            const savedConfig = localStorage.getItem('vf_config');
            if (savedConfig) appConfig = JSON.parse(savedConfig);

            const savedClients = localStorage.getItem('vf_clients');
            if (savedClients) clients = JSON.parse(savedClients);

            const savedInvoices = localStorage.getItem('vf_invoices');
            if (savedInvoices) {
                invoices = JSON.parse(savedInvoices);
            } else {
                // Si no hay facturas guardadas, inicializamos con los datos del CSV de Academia Online de prueba
                await inicializarDatosEjemplo();
            }

            await inicializarAuditLog();
            await registrarAuditLog('SESION_INICIO', 'Sesión de facturación iniciada en el navegador.');

            // Inputs Config
            document.getElementById('cfg-razon').value = appConfig.razon;
            document.getElementById('cfg-nif').value = appConfig.nif;
            document.getElementById('cfg-dir').value = appConfig.direccion;
            document.getElementById('cfg-cp').value = appConfig.cp;
            document.getElementById('cfg-ciudad').value = appConfig.ciudad;
            document.getElementById('cfg-tel').value = appConfig.telefono || '';

            refrescarCabecerasPerfil();
            cargarClientesSelect();
            p1_renderStats();
            renderTablaClientes();
            p1_renderHistorial();
            renderTablaDemoCsv();
            actualizarDeclaracion();
            await renderVisualChain();

            // Load servicios frecuentes
            cargarServiciosFrecuentes();

            // Apply role-based access policies
            aplicarPoliticasSeguridadRol();
        }

        async function inicializarDatosEjemplo() {
            // DATOS SINTÉTICOS DE DEMOSTRACIÓN — nombres, emails y NIFs ficticios (sin datos personales reales, RGPD)
            const rawInvoices = [
                { id: "OPS-2026-0001", fecha: "2026-05-05", email: "laura.demo01@ejemplo.es", nombre: "Laura Castro Méndez", nif: "11111111A", base: 7.43, iva: 1.56, total: 8.99, concepto: "Suscripción Plan Mensual Oposiciones" },
                { id: "OPS-2026-0002", fecha: "2026-05-05", email: "carmen.demo02@ejemplo.es", nombre: "Carmen Ferreiro Lago", nif: "22222222B", base: 7.43, iva: 1.56, total: 8.99, concepto: "Suscripción Plan Mensual Oposiciones" },
                { id: "OPS-2026-0003", fecha: "2026-04-20", email: "sara.demo03@ejemplo.es", nombre: "Sara Domínguez Prado", nif: "33333333C", base: 4.12, iva: 0.87, total: 4.99, concepto: "Suscripción Plan Mensual Oposiciones" },
                { id: "OPS-2026-0004", fecha: "2026-04-17", email: "nuria.demo04@ejemplo.es", nombre: "Nuria Vázquez Souto", nif: "44444444D", base: 4.12, iva: 0.87, total: 4.99, concepto: "Suscripción Plan Mensual Oposiciones" },
                { id: "OPS-2026-0005", fecha: "2026-05-08", email: "marta.demo05@ejemplo.es", nombre: "Marta Iglesias Rey", nif: "55555555E", base: 7.43, iva: 1.56, total: 8.99, concepto: "Suscripción Plan Mensual Oposiciones" },
                { id: "OPS-2026-0006", fecha: "2026-05-15", email: "alba.demo06@ejemplo.es", nombre: "Alba Seoane Vidal", nif: "66666666F", base: 7.43, iva: 1.56, total: 8.99, concepto: "Suscripción Plan Mensual Oposiciones" },
                { id: "OPS-2026-0007", fecha: "2026-05-15", email: "elena.demo07@ejemplo.es", nombre: "Elena Pereira Costas", nif: "77777777G", base: 7.43, iva: 1.56, total: 8.99, concepto: "Suscripción Plan Mensual Oposiciones" },
                { id: "OPS-2026-0008", fecha: "2026-05-17", email: "nuria.demo04@ejemplo.es", nombre: "Nuria Vázquez Souto", nif: "44444444D", base: 4.12, iva: 0.87, total: 4.99, concepto: "Suscripción Plan Mensual Oposiciones" },
                { id: "OPS-2026-0009", fecha: "2026-05-19", email: "maria.demo09@ejemplo.es", nombre: "María Otero Cabaleiro", nif: "88888888H", base: 7.43, iva: 1.56, total: 8.99, concepto: "Suscripción Plan Mensual Oposiciones" },
                { id: "OPS-2026-0010", fecha: "2026-05-21", email: "rosa.demo10@ejemplo.es", nombre: "Rosa Quintela Barros", nif: "99999999I", base: 7.43, iva: 1.56, total: 8.99, concepto: "Suscripción Plan Mensual Oposiciones" },
                { id: "OPS-2026-0011", fecha: "2026-05-21", email: "juana.demo11@ejemplo.es", nombre: "Juana Mosquera Pena", nif: "10101010J", base: 7.43, iva: 1.56, total: 8.99, concepto: "Suscripción Plan Mensual Oposiciones" },
                { id: "OPS-2026-0012", fecha: "2026-05-23", email: "sonia.demo12@ejemplo.es", nombre: "Sonia Lamas Freire", nif: "12121212K", base: 7.43, iva: 1.56, total: 8.99, concepto: "Suscripción Plan Mensual Oposiciones" },
                { id: "OPS-2026-0013", fecha: "2026-05-25", email: "aroa.demo13@ejemplo.es", nombre: "Aroa Caamaño Sieiro", nif: "13131313L", base: 7.43, iva: 1.56, total: 8.99, concepto: "Suscripción Plan Mensual Oposiciones" },
                { id: "OPS-2026-0014", fecha: "2026-05-28", email: "lucia.demo14@ejemplo.es", nombre: "Lucía Bouzas Antelo", nif: "14141414M", base: 7.43, iva: 1.56, total: 8.99, concepto: "Suscripción Plan Mensual Oposiciones" },
                { id: "OPS-2026-0015", fecha: "2026-06-02", email: "paz.demo15@ejemplo.es", nombre: "Paz Rivas Carballo", nif: "15151515N", base: 7.43, iva: 1.56, total: 8.99, concepto: "Suscripción Plan Mensual Oposiciones" },
                { id: "OPS-2026-0016", fecha: "2026-06-04", email: "bibiana.demo16@ejemplo.es", nombre: "Bibiana Noya Fontán", nif: "16161616P", base: 7.43, iva: 1.56, total: 8.99, concepto: "Suscripción Plan Mensual Oposiciones" },
                { id: "OPS-2026-0017", fecha: "2026-06-05", email: "carmen.demo02@ejemplo.es", nombre: "Carmen Ferreiro Lago", nif: "22222222B", base: 7.43, iva: 1.56, total: 8.99, concepto: "Suscripción Plan Mensual Oposiciones" },
                { id: "OPS-2026-0018", fecha: "2026-06-05", email: "laura.demo01@ejemplo.es", nombre: "Laura Castro Méndez", nif: "11111111A", base: 7.43, iva: 1.56, total: 8.99, concepto: "Suscripción Plan Mensual Oposiciones" },
                { id: "OPS-2026-0019", fecha: "2026-06-08", email: "ana.demo19@ejemplo.es", nombre: "Ana Loureiro Gestal", nif: "17171717Q", base: 7.43, iva: 1.56, total: 8.99, concepto: "Suscripción Plan Mensual Oposiciones" }
            ];

            // Ordenar por ID de factura numéricamente
            rawInvoices.sort((a, b) => {
                const numA = parseInt(a.id.split('-')[2]);
                const numB = parseInt(b.id.split('-')[2]);
                return numA - numB;
            });

            const loadedClients = [];
            const clientMap = {};

            // Generar lista de clientes únicos
            rawInvoices.forEach(item => {
                if (!clientMap[item.nif]) {
                    clientMap[item.nif] = {
                        nif: item.nif,
                        razon: item.nombre,
                        direccion: `Calle de ${item.nombre}, Vigo, Pontevedra`,
                        email: item.email
                    };
                    loadedClients.push(clientMap[item.nif]);
                }
            });

            clients = loadedClients;
            localStorage.setItem('vf_clients', JSON.stringify(clients));

            let ultHash = GENESIS_HASH;
            const loadedInvoices = [];

            for (const item of rawInvoices) {
                // Concatenación para la huella regulada:
                // NIFEmisor | SerieNumero | FechaExpedicion | ImporteTotal | HashAnterior
                const concatStr = `${appConfig.nif}|${item.id}|${item.fecha}|${item.total.toFixed(2)}|${ultHash}`;
                const hashFactura = await sha256(concatStr);
                const fechaFormat = item.fecha.split('-').reverse().join('-');
                const qrUrl = `https://www2.agenciatributaria.gob.es/wlpl/TBAI-VFCT/QR?nif=${appConfig.nif}&numserie=${item.id}&fecha=${fechaFormat}&importe=${item.total.toFixed(2)}&hash=${hashFactura}`;

                const invoice = {
                    id: item.id,
                    fecha: item.fecha,
                    emisor: { ...appConfig },
                    cliente: clientMap[item.nif],
                    lineas: [
                        {
                            concepto: item.concepto,
                            cantidad: 1,
                            precioUnitario: item.base,
                            ivaPorcentaje: 21,
                            ivaImporte: item.iva,
                            subtotal: item.base
                        }
                    ],
                    base: item.base,
                    iva: item.iva,
                    total: item.total,
                    hashAnterior: ultHash,
                    hashFactura: hashFactura,
                    qrUrl: qrUrl
                };

                loadedInvoices.push(invoice);
                ultHash = hashFactura;
            }

            invoices = loadedInvoices;
            localStorage.setItem('vf_invoices', JSON.stringify(invoices));
        }

        async function guardarConfiguracion() {
            appConfig.razon = document.getElementById('cfg-razon').value;
            appConfig.nif = document.getElementById('cfg-nif').value;
            appConfig.direccion = document.getElementById('cfg-dir').value;
            appConfig.cp = document.getElementById('cfg-cp').value;
            appConfig.ciudad = document.getElementById('cfg-ciudad').value;
            appConfig.telefono = document.getElementById('cfg-tel').value;

            localStorage.setItem('vf_config', JSON.stringify(appConfig));
            refrescarCabecerasPerfil();
            await registrarAuditLog('CONFIG_GUARDADA', `Datos del emisor actualizados. Razón: ${appConfig.razon}, NIF: ${appConfig.nif}`);
            showToast("Los datos de tu negocio se han guardado con éxito.");
            setTab('dash');
        }

        function refrescarCabecerasPerfil() {
            document.getElementById('side-comp-name').innerText = appConfig.razon;
            document.getElementById('side-comp-nif').innerText = "NIF: " + appConfig.nif;
        }

        async function sha256(message) {
            const msgBuffer = new TextEncoder().encode(message);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex;
        }

        // --- TABS CONTROL ---
        function setTab(tab) {
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.menu-item-btn').forEach(b => b.classList.remove('active'));

            const titles = {
                'dash': { title: 'Inicio y Estadísticas', sub: 'Visualiza el resumen financiero de tu negocio adaptado al reglamento Veri*factu.' },
                'profile': { title: 'Mi Perfil de Facturación', sub: 'Consulta tus datos de acceso, estadísticas personales y permisos reglamentarios SIF.' },
                'demo': { title: 'Caso Práctico: Academia Online 2026', sub: 'Análisis detallado e importación de la simulación del archivo CSV de Academia Online.' },
                'emit': { title: 'Hacer Nueva Factura', sub: 'Completa los campos e introduce los conceptos. El sistema registrará el hash encadenado automáticamente.' },
                'hist': { title: 'Historial de Facturas', sub: 'Consulta el listado inalterable de facturas oficiales y genera sus copias en PDF.' },
                'clie': { title: 'Mis Clientes', sub: 'Registra los datos fiscales de tus clientes para utilizarlos rápidamente en tus facturas.' },
                'users': { title: 'Gestión de Usuarios y Roles', sub: 'Control de acceso del personal de la empresa y roles auditados por Hacienda.' },
                'conf': { title: 'Datos de Mi Empresa', sub: 'Modifica los datos fiscales que representan a tu negocio emisor.' },
                'cert': { title: 'Certificación y Auditoría (SIF)', sub: 'Declaración responsable del software y registro inalterable de eventos de auditoría.' }
            };

            document.getElementById(`pane-${tab}`).classList.add('active');
            document.getElementById(`m-${tab}`).classList.add('active');

            document.getElementById('w-title-text').innerText = titles[tab].title;
            document.getElementById('w-title-sub').innerText = titles[tab].sub;

            if (tab === 'profile') {
                renderUserProfileTab();
                renderServiciosFrecuentesProfile();
            }
            if (tab === 'emit') prepararFormularioFactura();
            if (tab === 'dash') p1_renderStats();
            if (tab === 'hist') {
                p1_renderHistorial();
                renderVisualChain();
            }
            if (tab === 'demo') renderTablaDemoCsv();
            if (tab === 'users') renderSystemUsers();
            if (tab === 'cert') {
                renderAuditLog();
                actualizarDeclaracion();
            }
        }

        // --- EMISIÓN FACTURA ---
        // --- EMISIÓN FACTURA ---
        function prepararFormularioFactura() {
            let sigNumero = 1;
            const serie = document.getElementById('inv-serie').value;
            const facturasSerie = invoices.filter(i => i.id.startsWith(serie));
            if (facturasSerie.length > 0) {
                const numeros = facturasSerie.map(i => parseInt(i.id.split('-')[1]) || 0);
                sigNumero = Math.max(...numeros) + 1;
            }
            document.getElementById('inv-numero').value = sigNumero;
            document.getElementById('inv-fecha').value = new Date().toISOString().split('T')[0];

            cargarClientesSelect();

            const linesBody = document.getElementById('inv-lines-body');
            linesBody.innerHTML = '';
            addInvoiceLine();

            calcularImportesFactura();
            renderServiciosFrecuentes();
            actualizarLivePreview();
        }

        function addInvoiceLine() {
            const linesBody = document.getElementById('inv-lines-body');
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="text" class="line-concepto" placeholder="Ej. Prestación de servicios de consultoría" oninput="actualizarLivePreview()" required style="width:100%;"></td>
                <td><input type="number" class="line-cantidad" value="1" min="1" step="any" oninput="calcularImportesFactura(); actualizarLivePreview();" required style="width:100%; text-align:right;"></td>
                <td><input type="number" class="line-precio" value="0.00" min="0" step="0.01" oninput="calcularImportesFactura(); actualizarLivePreview();" required style="width:100%; text-align:right;"></td>
                <td>
                    <select class="line-iva" onchange="calcularImportesFactura(); actualizarLivePreview();" style="width:100%;">
                        <option value="21">21% (Normal)</option>
                        <option value="10">10% (Reducido)</option>
                        <option value="4">4% (Superreducido)</option>
                        <option value="0">0% (Exento)</option>
                    </select>
                </td>
                <td style="text-align:right; font-weight:700; color:var(--primary);" class="line-total-ver">0,00 €</td>
                <td style="text-align:center;"><button type="button" class="btn btn-secondary btn-danger" style="padding:0.35rem 0.5rem; font-size:0.75rem;" onclick="removeLineRow(this); actualizarLivePreview();">Eliminar</button></td>
            `;
            linesBody.appendChild(tr);
            calcularImportesFactura();
        }

        function removeLineRow(btn) {
            const row = btn.closest('tr');
            const linesBody = document.getElementById('inv-lines-body');
            if (linesBody.querySelectorAll('tr').length > 1) {
                row.remove();
                calcularImportesFactura();
                actualizarLivePreview();
            } else {
                alert("La factura debe tener al menos una línea.");
            }
        }

        function calcularImportesFactura() {
            const linesBody = document.getElementById('inv-lines-body');
            const rows = linesBody.querySelectorAll('tr');
            let baseTotal = 0;
            let ivaTotal = 0;

            rows.forEach(row => {
                const precio = parseFloat(row.querySelector('.line-precio').value) || 0;
                const cant = parseFloat(row.querySelector('.line-cantidad').value) || 0;
                const ivaPct = parseFloat(row.querySelector('.line-iva').value) || 0;

                const baseLine = precio * cant;
                const ivaLine = baseLine * (ivaPct / 100);
                const totalLine = baseLine + ivaLine;

                row.querySelector('.line-total-ver').innerText = totalLine.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

                baseTotal += baseLine;
                ivaTotal += ivaLine;
            });

            const grandTotal = baseTotal + ivaTotal;

            document.getElementById('calc-base').innerText = baseTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
            document.getElementById('calc-iva').innerText = ivaTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
            document.getElementById('calc-total').innerText = grandTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
        }

        // --- CLIENTES ---
        function cargarClientesSelect() {
            const sel = document.getElementById('inv-cliente-sel');
            sel.innerHTML = '<option value="">-- Elige un cliente registrado --</option>';
            clients.forEach(c => {
                sel.innerHTML += `<option value="${c.nif}">${c.razon} (${c.nif})</option>`;
            });
        }

        function autoCompletarCliente() {
            const val = document.getElementById('inv-cliente-sel').value;
            const inputNif = document.getElementById('inv-cli-nif');
            inputNif.value = val ? val : '';
        }

        async function guardarNuevoCliente() {
            const razon = document.getElementById('cli-razon').value;
            const nif = document.getElementById('cli-nif').value;
            const dir = document.getElementById('cli-dir').value;
            const email = document.getElementById('cli-email').value;

            if (clients.some(c => c.nif === nif)) {
                alert("Ya existe un cliente con ese NIF.");
                return;
            }

            clients.push({ razon, nif, direccion: dir, email });
            localStorage.setItem('vf_clients', JSON.stringify(clients));

            await registrarAuditLog('CLIENTE_REGISTRADO', `Cliente registrado. Nombre: ${razon}, NIF: ${nif}`);

            document.getElementById('cli-razon').value = '';
            document.getElementById('cli-nif').value = '';
            document.getElementById('cli-dir').value = '';
            document.getElementById('cli-email').value = '';

            renderTablaClientes();
            cargarClientesSelect();
            showToast("Cliente registrado correctamente.");
        }

        function renderTablaClientes() {
            const body = document.getElementById('clients-table-body');
            body.innerHTML = '';

            if (clients.length === 0) {
                body.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No hay clientes registrados en tu agenda.</td></tr>';
                return;
            }

            clients.forEach(c => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight:700; color:var(--primary);">${c.razon}</td>
                    <td style="font-weight:600;">${c.nif}</td>
                    <td>${c.direccion}</td>
                    <td>${c.email || '--'}</td>
                    <td>
                        <button class="btn btn-secondary btn-danger" style="padding:0.35rem 0.5rem; font-size:0.75rem;" onclick="eliminarCliente('${c.nif}')">Eliminar</button>
                    </td>
                `;
                body.appendChild(tr);
            });
        }

        async function eliminarCliente(nif) {
            if (confirm("¿Deseas eliminar este cliente de la lista?")) {
                const cli = clients.find(c => c.nif !== nif);
                const nombre = cli ? cli.razon : '';
                clients = clients.filter(c => c.nif !== nif);
                localStorage.setItem('vf_clients', JSON.stringify(clients));
                await registrarAuditLog('CLIENTE_ELIMINADO', `Cliente eliminado. Nombre: ${nombre}, NIF: ${nif}`);
                renderTablaClientes();
                cargarClientesSelect();
                showToast("Cliente eliminado de la agenda.");
            }
        }

        // --- EMISIÓN FACTURA ---
        async function emitirNuevaFactura() {
            const serie = document.getElementById('inv-serie').value;
            const numero = parseInt(document.getElementById('inv-numero').value);
            const fecha = document.getElementById('inv-fecha').value;
            const cliNif = document.getElementById('inv-cliente-sel').value;

            if (!cliNif) {
                alert("Debes elegir un cliente receptor.");
                return;
            }

            const cliObj = clients.find(c => c.nif === cliNif);

            const linesBody = document.getElementById('inv-lines-body');
            const rows = linesBody.querySelectorAll('tr');
            
            const lineas = [];
            let baseTotal = 0;
            let ivaTotal = 0;

            rows.forEach(row => {
                const concepto = row.querySelector('.line-concepto').value;
                const cant = parseFloat(row.querySelector('.line-cantidad').value) || 0;
                const precio = parseFloat(row.querySelector('.line-precio').value) || 0;
                const iva = parseFloat(row.querySelector('.line-iva').value) || 0;

                const sub = precio * cant;
                const ivaImp = sub * (iva / 100);

                lineas.push({ concepto, cantidad: cant, precioUnitario: precio, ivaPorcentaje: iva, ivaImporte: ivaImp, subtotal: sub });
                baseTotal += sub;
                ivaTotal += ivaImp;
            });

            const totalFactura = baseTotal + ivaTotal;
            const hashAnterior = invoices.length > 0 ? invoices[invoices.length - 1].hashFactura : GENESIS_HASH;

            // Formato regulado
            const contentToHash = `${appConfig.nif}|${serie}-${numero}|${fecha}|${totalFactura.toFixed(2)}|${hashAnterior}`;
            const hashFactura = await sha256(contentToHash);

            const fechaFormat = fecha.split('-').reverse().join('-');
            const qrUrl = `https://www2.agenciatributaria.gob.es/wlpl/TBAI-VFCT/QR?nif=${appConfig.nif}&numserie=${serie}-${numero}&fecha=${fechaFormat}&importe=${totalFactura.toFixed(2)}&hash=${hashFactura}`;

            const invoice = {
                id: `${serie}-${numero}`,
                fecha,
                emisor: { ...appConfig },
                cliente: { ...cliObj },
                lineas,
                base: baseTotal,
                iva: ivaTotal,
                total: totalFactura,
                hashAnterior,
                hashFactura,
                qrUrl
            };

            invoices.push(invoice);
            localStorage.setItem('vf_invoices', JSON.stringify(invoices));

            await registrarAuditLog('FACTURA_EMITIDA', `Factura ${invoice.id} emitida a ${invoice.cliente.razon} (${invoice.cliente.nif}) por importe de ${invoice.total.toFixed(2)} €.`);
            showToast(`Factura ${invoice.id} emitida con éxito.`);
            mostrarPreviewFactura(invoice.id);
            setTab('hist');
            
            p1_renderStats();
            p1_renderHistorial();
            await renderVisualChain();
        }

        // --- RENDERS STATS E HISTORIAL ---
        function p1_renderStats() {
            // Check if demo database is loaded
            const isDemoActive = invoices.length > 0 && invoices.every(i => i.id.startsWith('OPS-2026-'));
            const banner = document.getElementById('demo-active-banner');
            if (banner) {
                banner.style.display = isDemoActive ? 'block' : 'none';
            }

            let baseAcumulada = 0;
            let ivaAcumulado = 0;
            const count = invoices.length;
            
            // IVA detailed accumulators
            let iva21 = 0;
            let iva10 = 0;
            let iva4 = 0;

            invoices.forEach(i => {
                baseAcumulada += i.base;
                ivaAcumulado += i.iva;
                
                // Sum by line VAT percentage
                i.lineas.forEach(l => {
                    const ivaPct = parseFloat(l.ivaPorcentaje) || 0;
                    const ivaImp = parseFloat(l.ivaImporte) || 0;
                    if (ivaPct === 21) iva21 += ivaImp;
                    else if (ivaPct === 10) iva10 += ivaImp;
                    else if (ivaPct === 4) iva4 += ivaImp;
                });
            });

            document.getElementById('stat-base').innerText = baseAcumulada.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
            document.getElementById('stat-iva').innerText = ivaAcumulado.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
            document.getElementById('stat-count').innerText = count;

            // Update Mock Charts UI elements
            const updateChartBar = (barId, valId, amount, total) => {
                const barEl = document.getElementById(barId);
                const valEl = document.getElementById(valId);
                if (valEl) valEl.innerText = amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
                if (barEl) {
                    const percentage = total > 0 ? (amount / total) * 100 : 0;
                    barEl.style.width = percentage.toFixed(1) + "%";
                }
            };
            
            updateChartBar('chart-bar-21', 'chart-val-21', iva21, ivaAcumulado);
            updateChartBar('chart-bar-10', 'chart-val-10', iva10, ivaAcumulado);
            updateChartBar('chart-bar-4', 'chart-val-4', iva4, ivaAcumulado);
            
            // Distribution state
            const distLabel = document.getElementById('chart-dist-firmado');
            const distBar = document.getElementById('chart-dist-bar');
            
            // Check cryptographic integrity to render correct percentage
            verificarIntegridadCadena().then(integrity => {
                if (distLabel && distBar) {
                    if (integrity.valid) {
                        distLabel.innerText = "100%";
                        distBar.style.width = "100%";
                        distBar.style.backgroundColor = "var(--success)";
                    } else {
                        // Computed percentage of valid blocks
                        const totalCount = invoices.length;
                        const validCount = integrity.brokenIndex;
                        const pct = totalCount > 0 ? (validCount / totalCount) * 100 : 0;
                        distLabel.innerText = pct.toFixed(1) + "% (¡INTEGRIDAD COMPROMETIDA!)";
                        distBar.style.width = pct.toFixed(1) + "%";
                        distBar.style.backgroundColor = "var(--error)";
                    }
                }
            });

            const recentBody = document.getElementById('dash-recent-table');
            recentBody.innerHTML = '';

            const recentInvoices = [...invoices].reverse().slice(0, 4);

            if (recentInvoices.length === 0) {
                recentBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); font-size:0.75rem;">No se han emitido facturas en este periodo.</td></tr>';
                return;
            }

            recentInvoices.forEach(i => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="font-bold text-success">${i.id}</td>
                    <td>${i.fecha.split('-').reverse().join('-')}</td>
                    <td>${i.cliente.razon}</td>
                    <td class="font-bold text-accent">${i.total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</td>
                    <td><span class="hash-tag" title="${i.hashFactura}">${i.hashFactura.substring(0, 15)}...</span></td>
                    <td>
                        <span class="badge badge-success">
                            ✔ Listo y Firmado
                        </span>
                    </td>
                `;
                recentBody.appendChild(tr);
            });
        }

        // --- SESSION AND USER MANAGEMENT LOGIC ---
        function inicializarSesion() {
            const savedSession = localStorage.getItem('vf_session');
            if (savedSession) {
                activeSession = { ...activeSession, ...JSON.parse(savedSession) };
            } else {
                localStorage.setItem('vf_session', JSON.stringify(activeSession));
            }

            const savedUsers = localStorage.getItem('vf_users');
            if (savedUsers) {
                systemUsers = JSON.parse(savedUsers);
            } else {
                localStorage.setItem('vf_users', JSON.stringify(systemUsers));
            }

            // Update UI elements for active session
            const nameEl = document.getElementById('side-user-name');
            const roleEl = document.getElementById('side-user-role');
            if (nameEl) nameEl.innerText = activeSession.name;
            if (roleEl) {
                roleEl.innerText = activeSession.role;
                // Clean class list and add proper styling
                roleEl.className = 'badge';
                if (activeSession.role === 'Administrador') roleEl.classList.add('badge-admin');
                else if (activeSession.role === 'Empleado') roleEl.classList.add('badge-employee');
                else if (activeSession.role === 'Auditor') roleEl.classList.add('badge-auditor');
            }
        }

        function aplicarPoliticasSeguridadRol() {
            const role = activeSession.role;
            
            // Remove restricted/disabled states first
            document.querySelectorAll('.role-disabled').forEach(el => {
                el.classList.remove('role-disabled');
                el.querySelectorAll('input, select, textarea, button').forEach(subEl => {
                    subEl.removeAttribute('disabled');
                });
            });
            document.querySelectorAll('.role-hidden').forEach(el => el.classList.remove('role-hidden'));
            
            // Helper functions to disable/hide
            const disableFields = (selector) => {
                const container = document.getElementById(selector) || document.querySelector(selector);
                if (container) {
                    container.classList.add('role-disabled');
                    container.querySelectorAll('input, select, textarea, button').forEach(el => {
                        el.setAttribute('disabled', 'true');
                    });
                }
            };
            
            const hideElement = (selector) => {
                const el = document.getElementById(selector) || document.querySelector(selector);
                if (el) el.classList.add('role-hidden');
            };

            if (role === 'Auditor') {
                // Readonly access to everything
                disableFields('#pane-emit form');
                disableFields('#pane-clie form');
                disableFields('#pane-conf form');
                disableFields('#user-creation-panel');
                
                // Hide actions
                hideElement('#pane-hist .btn-danger'); // Database reset button
                hideElement('#btn-revert-tamper');     // Rebuild chain button
                hideElement('.btn-warning-light');       // Simular Alteración button
                
                // Hide client delete buttons (by blocking style/option class)
                document.querySelectorAll('.role-restricted').forEach(el => el.classList.add('role-hidden'));
            } else if (role === 'Empleado') {
                // Empleados can emit invoices & register clients but cannot reset db or manage system users
                hideElement('#pane-hist .btn-danger'); // Database reset button
                hideElement('#user-creation-panel');   // User creation panel
                hideElement('.btn-warning-light');       // Simular Alteración button
                
                // Hide client delete buttons in tables if they are restricted
                document.querySelectorAll('.role-restricted').forEach(el => el.classList.add('role-hidden'));
            }
        }

        function renderSystemUsers() {
            const body = document.getElementById('users-table-body');
            if (!body) return;
            body.innerHTML = '';

            systemUsers.forEach(u => {
                const tr = document.createElement('tr');
                
                // Role Badge class
                let badgeClass = 'badge-admin';
                if (u.role === 'Empleado') badgeClass = 'badge-employee';
                else if (u.role === 'Auditor') badgeClass = 'badge-auditor';
                
                // SIF Permissions text
                let permissions = 'Total (Lectura/Escritura/Configuración/Wipe)';
                if (u.role === 'Empleado') permissions = 'Emisión y Registro (Sin alteración de BD)';
                else if (u.role === 'Auditor') permissions = 'Solo Lectura (Auditoría e Inspección)';

                const isCurrentUser = u.name === activeSession.name && u.role === activeSession.role;
                const deleteBtn = isCurrentUser 
                    ? '<span class="text-muted font-size-xs font-semibold">Tú (Sesión Activa)</span>'
                    : `<button class="btn btn-secondary btn-danger" style="padding:0.35rem 0.5rem; font-size:0.75rem;" onclick="eliminarUsuario('${u.name}')">Eliminar</button>`;

                tr.innerHTML = `
                    <td class="font-bold">${u.name} ${isCurrentUser ? '<span class="text-success">(Actual)</span>' : ''}</td>
                    <td><span class="badge-role ${badgeClass}">${u.role}</span></td>
                    <td class="font-size-xs text-muted">${permissions}</td>
                    <td><span class="badge badge-success">● Activo</span></td>
                    <td class="role-restricted">${deleteBtn}</td>
                `;
                body.appendChild(tr);
            });
            
            // Re-apply security styles to options
            aplicarPoliticasSeguridadRol();
        }

        async function guardarNuevoUsuario() {
            const nombre = document.getElementById('new-usr-name').value;
            const rol = document.getElementById('new-usr-role').value;

            if (systemUsers.some(u => u.name.toLowerCase() === nombre.toLowerCase())) {
                alert("Ya existe un usuario registrado con ese nombre.");
                return;
            }

            systemUsers.push({ name: nombre, role: rol, status: "Activo" });
            localStorage.setItem('vf_users', JSON.stringify(systemUsers));

            await registrarAuditLog('CLIENTE_REGISTRADO', `Nuevo usuario dado de alta en el sistema ERP. Nombre: ${nombre}, Rol: ${rol}`);

            document.getElementById('new-usr-name').value = '';
            renderSystemUsers();
            showToast(`Usuario ${nombre} registrado con éxito.`);
        }

        async function eliminarUsuario(nombre) {
            if (confirm(`¿Deseas dar de baja y eliminar al usuario ${nombre}?`)) {
                const userObj = systemUsers.find(u => u.name === nombre);
                const rol = userObj ? userObj.role : '';
                systemUsers = systemUsers.filter(u => u.name !== nombre);
                localStorage.setItem('vf_users', JSON.stringify(systemUsers));

                await registrarAuditLog('CLIENTE_ELIMINADO', `Usuario dado de baja en el sistema ERP. Nombre: ${nombre}, Rol: ${rol}`);
                renderSystemUsers();
                showToast(`Usuario ${nombre} de baja.`);
            }
        }

        function logoutSession(event) {
            if (event) event.preventDefault();
            localStorage.removeItem('vf_session');
            window.location.href = "../../index.html";
        }

        function p1_renderHistorial() {
            const body = document.getElementById('hist-table-body');
            body.innerHTML = '';

            if (invoices.length === 0) {
                body.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:2rem;">No hay registros de facturación almacenados en este navegador.</td></tr>';
                return;
            }

            [...invoices].reverse().forEach(i => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="font-bold text-success">${i.id}</td>
                    <td>${i.fecha.split('-').reverse().join('-')}</td>
                    <td>
                        <div class="font-bold">${i.cliente.razon}</div>
                        <div class="font-size-xxs text-muted">${i.cliente.nif}</div>
                    </td>
                    <td>${i.base.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</td>
                    <td>${i.iva.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</td>
                    <td class="font-bold text-accent">${i.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</td>
                    <td><span class="hash-tag" title="${i.hashAnterior}">${i.hashAnterior.substring(0,10)}...</span></td>
                    <td><span class="hash-tag text-success" title="${i.hashFactura}">${i.hashFactura.substring(0,10)}...</span></td>
                    <td>
                        <div class="flex-gap-05">
                            <button class="btn btn-secondary font-size-xs" style="padding:0.35rem 0.6rem;" onclick="mostrarPreviewFactura('${i.id}')">🖨️ Ver</button>
                            <button class="btn btn-secondary btn-success-light font-size-xs" style="padding:0.35rem 0.6rem;" onclick="descargarXMLFacturae('${i.id}')">📄 XML</button>
                        </div>
                    </td>
                `;
                body.appendChild(tr);
            });
        }

        // --- PREVIEW / MODAL ---
        function mostrarPreviewFactura(id) {
            const inv = invoices.find(i => i.id === id);
            if (!inv) return;

            document.getElementById('p-emi-razon').innerText = inv.emisor.razon;
            document.getElementById('p-emi-nif').innerText = "NIF: " + inv.emisor.nif;
            document.getElementById('p-emi-addr').innerText = `${inv.emisor.direccion}, ${inv.emisor.cp} ${inv.emisor.ciudad}`;

            document.getElementById('p-fac-num').innerText = `FACTURA Nº ${inv.id}`;
            document.getElementById('p-fac-date').innerText = `Fecha de expedición: ${inv.fecha.split('-').reverse().join('-')}`;

            document.getElementById('p-cli-razon').innerText = inv.cliente.razon;
            document.getElementById('p-cli-nif').innerText = "NIF: " + inv.cliente.nif;
            document.getElementById('p-cli-addr').innerText = inv.cliente.direccion;

            const tableBody = document.getElementById('p-table-body');
            tableBody.innerHTML = '';
            inv.lineas.forEach(l => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="font-semibold" style="color:var(--dark-slate);">${l.concepto}</td>
                    <td class="text-right">${l.cantidad}</td>
                    <td class="text-right">${l.precioUnitario.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</td>
                    <td class="text-right">${l.ivaPorcentaje}%</td>
                    <td class="text-right font-bold" style="color:var(--dark-slate);">${(l.subtotal + l.ivaImporte).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</td>
                `;
                tableBody.appendChild(tr);
            });

            document.getElementById('p-subtotal').innerText = inv.base.toLocaleString('es-ES', { minimumFractionDigits: 2 }) + " €";
            document.getElementById('p-iva').innerText = inv.iva.toLocaleString('es-ES', { minimumFractionDigits: 2 }) + " €";
            document.getElementById('p-total').innerText = inv.total.toLocaleString('es-ES', { minimumFractionDigits: 2 }) + " €";

            document.getElementById('p-qr-box').innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(inv.qrUrl)}" class="print-qr-img" alt="QR Verifactu">`;
            document.getElementById('p-hash').innerText = inv.hashFactura;
            document.getElementById('btn-modal-xml').setAttribute('onclick', `descargarXMLFacturae('${inv.id}')`);

            document.getElementById('invoice-modal').style.display = 'flex';
        }

        function cerrarPreviewFactura() {
            document.getElementById('invoice-modal').style.display = 'none';
        }

        async function borrarDatosPrueba() {
            if (confirm("⚠️ CUIDADO: Vas a borrar todas las facturas y el registro criptográfico de este navegador. ¿Deseas vaciarlo?")) {
                await registrarAuditLog('RESET_DATOS', 'Vaciado completo de la base de datos de facturas por el usuario.');
                invoices = [];
                localStorage.removeItem('vf_invoices');
                p1_renderStats();
                p1_renderHistorial();
                await renderVisualChain();
                showToast("Datos de facturas reseteados.");
            }
        }

        function showToast(message) {
            const toast = document.getElementById('toast');
            document.getElementById('toast-message').innerText = message;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3500);
        }

        async function restaurarDemoAcademia() {
            if (confirm("¿Deseas restaurar la base de datos de facturas con las 19 facturas originales del ejemplo Academia Online 2026?")) {
                localStorage.removeItem('vf_invoices');
                localStorage.removeItem('vf_clients');
                await registrarAuditLog('RESTAURAR_DEMO', 'Restauración del conjunto de datos de prueba Academia Online 2026 (19 facturas).');
                await inicializarDatosEjemplo();
                p1_renderStats();
                p1_renderHistorial();
                renderTablaClientes();
                renderTablaDemoCsv();
                await renderVisualChain();
                showToast("Datos de Academia Online 2026 restaurados correctamente.");
                setTab('dash');
            }
        }

        function renderTablaDemoCsv() {
            const body = document.getElementById('demo-csv-table-body');
            if (!body) return;
            body.innerHTML = '';
            
            // DATOS SINTÉTICOS DE DEMOSTRACIÓN (sin datos personales reales)
            const rawInvoicesData = [
                { id: "OPS-2026-0001", fecha: "2026-05-05 21:40:49", email: "laura.demo01@ejemplo.es", nombre: "Laura Castro Méndez", base: 7.43, iva: 1.56, total: 8.99 },
                { id: "OPS-2026-0002", fecha: "2026-05-05 17:03:33", email: "carmen.demo02@ejemplo.es", nombre: "Carmen Ferreiro Lago", base: 7.43, iva: 1.56, total: 8.99 },
                { id: "OPS-2026-0003", fecha: "2026-04-20 11:17:16", email: "sara.demo03@ejemplo.es", nombre: "Sara Domínguez Prado", base: 4.12, iva: 0.87, total: 4.99 },
                { id: "OPS-2026-0004", fecha: "2026-04-17 15:36:31", email: "nuria.demo04@ejemplo.es", nombre: "Nuria Vázquez Souto", base: 4.12, iva: 0.87, total: 4.99 },
                { id: "OPS-2026-0005", fecha: "2026-05-08 09:28:08", email: "marta.demo05@ejemplo.es", nombre: "Marta Iglesias Rey", base: 7.43, iva: 1.56, total: 8.99 },
                { id: "OPS-2026-0006", fecha: "2026-05-15 00:48:58", email: "alba.demo06@ejemplo.es", nombre: "Alba Seoane Vidal", base: 7.43, iva: 1.56, total: 8.99 },
                { id: "OPS-2026-0007", fecha: "2026-05-15 16:31:15", email: "elena.demo07@ejemplo.es", nombre: "Elena Pereira Costas", base: 7.43, iva: 1.56, total: 8.99 },
                { id: "OPS-2026-0008", fecha: "2026-05-17 16:37:57", email: "nuria.demo04@ejemplo.es", nombre: "Nuria Vázquez Souto", base: 4.12, iva: 0.87, total: 4.99 },
                { id: "OPS-2026-0009", fecha: "2026-05-19 08:51:32", email: "maria.demo09@ejemplo.es", nombre: "María Otero Cabaleiro", base: 7.43, iva: 1.56, total: 8.99 },
                { id: "OPS-2026-0010", fecha: "2026-05-21 12:53:08", email: "rosa.demo10@ejemplo.es", nombre: "Rosa Quintela Barros", base: 7.43, iva: 1.56, total: 8.99 },
                { id: "OPS-2026-0011", fecha: "2026-05-21 18:38:23", email: "juana.demo11@ejemplo.es", nombre: "Juana Mosquera Pena", base: 7.43, iva: 1.56, total: 8.99 },
                { id: "OPS-2026-0012", fecha: "2026-05-23 07:11:56", email: "sonia.demo12@ejemplo.es", nombre: "Sonia Lamas Freire", base: 7.43, iva: 1.56, total: 8.99 },
                { id: "OPS-2026-0013", fecha: "2026-05-25 21:01:32", email: "aroa.demo13@ejemplo.es", nombre: "Aroa Caamaño Sieiro", base: 7.43, iva: 1.56, total: 8.99 },
                { id: "OPS-2026-0014", fecha: "2026-05-28 21:37:02", email: "lucia.demo14@ejemplo.es", nombre: "Lucía Bouzas Antelo", base: 7.43, iva: 1.56, total: 8.99 },
                { id: "OPS-2026-0015", fecha: "2026-06-02 10:23:32", email: "paz.demo15@ejemplo.es", nombre: "Paz Rivas Carballo", base: 7.43, iva: 1.56, total: 8.99 },
                { id: "OPS-2026-0016", fecha: "2026-06-04 16:22:39", email: "bibiana.demo16@ejemplo.es", nombre: "Bibiana Noya Fontán", base: 7.43, iva: 1.56, total: 8.99 },
                { id: "OPS-2026-0017", fecha: "2026-06-05 18:04:36", email: "carmen.demo02@ejemplo.es", nombre: "Carmen Ferreiro Lago", base: 7.43, iva: 1.56, total: 8.99 },
                { id: "OPS-2026-0018", fecha: "2026-06-05 22:39:56", email: "laura.demo01@ejemplo.es", nombre: "Laura Castro Méndez", base: 7.43, iva: 1.56, total: 8.99 },
                { id: "OPS-2026-0019", fecha: "2026-06-08 09:41:46", email: "ana.demo19@ejemplo.es", nombre: "Ana Loureiro Gestal", base: 7.43, iva: 1.56, total: 8.99 }
            ];
            
            rawInvoicesData.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

            rawInvoicesData.forEach(item => {
                const tr = document.createElement('tr');
                const registrada = invoices.some(i => i.id === item.id);
                const statusBadge = registrada 
                    ? '<span class="badge badge-success">✔ Procesado y Encadenado</span>'
                    : '<span class="badge panel-secondary">No Registrado</span>';
                
                tr.innerHTML = `
                    <td class="font-bold text-success">${item.id}</td>
                    <td>${item.fecha}</td>
                    <td>${item.email}</td>
                    <td>${item.nombre}</td>
                    <td>${item.base.toFixed(2)} €</td>
                    <td>${item.iva.toFixed(2)} €</td>
                    <td class="font-bold">${item.total.toFixed(2)} €</td>
                    <td>${statusBadge}</td>
                `;
                body.appendChild(tr);
            });
        }

        // --- NEW PROFESSIONAL UI ENHANCEMENTS & CUSTOM SERVICES ---

        let serviciosFrecuentes = [];

        const DEFAULT_PRESETS = [
            { id: "p1", label: "Suscripción Mensual", concepto: "Suscripción Plan Mensual Oposiciones", precio: 8.99, iva: 21 },
            { id: "p2", label: "Consultoría TI", concepto: "Servicios Profesionales de Consultoría Tecnológica", precio: 65.00, iva: 21 },
            { id: "p3", label: "Desarrollo Web", concepto: "Desarrollo e Integración de Software a Medida", precio: 1200.00, iva: 21 },
            { id: "p4", label: "Mantenimiento Cloud", concepto: "Soporte y Administración de Servidores en la Nube", precio: 150.00, iva: 21 },
            { id: "p5", label: "Formación", concepto: "Sesión de Formación Técnica para Personal de Empresa", precio: 450.00, iva: 21 }
        ];

        function cargarServiciosFrecuentes() {
            const saved = localStorage.getItem('vf_servicios_frecuentes');
            if (saved) {
                serviciosFrecuentes = JSON.parse(saved);
            } else {
                serviciosFrecuentes = [...DEFAULT_PRESETS];
                localStorage.setItem('vf_servicios_frecuentes', JSON.stringify(serviciosFrecuentes));
            }
        }

        function guardarServiciosFrecuentesStorage() {
            localStorage.setItem('vf_servicios_frecuentes', JSON.stringify(serviciosFrecuentes));
        }

        function renderServiciosFrecuentes() {
            const container = document.getElementById('presets-container');
            if (!container) return;
            container.innerHTML = '';

            if (serviciosFrecuentes.length === 0) {
                container.innerHTML = '<span class="text-muted font-size-xs">No hay conceptos guardados. Pulsa Administrar para crear uno.</span>';
                return;
            }

            serviciosFrecuentes.forEach(preset => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'preset-badge-btn';
                btn.innerText = preset.label || preset.concepto;
                btn.onclick = () => aplicarPreset(preset);
                container.appendChild(btn);
            });
        }

        function aplicarPreset(preset) {
            const linesBody = document.getElementById('inv-lines-body');
            const rows = linesBody ? linesBody.querySelectorAll('tr') : [];
            
            let targetRow = null;
            if (rows.length === 1) {
                const conceptoInput = rows[0].querySelector('.line-concepto');
                const precioInput = rows[0].querySelector('.line-precio');
                if (conceptoInput && conceptoInput.value === '' && precioInput && parseFloat(precioInput.value) === 0) {
                    targetRow = rows[0];
                }
            }

            if (!targetRow) {
                addInvoiceLine();
                const newRows = linesBody.querySelectorAll('tr');
                targetRow = newRows[newRows.length - 1];
            }

            targetRow.querySelector('.line-concepto').value = preset.concepto;
            targetRow.querySelector('.line-cantidad').value = 1;
            targetRow.querySelector('.line-precio').value = preset.precio.toFixed(2);
            targetRow.querySelector('.line-iva').value = preset.iva;

            calcularImportesFactura();
            actualizarLivePreview();
            showToast(`Concepto "${preset.label || preset.concepto}" aplicado.`);
        }

        function renderServiciosFrecuentesProfile() {
            const grid = document.getElementById('profile-servicios-grid');
            const badge = document.getElementById('profile-servicios-count');
            if (!grid) return;
            grid.innerHTML = '';

            if (badge) badge.innerText = serviciosFrecuentes.length + ' guardados';

            if (serviciosFrecuentes.length === 0) {
                grid.innerHTML = `
                    <div class="servicios-empty" style="grid-column: 1 / -1;">
                        <span class="servicios-empty-icon">📋</span>
                        No tienes conceptos frecuentes guardados.<br>Crea los tuyos propios para agilizar tu facturación.
                    </div>
                `;
                return;
            }

            serviciosFrecuentes.forEach(s => {
                const card = document.createElement('div');
                card.className = 'servicio-card';
                card.innerHTML = `
                    <div class="servicio-card-info">
                        <div class="servicio-card-name">${s.concepto}</div>
                        <div class="servicio-card-meta">
                            <span>${s.precio.toLocaleString('es-ES', {minimumFractionDigits: 2})} €</span>
                            <span>IVA ${s.iva}%</span>
                        </div>
                    </div>
                    <div class="servicio-card-actions">
                        <button type="button" class="btn-delete-servicio" onclick="eliminarServicioFrecuente('${s.id}')" title="Eliminar">🗑️</button>
                    </div>
                `;
                grid.appendChild(card);
            });
        }

        function guardarServicioFrecuenteDesdeProfile() {
            const nombre = document.getElementById('profile-sf-nombre').value.trim();
            const precio = parseFloat(document.getElementById('profile-sf-precio').value);
            const iva = parseInt(document.getElementById('profile-sf-iva').value);

            if (!nombre) { alert('Introduce un nombre para el concepto.'); return; }
            if (isNaN(precio) || precio < 0) { alert('Introduce un precio válido.'); return; }

            const labelShort = nombre.length > 20 ? nombre.substring(0, 18) + '...' : nombre;

            serviciosFrecuentes.push({
                id: Date.now().toString(36),
                label: labelShort,
                concepto: nombre,
                precio,
                iva
            });

            guardarServiciosFrecuentesStorage();

            document.getElementById('profile-sf-nombre').value = '';
            document.getElementById('profile-sf-precio').value = '';

            renderServiciosFrecuentesProfile();
            showToast(`Concepto "${nombre}" guardado.`);
        }

        function eliminarServicioFrecuente(id) {
            serviciosFrecuentes = serviciosFrecuentes.filter(s => s.id !== id);
            guardarServiciosFrecuentesStorage();
            renderServiciosFrecuentesProfile();
            showToast('Concepto eliminado.');
        }

        function renderUserProfileTab() {
            let myCount = invoices.length;
            let myTotal = invoices.reduce((sum, item) => sum + item.total, 0);

            document.getElementById('profile-full-name').innerText = activeSession.name;
            document.getElementById('profile-user-email').innerText = activeSession.email || (activeSession.name.toLowerCase().replace(' ', '') + '@facturafacil.es');
            
            const badge = document.getElementById('profile-badge-role');
            if (badge) {
                badge.innerText = activeSession.role;
                badge.className = 'badge';
                if (activeSession.role === 'Administrador') badge.classList.add('badge-admin');
                else if (activeSession.role === 'Empleado') badge.classList.add('badge-employee');
                else if (activeSession.role === 'Auditor') badge.classList.add('badge-auditor');
            }

            document.getElementById('profile-avatar-box').innerText = activeSession.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            document.getElementById('profile-company-name').innerText = appConfig.razon;
            document.getElementById('profile-company-nif').innerText = appConfig.nif;
            document.getElementById('profile-last-login').innerText = activeSession.lastLogin || new Date().toLocaleString();

            document.getElementById('profile-stats-count').innerText = myCount;
            document.getElementById('profile-stats-total').innerText = myTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

            // Permisos checks
            const pEmit = document.getElementById('perm-emit');
            const pLogs = document.getElementById('perm-logs');
            const pConfig = document.getElementById('perm-config');

            const setPermBadge = (el, allowed) => {
                if (!el) return;
                if (allowed) {
                    el.innerText = 'Autorizado';
                    el.className = 'badge badge-success';
                    el.style.backgroundColor = 'var(--success-light)';
                    el.style.color = 'var(--success)';
                } else {
                    el.innerText = 'Denegado';
                    el.className = 'badge';
                    el.style.backgroundColor = 'var(--error-light)';
                    el.style.color = 'var(--error)';
                    el.style.borderColor = 'rgba(225,29,72,0.15)';
                }
            };

            setPermBadge(pEmit, activeSession.role !== 'Auditor');
            setPermBadge(pLogs, true); // All roles can inspect logs in this compliance suite
            setPermBadge(pConfig, activeSession.role === 'Administrador');
        }

        function actualizarLivePreview() {
            // Emisor
            document.getElementById('lp-emi-name').innerText = appConfig.razon;
            document.getElementById('lp-emi-nif').innerText = "NIF: " + appConfig.nif;
            document.getElementById('lp-emi-addr').innerText = `${appConfig.direccion}, ${appConfig.cp} ${appConfig.ciudad}`;

            // Meta Right
            const serie = document.getElementById('inv-serie').value;
            const numero = document.getElementById('inv-numero').value;
            document.getElementById('lp-inv-id').innerText = `FACTURA ${serie}-${numero}`;
            
            const fechaInput = document.getElementById('inv-fecha').value;
            const fechaFormat = fechaInput ? fechaInput.split('-').reverse().join('-') : '--/--/----';
            document.getElementById('lp-inv-date').innerText = `Fecha: ${fechaFormat}`;

            // Cliente
            const clientSel = document.getElementById('inv-cliente-sel');
            const selectedNif = clientSel ? clientSel.value : '';
            const clientCard = document.getElementById('client-preview-card');
            
            if (selectedNif) {
                const cli = clients.find(c => c.nif === selectedNif);
                if (cli) {
                    document.getElementById('lp-cli-name').innerText = cli.razon;
                    document.getElementById('lp-cli-nif').innerText = "NIF: " + cli.nif;
                    document.getElementById('lp-cli-addr').innerText = cli.direccion;

                    // Update client preview interactive card in form
                    document.getElementById('client-preview-name').innerText = cli.razon;
                    document.getElementById('client-preview-nif-txt').innerText = "NIF: " + cli.nif;
                    document.getElementById('client-preview-addr').innerText = cli.direccion;
                    document.getElementById('client-preview-avatar').innerText = cli.razon.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    if (clientCard) clientCard.style.display = 'flex';
                }
            } else {
                document.getElementById('lp-cli-name').innerText = "Selecciona un cliente...";
                document.getElementById('lp-cli-nif').innerText = "NIF: --";
                document.getElementById('lp-cli-addr').innerText = "Dirección: --";
                if (clientCard) clientCard.style.display = 'none';
            }

            // Lines
            const linesBody = document.getElementById('inv-lines-body');
            const lpItemsBody = document.getElementById('lp-items-body');
            if (!lpItemsBody) return;
            lpItemsBody.innerHTML = '';

            const rows = linesBody ? linesBody.querySelectorAll('tr') : [];
            let baseTotal = 0;
            let ivaTotal = 0;

            rows.forEach(row => {
                const conceptoInput = row.querySelector('.line-concepto');
                const concepto = conceptoInput ? (conceptoInput.value || 'Concepto sin definir') : 'Concepto sin definir';
                const cant = parseFloat(row.querySelector('.line-cantidad').value) || 0;
                const precio = parseFloat(row.querySelector('.line-precio').value) || 0;
                const ivaPct = parseFloat(row.querySelector('.line-iva').value) || 0;

                const baseLine = cant * precio;
                const ivaLine = baseLine * (ivaPct / 100);
                const totalLine = baseLine + ivaLine;

                baseTotal += baseLine;
                ivaTotal += ivaLine;

                // Update subtotal display on form line row
                const subtotalCell = row.querySelector('.line-total-ver');
                if (subtotalCell) {
                    subtotalCell.innerText = totalLine.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
                }

                // Add to Live Preview document table
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="font-semibold" style="text-align: left;">${concepto}</td>
                    <td class="text-right">${cant}</td>
                    <td class="text-right">${precio.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</td>
                    <td class="text-right font-bold">${totalLine.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</td>
                `;
                lpItemsBody.appendChild(tr);
            });

            if (rows.length === 0) {
                lpItemsBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">Sin conceptos añadidos</td></tr>';
            }

            const grandTotal = baseTotal + ivaTotal;

            // Form totals update
            const calcBase = document.getElementById('calc-base');
            const calcIva = document.getElementById('calc-iva');
            const calcTotal = document.getElementById('calc-total');
            if (calcBase) calcBase.innerText = baseTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
            if (calcIva) calcIva.innerText = ivaTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
            if (calcTotal) calcTotal.innerText = grandTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

            // Live preview totals update
            document.getElementById('lp-subtotal').innerText = baseTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
            document.getElementById('lp-iva').innerText = ivaTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
            document.getElementById('lp-total').innerText = grandTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
        }

        window.onload = async () => {
            await cargarBaseDatos();
        };