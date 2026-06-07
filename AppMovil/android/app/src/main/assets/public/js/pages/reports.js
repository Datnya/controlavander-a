window.reportsPage = {
  currentPeriod: 'monthly', // daily, weekly, monthly
  data: null,
  dateBasis: 'reception', // 'reception' (fecha de recepción) | 'payment' (fecha de cobro)
  historyExpanded: false,
  historyRange: null, // { from, to } del periodo seleccionado

  async render() {
    return `
      <div class="card mb-6">
        <div class="flex-between align-center">
          <div class="tab-pills" id="reportPeriodTabs">
            <div class="tab-pill" data-period="daily">Diario</div>
            <div class="tab-pill" data-period="weekly">Semanal</div>
            <div class="tab-pill active" data-period="monthly">Mensual</div>
          </div>
          <div id="reportControls" class="flex-align gap-3">
            <!-- Los controles cambiarán según el periodo -->
          </div>
        </div>
        <div class="flex-align gap-2" style="margin-top: 28px;">
          <span class="text-sm text-gray-500">Ingresos por:</span>
          <div class="tab-pills" id="basisTabs">
            <div class="tab-pill active" data-basis="reception">Recepción</div>
            <div class="tab-pill" data-basis="payment">Cobro</div>
          </div>
        </div>
        <div class="flex-align gap-3" style="margin-top: 28px; justify-content: flex-end; flex-wrap: wrap;">
          <button class="btn btn-secondary btn-sm" onclick="reportsPage.showExportModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exportar
          </button>
          <button class="btn btn-danger btn-sm" onclick="reportsPage.clearHistory()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            Vaciar Historial
          </button>
        </div>
      </div>

      <div class="reports-summary grid grid-3">
        <div class="card stat-card">
          <div class="stat-icon primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
          <div class="stat-content">
            <div class="stat-label">Ingresos del Periodo</div>
            <div class="stat-value text-primary" id="repTotalIncome">S/ 0.00</div>
          </div>
        </div>
        
        <div class="card stat-card">
          <div class="stat-icon info"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>
          <div class="stat-content">
            <div class="stat-label">Total de Pedidos</div>
            <div class="stat-value" id="repTotalOrders">0</div>
          </div>
        </div>
        
        <div class="card stat-card">
          <div class="stat-icon success"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
          <div class="stat-content">
            <div class="stat-label">Clientes Atendidos</div>
            <div class="stat-value" id="repTotalClients">0</div>
          </div>
        </div>
      </div>

      <!-- Historial de pedidos del periodo (desplegable) -->
      <div class="card mb-6">
        <div class="flex-between align-center" style="cursor: pointer;" onclick="reportsPage.toggleHistory()">
          <h3 class="font-semibold text-md flex-align gap-2" style="margin:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Historial de pedidos del periodo
          </h3>
          <svg id="histChevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" style="transition: transform .2s;"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div id="historyContainer" style="display: none; margin-top: 16px;"></div>
      </div>

      <div class="grid grid-3">
        <div class="card" style="grid-column: span 2;">
          <h3 class="font-semibold text-md mb-4">Evolución de Ingresos</h3>
          <div class="chart-container" id="incomeChart">
            <div class="empty-state">
              <div class="spinner"></div>
            </div>
          </div>
        </div>
        
        <div class="card">
          <h3 class="font-semibold text-md mb-4">Servicios más Solicitados</h3>
          <div id="servicesBreakdown" class="flex-col gap-3">
            <div class="empty-state">
              <div class="spinner"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async init() {
    this.setupControls();
    this.bindEvents();
    await this.loadData();
  },

  setupControls() {
    const container = document.getElementById('reportControls');
    const today = new Date();
    
    if (this.currentPeriod === 'daily') {
      container.innerHTML = `<input type="date" id="repDate" class="form-input" value="${format.localDateStr(today)}">`;
    } else if (this.currentPeriod === 'weekly') {
      // Get monday of current week
      const d = new Date(today);
      const day = d.getDay(), diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
      d.setDate(diff);
      const startOfWeek = format.localDateStr(d);

      const endOfWeekObj = new Date(d);
      endOfWeekObj.setDate(endOfWeekObj.getDate() + 6);
      const endOfWeek = format.localDateStr(endOfWeekObj);

      container.innerHTML = `
        <div class="flex-align gap-2">
          <input type="date" id="repWeekStart" class="form-input form-input-sm" value="${startOfWeek}">
          <span class="text-gray-400">al</span>
          <input type="date" id="repWeekEnd" class="form-input form-input-sm" value="${endOfWeek}">
        </div>
      `;
    } else if (this.currentPeriod === 'monthly') {
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      container.innerHTML = `<input type="month" id="repMonth" class="form-input" value="${year}-${month}">`;
    }
  },

  bindEvents() {
    // Tabs
    document.querySelectorAll('#reportPeriodTabs .tab-pill').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('#reportPeriodTabs .tab-pill').forEach(t => t.classList.remove('active'));
        const el = e.currentTarget;
        el.classList.add('active');
        this.currentPeriod = el.dataset.period;
        
        this.setupControls();
        this.bindControlEvents(); // re-bind after replacing html
        this.loadData();
      });
    });

    // Selector de base de fecha: Recepción vs Cobro
    document.querySelectorAll('#basisTabs .tab-pill').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('#basisTabs .tab-pill').forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.dateBasis = e.currentTarget.dataset.basis;
        this.loadData();
      });
    });

    this.bindControlEvents();
  },

  bindControlEvents() {
    if (this.currentPeriod === 'daily') {
      document.getElementById('repDate').addEventListener('change', () => this.loadData());
    } else if (this.currentPeriod === 'weekly') {
      document.getElementById('repWeekStart').addEventListener('change', () => this.loadData());
      document.getElementById('repWeekEnd').addEventListener('change', () => this.loadData());
    } else if (this.currentPeriod === 'monthly') {
      document.getElementById('repMonth').addEventListener('change', () => this.loadData());
    }
  },

  async loadData() {
    try {
      let res;
      
      if (this.currentPeriod === 'daily') {
        const date = document.getElementById('repDate').value;
        res = await window.api.reports.getDailySummary(date, this.dateBasis);
        this.historyRange = { from: date, to: date };
      } else if (this.currentPeriod === 'weekly') {
        const start = document.getElementById('repWeekStart').value;
        const end = document.getElementById('repWeekEnd').value;
        res = await window.api.reports.getWeeklySummary(start, end, this.dateBasis);
        this.historyRange = { from: start, to: end };
      } else if (this.currentPeriod === 'monthly') {
        const monthVal = document.getElementById('repMonth').value;
        const parts = monthVal.split('-');
        res = await window.api.reports.getMonthlySummary(parts[0], parts[1], this.dateBasis);
        const lastDay = new Date(parseInt(parts[0]), parseInt(parts[1]), 0).getDate();
        this.historyRange = { from: `${parts[0]}-${parts[1]}-01`, to: `${parts[0]}-${parts[1]}-${String(lastDay).padStart(2, '0')}` };
      }

      if (res && res.success) {
        this.data = res.data;
        this.updateUI();
      }
      // Si el historial está desplegado, refrescarlo con el nuevo periodo
      if (this.historyExpanded) this.loadHistory();
    } catch (e) {
      console.error('Error cargando reportes', e);
      toast.error('Error', 'No se pudieron cargar los reportes');
    }
  },

  toggleHistory() {
    this.historyExpanded = !this.historyExpanded;
    const cont = document.getElementById('historyContainer');
    const chev = document.getElementById('histChevron');
    if (this.historyExpanded) {
      if (cont) cont.style.display = 'block';
      if (chev) chev.style.transform = 'rotate(180deg)';
      this.loadHistory();
    } else {
      if (cont) cont.style.display = 'none';
      if (chev) chev.style.transform = 'rotate(0deg)';
    }
  },

  async loadHistory() {
    const cont = document.getElementById('historyContainer');
    if (!cont || !this.historyRange) return;
    cont.innerHTML = '<div class="empty-state" style="padding:20px;"><div class="spinner"></div></div>';
    try {
      const res = await window.api.orders.getAll({ dateFrom: this.historyRange.from, dateTo: this.historyRange.to });
      if (res.success) this.renderHistoryList(res.data || []);
      else cont.innerHTML = '<div class="empty-state text-sm text-gray-500" style="padding:16px;">No se pudo cargar el historial</div>';
    } catch (e) {
      cont.innerHTML = '<div class="empty-state text-sm text-gray-500" style="padding:16px;">No se pudo cargar el historial</div>';
    }
  },

  renderHistoryList(orders) {
    const cont = document.getElementById('historyContainer');
    if (!cont) return;
    if (!orders.length) {
      cont.innerHTML = '<div class="empty-state text-sm text-gray-500" style="padding:16px;">No hay pedidos en este periodo</div>';
      return;
    }
    let html = `<div class="text-xs text-gray-500 mb-3">${orders.length} ${orders.length === 1 ? 'pedido' : 'pedidos'} en el periodo</div><div class="flex-col gap-2">`;
    orders.forEach(o => {
      html += `
        <div class="card-hover" style="display:flex; justify-content:space-between; align-items:center; gap:12px; padding:12px 14px; border:1px solid var(--color-gray-100); border-radius:10px; cursor:pointer;" onclick="app.navigate('order-detail', {id: ${o.id}})">
          <div style="min-width:0;">
            <div class="font-bold text-primary">${format.escapeHtml(o.order_number)}</div>
            <div class="font-medium text-gray-800 truncate">${format.escapeHtml(o.client_name)}</div>
            <div class="text-xs text-gray-400">${format.datetime(o.received_date)} · ${format.escapeHtml(o.service_name)}</div>
          </div>
          <div style="text-align:right; flex-shrink:0;">
            <div class="font-bold text-gray-900">${format.currency(o.final_amount)}</div>
            <div class="mt-1">${format.statusBadge(o.status)}</div>
          </div>
        </div>`;
    });
    html += '</div>';
    cont.innerHTML = html;
  },

  updateUI() {
    if (!this.data) return;

    // Header Stats
    document.getElementById('repTotalIncome').textContent = format.currency(this.data.total_income);
    document.getElementById('repTotalOrders').textContent = this.data.total_orders;
    document.getElementById('repTotalClients').textContent = this.data.unique_clients;

    // Chart & Breakdown - Since we don't have a charting library, we build a simple CSS chart
    this.renderChart();
    this.renderServicesBreakdown();
  },

  renderChart() {
    const container = document.getElementById('incomeChart');
    if (!this.data.income_by_date || this.data.income_by_date.length === 0) {
      container.innerHTML = `<div class="empty-state text-sm text-gray-500">No hay datos para mostrar en este periodo</div>`;
      return;
    }

    const data = this.data.income_by_date;
    const maxVal = Math.max(...data.map(d => d.total));
    
    let html = '<div class="chart-bars">';
    
    data.forEach(item => {
      // Calculate height percentage (min 2%)
      let heightPct = maxVal > 0 ? Math.max((item.total / maxVal) * 100, 2) : 2;
      
      // Etiqueta: usa item.label si viene (semanas/meses); si no, DD/MM
      let label = item.label || item.date;
      if (!item.label && typeof label === 'string' && label.includes('-')) {
        const parts = label.split('-');
        label = `${parts[2]}/${parts[1]}`; // DD/MM
      }
      
      html += `
        <div class="chart-bar-wrapper">
          <div class="chart-bar-value">${format.currency(item.total)}</div>
          <div class="chart-bar" style="height: ${heightPct}%;" title="${format.currency(item.total)}"></div>
          <div class="chart-bar-label">${label}</div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  },

  renderServicesBreakdown() {
    const container = document.getElementById('servicesBreakdown');
    
    if (!this.data.services_breakdown || this.data.services_breakdown.length === 0) {
      container.innerHTML = `<div class="empty-state text-sm text-gray-500" style="padding: 10px;">Sin datos</div>`;
      return;
    }

    const totalIncome = this.data.total_income;
    let html = '';
    
    this.data.services_breakdown.forEach(item => {
      const pct = totalIncome > 0 ? Math.round((item.total_amount / totalIncome) * 100) : 0;
      
      html += `
        <div class="mb-4">
          <div class="flex-between align-center mb-1">
            <span class="font-medium text-sm text-gray-800">${item.service_name}</span>
            <span class="font-bold text-sm">${format.currency(item.total_amount)}</span>
          </div>
          <div class="flex-between align-center mb-1 text-xs text-gray-500">
            <span>${item.order_count} pedidos</span>
            <span>${pct}%</span>
          </div>
          <div style="width: 100%; height: 6px; background: var(--color-gray-100); border-radius: 4px; overflow: hidden;">
            <div style="width: ${pct}%; height: 100%; background: var(--color-primary-500); border-radius: 4px;"></div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  showExportModal() {
    if (!this.data || !this.data.income_by_date) {
      toast.error('Error', 'No hay datos para exportar');
      return;
    }

    const modalInstance = modal.show({
      title: 'Exportar Reporte',
      content: `
        <p class="text-sm text-gray-600 mb-4">¿En qué formato deseas exportar el reporte actual?</p>
        <div class="flex-col" style="gap: 16px;">
          <button class="btn btn-primary w-100" style="justify-content: center;" id="btnExportExcel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Excel (CSV)
          </button>
          <button class="btn btn-secondary w-100" style="justify-content: center;" id="btnExportPDF">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Documento PDF
          </button>
        </div>
      `,
      size: 'sm',
      showFooter: false
    });

    setTimeout(() => {
      document.getElementById('btnExportExcel').addEventListener('click', () => {
        modalInstance.close();
        this.exportCSV();
      });
      document.getElementById('btnExportPDF').addEventListener('click', () => {
        modalInstance.close();
        window.print();
      });
    }, 100);
  },

  async exportCSV() {

    // Construir CSV string
    let csv = 'Fecha,Total Pedidos,Ingresos\n';
    this.data.income_by_date.forEach(item => {
      csv += `"${item.date}","${item.total_orders}","${item.total}"\n`;
    });
    
    csv += '\nServicio,Pedidos,Total Ingresos\n';
    if (this.data.services_breakdown) {
      this.data.services_breakdown.forEach(item => {
        csv += `"${item.service_name}","${item.order_count}","${item.total_amount}"\n`;
      });
    }
    
    csv += `\nRESUMEN\nIngresos Totales,"${this.data.total_income}"\n`;
    csv += `Total Pedidos,"${this.data.total_orders}"\n`;

    const res = await window.api.reports.exportCSV(csv, `Reporte_${this.currentPeriod}.csv`);
    if (res.success) {
      if (!res.canceled) toast.success('Exportado', 'El reporte fue guardado correctamente');
    } else {
      toast.error('Error', 'No se pudo exportar el archivo');
    }
  },

  clearHistory() {
    const periodLabel = { daily: 'el día', weekly: 'la semana', monthly: 'el mes' }[this.currentPeriod] || 'el periodo';
    const r = this.historyRange;
    const modalInstance = modal.show({
      title: 'Vaciar Historial',
      content: `
        <p class="text-sm text-gray-600 mb-4">Se eliminan solo pedidos <b>entregados</b>. Los pedidos aún <b>activos en servicio NO se borran</b>. Esta acción no se puede deshacer.</p>
        <div class="flex-col gap-3">
          <button class="btn btn-secondary w-100" style="justify-content:center;" id="btnClearPeriod">Vaciar ${periodLabel} seleccionado</button>
          <button class="btn btn-danger w-100" style="justify-content:center;" id="btnClearAll">Vaciar TODO el historial</button>
        </div>
      `,
      size: 'sm',
      showFooter: false
    });

    setTimeout(() => {
      const periodBtn = document.getElementById('btnClearPeriod');
      if (periodBtn) periodBtn.addEventListener('click', () => {
        modalInstance.close();
        this._doClear(r ? { from: r.from, to: r.to } : {});
      });
      const allBtn = document.getElementById('btnClearAll');
      if (allBtn) allBtn.addEventListener('click', () => {
        modalInstance.close();
        modal.confirm(
          'Vaciar TODO el historial',
          '¿Seguro? Se borrarán TODOS los pedidos entregados de todos los meses (los activos en servicio se mantienen). No se puede deshacer.',
          () => this._doClear({}),
          'danger'
        );
      });
    }, 100);
  },

  async _doClear(filters) {
    try {
      const res = await window.api.reports.clearOrders(filters);
      if (res.success) {
        toast.success('Limpieza Completa', `Se eliminaron ${res.count} pedidos entregados.`);
        this.loadData();
      } else {
        throw new Error(res.error);
      }
    } catch (e) {
      toast.error('Error', 'No se pudo vaciar el historial');
    }
  }
};
