window.settingsPage = {
  settings: {},
  services: [],

  async render() {
    return `
      <div class="settings-page mx-auto">
        
        <!-- General Info -->
        <div class="card settings-section">
          <div class="settings-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <h3>Datos del Negocio</h3>
          </div>
          
          <div class="form-group">
            <label class="form-label">Nombre del Negocio (Se muestra en recibos y pantalla principal)</label>
            <input type="text" id="setBizName" class="form-input">
          </div>
          
          <div class="grid grid-2">
            <div class="form-group">
              <label class="form-label">Teléfono de Contacto</label>
              <input type="text" id="setBizPhone" class="form-input">
            </div>
            <div class="form-group">
              <label class="form-label">Dirección</label>
              <input type="text" id="setBizAddress" class="form-input">
            </div>
          </div>
          
          <div class="flex" style="justify-content: flex-end;">
            <button class="btn btn-primary" onclick="settingsPage.saveSettings('business')">Guardar Datos</button>
          </div>
        </div>

        <!-- Appearance Settings -->
        <div class="card settings-section">
          <div class="settings-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <h3>Apariencia (Accesibilidad)</h3>
          </div>
          <div class="form-group">
            <label class="form-label">Tamaño de Interfaz (Letras e Iconos)</label>
            <select id="setAppScale" class="form-select">
              <option value="normal">Normal</option>
              <option value="large">Grande</option>
              <option value="xlarge">Muy Grande</option>
            </select>
          </div>
          <div class="flex" style="justify-content: flex-end;">
            <button class="btn btn-primary" onclick="settingsPage.saveSettings('appearance')">Guardar Apariencia</button>
          </div>
        </div>

        <!-- Receipt Settings -->
        <div class="card settings-section">
          <div class="settings-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <h3>Configuración de Recibos</h3>
          </div>
          
          <div class="form-group">
            <label class="form-label">Mensaje Principal (Debajo del nombre)</label>
            <input type="text" id="setRecMsg" class="form-input" placeholder="Ej: Especialistas en cuidado de prendas">
          </div>
          
          <div class="form-group">
            <label class="form-label">Mensaje de Pie de Página</label>
            <textarea id="setRecFooter" class="form-textarea" style="min-height: 80px;" placeholder="Ej: Gracias por su preferencia. No nos responsabilizamos por prendas desteñidas."></textarea>
          </div>
          
          <div class="flex" style="justify-content: flex-end;">
            <button class="btn btn-primary" onclick="settingsPage.saveSettings('receipt')">Guardar Recibos</button>
          </div>
        </div>

        <!-- Services Management -->
        <div class="card settings-section">
          <div class="flex-between align-center mb-4">
            <div class="settings-section-header mb-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
              <h3>Servicios y Precios</h3>
            </div>
            <button class="btn btn-sm btn-secondary" onclick="settingsPage.openServiceModal()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nuevo Servicio
            </button>
          </div>
          
          <div class="settings-services-list" id="settingsServicesList">
            <div class="text-center py-4"><div class="spinner mx-auto"></div></div>
          </div>
        </div>

        <!-- License Info -->
        <div class="card settings-section">
          <div class="settings-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <h3>Estado de Licencia</h3>
          </div>
          
          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="grid grid-2 gap-4">
              <div>
                <div class="text-xs text-gray-500 mb-1">CÓDIGO DE LICENCIA</div>
                <div class="font-bold text-gray-800 font-mono" id="licCode">Cargando...</div>
              </div>
              <div>
                <div class="text-xs text-gray-500 mb-1">ESTADO</div>
                <div id="licStatus">Cargando...</div>
              </div>
              <div>
                <div class="text-xs text-gray-500 mb-1">ÚLTIMA VALIDACIÓN</div>
                <div class="text-sm font-medium" id="licLastVal">-</div>
              </div>
              <div>
                <div class="text-xs text-gray-500 mb-1">DISPOSITIVO (Machine ID)</div>
                <div class="text-sm font-medium font-mono text-gray-600 truncate" id="licMachineId">-</div>
              </div>
            </div>
            
            <div class="mt-4 pt-4 border-top">
              <button class="btn btn-sm btn-ghost" onclick="settingsPage.forceValidation()" id="btnForceVal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
                Forzar Validación Online
              </button>
            </div>
          </div>
        </div>

        <!-- About -->
        <div class="settings-about">
          <div class="foxy-logo">Foxy Studios</div>
          <div class="legal-text">
            © ${new Date().getFullYear()} Control de Lavandería. Todos los derechos reservados.<br><br>
            Esta aplicación es de uso exclusivo para la empresa licenciataria. 
            Prohibida su reproducción, distribución o reventa sin autorización expresa de Foxy Studios.
          </div>
        </div>

      </div>
    `;
  },

  async init() {
    await this.loadSettings();
    await this.loadServices();
    await this.loadLicenseInfo();
  },

  async loadSettings() {
    try {
      const res = await window.api.settings.getAll();
      if (res.success) {
        this.settings = res.data;
        
        document.getElementById('setBizName').value = this.settings.business_name || '';
        document.getElementById('setBizPhone').value = this.settings.business_phone || '';
        document.getElementById('setBizAddress').value = this.settings.business_address || '';
        document.getElementById('setRecMsg').value = this.settings.receipt_message || '';
        document.getElementById('setRecFooter').value = this.settings.receipt_footer || '';
        
        if (this.settings.app_scale && document.getElementById('setAppScale')) {
          document.getElementById('setAppScale').value = this.settings.app_scale;
        }
      }
    } catch (e) {
      console.error(e);
    }
  },

  async loadServices() {
    try {
      const res = await window.api.services.getAll();
      if (res.success) {
        this.services = res.data;
        this.renderServices();
      }
    } catch (e) {
      console.error(e);
    }
  },

  async loadLicenseInfo() {
    try {
      const res = await window.api.license.getInfo();
      if (res.success && res.data) {
        document.getElementById('licCode').textContent = res.data.code;
        document.getElementById('licMachineId').textContent = res.data.machineId || '-';
        document.getElementById('licLastVal').textContent = res.data.lastValidated ? format.datetime(res.data.lastValidated) : 'Nunca';
        
        const statusEl = document.getElementById('licStatus');
        if (res.data.status === 'active') {
          statusEl.innerHTML = '<span class="badge badge-active">Activa</span>';
        } else {
          statusEl.innerHTML = '<span class="badge badge-suspended">Suspendida/Inválida</span>';
        }
      }
    } catch (e) {
      console.error(e);
    }
  },

  renderServices() {
    const container = document.getElementById('settingsServicesList');
    let html = '';
    
    if (this.services.length === 0) {
      container.innerHTML = `<div class="empty-state text-sm p-4">No hay servicios configurados</div>`;
      return;
    }

    this.services.forEach(srv => {
      const isKg = srv.is_per_kg === 1;
      const priceText = isKg ? `${format.currency(srv.price_per_kg)} por Kg` : `${format.currency(srv.fixed_price)} Fijo`;
      
      html += `
        <div class="settings-service-item">
          <div class="service-info">
            <div style="opacity: ${srv.is_active ? '1' : '0.5'}">
              <div class="service-name flex-align gap-2">
                ${srv.name}
                ${!srv.is_active ? '<span class="badge bg-gray-200 text-gray-600">Inactivo</span>' : ''}
              </div>
              <div class="service-price">${priceText}</div>
            </div>
          </div>
          <div class="service-actions">
            <button class="btn btn-icon btn-sm btn-ghost" title="Editar" onclick="settingsPage.openServiceModal(${srv.id})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
            </button>
            <label class="toggle" title="${srv.is_active ? 'Desactivar' : 'Activar'}">
              <input type="checkbox" onchange="settingsPage.toggleServiceStatus(${srv.id})" ${srv.is_active ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
  },

  async saveSettings(group) {
    let keys = [];
    let values = {};

    if (group === 'business') {
      values = {
        'business_name': document.getElementById('setBizName').value.trim(),
        'business_phone': document.getElementById('setBizPhone').value.trim(),
        'business_address': document.getElementById('setBizAddress').value.trim()
      };
    } else if (group === 'receipt') {
      values = {
        'receipt_message': document.getElementById('setRecMsg').value.trim(),
        'receipt_footer': document.getElementById('setRecFooter').value.trim()
      };
    } else if (group === 'appearance') {
      const scale = document.getElementById('setAppScale').value;
      values = {
        'app_scale': scale
      };
      
      // Apply immediately
      document.documentElement.classList.remove('scale-normal', 'scale-large', 'scale-xlarge');
      if (scale !== 'normal') {
        document.documentElement.classList.add('scale-' + scale);
      }
    }

    try {
      for (const [key, value] of Object.entries(values)) {
        await window.api.settings.set(key, value);
      }
      toast.success('Guardado', 'La configuración se actualizó correctamente');
      
      // Update app title if business name changed
      if (values['business_name']) {
        document.getElementById('appTitle').textContent = values['business_name'];
        const logoText = document.getElementById('sidebarLogoText');
        if (logoText) logoText.textContent = values['business_name'];
      }
    } catch (e) {
      toast.error('Error', 'No se pudo guardar la configuración');
    }
  },

  openServiceModal(id = null) {
    const srv = id ? this.services.find(s => s.id === id) : null;
    const isEdit = !!srv;

    const html = `
      <form class="flex-col gap-4">
        <div class="form-group mb-0">
          <label class="form-label">Nombre del Servicio</label>
          <input type="text" id="modalSrvName" class="form-input" required value="${isEdit ? srv.name : ''}">
        </div>
        
        <div class="form-group mb-0">
          <label class="form-label">Tipo de Cobro</label>
          <select id="modalSrvType" class="form-select" onchange="settingsPage.onServiceTypeChange()">
            <option value="1" ${isEdit && srv.is_per_kg === 1 ? 'selected' : ''}>Por Kilo</option>
            <option value="0" ${isEdit && srv.is_per_kg === 0 ? 'selected' : ''}>Precio Fijo (Por Prenda/Unidad)</option>
          </select>
        </div>

        <div class="form-group mb-0" id="modalSrvPriceKgGroup" style="${isEdit && srv.is_per_kg === 0 ? 'display:none;' : ''}">
          <label class="form-label">Precio por Kg (S/)</label>
          <input type="text" id="modalSrvPriceKg" class="form-input" value="${isEdit ? srv.price_per_kg : '0.00'}" oninput="this.value=format.numericInput(this.value)">
        </div>

        <div class="form-group mb-0" id="modalSrvPriceFixedGroup" style="${isEdit && srv.is_per_kg === 1 ? 'display:none;' : (!isEdit ? 'display:none;' : '')}">
          <label class="form-label">Precio Fijo (S/)</label>
          <input type="text" id="modalSrvPriceFixed" class="form-input" value="${isEdit ? srv.fixed_price : '0.00'}" oninput="this.value=format.numericInput(this.value)">
        </div>
      </form>
    `;

    modal.show({
      title: isEdit ? 'Editar Servicio' : 'Nuevo Servicio',
      content: html,
      onConfirm: async () => {
        const name = document.getElementById('modalSrvName').value.trim();
        if (!name) { toast.warning('Validación', 'El nombre es obligatorio'); return false; }
        
        const isKg = document.getElementById('modalSrvType').value === '1' ? 1 : 0;
        const priceKg = parseFloat(document.getElementById('modalSrvPriceKg').value) || 0;
        const priceFixed = parseFloat(document.getElementById('modalSrvPriceFixed').value) || 0;

        const data = {
          name,
          is_per_kg: isKg,
          price_per_kg: priceKg,
          fixed_price: priceFixed,
          is_active: isEdit ? srv.is_active : 1
        };

        try {
          if (isEdit) {
            await window.api.services.update(id, data);
            toast.success('Servicio Actualizado', 'Los cambios se guardaron');
          } else {
            await window.api.services.create(data);
            toast.success('Servicio Creado', 'El servicio fue agregado');
          }
          this.loadServices();
          return true;
        } catch (e) {
          toast.error('Error', 'No se pudo guardar el servicio');
          return false;
        }
      }
    });
  },

  onServiceTypeChange() {
    const val = document.getElementById('modalSrvType').value;
    if (val === '1') {
      document.getElementById('modalSrvPriceKgGroup').style.display = 'block';
      document.getElementById('modalSrvPriceFixedGroup').style.display = 'none';
    } else {
      document.getElementById('modalSrvPriceKgGroup').style.display = 'none';
      document.getElementById('modalSrvPriceFixedGroup').style.display = 'block';
    }
  },

  async toggleServiceStatus(id) {
    try {
      const res = await window.api.services.toggleActive(id);
      if (res.success) {
        this.loadServices();
        toast.success('Actualizado', 'Estado del servicio modificado');
      }
    } catch (e) {
      toast.error('Error', 'No se pudo cambiar el estado');
      this.loadServices(); // re-render to revert toggle
    }
  },

  async forceValidation() {
    const btn = document.getElementById('btnForceVal');
    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner spinner-sm"></div> Validando...';

    try {
      const res = await window.api.license.validate();
      if (res.valid) {
        toast.success('Validación Exitosa', 'Su licencia está activa y correcta');
        await this.loadLicenseInfo();
      } else {
        toast.error('Error de Validación', 'No se pudo validar o la licencia fue suspendida');
        // El main process debería redirigir a blocked.html automáticamente si es inválida.
        // Si no lo hace, recargamos la app nosotros.
        if (res.reason === 'suspended' || res.reason === 'no-license') {
           window.api.app.relaunch();
        }
      }
    } catch (e) {
      toast.error('Error', 'Revise su conexión a internet');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalContent;
    }
  }
};
