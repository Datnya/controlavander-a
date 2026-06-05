window.clientsPage = {
  data: [],
  searchQuery: '',

  async render() {
    return `
      <div class="filters-bar flex-between">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="clientSearch" class="search-input" placeholder="Buscar por nombre o teléfono...">
        </div>
        <button class="btn btn-primary" onclick="clientsPage.openClientModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo Cliente
        </button>
      </div>

      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>Teléfono</th>
              <th>Documento</th>
              <th>Frecuente</th>
              <th>Registro</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody id="clientsTableBody">
            <tr><td colspan="6" class="text-center py-8"><div class="spinner mx-auto"></div></td></tr>
          </tbody>
        </table>
      </div>
    `;
  },

  async init() {
    await this.loadData();

    // Event listener para búsqueda con debounce
    const searchInput = document.getElementById('clientSearch');
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.searchQuery = e.target.value.trim();
        this.loadData();
      }, 300);
    });
  },

  async loadData() {
    try {
      let res;
      if (this.searchQuery) {
        res = await window.api.clients.search(this.searchQuery);
      } else {
        res = await window.api.clients.getAll();
      }

      if (res.success) {
        this.data = res.data;
        this.renderTable();
      }
    } catch (e) {
      console.error('Error cargando clientes', e);
      toast.error('Error', 'No se pudieron cargar los clientes');
    }
  },

  renderTable() {
    const tbody = document.getElementById('clientsTableBody');
    if (!tbody) return;
    
    if (this.data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-state">
              <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <div class="empty-state-title">No se encontraron clientes</div>
              <div class="empty-state-text">${this.searchQuery ? 'Prueba con otro término de búsqueda.' : 'Aún no hay clientes registrados en el sistema.'}</div>
            </div>
          </td>
        </tr>`;
      return;
    }

    let html = '';
    this.data.forEach(client => {
      const isFrequent = client.is_frequent === 1;
      html += `
        <tr>
          <td class="font-medium text-gray-800">
            ${client.full_name}
          </td>
          <td>${client.phone || '-'}</td>
          <td>${client.document_id || '-'}</td>
          <td>
            ${isFrequent 
              ? `<span class="client-frequent-star"><svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span>` 
              : '-'}
          </td>
          <td class="text-gray-500">${format.date(client.created_at)}</td>
          <td class="td-actions">
            <div class="btn-group" style="justify-content: flex-end;">
              <button class="btn btn-icon btn-sm btn-ghost" title="Editar" onclick="clientsPage.openClientModal(${client.id})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
              </button>
              <button class="btn btn-icon btn-sm btn-ghost text-danger" title="Eliminar" onclick="clientsPage.deleteClient(${client.id}, '${client.full_name}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    });
    
    tbody.innerHTML = html;
  },

  async openClientModal(id = null) {
    let client = null;
    let isEdit = false;

    if (id) {
      const res = await window.api.clients.getById(id);
      if (res.success) {
        client = res.data;
        isEdit = true;
      }
    }

    const formHtml = `
      <form id="clientForm" class="flex-col gap-4">
        <div class="form-group mb-0">
          <label class="form-label">Nombre Completo <span class="text-danger">*</span></label>
          <input type="text" id="clientName" class="form-input" required value="${client ? client.full_name : ''}">
        </div>
        
        <div class="form-row">
          <div class="form-group mb-0">
            <label class="form-label">Teléfono</label>
            <input type="tel" id="clientPhone" class="form-input" value="${client && client.phone ? client.phone : ''}">
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Documento (DNI/RUC)</label>
            <input type="text" id="clientDoc" class="form-input" value="${client && client.document_id ? client.document_id : ''}">
          </div>
        </div>

        <div class="form-group mb-0">
          <label class="form-label">Notas</label>
          <textarea id="clientNotes" class="form-textarea" style="min-height: 80px;">${client && client.notes ? client.notes : ''}</textarea>
        </div>

        <div class="flex-align gap-3 mt-2">
          <label class="toggle">
            <input type="checkbox" id="clientFrequent" ${client && client.is_frequent === 1 ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
          <span class="text-sm font-medium text-gray-700">Cliente Frecuente</span>
        </div>
      </form>
    `;

    modal.show({
      title: isEdit ? 'Editar Cliente' : 'Nuevo Cliente',
      content: formHtml,
      confirmText: 'Guardar',
      onConfirm: async () => {
        const nameInput = document.getElementById('clientName');
        if (!nameInput.value.trim()) {
          nameInput.focus();
          toast.warning('Validación', 'El nombre del cliente es obligatorio');
          return false; // No cerrar el modal
        }

        const data = {
          full_name: nameInput.value.trim(),
          phone: document.getElementById('clientPhone').value.trim(),
          document_id: document.getElementById('clientDoc').value.trim(),
          notes: document.getElementById('clientNotes').value.trim(),
          is_frequent: document.getElementById('clientFrequent').checked ? 1 : 0
        };

        try {
          let res;
          if (isEdit) {
            res = await window.api.clients.update(id, data);
          } else {
            res = await window.api.clients.create(data);
          }

          if (res.success) {
            toast.success('Éxito', `Cliente ${isEdit ? 'actualizado' : 'creado'} correctamente`);
            this.loadData();
            return true; // Cerrar modal
          } else {
            throw new Error(res.error);
          }
        } catch (e) {
          toast.error('Error', e.message || 'No se pudo guardar el cliente');
          return false;
        }
      }
    });
  },

  deleteClient(id, name) {
    modal.confirm(
      'Eliminar Cliente',
      `¿Está seguro que desea eliminar a <b>${name}</b>?<br><br>Nota: Si el cliente tiene pedidos registrados, no podrá ser eliminado por integridad de datos.`,
      async () => {
        const res = await window.api.clients.delete(id);
        if (res.success) {
          toast.success('Eliminado', 'El cliente ha sido eliminado');
          this.loadData();
        } else {
          toast.error('Error', res.error || 'No se pudo eliminar el cliente (probablemente tenga pedidos asociados)');
        }
      },
      'danger'
    );
  }
};
