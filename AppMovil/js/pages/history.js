window.historyPage = {
  data: [],
  filters: {
    status: 'all',
    search: '',
    dateFrom: '',
    dateTo: ''
  },

  async render() {
    // Por defecto, mostrar el mes actual
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return `
      <div class="filters-bar">
        <div class="filter-group">
          <label class="filter-label">Desde:</label>
          <input type="date" id="histDateFrom" class="filter-input" value="${firstDay.toISOString().split('T')[0]}">
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Hasta:</label>
          <input type="date" id="histDateTo" class="filter-input" value="${lastDay.toISOString().split('T')[0]}">
        </div>

        <div class="filters-divider"></div>
        
        <div class="filter-group">
          <label class="filter-label">Estado:</label>
          <select id="histStatus" class="form-select filter-input">
            <option value="all" selected>Todos</option>
            <option value="delivered">Entregados</option>
            <option value="ready">Listos</option>
            <option value="in_progress">En Proceso</option>
            <option value="received">Recibidos</option>
          </select>
        </div>
        
        <div class="filters-divider"></div>
        
        <div class="filter-group flex-1">
          <div class="search-box" style="max-width: 100%;">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="histSearch" class="search-input" placeholder="Buscar por cliente o N° pedido...">
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
              <th>Fecha Recepción</th>
              <th>Fecha Entrega</th>
              <th>Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody id="historyTableBody">
            <tr><td colspan="7" class="text-center py-8"><div class="spinner mx-auto"></div></td></tr>
          </tbody>
        </table>
      </div>
    `;
  },

  async init() {
    this.filters.dateFrom = document.getElementById('histDateFrom').value;
    this.filters.dateTo = document.getElementById('histDateTo').value;

    await this.loadData();

    // Filtros
    document.getElementById('histDateFrom').addEventListener('change', (e) => {
      this.filters.dateFrom = e.target.value;
      this.loadData();
    });
    document.getElementById('histDateTo').addEventListener('change', (e) => {
      this.filters.dateTo = e.target.value;
      this.loadData();
    });
    document.getElementById('histStatus').addEventListener('change', (e) => {
      this.filters.status = e.target.value;
      this.loadData();
    });

    const searchInput = document.getElementById('histSearch');
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
      const apiFilters = {
        dateFrom: this.filters.dateFrom,
        dateTo: this.filters.dateTo
      };

      if (this.filters.search) apiFilters.search = this.filters.search;
      if (this.filters.status !== 'all') apiFilters.status = this.filters.status;

      const res = await window.api.orders.getAll(apiFilters);

      if (res.success) {
        this.data = res.data;
        this.renderTable();
      }
    } catch (e) {
      console.error('Error cargando historial', e);
      toast.error('Error', 'No se pudo cargar el historial');
    }
  },

  renderTable() {
    const tbody = document.getElementById('historyTableBody');
    
    if (this.data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <div class="empty-state-title">No hay registros</div>
              <div class="empty-state-text">Intente ajustando el rango de fechas u otros filtros.</div>
            </div>
          </td>
        </tr>`;
      return;
    }

    let html = '';
    this.data.forEach(order => {
      html += `
        <tr style="cursor: pointer;" onclick="app.navigate('order-detail', {id: ${order.id}})">
          <td class="font-bold text-gray-700">${order.order_number}</td>
          <td>
            <div class="font-medium text-gray-800">${order.client_name}</div>
            <div class="text-xs text-gray-400">${order.client_phone || '-'}</div>
          </td>
          <td class="text-gray-600">${order.service_name}</td>
          <td class="text-gray-500 text-sm">${format.datetime(order.received_date)}</td>
          <td class="text-gray-500 text-sm">${order.delivered_date ? format.datetime(order.delivered_date) : '-'}</td>
          <td class="font-semibold text-gray-900">${format.currency(order.final_amount)}</td>
          <td>${format.statusBadge(order.status)}</td>
        </tr>
      `;
    });
    
    tbody.innerHTML = html;
  }
};
