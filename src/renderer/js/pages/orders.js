window.ordersPage = {
  data: [],
  filters: {
    status: 'active', // active = received, in_progress, ready
    search: ''
  },

  async render() {
    return `
      <div class="filters-bar">
        <div class="filter-group">
          <label class="filter-label">Estado:</label>
          <select id="orderStatusFilter" class="form-select filter-input" style="width: 180px;">
            <option value="active" selected>Pedidos Activos</option>
            <option value="received">Recibidos</option>
            <option value="in_progress">En Proceso</option>
            <option value="ready">Listos para recoger</option>
            <option value="delivered">Entregados</option>
            <option value="all">Todos los pedidos</option>
          </select>
        </div>
        
        <div class="filters-divider"></div>
        
        <div class="filter-group flex-1">
          <div class="search-box" style="max-width: 100%;">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="orderSearch" class="search-input" placeholder="Buscar por N° pedido, cliente o teléfono...">
          </div>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>N° Pedido</th>
              <th>Cliente</th>
              <th>Servicio</th>
              <th>Recepción</th>
              <th>Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody id="ordersTableBody">
            <tr><td colspan="6" class="text-center py-8"><div class="spinner mx-auto"></div></td></tr>
          </tbody>
        </table>
      </div>
    `;
  },

  async init() {
    await this.loadData();

    // Filtros
    document.getElementById('orderStatusFilter').addEventListener('change', (e) => {
      this.filters.status = e.target.value;
      this.loadData();
    });

    const searchInput = document.getElementById('orderSearch');
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.filters.search = e.target.value.trim();
        this.loadData();
      }, 300);
    });
  },

  async loadData() {
    try {
      // Configurar filtros para la API
      const apiFilters = {};
      
      if (this.filters.search) {
        apiFilters.search = this.filters.search;
      }

      if (this.filters.status !== 'all' && this.filters.status !== 'active') {
        apiFilters.status = this.filters.status;
      }

      let res;
      if (this.filters.status === 'active' && !this.filters.search) {
        res = await window.api.orders.getActive();
      } else {
        res = await window.api.orders.getAll(apiFilters);
        // Si el filtro es active y hay búsqueda, tenemos que filtrar en cliente los activos
        if (this.filters.status === 'active') {
          res.data = res.data.filter(o => o.status !== 'delivered');
        }
      }

      if (res.success) {
        this.data = res.data;
        this.renderTable();
      }
    } catch (e) {
      console.error('Error cargando pedidos', e);
      toast.error('Error', 'No se pudieron cargar los pedidos');
    }
  },

  renderTable() {
    const tbody = document.getElementById('ordersTableBody');
    
    if (this.data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-state">
              <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              <div class="empty-state-title">No hay pedidos</div>
              <div class="empty-state-text">No se encontraron pedidos con los filtros actuales.</div>
            </div>
          </td>
        </tr>`;
      return;
    }

    let html = '';
    this.data.forEach(order => {
      html += `
        <tr style="cursor: pointer;" onclick="app.navigate('order-detail', {id: ${order.id}})">
          <td class="font-bold text-primary">${order.order_number}</td>
          <td>
            <div class="font-medium text-gray-800">${order.client_name}</div>
            ${order.client_phone ? `<div class="text-xs text-gray-400">${order.client_phone}</div>` : ''}
          </td>
          <td>
            <div class="text-sm">${order.service_name}</div>
            <div class="text-xs text-gray-500">${order.weight_kg > 0 ? order.weight_kg + ' Kg' : ''} ${order.garment_count > 0 ? order.garment_count + ' prendas' : ''}</div>
          </td>
          <td class="text-gray-500 text-sm">
            ${format.datetime(order.received_date)}
          </td>
          <td class="font-semibold text-gray-900">${format.currency(order.final_amount)}</td>
          <td>${format.statusBadge(order.status)}</td>
        </tr>
      `;
    });
    
    tbody.innerHTML = html;
  }
};
