const modal = {
  /**
   * Muestra un modal dinámico
   * @param {Object} options Opciones del modal
   * @param {string} options.title Título del modal
   * @param {string} options.content Contenido HTML interno
   * @param {string} options.size 'sm', 'md', 'lg', 'xl' (default: 'md')
   * @param {Function} options.onConfirm Callback al confirmar (retorna true para cerrar, false para mantener)
   * @param {Function} options.onCancel Callback al cancelar
   * @param {string} options.confirmText Texto del botón confirmar
   * @param {string} options.cancelText Texto del botón cancelar
   * @param {string} options.confirmClass Clase extra para botón confirmar (ej: 'btn-danger')
   * @param {boolean} options.showFooter Mostrar u ocultar botones (default: true)
   */
  show(options = {}) {
    const {
      title = 'Modal',
      content = '',
      size = 'md',
      onConfirm = null,
      onCancel = null,
      confirmText = 'Aceptar',
      cancelText = 'Cancelar',
      confirmClass = 'btn-primary',
      showFooter = true
    } = options;

    // Crear overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    // Crear footer si es necesario
    let footerHtml = '';
    if (showFooter) {
      footerHtml = `
        <div class="modal-footer">
          <button class="btn btn-secondary modal-btn-cancel">${cancelText}</button>
          ${onConfirm ? `<button class="btn ${confirmClass} modal-btn-confirm">${confirmText}</button>` : ''}
        </div>
      `;
    }

    // HTML del modal
    overlay.innerHTML = `
      <div class="modal modal-${size}">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
        ${footerHtml}
      </div>
    `;

    document.body.appendChild(overlay);

    // Función para cerrar (con animación)
    const closeModal = () => {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
    };

    // Eventos
    // Cerrar desde la X
    overlay.querySelector('.modal-close').addEventListener('click', () => {
      if (onCancel) onCancel();
      closeModal();
    });

    // Cerrar clicando fuera
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        if (onCancel) onCancel();
        closeModal();
      }
    });

    // Botones del footer
    if (showFooter) {
      overlay.querySelector('.modal-btn-cancel').addEventListener('click', () => {
        if (onCancel) onCancel();
        closeModal();
      });

      if (onConfirm) {
        overlay.querySelector('.modal-btn-confirm').addEventListener('click', async (e) => {
          const btn = e.target;
          btn.disabled = true;
          const originalText = btn.innerHTML;
          btn.innerHTML = '<div class="spinner spinner-sm" style="border-color: rgba(255,255,255,0.3); border-top-color: white;"></div>';

          try {
            const shouldClose = await onConfirm();
            if (shouldClose !== false) {
              closeModal();
            } else {
              btn.disabled = false;
              btn.innerHTML = originalText;
            }
          } catch (err) {
            console.error('Error en onConfirm:', err);
            btn.disabled = false;
            btn.innerHTML = originalText;
            toast.error('Error', err.message || 'Ocurrió un problema');
          }
        });
      }
    }

    // Animar entrada
    void overlay.offsetWidth;
    overlay.classList.add('active');

    return {
      close: closeModal,
      element: overlay
    };
  },

  /**
   * Helper para mostrar diálogo de confirmación
   */
  confirm(title, message, onConfirm, type = 'warning') {
    const confirmClasses = {
      'danger': 'btn-danger',
      'warning': 'btn-primary',
      'info': 'btn-primary'
    };

    return this.show({
      title,
      content: `<p class="text-md text-gray-600">${message}</p>`,
      size: 'sm',
      onConfirm,
      confirmText: 'Confirmar',
      confirmClass: confirmClasses[type] || 'btn-primary'
    });
  }
};
