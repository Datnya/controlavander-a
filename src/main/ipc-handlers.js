const { ipcMain, clipboard, nativeImage, BrowserWindow, app, dialog, shell } = require('electron');
const fs = require('fs');
const db = require('./database');
const license = require('./license');

/**
 * Registra todos los manejadores IPC para la comunicación main ↔ renderer.
 */
function registerIpcHandlers() {
  // ==================== CLIENTES ====================
  ipcMain.handle('clients:getAll', async () => {
    try { return { success: true, data: db.getAllClients() }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('clients:getById', async (_, id) => {
    try { return { success: true, data: db.getClientById(id) }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('clients:search', async (_, query) => {
    try { return { success: true, data: db.searchClients(query) }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('clients:create', async (_, data) => {
    try { return { success: true, data: db.createClient(data) }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('clients:update', async (_, id, data) => {
    try { return { success: true, data: db.updateClient(id, data) }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('clients:delete', async (_, id) => {
    try { db.deleteClient(id); return { success: true }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('clients:getFrequent', async () => {
    try { return { success: true, data: db.getFrequentClients() }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  // ==================== PEDIDOS ====================
  ipcMain.handle('orders:getAll', async (_, filters) => {
    try { return { success: true, data: db.getAllOrders(filters || {}) }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('orders:getById', async (_, id) => {
    try { return { success: true, data: db.getOrderById(id) }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('orders:create', async (_, data) => {
    try { return { success: true, data: db.createOrder(data) }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('orders:update', async (_, id, data) => {
    try { return { success: true, data: db.updateOrder(id, data) }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('orders:updateStatus', async (_, id, status) => {
    try { return { success: true, data: db.updateOrderStatus(id, status) }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('orders:getByClient', async (_, clientId) => {
    try { return { success: true, data: db.getOrdersByClient(clientId) }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('orders:getNextNumber', async () => {
    try { return { success: true, data: db.getNextOrderNumber() }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('orders:getActive', async () => {
    try { return { success: true, data: db.getActiveOrders() }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('orders:getToday', async () => {
    try { return { success: true, data: db.getTodayOrders() }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('orders:delete', async (_, id) => {
    try { db.deleteOrder(id); return { success: true }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  // ==================== SERVICIOS ====================
  ipcMain.handle('services:getAll', async () => {
    try { return { success: true, data: db.getAllServices() }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('services:getActive', async () => {
    try { return { success: true, data: db.getActiveServices() }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('services:create', async (_, data) => {
    try { return { success: true, data: db.createService(data) }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('services:update', async (_, id, data) => {
    try { return { success: true, data: db.updateService(id, data) }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('services:toggleActive', async (_, id) => {
    try { return { success: true, data: db.toggleServiceActive(id) }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  // ==================== CONFIGURACIÓN ====================
  ipcMain.handle('settings:get', async (_, key) => {
    try { return { success: true, data: db.getSetting(key) }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('settings:getAll', async () => {
    try { return { success: true, data: db.getAllSettings() }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('settings:set', async (_, key, value) => {
    try { db.setSetting(key, value); return { success: true }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('settings:getBulk', async (_, keys) => {
    try { return { success: true, data: db.getBulkSettings(keys) }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  // ==================== REPORTES ====================
  ipcMain.handle('reports:getDashboardStats', async () => {
    try { return { success: true, data: db.getDashboardStats() }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('reports:getDailySummary', async (_, date) => {
    try { return { success: true, data: db.getDailySummary(date) }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('reports:getWeeklySummary', async (_, startDate, endDate) => {
    try { return { success: true, data: db.getWeeklySummary(startDate, endDate) }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('reports:getMonthlySummary', async (_, year, month) => {
    try { return { success: true, data: db.getMonthlySummary(year, month) }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('reports:getIncomeByDateRange', async (_, startDate, endDate) => {
    try { return { success: true, data: db.getIncomeByDateRange(startDate, endDate) }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('reports:exportCSV', async (_, data, filename) => {
    try {
      const win = BrowserWindow.getFocusedWindow();
      const { canceled, filePath } = await dialog.showSaveDialog(win, {
        title: 'Guardar Reporte',
        defaultPath: filename || 'reporte.csv',
        filters: [{ name: 'Archivos CSV', extensions: ['csv'] }]
      });
      
      if (canceled || !filePath) return { success: true, canceled: true };
      
      // Agregar BOM para que Excel detecte correctamente UTF-8
      const bom = '\uFEFF';
      fs.writeFileSync(filePath, bom + data, 'utf8');
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('reports:clearOld', async () => {
    try {
      const count = db.clearOldOrders();
      return { success: true, count };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  // ==================== LICENCIA ====================
  ipcMain.handle('license:activate', async (_, code) => {
    try { return await license.activateLicense(code); }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('license:getStatus', async () => {
    try { return await license.isLicenseValid(); }
    catch (e) { return { valid: false, reason: e.message }; }
  });

  ipcMain.handle('license:validate', async () => {
    try { return await license.validateLicense(); }
    catch (e) { return { valid: false, reason: e.message }; }
  });

  ipcMain.handle('license:getInfo', async () => {
    try { return { success: true, data: license.getLicenseInfo() }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  // ==================== COMPROBANTE ====================
  ipcMain.handle('receipt:copyToClipboard', async (_, dataUrl) => {
    try {
      const image = nativeImage.createFromDataURL(dataUrl);
      clipboard.writeImage(image);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('receipt:getOrderForReceipt', async (_, orderId) => {
    try {
      const order = db.getOrderById(orderId);
      const settings = db.getAllSettings();
      return { success: true, data: { order, settings } };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  // ==================== APP ====================
  ipcMain.handle('app:getVersion', async () => {
    return app.getVersion();
  });

  // Abre un enlace en el navegador del sistema (ej. WhatsApp Web), no en una
  // ventana de Electron.
  ipcMain.handle('app:openExternal', async (_, url) => {
    try { await shell.openExternal(url); return { success: true }; }
    catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('app:minimize', async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.minimize();
  });

  ipcMain.handle('app:maximize', async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      if (win.isMaximized()) win.unmaximize();
      else win.maximize();
    }
  });

  ipcMain.handle('app:close', async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.close();
  });

  ipcMain.handle('app:isMaximized', async () => {
    const win = BrowserWindow.getFocusedWindow();
    return win ? win.isMaximized() : false;
  });
}

module.exports = { registerIpcHandlers };
