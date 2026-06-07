window.newOrderPage = {
  services: [],
  searchResults: [],
  selectedClient: null,
  selectedService: null,
  
  async render() {
    return `
      <div class="order-form-container">
        <!-- Main Form Area -->
        <div class="order-form-main">
          
          <!-- Cliente Section -->
          <div class="card">
            <div class="card-header">
              <h3>1. Datos del Cliente</h3>
              <button class="btn btn-sm btn-ghost" onclick="clientsPage.openClientModal()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nuevo
              </button>
            </div>
            
            <div class="client-autocomplete mt-4">
              <label class="form-label">Buscar Cliente</label>
              <div class="search-box" style="max-width: 100%;">
                <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" id="orderClientSearch" class="search-input" placeholder="Nombre o teléfono..." autocomplete="off">
              </div>
              <div id="clientAutocompleteResults" class="autocomplete-results"></div>
            </div>

            <div id="selectedClientCard" class="mt-4" style="display: none; align-items: center; gap: 12px; padding: 14px 16px; background: var(--color-primary-50); border: 1.5px solid var(--color-primary-300); border-radius: 12px;">
              <div style="flex-shrink:0; width:42px; height:42px; border-radius:50%; background:var(--color-primary-100); display:flex; align-items:center; justify-content:center; color:var(--color-primary-600);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div style="flex:1; min-width:0; display:flex; align-items:baseline; gap:10px; flex-wrap:wrap;">
                <span class="font-bold" id="selectedClientName" style="color:var(--color-primary-700); font-size:15px;">Nombre</span>
                <span id="selectedClientPhone" style="color:var(--color-primary-600); font-size:13px; font-weight:500;">Teléfono</span>
              </div>
              <button class="btn btn-icon btn-sm btn-ghost text-danger" style="flex-shrink:0;" onclick="newOrderPage.clearClient()" title="Quitar cliente">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          <!-- Servicio Section -->
          <div class="card">
            <div class="card-header">
              <h3>2. Servicio y Detalles</h3>
            </div>
            
            <div class="form-group mt-4">
              <label class="form-label">Tipo de Servicio</label>
              <select id="orderServiceSelect" class="form-select">
                <option value="">Seleccione un servicio...</option>
                <!-- Opciones cargadas dinámicamente -->
              </select>
            </div>

            <div class="grid grid-2" id="serviceDetailsGrid" style="display: none;">
              <div class="form-group" id="weightGroup">
                <label class="form-label">Peso (Kg)</label>
                <input type="text" id="orderWeight" class="form-input" placeholder="0.00">
              </div>
              
              <div class="form-group" id="countGroup">
                <label class="form-label">Cantidad de Prendas</label>
                <input type="number" id="orderCount" class="form-input" min="0" placeholder="0">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Detalle de prendas / Observaciones</label>
              <textarea id="orderNotes" class="form-textarea" placeholder="Ej: 2 camisas blancas (una con mancha en cuello), 1 pantalón jean..."></textarea>
            </div>
          </div>

        </div>

        <!-- Sidebar Summary -->
        <div class="order-summary-card card">
          <h3 class="font-bold text-lg mb-4 pb-4" style="border-bottom: 1px solid var(--color-gray-100);">Resumen del Pedido</h3>
          
          <div class="form-group">
            <label class="form-label text-xs">N° DE PEDIDO (Auto-generado)</label>
            <div class="font-bold text-gray-900" id="nextOrderNumber">Cargando...</div>
          </div>

          <div class="summary-row mt-6">
            <span>Servicio</span>
            <span class="summary-value" id="summaryService">-</span>
          </div>
          
          <div class="summary-row">
            <span>Subtotal</span>
            <span class="summary-value" id="summarySubtotal">S/ 0.00</span>
          </div>
          
          <div class="summary-row">
            <span>Descuento</span>
            <div class="flex-align" style="gap: 4px; width: 100px;">
              <span class="text-gray-400">S/</span>
              <input type="text" id="orderDiscount" class="form-input form-input-sm text-right" style="padding: 4px 8px;" value="0.00">
            </div>
          </div>
          
          <div class="summary-row total">
            <span>TOTAL</span>
            <span class="summary-total-value" id="summaryTotal">S/ 0.00</span>
          </div>

          <div class="form-group mt-6">
            <label class="form-label text-xs">ESTADO DE PAGO</label>
            <select id="orderPaymentStatus" class="form-select mb-2">
              <option value="pending" selected>Pendiente de Pago</option>
              <option value="partial">Adelanto / Pago Parcial</option>
              <option value="paid">Pagado Completo</option>
            </select>
            
            <div id="advancePaymentGroup" style="display: none; align-items: center; gap: 8px;" class="mt-2">
              <span class="text-sm font-medium text-gray-600">Adelanto:</span>
              <div class="flex-align" style="gap: 4px; flex: 1;">
                <span class="text-gray-400">S/</span>
                <input type="text" id="orderAdvancePayment" class="form-input form-input-sm text-right" style="padding: 4px 8px; flex: 1;" value="0.00">
              </div>
            </div>
          </div>

          <div class="form-group mt-6">
            <label class="form-label text-xs">FECHA ESTIMADA DE ENTREGA</label>
            <input type="date" id="orderDeliveryDate" class="form-input">
          </div>

          <button id="saveOrderBtn" class="btn btn-primary w-100 mt-4" style="width: 100%; justify-content: center; padding: 14px;" disabled>
            Crear Pedido
          </button>
        </div>
      </div>
    `;
  },

  async init() {
    await this.loadServices();
    await this.loadNextOrderNumber();
    
    // Set default date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('orderDeliveryDate').value = format.localDateStr(tomorrow);

    this.bindEvents();
  },

  async loadServices() {
    try {
      const res = await window.api.services.getActive();
      if (res.success) {
        this.services = res.data;
        const select = document.getElementById('orderServiceSelect');
        this.services.forEach(srv => {
          const option = document.createElement('option');
          option.value = srv.id;
          const priceText = srv.is_per_kg === 1 ? `${format.currency(srv.price_per_kg)}/Kg` : format.currency(srv.fixed_price);
          option.textContent = `${srv.name} (${priceText})`;
          select.appendChild(option);
        });
      }
    } catch (e) {
      console.error('Error cargando servicios', e);
    }
  },

  async loadNextOrderNumber() {
    try {
      const res = await window.api.orders.getNextNumber();
      if (res.success) {
        document.getElementById('nextOrderNumber').textContent = res.data;
      }
    } catch (e) {
      document.getElementById('nextOrderNumber').textContent = 'Error';
    }
  },

  bindEvents() {
    // Búsqueda de cliente autocomplete
    const clientSearch = document.getElementById('orderClientSearch');
    const resultsContainer = document.getElementById('clientAutocompleteResults');
    let searchTimer;

    clientSearch.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      const query = e.target.value.trim();
      
      if (query.length < 2) {
        resultsContainer.classList.remove('show');
        return;
      }

      searchTimer = setTimeout(async () => {
        const res = await window.api.clients.search(query);
        if (res.success && res.data.length > 0) {
          this.searchResults = res.data.slice(0, 5);
          let html = '';
          this.searchResults.forEach(c => {
            html += `
              <div class="autocomplete-item" onclick="newOrderPage.selectClient(${c.id})">
                <span class="font-medium">${format.escapeHtml(c.full_name)}</span>
                <span class="client-phone">${format.escapeHtml(c.phone || c.document_id || '')}</span>
              </div>
            `;
          });
          resultsContainer.innerHTML = html;
          resultsContainer.classList.add('show');
        } else {
          resultsContainer.innerHTML = `<div class="p-2 text-sm text-gray-500 text-center">No se encontraron clientes</div>`;
          resultsContainer.classList.add('show');
        }
      }, 300);
    });

    // Ocultar autocomplete al hacer click fuera
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.client-autocomplete')) {
        resultsContainer.classList.remove('show');
      }
    });

    // Cambio de servicio
    document.getElementById('orderServiceSelect').addEventListener('change', (e) => {
      const srvId = parseInt(e.target.value);
      this.selectedService = this.services.find(s => s.id === srvId) || null;
      
      const grid = document.getElementById('serviceDetailsGrid');
      const weightGroup = document.getElementById('weightGroup');
      const countGroup = document.getElementById('countGroup');
      
      if (this.selectedService) {
        grid.style.display = 'grid';
        
        if (this.selectedService.is_per_kg === 1) {
          weightGroup.style.display = 'block';
          // Para por kilo, la cantidad de prendas es opcional pero útil
          countGroup.style.display = 'block';
        } else {
          weightGroup.style.display = 'none';
          countGroup.style.display = 'block';
          document.getElementById('orderWeight').value = '';
        }
        
        document.getElementById('summaryService').textContent = this.selectedService.name;
      } else {
        grid.style.display = 'none';
        document.getElementById('summaryService').textContent = '-';
      }
      
      this.calculateTotal();
      this.validateForm();
    });

    // Cálculos dinámicos
    const recalcEvents = ['input', 'change'];
    const inputs = ['orderWeight', 'orderCount', 'orderDiscount'];
    
    inputs.forEach(id => {
      const el = document.getElementById(id);
      recalcEvents.forEach(evt => {
        el.addEventListener(evt, (e) => {
          if (id === 'orderWeight' || id === 'orderDiscount') {
            e.target.value = format.numericInput(e.target.value);
          }
          this.calculateTotal();
          this.validateForm();
        });
      });
    });

    // Estado de pago
    document.getElementById('orderPaymentStatus').addEventListener('change', (e) => {
      const advanceGroup = document.getElementById('advancePaymentGroup');
      if (e.target.value === 'partial') {
        advanceGroup.style.display = 'flex';
      } else {
        advanceGroup.style.display = 'none';
        document.getElementById('orderAdvancePayment').value = '0.00';
      }
    });

    document.getElementById('orderAdvancePayment').addEventListener('input', (e) => {
      e.target.value = format.numericInput(e.target.value);
    });

    // Submit form
    document.getElementById('saveOrderBtn').addEventListener('click', () => this.saveOrder());
  },

  selectClient(id) {
    const client = (this.searchResults || []).find(c => c.id === id);
    this.selectedClient = id;

    document.getElementById('orderClientSearch').value = '';
    document.getElementById('clientAutocompleteResults').classList.remove('show');
    document.querySelector('.client-autocomplete').style.display = 'none';

    const card = document.getElementById('selectedClientCard');
    // textContent evita cualquier inyección; los nombres con comillas ya no rompen nada.
    document.getElementById('selectedClientName').textContent = client ? client.full_name : '';
    document.getElementById('selectedClientPhone').textContent = (client && client.phone) ? client.phone : 'Sin teléfono';
    card.style.display = 'flex';

    this.validateForm();
  },

  clearClient() {
    this.selectedClient = null;
    document.getElementById('selectedClientCard').style.display = 'none';
    document.querySelector('.client-autocomplete').style.display = 'block';
    this.validateForm();
  },

  calculateTotal() {
    if (!this.selectedService) {
      this.updateSummary(0, 0);
      return;
    }

    let subtotal = 0;
    
    if (this.selectedService.is_per_kg === 1) {
      const weight = parseFloat(document.getElementById('orderWeight').value) || 0;
      subtotal = weight * this.selectedService.price_per_kg;
    } else {
      // Precio fijo por unidad (prenda)
      const count = parseInt(document.getElementById('orderCount').value) || 1;
      subtotal = count * this.selectedService.fixed_price;
    }

    let discount = parseFloat(document.getElementById('orderDiscount').value) || 0;
    
    // El descuento no puede ser mayor al subtotal
    if (discount > subtotal) {
      discount = subtotal;
      document.getElementById('orderDiscount').value = discount.toFixed(2);
    }
    
    const total = subtotal - discount;
    this.updateSummary(subtotal, total);
  },

  updateSummary(subtotal, total) {
    document.getElementById('summarySubtotal').textContent = format.currency(subtotal);
    document.getElementById('summaryTotal').textContent = format.currency(total);
  },

  validateForm() {
    const btn = document.getElementById('saveOrderBtn');
    let isValid = true;

    if (!this.selectedClient) isValid = false;
    if (!this.selectedService) isValid = false;
    
    if (this.selectedService) {
      if (this.selectedService.is_per_kg === 1) {
        const weight = parseFloat(document.getElementById('orderWeight').value) || 0;
        if (weight <= 0) isValid = false;
      } else {
        const count = parseInt(document.getElementById('orderCount').value) || 0;
        if (count <= 0) isValid = false;
      }
    }

    btn.disabled = !isValid;
  },

  async saveOrder() {
    if (document.getElementById('saveOrderBtn').disabled) return;

    try {
      const weight = parseFloat(document.getElementById('orderWeight').value) || 0;
      const count = parseInt(document.getElementById('orderCount').value) || 0;
      const discount = parseFloat(document.getElementById('orderDiscount').value) || 0;
      const notes = document.getElementById('orderNotes').value.trim();
      const deliveryDate = document.getElementById('orderDeliveryDate').value;
      const paymentStatus = document.getElementById('orderPaymentStatus').value;
      const advancePayment = parseFloat(document.getElementById('orderAdvancePayment').value) || 0;
      
      let subtotal = 0;
      if (this.selectedService.is_per_kg === 1) {
        subtotal = weight * this.selectedService.price_per_kg;
      } else {
        subtotal = (count || 1) * this.selectedService.fixed_price;
      }

      const orderData = {
        client_id: this.selectedClient,
        service_id: this.selectedService.id,
        weight_kg: weight,
        garment_count: count,
        garment_observations: notes,
        base_amount: subtotal,
        discount: discount,
        final_amount: subtotal - discount,
        estimated_delivery: deliveryDate,
        payment_status: paymentStatus,
        advance_payment: paymentStatus === 'partial' ? advancePayment : 0
      };

      const res = await window.api.orders.create(orderData);
      
      if (res.success) {
        toast.success('Pedido Creado', `El pedido ${res.data.order_number} se guardó correctamente`);
        // Redirigir al detalle del pedido para imprimir recibo
        app.navigate('order-detail', { id: res.data.id });
      } else {
        throw new Error(res.error);
      }

    } catch (e) {
      console.error('Error guardando pedido:', e);
      toast.error('Error', e.message || 'No se pudo guardar el pedido');
    }
  }
};
