const format = {
  /**
   * Formatea un número como moneda (Soles)
   * @param {number} amount Monto a formatear
   * @returns {string} Ej: S/ 120.50
   */
  currency(amount) {
    if (isNaN(amount) || amount === null) return 'S/ 0.00';
    return `S/ ${Number(amount).toFixed(2)}`;
  },

  /**
   * Formatea una fecha al formato local (DD/MM/YYYY)
   * @param {string|Date} date Fecha a formatear
   * @returns {string} Ej: 15/06/2026
   */
  date(dateString) {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '-';
      
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (e) {
      return '-';
    }
  },

  /**
   * Formatea fecha y hora (DD/MM/YYYY HH:MM)
   * @param {string|Date} date Fecha a formatear
   * @returns {string} Ej: 15/06/2026 14:30
   */
  datetime(dateString) {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '-';
      
      const datePart = this.date(d);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      
      return `${datePart} ${hours}:${minutes}`;
    } catch (e) {
      return '-';
    }
  },

  /**
   * Devuelve el texto amigable para un estado de pedido
   * @param {string} status Código de estado
   * @returns {string} Texto en español
   */
  statusText(status) {
    const states = {
      'received': 'Recibido',
      'in_progress': 'En Proceso',
      'ready': 'Listo para recoger',
      'delivered': 'Entregado'
    };
    return states[status] || status;
  },

  /**
   * Genera el HTML para un badge de estado
   * @param {string} status Código de estado
   * @returns {string} Elemento HTML span
   */
  statusBadge(status) {
    const text = this.statusText(status);
    let icon = '';
    
    switch(status) {
      case 'received':
        icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
        break;
      case 'in_progress':
        icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
        break;
      case 'ready':
        icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
        break;
      case 'delivered':
        icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M20 6 9 17l-5-5"/></svg>`;
        break;
    }
    
    return `<span class="badge badge-${status.replace('_', '-')}">${icon} ${text}</span>`;
  },

  /**
   * Limpia un input para que solo contenga números y punto decimal
   */
  numericInput(value) {
    if (!value) return '';
    // Reemplaza comas con puntos y remueve todo lo que no sea número o punto
    let cleaned = value.toString().replace(/,/g, '.').replace(/[^\d.]/g, '');
    
    // Asegura que solo haya un punto decimal
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    
    return cleaned;
  }
};
