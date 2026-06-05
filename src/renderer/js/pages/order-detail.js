window.orderDetailPage = {
  orderId: null,
  data: null,

  async render(params) {
    this.orderId = params ? params.id : null;
    
    if (!this.orderId) {
      return `<div class="empty-state">Error: ID de pedido no proporcionado</div>`;
    }

    return `
      <div class="flex-between align-center mb-6">
        <button class="btn btn-secondary btn-sm" onclick="app.navigate('orders')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Volver a Pedidos
        </button>
        
        <div class="flex-align gap-3">
          <button class="btn btn-primary" onclick="app.navigate('receipt', {id: ${this.orderId}})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Comprobante Digital
          </button>
        </div>
      </div>

      <div class="grid grid-3">
        <!-- Columna Izquierda: Detalles -->
        <div style="grid-column: span 2;" class="flex-col gap-4">
          
          <div class="card" id="detailHeaderCard">
            <div class="flex-between align-center border-bottom pb-4 mb-4">
              <div>
                <div class="text-sm text-gray-500 mb-1">PEDIDO</div>
                <div class="font-bold text-2xl text-primary" id="detailOrderNumber">Cargando...</div>
              </div>
              <div id="detailStatusBadge"></div>
            </div>

            <div class="order-detail-grid">
              <div class="order-detail-info">
                <div class="text-xs font-semibold text-gray-400 mb-2">DATOS DEL CLIENTE</div>
                <div class="info-row">
                  <div class="info-label">Nombre</div>
                  <div class="info-value font-medium" id="detailClientName">-</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Teléfono</div>
                  <div class="info-value" id="detailClientPhone">-</div>
                </div>
                <div class="info-row" style="border-bottom: none;">
                  <div class="info-label">Documento</div>
                  <div class="info-value" id="detailClientDoc">-</div>
                </div>
              </div>

              <div class="order-detail-info">
                <div class="text-xs font-semibold text-gray-400 mb-2">FECHAS</div>
                <div class="info-row">
                  <div class="info-label">Recepción</div>
                  <div class="info-value" id="detailReceivedDate">-</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Entrega Estimada</div>
                  <div class="info-value" id="detailEstimatedDate">-</div>
                </div>
                <div class="info-row" style="border-bottom: none;">
                  <div class="info-label">Entregado el</div>
                  <div class="info-value" id="detailDeliveredDate">-</div>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-2">
            <div class="card">
              <h3 class="font-semibold text-md mb-4 border-bottom pb-3">Detalle del Servicio</h3>
              
              <div class="flex-between align-center mb-4">
                <div class="flex-align gap-3">
                  <div class="stat-icon primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="6.5"/></svg></div>
                  <div>
                    <div class="font-bold text-gray-800" id="detailServiceName">-</div>
                    <div class="text-sm text-gray-500" id="detailServiceAmount">-</div>
                  </div>
                </div>
                <div class="font-bold text-xl" id="detailTotalAmount">-</div>
              </div>

              <div class="bg-gray-50 p-4 rounded-lg">
                <div class="text-sm font-semibold text-gray-600 mb-2">Observaciones de prendas:</div>
                <p class="text-sm text-gray-700" id="detailNotes">-</p>
              </div>
            </div>

            <div class="card">
              <h3 class="font-semibold text-md mb-4 border-bottom pb-3 flex-between align-center">
                <span>Estado de Pago</span>
                <span id="detailPaymentBadge"></span>
              </h3>
              
              <div class="flex-between align-center mb-3">
                <span class="text-gray-600">Total del Servicio:</span>
                <span class="font-bold text-lg" id="detailPaymentTotal">-</span>
              </div>
              
              <div class="flex-between align-center mb-3 text-success" id="detailPaymentAdvanceRow" style="display: none;">
                <span>Adelanto Pagado:</span>
                <span class="font-bold" id="detailPaymentAdvance">-</span>
              </div>
              
              <div class="flex-between align-center border-top pt-3 mt-3">
                <span class="text-gray-800 font-medium">Saldo Pendiente:</span>
                <span class="font-bold text-xl text-danger" id="detailPaymentBalance">-</span>
              </div>

              <div id="paymentActionContainer" class="mt-4 pt-4 border-top" style="display: none;">
                <button class="btn btn-success w-100" style="justify-content: center;" onclick="orderDetailPage.markAsPaid()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  Cobrar Saldo
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Columna Derecha: Acciones y Estado -->
        <div class="flex-col gap-4">
          <div class="card">
            <h3 class="font-semibold text-md mb-4 pb-3 border-bottom">Actualizar Estado</h3>
            
            <div class="order-status-actions flex-col gap-2" id="statusButtonsContainer">
              <button class="status-btn" data-status="received" onclick="orderDetailPage.updateStatus('received')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Recibido
              </button>
              
              <button class="status-btn" data-status="in_progress" onclick="orderDetailPage.updateStatus('in_progress')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                En Proceso
              </button>
              
              <button class="status-btn" data-status="ready" onclick="orderDetailPage.updateStatus('ready')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Listo para recoger
              </button>
              
              <div class="divider my-2"></div>
              
              <button class="status-btn" data-status="delivered" onclick="orderDetailPage.updateStatus('delivered')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M20 6 9 17l-5-5"/></svg>
                Entregado al cliente
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async init(params) {
    if (!this.orderId) return;
    await this.loadData();
  },

  async loadData() {
    try {
      const res = await window.api.orders.getById(this.orderId);
      if (res.success) {
        this.data = res.data;
        this.updateUI();
      } else {
        toast.error('Error', 'No se pudo cargar la información del pedido');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error', 'Problema al conectar con la base de datos');
    }
  },

  updateUI() {
    if (!this.data) return;
    const d = this.data;

    document.getElementById('detailOrderNumber').textContent = d.order_number;
    document.getElementById('detailStatusBadge').innerHTML = format.statusBadge(d.status);

    document.getElementById('detailClientName').textContent = d.client_name;
    document.getElementById('detailClientPhone').textContent = d.client_phone || '-';
    document.getElementById('detailClientDoc').textContent = d.client_document || '-';

    document.getElementById('detailReceivedDate').textContent = format.datetime(d.received_date);
    document.getElementById('detailEstimatedDate').textContent = format.date(d.estimated_delivery);
    document.getElementById('detailDeliveredDate').textContent = d.delivered_date ? format.datetime(d.delivered_date) : '-';

    document.getElementById('detailServiceName').textContent = d.service_name;
    
    let amountText = [];
    if (d.weight_kg > 0) amountText.push(`${d.weight_kg} Kg`);
    if (d.garment_count > 0) amountText.push(`${d.garment_count} prendas`);
    document.getElementById('detailServiceAmount').textContent = amountText.join(' • ') || 'Cantidad no especificada';
    
    document.getElementById('detailTotalAmount').textContent = format.currency(d.final_amount);
    
    let notesText = d.garment_observations || '';
    if (d.discount > 0) {
      notesText += `<br><br><span class="text-primary font-medium">Se aplicó un descuento de ${format.currency(d.discount)}</span>`;
    }
    document.getElementById('detailNotes').innerHTML = notesText || '-';

    // Update Payment
    const paymentBadges = {
      pending: '<span class="badge" style="background: #fef3c7; color: #b45309; border: 1px solid #fde68a;">Pendiente</span>',
      partial: '<span class="badge" style="background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd;">Adelanto</span>',
      paid: '<span class="badge" style="background: #d1fae5; color: #059669; border: 1px solid #a7f3d0;">Pagado</span>'
    };
    document.getElementById('detailPaymentBadge').innerHTML = paymentBadges[d.payment_status] || paymentBadges.pending;
    
    document.getElementById('detailPaymentTotal').textContent = format.currency(d.final_amount);
    
    const advance = d.payment_status === 'partial' ? d.advance_payment : (d.payment_status === 'paid' ? d.final_amount : 0);
    const balance = Math.max(0, d.final_amount - advance);
    
    if (d.payment_status === 'partial') {
      document.getElementById('detailPaymentAdvanceRow').style.display = 'flex';
      document.getElementById('detailPaymentAdvance').textContent = format.currency(advance);
    } else {
      document.getElementById('detailPaymentAdvanceRow').style.display = 'none';
    }
    
    const balanceEl = document.getElementById('detailPaymentBalance');
    balanceEl.textContent = format.currency(balance);
    if (balance === 0) {
      balanceEl.classList.remove('text-danger');
      balanceEl.classList.add('text-success');
    } else {
      balanceEl.classList.add('text-danger');
      balanceEl.classList.remove('text-success');
    }

    const actionContainer = document.getElementById('paymentActionContainer');
    if (d.payment_status !== 'paid') {
      actionContainer.style.display = 'block';
    } else {
      actionContainer.style.display = 'none';
    }

    // Update status buttons
    const buttons = document.querySelectorAll('.status-btn');
    buttons.forEach(btn => {
      btn.classList.remove('active-status');
      if (btn.dataset.status === d.status) {
        btn.classList.add('active-status');
      }
    });
  },

  async markAsPaid() {
    if (!this.data) return;
    
    modal.confirm(
      'Cobrar Saldo',
      '¿Confirmas que el cliente ha pagado el saldo restante?',
      async () => {
        try {
          const updatedData = { ...this.data, payment_status: 'paid', advance_payment: 0 };
          const res = await window.api.orders.update(this.orderId, updatedData);
          if (res.success) {
            toast.success('Pago Registrado', 'El pedido ha sido marcado como pagado.');
            this.loadData();
          } else {
            throw new Error(res.error);
          }
        } catch(e) {
          toast.error('Error', 'No se pudo registrar el pago');
        }
      },
      'info'
    );
  },

  async updateStatus(newStatus) {
    if (!this.data || this.data.status === newStatus) return;

    // Si pasamos a Entregado, confirmar
    if (newStatus === 'delivered') {
      modal.confirm(
        'Confirmar Entrega',
        '¿Está seguro de marcar este pedido como entregado? Esta acción registrará la fecha y hora de entrega.',
        async () => {
          await this.executeStatusUpdate(newStatus);
        },
        'info'
      );
    } else {
      await this.executeStatusUpdate(newStatus);
    }
  },

  async executeStatusUpdate(newStatus) {
    try {
      const res = await window.api.orders.updateStatus(this.orderId, newStatus);
      if (res.success) {
        toast.success('Actualizado', `El estado cambió a ${format.statusText(newStatus)}`);
        this.loadData();
        app.updateActiveOrdersBadge();
      } else {
        throw new Error(res.error);
      }
    } catch (e) {
      toast.error('Error', 'No se pudo actualizar el estado');
    }
  }
};
