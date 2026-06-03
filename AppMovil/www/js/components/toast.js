const toast = {
  /**
   * Muestra una notificación tipo toast
   * @param {string} title Título de la notificación
   * @param {string} message Mensaje detallado
   * @param {string} type Tipo: 'success', 'error', 'warning', 'info'
   * @param {number} duration Duración en milisegundos (default: 4000)
   */
  show(title, message = '', type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    // Crear elemento
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    
    // Configurar ícono según el tipo
    let iconSvg = '';
    switch(type) {
      case 'success':
        iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
        break;
      case 'error':
        iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
        break;
      case 'warning':
        iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
        break;
      case 'info':
      default:
        iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
        break;
    }

    el.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
      <div class="toast-close" onclick="this.parentElement.remove()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </div>
    `;

    container.appendChild(el);

    // Animar entrada (forzar reflow)
    void el.offsetWidth;
    el.classList.add('show');

    // Autocerrar
    if (duration > 0) {
      setTimeout(() => {
        el.classList.remove('show');
        el.classList.add('hiding');
        setTimeout(() => el.remove(), 300); // Esperar animación CSS
      }, duration);
    }
  },

  success(title, message, duration) { this.show(title, message, 'success', duration); },
  error(title, message, duration) { this.show(title, message, 'error', duration); },
  warning(title, message, duration) { this.show(title, message, 'warning', duration); },
  info(title, message, duration) { this.show(title, message, 'info', duration); }
};
