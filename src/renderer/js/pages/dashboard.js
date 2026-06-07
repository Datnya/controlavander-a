window.dashboardPage = {
  data: null,
  updateInterval: null,

  async render() {
    return `
      <div class="dashboard-stats grid grid-4">
        <!-- Ingresos de Hoy -->
        <div class="card income-card-large" style="grid-column: span 2;">
          <div class="stat-card" style="padding: 0;">
            <div class="stat-content">
              <div class="stat-label mb-2">Ingresos de Hoy</div>
              <div class="stat-value" id="dashTotalIncome">S/ 0.00</div>
              <div class="text-sm mt-4 opacity-80" id="dashClientsCount">0 clientes atendidos hoy</div>
            </div>
            <div class="stat-icon" style="width: 80px; height: 80px; border-radius: 20px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
        </div>

        <!-- Pedidos Recibidos -->
        <div class="card card-hover">
          <div class="stat-card" style="padding: 0;">
            <div class="stat-content">
              <div class="stat-value" id="dashReceivedCount">0</div>
              <div class="stat-label">Recibidos Hoy</div>
            </div>
            <div class="stat-icon primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </div>
          </div>
        </div>

        <!-- En Proceso -->
        <div class="card card-hover">
          <div class="stat-card" style="padding: 0;">
            <div class="stat-content">
              <div class="stat-value" id="dashInProgressCount">0</div>
              <div class="stat-label">En Proceso</div>
            </div>
            <div class="stat-icon warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-3">
        <!-- Columna Izquierda: Pedidos Listos -->
        <div style="grid-column: span 1;">
          <h3 class="text-lg font-semibold mb-4 flex-align gap-2">
            <svg class="text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Listos para recoger
            <span class="badge badge-ready" id="dashReadyCount" style="margin-left: auto;">0</span>
          </h3>
          
          <div id="readyListContainer" class="flex-col gap-3">
            <!-- Loading -->
            <div class="skeleton" style="height: 80px;"></div>
            <div class="skeleton" style="height: 80px;"></div>
          </div>
        </div>

        <!-- Columna Derecha: Últimos Pedidos -->
        <div style="grid-column: span 2;">
          <div class="flex-between mb-4">
            <h3 class="text-lg font-semibold">Últimos Pedidos de Hoy</h3>
            <button class="btn btn-ghost btn-sm" onclick="app.navigate('orders')">Ver todos</button>
          </div>
          
          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>N° Pedido</th>
                  <th>Cliente</th>
                  <th>Servicio</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody id="recentOrdersBody">
                <tr><td colspan="5" class="text-center py-4"><div class="spinner mx-auto"></div></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  async init() {
    await this.loadData();
    // Auto-actualizar cada minuto
    this.updateInterval = setInterval(() => this.loadData(), 60000);
  },

  destroy() {
    if (this.updateInterval) clearInterval(this.updateInterval);
  },

  async loadData() {
    try {
      // 1. Cargar estadísticas generales
      const statsRes = await window.api.reports.getDashboardStats();
      if (statsRes.success) {
        this.data = statsRes.data;
        this.updateUIStats();
      }

      // 2. Cargar pedidos listos para recoger
      const readyRes = await window.api.orders.getAll({ status: 'ready' });
      if (readyRes.success) {
        this.renderReadyOrders(readyRes.data);
      }

      // 3. Cargar últimos pedidos de hoy
      const recentRes = await window.api.orders.getToday();
      if (recentRes.success) {
        this.renderRecentOrders(recentRes.data);
      }

    } catch (e) {
      console.error('Error cargando dashboard', e);
      // Silenciar toast recurrente
      // toast.error('Error', 'No se pudieron cargar los datos del dashboard');
    }
  },

  updateUIStats() {
    if (!this.data) return;
    document.getElementById('dashTotalIncome').textContent = format.currency(this.data.today_income);
    document.getElementById('dashClientsCount').textContent = `${this.data.today_clients} clientes atendidos hoy`;
    document.getElementById('dashReceivedCount').textContent = this.data.received;
    document.getElementById('dashInProgressCount').textContent = this.data.in_progress;
    
    const readyBadge = document.getElementById('dashReadyCount');
    readyBadge.textContent = this.data.ready;
    if (this.data.ready > 0) {
      readyBadge.classList.add('badge-ready'); // añade animación de pulso
    } else {
      readyBadge.classList.remove('badge-ready');
      readyBadge.style.background = 'var(--color-gray-200)';
      readyBadge.style.color = 'var(--color-gray-600)';
    }
  },

  renderReadyOrders(orders) {
    const container = document.getElementById('readyListContainer');
    
    if (!orders || orders.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 32px 16px; background: white; border-radius: 12px; border: 1px solid var(--color-gray-100);">
          <svg class="empty-state-icon" style="width: 48px; height: 48px; margin-bottom: 12px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <div class="text-gray-500 text-sm">No hay pedidos listos para entrega</div>
        </div>
      `;
      return;
    }

    let html = '';
    orders.forEach(order => {
      html += `
        <div class="card card-hover" style="padding: 16px; cursor: pointer;" onclick="app.navigate('order-detail', {id: ${order.id}})">
          <div class="flex-between mb-2">
            <span class="font-bold text-primary">${order.order_number}</span>
            <span class="text-xs text-gray-400">${format.date(order.received_date)}</span>
          </div>
          <div class="font-medium text-gray-800 truncate mb-1">${format.escapeHtml(order.client_name)}</div>
          <div class="flex-between align-center">
            <span class="text-sm text-gray-500 truncate" style="max-width: 60%;">${format.escapeHtml(order.service_name)}</span>
            <span class="font-bold text-gray-900">${format.currency(order.final_amount)}</span>
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
  },

  renderRecentOrders(orders) {
    const tbody = document.getElementById('recentOrdersBody');
    
    if (!orders || orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-gray-500">No se han registrado pedidos hoy</td></tr>`;
      return;
    }

    // Tomar solo los últimos 8
    const recent = orders.slice(0, 8);
    let html = '';
    
    recent.forEach(order => {
      html += `
        <tr style="cursor: pointer;" onclick="app.navigate('order-detail', {id: ${order.id}})">
          <td class="font-medium text-primary">${order.order_number}</td>
          <td>
            <div class="font-medium text-gray-800">${format.escapeHtml(order.client_name)}</div>
            ${order.client_phone ? `<div class="text-xs text-gray-400">${format.escapeHtml(order.client_phone)}</div>` : ''}
          </td>
          <td class="text-gray-600">${format.escapeHtml(order.service_name)}</td>
          <td class="font-medium">${format.currency(order.final_amount)}</td>
          <td>${format.statusBadge(order.status)}</td>
        </tr>
      `;
    });
    
    tbody.innerHTML = html;
  }
};
