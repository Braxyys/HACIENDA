// Global State & Session Ledgers
        const p1_ledger = [];
        const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

        const p3_invoices = [
            { id: "B2B-001", cliente: "Distribuciones Bahía S.L.", base: 1200.00, total: 1452.00, estado: "SENT" },
            { id: "B2B-002", cliente: "Suministros Lorenzo S.A.", base: 450.00, total: 544.50, estado: "ACCEPTED" },
            { id: "B2B-003", cliente: "Bahía Frutas S.L.", base: 1200.00, total: 1452.00, estado: "SENT" }
        ];

        // Hash helper
        async function sha256(message) {
            const msgBuffer = new TextEncoder().encode(message);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex;
        }

        // Switch Navigation Tabs
        function switchTab(tabId) {
            // Hide all tab content panes
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            // Remove active classes from buttons
            document.querySelectorAll('.nav-tab-btn').forEach(el => el.classList.remove('active'));
            
            // Show selected tab content pane
            document.getElementById(tabId).classList.add('active');
            
            // Find and activate the button calling this tab
            const tabBtn = Array.from(document.querySelectorAll('.nav-tab-btn')).find(btn => btn.getAttribute('onclick').includes(tabId));
            if (tabBtn) tabBtn.classList.add('active');

            // Hook calculations to prevent empty forms showing zero values
            if (tabId === 'tab-saas') p1_calcular();
            if (tabId === 'tab-b2b') p3_render();
        }

        // Show toast alert helper
        function showToast(message) {
            const toast = document.getElementById('toast');
            document.getElementById('toast-message').innerText = message;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3500);
        }

        // ==========================================
        // PROJECT 1 LOGIC (SAAS VERIFACTU)
        // ==========================================
        function p1_calcular() {
            const base = parseFloat(document.getElementById('p1-base').value) || 0;
            const iva = parseInt(document.getElementById('p1-iva').value) || 21;
            const ivaImporte = base * (iva / 100);
            const total = base + ivaImporte;

            document.getElementById('p1-tot-base').innerText = base.toFixed(2) + " €";
            document.getElementById('p1-tot-iva').innerText = ivaImporte.toFixed(2) + " €";
            document.getElementById('p1-tot-grand').innerText = total.toFixed(2) + " €";

            // Update preview card
            const cliName = document.getElementById('p1-cli-name').value || "Nombre del Cliente";
            const cliNif = document.getElementById('p1-cli-nif').value || "NIF: -";
            const concepto = document.getElementById('p1-concepto').value || "Introduce datos...";

            document.getElementById('p1-view-cli-name').innerText = cliName;
            document.getElementById('p1-view-cli-nif').innerText = "NIF: " + cliNif;
            document.getElementById('p1-view-concepto').innerText = concepto;
            document.getElementById('p1-view-base').innerText = base.toFixed(2) + " €";
            document.getElementById('p1-view-iva').innerText = iva + "%";
            document.getElementById('p1-view-total').innerText = total.toFixed(2) + " €";
        }

        async function p1_emitirFactura() {
            const serie = document.getElementById('p1-serie').value;
            const numero = parseInt(document.getElementById('p1-numero').value);
            const cliNif = document.getElementById('p1-cli-nif').value;
            const cliName = document.getElementById('p1-cli-name').value;
            const concepto = document.getElementById('p1-concepto').value;
            const base = parseFloat(document.getElementById('p1-base').value) || 0;
            const iva = parseInt(document.getElementById('p1-iva').value) || 21;

            if (base <= 0) {
                alert("Introduce una base imponible válida.");
                return;
            }

            const ivaImporte = base * (iva / 100);
            const total = base + ivaImporte;

            // Generate hashes
            const ultHash = p1_ledger.length > 0 ? p1_ledger[p1_ledger.length - 1].hashFactura : GENESIS_HASH;
            const dateStr = new Date().toISOString().split('T')[0];
            const concatStr = `A1234567B|${serie}-${numero}|${dateStr}|${total.toFixed(2)}|${ultHash}`;
            const hashFactura = await sha256(concatStr);

            // Add to session ledger
            const factura = {
                id: `${serie}-${numero}`,
                cliente: cliName,
                total: total,
                hashAnterior: ultHash,
                hashFactura: hashFactura
            };
            p1_ledger.push(factura);

            // Render PDF Invoice View update
            document.getElementById('p1-view-num').innerText = `FACTURA #${factura.id}`;
            document.getElementById('p1-view-date').innerText = `Fecha: ${dateStr.split('-').reverse().join('-')}`;
            document.getElementById('p1-view-hash').innerText = hashFactura;
            document.getElementById('p1-verifactu-block').style.opacity = "1";
            
            // Build QR Image API
            const qrUrl = `https://www2.agenciatributaria.gob.es/wlpl/TBAI-VFCT/QR?nif=A1234567B&numserie=${serie}-${numero}&fecha=${dateStr}&importe=${total.toFixed(2)}&hash=${hashFactura}`;
            document.getElementById('p1-qr').innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(qrUrl)}" style="width:80px;height:80px;" alt="QR Code">`;

            // Render output payload
            const jsonSchema = {
                "Cabecera": { "ObligadoEmisor": "A1234567B", "Version": "1.0" },
                "RegistroFactura": {
                    "IdFactura": { "SerieNumero": factura.id, "FechaExpedicion": dateStr },
                    "DetalleOperacion": { "BaseImponible": base.toFixed(2), "IVATipo": iva, "ImporteTotal": total.toFixed(2) },
                    "Destinatario": { "NIF": cliNif, "RazonSocial": cliName },
                    "Encadenamiento": { "HashAnterior": ultHash },
                    "HuellaDigital": hashFactura
                }
            };
            document.getElementById('p1-console').innerText = JSON.stringify(jsonSchema, null, 2);

            // Update ledger table
            p1_renderLedger();
            
            // Increment form invoice number
            document.getElementById('p1-numero').value = numero + 1;
            showToast(`Factura ${factura.id} registrada en el ledger local.`);

            // Reset fields
            document.getElementById('p1-cli-nif').value = '';
            document.getElementById('p1-cli-name').value = '';
            document.getElementById('p1-concepto').value = '';
            document.getElementById('p1-base').value = '';
            p1_calcular();
        }

        function p1_renderLedger() {
            const body = document.getElementById('p1-ledger');
            body.innerHTML = '';
            
            if (p1_ledger.length === 0) {
                body.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted); font-size:0.75rem;">No se han emitido facturas.</td></tr>';
                return;
            }

            p1_ledger.forEach(fac => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight:600; color:white;">${fac.id}</td>
                    <td>${fac.cliente}</td>
                    <td style="font-weight:700; color:var(--accent-cyan);">${fac.total.toFixed(2)} €</td>
                    <td><span class="hash-code" title="${fac.hashAnterior}">${fac.hashAnterior.substring(0,10)}...</span></td>
                    <td><span class="hash-code" style="color:#a5b4fc;" title="${fac.hashFactura}">${fac.hashFactura.substring(0,10)}...</span></td>
                `;
                body.appendChild(tr);
            });
        }

        // ==========================================
        // PROJECT 2 LOGIC (API MIDDLEWARE)
        // ==========================================
        async function p2_enviarAPI() {
            const reqBody = document.getElementById('p2-body').value;
            const statusBox = document.getElementById('p2-status');
            const consoleBox = document.getElementById('p2-console');
            const qrBox = document.getElementById('p2-qr-container');

            try {
                const data = JSON.parse(reqBody);
                statusBox.innerHTML = '<span style="color:var(--success);">200 OK (Solicitud Procesada)</span>';
                
                // Perform calculations simulated
                const base = parseFloat(data.base_imponible) || 0;
                const iva = parseFloat(data.tipo_iva) || 21;
                const total = base + (base * (iva / 100));

                const dateStr = data.fecha || new Date().toISOString().split('T')[0];
                const fakeHash = await sha256(`A1234567B|${data.serie}-${data.numero}|${dateStr}|${total.toFixed(2)}|${GENESIS_HASH}`);
                
                const qrUrl = `https://www2.agenciatributaria.gob.es/wlpl/TBAI-VFCT/QR?nif=A1234567B&numserie=${data.serie}-${data.numero}&fecha=${dateStr}&importe=${total.toFixed(2)}&hash=${fakeHash}`;

                const responseObj = {
                    "status": "success",
                    "code": 200,
                    "timestamp": new Date().toISOString(),
                    "response": {
                        "factura_id": `vf_id_${Math.random().toString(36).substring(2, 9)}`,
                        "serie_numero": `${data.serie}-${data.numero}`,
                        "firma_XAdES": "XAdES-BES-Envelope-Signature_MIIEuwYJKoZIhvcNAQcCoIIErDCC...",
                        "verifactu_hash": fakeHash,
                        "qr_url": qrUrl,
                        "mensajes": [
                            "Registro firmado digitalmente con certificado X.509 de Lorenzo Corp.",
                            "Factura encolada para transmisión síncrona a servidores AEAT.",
                            "Respuesta recibida: AEAT_ACCEPTED (Correcto)."
                        ]
                    }
                };

                consoleBox.innerText = JSON.stringify(responseObj, null, 2);
                qrBox.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrUrl)}" style="width:100px; height:100px;" alt="API QR">`;
                showToast("Llamada API simulada con éxito.");

            } catch (err) {
                statusBox.innerHTML = '<span style="color:var(--error);">400 Bad Request (Error en Payload)</span>';
                consoleBox.innerText = JSON.stringify({ "error": "JSON mal formateado", "message": err.message }, null, 2);
                qrBox.innerHTML = '<span style="color:var(--error);">Error</span>';
            }
        }

        // ==========================================
        // PROJECT 3 LOGIC (PORTAL CREA Y CRECE B2B)
        // ==========================================
        function p3_render() {
            const list = document.getElementById('p3-list');
            list.innerHTML = '';

            p3_invoices.forEach(inv => {
                let badgeClass = 'badge-warning';
                let stateText = 'Enviada (Pendiente)';
                if (inv.estado === 'ACCEPTED') {
                    badgeClass = 'badge-info';
                    stateText = 'Aceptada Comercial';
                } else if (inv.estado === 'PAID') {
                    badgeClass = 'badge-success';
                    stateText = 'Cobrada / Pagada';
                }

                const item = document.createElement('div');
                item.className = 'b2b-invoice-item';
                item.onclick = () => p3_inspeccionar(inv.id);
                item.innerHTML = `
                    <div>
                        <div style="font-weight:700; font-size:0.9rem; color:white;">${inv.id} - ${inv.cliente}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.15rem;">Base: ${inv.base.toFixed(2)} € | Total: ${inv.total.toFixed(2)} €</div>
                    </div>
                    <div style="display:flex; flex-direction:column; align-items:flex-end; gap:0.4rem;">
                        <span class="badge ${badgeClass}">${stateText}</span>
                        ${inv.estado === 'ACCEPTED' ? `<button class="btn" style="font-size:0.65rem; padding:0.2rem 0.5rem; border-radius:4px;" onclick="event.stopPropagation(); p3_marcarPagado('${inv.id}')">Cobrada (Manual)</button>` : ''}
                        ${inv.estado === 'SENT' ? `<button class="btn" style="font-size:0.65rem; padding:0.2rem 0.5rem; border-radius:4px; background:var(--accent-teal);" onclick="event.stopPropagation(); p3_cambiarEstado('${inv.id}', 'ACCEPTED')">Aceptar Factura</button>` : ''}
                    </div>
                `;
                list.appendChild(item);
            });
        }

        function p3_inspeccionar(id) {
            const inv = p3_invoices.find(i => i.id === id);
            if (!inv) return;

            const xmlStr = `<?xml version="1.0" encoding="UTF-8"?>
<fe:Facturae xmlns:fe="http://www.facturae.es/Facturae/2014/v3.2.2/Facturae">
  <FileHeader>
    <SchemaVersion>3.2.2</SchemaVersion>
    <Batch>
      <BatchIdentifier>${inv.id}-BATCH</BatchIdentifier>
      <TotalInvoicesAmount><TotalAmount>${inv.total.toFixed(2)}</TotalAmount></TotalInvoicesAmount>
    </Batch>
  </FileHeader>
  <Parties>
    <SellerParty>
      <TaxIdentificationNumber>A1234567B</TaxIdentificationNumber>
      <CorporateName>Juan Pérez Lorenzo S.L.</CorporateName>
    </SellerParty>
    <BuyerParty>
      <TaxIdentificationNumber>B87654321</TaxIdentificationNumber>
      <CorporateName>${inv.cliente}</CorporateName>
    </BuyerParty>
  </Parties>
  <Invoices>
    <Invoice>
      <InvoiceHeader>
        <InvoiceNumber>${inv.id}</InvoiceNumber>
        <InvoiceDate>2026-06-04</InvoiceDate>
      </InvoiceHeader>
      <InvoiceTotals>
        <TotalGrossAmount>${inv.base.toFixed(2)}</TotalGrossAmount>
        <TotalTaxOutputs>
          <Tax>
            <TaxTypeCode>01</TaxTypeCode>
            <TaxRate>21.00</TaxRate>
            <TaxableBase><Double>${inv.base.toFixed(2)}</Double></TaxableBase>
          </Tax>
        </TotalTaxOutputs>
      </InvoiceTotals>
    </Invoice>
  </Invoices>
</fe:Facturae>`;

            document.getElementById('p3-xml-console').innerText = xmlStr;
            showToast(`Inspeccionando XML Facturae de ${inv.id}`);
        }

        function p3_cambiarEstado(id, nuevoEstado) {
            const inv = p3_invoices.find(i => i.id === id);
            if (inv) {
                inv.estado = nuevoEstado;
                p3_render();
                showToast(`Factura ${id} modificada a estado: ${nuevoEstado}`);
                p3_inspeccionar(id);
            }
        }

        function p3_marcarPagado(id) {
            p3_cambiarEstado(id, 'PAID');
        }

        function p3_generarB2B() {
            const cli = document.getElementById('p3-cli').value;
            const base = parseFloat(document.getElementById('p3-base').value) || 0;
            
            if (base <= 0 || !cli) {
                alert("Introduce valores correctos.");
                return;
            }

            const total = base * 1.21;
            const index = p3_invoices.length + 1;
            const newId = `B2B-00${index}`;

            p3_invoices.push({
                id: newId,
                cliente: cli,
                base: base,
                total: total,
                estado: "SENT"
            });

            p3_render();
            p3_inspeccionar(newId);
            showToast(`Factura B2B ${newId} generada en formato XML.`);
        }

        // PSD2 simulated reconciliation matching
        function p3_conciliar(idSuffix, importe) {
            const targetId = `B2B-00${idSuffix}`;
            const inv = p3_invoices.find(i => i.id === targetId);

            if (inv) {
                if (inv.estado === 'PAID') {
                    showToast(`La factura ${targetId} ya ha sido conciliada anteriormente.`);
                    return;
                }
                
                // Match values
                if (Math.abs(inv.total - importe) < 0.01) {
                    inv.estado = 'PAID';
                    p3_render();
                    showToast(`API PSD2: Cobro conciliado automáticamente para ${targetId}. Fecha de cobro registrada.`);
                    p3_inspeccionar(targetId);
                } else {
                    showToast(`API PSD2: Los importes no coinciden para ${targetId}.`);
                }
            } else {
                showToast(`No se encontró la factura ${targetId} para conciliar.`);
            }
        }

        // ==========================================
        // PROJECT 4 LOGIC (ROUTER FISCAL)
        // ==========================================
        function p4_enrutamiento() {
            const prov = document.getElementById('p4-provincia').value;
            const cp = document.getElementById('p4-cp').value;
            const sii = document.getElementById('p4-sii').checked;

            const dVer = document.getElementById('node-verifactu');
            const dSii = document.getElementById('node-sii');
            const dBiz = document.getElementById('node-tbai-biz');
            const dGip = document.getElementById('node-tbai-gip');

            // Reset status
            document.querySelectorAll('.routing-node').forEach(el => el.classList.remove('active'));

            let diagnostic = "";
            let endpoint = "";

            // Check vascongadas
            if (prov === 'BIZKAIA' || cp.startsWith('48')) {
                dBiz.classList.add('active');
                diagnostic = "El emisor tiene domicilio fiscal en Bizkaia. Aplica normativa regional TBAI con anotación LROE (Libro Registro de Operaciones Económicas).";
                endpoint = "https://pru-lroe.bizkaia.eus/eu/lroe/v1/facturas";
            } else if (prov === 'GIPUZKOA' || cp.startsWith('20')) {
                dGip.classList.add('active');
                diagnostic = "El emisor tiene domicilio fiscal en Gipuzkoa. Aplica normativa foral TicketBAI tradicional (Firmado XML XAdES y envío AS4).";
                endpoint = "https://ticketbai.gipuzkoa.eus/tbai/obtenerQR";
            } else if (prov === 'ALAVA' || cp.startsWith('01')) {
                // Alava uses similar TBAI node
                dGip.classList.add('active'); // Mapped to Gipuzkoa node representatively
                diagnostic = "El emisor tiene domicilio fiscal en Álava. Aplica normativa foral TicketBAI Araba (Envío SOAP XML).";
                endpoint = "https://ticketbai.araba.eus/tbai/wswd";
            } else {
                // National territory
                if (sii) {
                    dSii.classList.add('active');
                    diagnostic = "El emisor declara estar acogido u obligado al SII (volumen de ventas >6M€). Queda eximido de Verifactu y se envía el detalle por lote SOAP XML.";
                    endpoint = "https://www1.agenciatributaria.gob.es/wlpl/SSII-FACT/ws/SuministroFactEmitidas";
                } else {
                    dVer.classList.add('active');
                    diagnostic = "Emisor nacional general (no vasco, no obligado a SII). Aplica el nuevo reglamento Veri*factu (Real Decreto 1007/2023) para el envío inmediato de registros individuales.";
                    endpoint = "https://www2.agenciatributaria.gob.es/wlpl/TBAI-VFCT/WD/Verifactu";
                }
            }

            document.getElementById('p4-diagnostic').innerText = diagnostic;
            document.getElementById('p4-endpoint').innerText = endpoint;
            showToast("Calculado enrutamiento fiscal óptimo.");
        }