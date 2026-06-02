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

      <div class="receipt-page">
        <div class="receipt-preview-container">
          <div class="receipt-paper" id="receiptNode">
            <!-- Contenido del recibo cargado dinámicamente -->
            <div class="text-center"><div class="spinner mx-auto"></div> Cargando recibo...</div>
          </div>
        </div>
        
        <div class="receipt-actions card" style="align-self: flex-start;">
          <h3 class="font-semibold text-md mb-4 pb-2 border-bottom">Acciones de Comprobante</h3>
          
          <button class="btn btn-primary w-100" onclick="receiptPage.copyAsImage()" id="btnCopyImg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copiar como Imagen
          </button>
          
          <div class="text-xs text-gray-500 mt-2 text-center">
            Ideal para pegar en WhatsApp.
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
    
    // Cargar la librería html2canvas si no está cargada
    if (typeof html2canvas === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.onload = () => this.loadData();
      document.head.appendChild(script);
    } else {
      await this.loadData();
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
    
    // Preparar info
    const bizName = settings.business_name || 'Control de Lavandería';
    const bizPhone = settings.business_phone ? `Tel: ${settings.business_phone}` : '';
    const bizAddress = settings.business_address || '';
    
    const clientName = order.client_name;
    const clientPhone = order.client_phone || '';
    
    let serviceDetail = '';
    if (order.weight_kg > 0) serviceDetail += `${order.weight_kg} Kg`;
    if (order.weight_kg > 0 && order.garment_count > 0) serviceDetail += ' / ';
    if (order.garment_count > 0) serviceDetail += `${order.garment_count} pzas`;

    html = `
      <div class="receipt-header-section">
        <div class="receipt-business-name">${bizName}</div>
        <div class="receipt-business-info">
          ${bizAddress ? `<div>${bizAddress}</div>` : ''}
          ${bizPhone ? `<div>${bizPhone}</div>` : ''}
        </div>
        <div class="receipt-order-number">TICKET: ${order.order_number}</div>
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
          ${order.service_name}<br>
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
        ${settings.receipt_message ? `<div style="font-weight: bold; margin-bottom: 8px;">${settings.receipt_message}</div>` : ''}
        ${settings.receipt_footer ? `<div class="receipt-footer-message">${settings.receipt_footer.replace(/\n/g, '<br>')}</div>` : ''}
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
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  },

  print() {
    window.print();
  }
};
