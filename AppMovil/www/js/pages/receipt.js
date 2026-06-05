window.receiptPage = {
  orderId: null,
  data: null,

  async render(params) {
    this.orderId = params ? params.id : null;
    
    if (!this.orderId) {
      return `<div class="empty-state">Error: ID de pedido no proporcionado</div>`;
    }

    return `
      <div class="mb-4">
        <button class="btn btn-secondary btn-sm" onclick="app.navigate('order-detail', {id: ${this.orderId}})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Volver al Pedido
        </button>
      </div>

      <div class="receipt-page flex-col align-center" style="gap: 24px; padding: 10px 0;">
        <div class="receipt-preview-container" style="width: 100%; display: flex; justify-content: center; overflow-x: auto;">
          <div class="receipt-paper" id="receiptNode" style="margin: 0 auto;">
            <!-- Contenido del recibo cargado dinámicamente -->
            <div class="text-center"><div class="spinner mx-auto"></div> Cargando recibo...</div>
          </div>
        </div>
        
        <div class="receipt-actions card w-100" style="max-width: 400px; margin: 0 auto;">
          <h3 class="font-semibold text-md mb-4 pb-2 border-bottom">Acciones de Comprobante</h3>
          
          <button class="btn btn-primary w-100" onclick="receiptPage.copyAsImage()" id="btnCopyImg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copiar como Imagen
          </button>

          <button class="btn btn-success w-100 mt-3" style="background-color: #25D366; border-color: #25D366;" onclick="receiptPage.sendToWhatsApp()" id="btnSendWA">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Enviar por WhatsApp
          </button>
          
          <div class="text-xs text-gray-500 mt-2 text-center">
            Pega (Ctrl+V) la imagen en el chat.
          </div>
          
          <div class="divider my-4"></div>
          
          <button class="btn btn-secondary w-100" onclick="receiptPage.print()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Imprimir
          </button>
        </div>
      </div>
    `;
  },

  async init(params) {
    if (!this.orderId) return;

    // El recibo se muestra siempre, sin depender de librerías externas (funciona sin internet).
    await this.loadData();

    // html2canvas se carga en segundo plano solo para "Copiar como Imagen".
    if (typeof html2canvas === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.onerror = () => console.warn('html2canvas no disponible (sin conexión). El recibo se muestra igual; "Copiar como Imagen" no estará disponible hasta tener internet.');
      document.head.appendChild(script);
    }
  },

  async loadData() {
    try {
      const res = await window.api.receipt.getOrderForReceipt(this.orderId);
      if (res.success) {
        this.data = res.data;
        this.renderReceipt();
      } else {
        toast.error('Error', 'No se pudo cargar la información para el recibo');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error', 'Problema al cargar el recibo');
    }
  },

  renderReceipt() {
    if (!this.data) return;
    const { order, settings } = this.data;
    
    const container = document.getElementById('receiptNode');
    
    const esc = (v) => format.escapeHtml(v);

    // Preparar info
    const bizName = esc(settings.business_name || 'Control de Lavandería');
    const bizPhone = settings.business_phone ? `Tel: ${esc(settings.business_phone)}` : '';
    const bizAddress = esc(settings.business_address || '');
    const clientName = esc(order.client_name);
    const clientPhone = esc(order.client_phone || '');

    let serviceDetail = '';
    if (order.weight_kg > 0) serviceDetail += `${order.weight_kg} Kg`;
    if (order.weight_kg > 0 && order.garment_count > 0) serviceDetail += ' / ';
    if (order.garment_count > 0) serviceDetail += `${order.garment_count} pzas`;

    const html = `
      <div class="receipt-header-section">
        <div class="receipt-business-name">${bizName}</div>
        <div class="receipt-business-info">
          ${bizAddress ? `<div>${bizAddress}</div>` : ''}
          ${bizPhone ? `<div>${bizPhone}</div>` : ''}
        </div>
        <div class="receipt-order-number">TICKET: ${esc(order.order_number)}</div>
      </div>

      <div class="receipt-row">
        <span class="receipt-label">Fecha:</span>
        <span class="receipt-value">${format.datetime(order.received_date)}</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-label">Entrega:</span>
        <span class="receipt-value">${format.date(order.estimated_delivery)}</span>
      </div>
      
      <div class="receipt-divider"></div>
      
      <div class="receipt-row">
        <span class="receipt-label">Cliente:</span>
        <span class="receipt-value">${clientName}</span>
      </div>
      ${clientPhone ? `
      <div class="receipt-row">
        <span class="receipt-label">Teléfono:</span>
        <span class="receipt-value">${clientPhone}</span>
      </div>` : ''}
      
      <div class="receipt-divider"></div>
      
      <div class="receipt-row" style="margin-bottom: 8px;">
        <span class="receipt-value" style="text-align: left; font-weight: bold;">Descripción</span>
        <span class="receipt-value" style="text-align: right; font-weight: bold;">Importe</span>
      </div>
      
      <div class="receipt-row">
        <span class="receipt-label" style="text-align: left;">
          ${esc(order.service_name)}<br>
          <span style="font-size: 11px;">${serviceDetail}</span>
        </span>
        <span class="receipt-value">${format.currency(order.base_amount)}</span>
      </div>
      
      ${order.discount > 0 ? `
      <div class="receipt-row mt-2">
        <span class="receipt-label" style="text-align: left;">Descuento</span>
        <span class="receipt-value text-danger">-${format.currency(order.discount)}</span>
      </div>` : ''}
      
      <div class="receipt-total-row">
        <span class="receipt-label">TOTAL</span>
        <span class="receipt-value">${format.currency(order.final_amount)}</span>
      </div>
      
      <div class="receipt-divider"></div>
      
      <div class="receipt-row mt-2">
        <span class="receipt-label">Estado:</span>
        <span class="receipt-value font-bold">${format.statusText(order.status).toUpperCase()}</span>
      </div>
      
      <div class="receipt-footer-section">
        ${settings.receipt_message ? `<div style="font-weight: bold; margin-bottom: 8px;">${esc(settings.receipt_message)}</div>` : ''}
        ${settings.receipt_footer ? `<div class="receipt-footer-message">${esc(settings.receipt_footer).replace(/\n/g, '<br>')}</div>` : ''}
      </div>
    `;

    container.innerHTML = html;
  },

  async copyAsImage() {
    if (typeof html2canvas === 'undefined') {
      toast.error('Error', 'La librería de captura de imagen aún se está cargando, intente nuevamente.');
      return;
    }

    const btn = document.getElementById('btnCopyImg');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner spinner-sm"></div> Copiando...';

    try {
      const node = document.getElementById('receiptNode');
      
      // Aplicar estilos temporales para la captura si es necesario
      const originalBorder = node.style.border;
      const originalShadow = node.style.boxShadow;
      node.style.border = 'none';
      node.style.boxShadow = 'none';
      
      const canvas = await html2canvas(node, {
        scale: 2, // Mejor calidad
        backgroundColor: '#ffffff',
        logging: false
      });
      
      // Restaurar estilos
      node.style.border = originalBorder;
      node.style.boxShadow = originalShadow;

      const dataUrl = canvas.toDataURL('image/png');
      
      // Enviar al main process para poner en el portapapeles (IPC nativeImage)
      const res = await window.api.receipt.copyToClipboard(dataUrl);
      
      if (res.success) {
        toast.success('Copiado', 'El recibo se ha copiado como imagen al portapapeles. Puede pegarlo en WhatsApp.');
      } else {
        throw new Error(res.error);
      }
    } catch (e) {
      console.error('Error al generar imagen:', e);
      toast.error('Error', 'No se pudo generar la imagen del recibo.');
      return false;
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  },

  async sendToWhatsApp() {
    if (!this.data) return;
    
    let phone = this.data.order.client_phone || '';
    phone = phone.replace(/\D/g, ''); // Remove non-numeric
    
    if (!phone) {
      toast.error('Atención', 'El cliente no tiene un número de teléfono registrado.');
      return;
    }

    const btn = document.getElementById('btnSendWA');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner spinner-sm"></div> Procesando...';

    // Auto copy image first
    await this.copyAsImage(); 
    
    // Open WA Web
    const msg = encodeURIComponent(`Hola ${this.data.order.client_name}, aquí tienes el comprobante de tu pedido ${this.data.order.order_number}.`);
    
    // In Electron renderer without shell module, window.open works best for external links if webPreferences allows it,
    // or we can just create an anchor and click it.
    const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${msg}`;
    window.open(waUrl, '_blank');
    
    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }, 1000);
  },

  print() {
    window.print();
  }
};
