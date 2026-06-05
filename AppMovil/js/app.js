/**
 * App.js - Controlador principal de la aplicación y sistema de enrutamiento
 */

const app = {
  // Estado global
  state: {
    currentRoute: null,
    businessName: 'Control de Lavandería',
    pages: {} // Instancias de las páginas
  },

  // Inicialización
  async init() {
    this.bindEvents();
    this.updateCurrentDate();
    
    // Obtener info inicial (nombre negocio, versión, etc)
    await this.loadInitialData();

    // Actualizar conteo de pedidos activos
    this.updateActiveOrdersBadge();
    
    // Cargar la ruta inicial
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    this.navigate(hash);
  },

  // Binding de eventos globales
  bindEvents() {
    // Navegación del sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const route = e.currentTarget.dataset.route;
        if (route) this.navigate(route);
      });
    });

    // Control de maximizar ventana
    const maxBtn = document.getElementById('maximizeBtn');
    if (maxBtn) {
      maxBtn.addEventListener('click', async () => {
        await window.api.app.maximize();
        this.updateMaximizeIcon();
      });
      // Comprobar estado inicial
      this.updateMaximizeIcon();
    }
  },

  async updateMaximizeIcon() {
    const isMaximized = await window.api.app.isMaximized();
    const btn = document.getElementById('maximizeBtn');
    if (btn) {
      if (isMaximized) {
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><path d="M9 4v16"/><path d="M4 9h16"/></svg>`; // restore icon (simplified)
      } else {
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>`; // maximize icon
      }
    }
  },

  async loadInitialData() {
    try {
      const response = await window.api.settings.get('business_name');
      if (response.success && response.data) {
        this.state.businessName = response.data;
        document.getElementById('appTitle').textContent = this.state.businessName;
        
        const logoText = document.getElementById('sidebarLogoText');
        if (logoText) logoText.textContent = this.state.businessName;
      }

      const version = await window.api.app.getVersion();
      const versionEl = document.getElementById('appVersion');
      if (versionEl) versionEl.textContent = `v${version}`;
    } catch (e) {
      console.error('Error cargando datos iniciales', e);
    }
  },

  updateCurrentDate() {
    const el = document.getElementById('currentDateDisplay');
    if (el) {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      let dateString = new Date().toLocaleDateString('es-PE', options);
      // Capitalizar primera letra
      dateString = dateString.charAt(0).toUpperCase() + dateString.slice(1);
      el.textContent = dateString;
    }
  },

  async updateActiveOrdersBadge() {
    try {
      const res = await window.api.orders.getActive();
      if (res.success) {
        const badge = document.getElementById('activeOrdersBadge');
        if (badge) {
          if (res.data.length > 0) {
            badge.textContent = res.data.length;
            badge.style.display = 'flex';
          } else {
            badge.style.display = 'none';
          }
        }
      }
    } catch (e) {
      console.error('Error al actualizar badge', e);
    }
  },

  // Sistema de navegación SPA
  async navigate(route, params = {}) {
    if (this.state.currentRoute === route && Object.keys(params).length === 0) return;

    // Destroy current page logic if exists
    if (this.state.currentRoute && this.state.pages[this.state.currentRoute]) {
      if (typeof this.state.pages[this.state.currentRoute].destroy === 'function') {
        this.state.pages[this.state.currentRoute].destroy();
      }
    }

    this.state.currentRoute = route;
    window.location.hash = route;

    // Actualizar UI del sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.dataset.route === route) {
        item.classList.add('active');
        // Actualizar título de página
        document.getElementById('pageTitle').textContent = item.textContent.trim();
      } else {
        item.classList.remove('active');
      }
    });

    // Casos especiales para títulos
    if (route === 'order-detail') document.getElementById('pageTitle').textContent = 'Detalle del Pedido';
    if (route === 'receipt') document.getElementById('pageTitle').textContent = 'Comprobante Digital';

    // Cargar contenido
    const container = document.getElementById('pageContainer');
    container.innerHTML = '<div class="empty-state"><div class="spinner spinner-lg"></div><div class="mt-4 text-gray-500">Cargando...</div></div>';

    try {
      // Registrar la página si no existe en el scope global (esto asume que las páginas se auto-registran en window.app.pages)
      // Como estamos cargando JS sincrónicamente en index.html, los objetos deberían estar en window.[routeName]Page
      
      const pageObjectName = route.replace(/-([a-z])/g, (g) => g[1].toUpperCase()) + 'Page';
      
      if (window[pageObjectName]) {
        // La página tiene su propio objeto controlador
        const pageHtml = await window[pageObjectName].render(params);
        container.innerHTML = pageHtml;
        
        // Pequeño delay para permitir que el DOM se actualice antes de inicializar
        setTimeout(() => {
          if (typeof window[pageObjectName].init === 'function') {
            window[pageObjectName].init(params);
          }
        }, 50);
      } else {
        container.innerHTML = `<div class="empty-state">
          <svg class="empty-state-icon text-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div class="empty-state-title">Página no encontrada</div>
          <div class="empty-state-text">El módulo "${route}" no está implementado o no pudo cargarse.</div>
        </div>`;
      }
    } catch (e) {
      console.error(`Error cargando ruta ${route}:`, e);
      container.innerHTML = `<div class="empty-state">
        <svg class="empty-state-icon text-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        <div class="empty-state-title">Error de carga</div>
        <div class="empty-state-text">${e.message}</div>
      </div>`;
    }
  }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const status = await window.api.license.getStatus();
    if (!status.success || !status.data || !status.data.valid) {
      window.location.href = 'activation.html';
      return;
    }
  } catch(e) {
    window.location.href = 'activation.html';
    return;
  }
  app.init();
});
