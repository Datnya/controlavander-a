const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // ==================== CLIENTES ====================
  clients: {
    getAll: () => ipcRenderer.invoke('clients:getAll'),
    getById: (id) => ipcRenderer.invoke('clients:getById', id),
    search: (query) => ipcRenderer.invoke('clients:search', query),
    create: (data) => ipcRenderer.invoke('clients:create', data),
    update: (id, data) => ipcRenderer.invoke('clients:update', id, data),
    delete: (id) => ipcRenderer.invoke('clients:delete', id),
    getFrequent: () => ipcRenderer.invoke('clients:getFrequent'),
    getOrders: (clientId) => ipcRenderer.invoke('orders:getByClient', clientId),
  },

  // ==================== PEDIDOS ====================
  orders: {
    getAll: (filters) => ipcRenderer.invoke('orders:getAll', filters),
    getById: (id) => ipcRenderer.invoke('orders:getById', id),
    create: (data) => ipcRenderer.invoke('orders:create', data),
    update: (id, data) => ipcRenderer.invoke('orders:update', id, data),
    updateStatus: (id, status) => ipcRenderer.invoke('orders:updateStatus', id, status),
    getByClient: (clientId) => ipcRenderer.invoke('orders:getByClient', clientId),
    getNextNumber: () => ipcRenderer.invoke('orders:getNextNumber'),
    getActive: () => ipcRenderer.invoke('orders:getActive'),
    getToday: () => ipcRenderer.invoke('orders:getToday'),
  },

  // ==================== SERVICIOS ====================
  services: {
    getAll: () => ipcRenderer.invoke('services:getAll'),
    getActive: () => ipcRenderer.invoke('services:getActive'),
    create: (data) => ipcRenderer.invoke('services:create', data),
    update: (id, data) => ipcRenderer.invoke('services:update', id, data),
    toggleActive: (id) => ipcRenderer.invoke('services:toggleActive', id),
  },

  // ==================== CONFIGURACIÓN ====================
  settings: {
    get: (key) => ipcRenderer.invoke('settings:get', key),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value),
    getBulk: (keys) => ipcRenderer.invoke('settings:getBulk', keys),
  },

  // ==================== REPORTES ====================
  reports: {
    getDashboardStats: () => ipcRenderer.invoke('reports:getDashboardStats'),
    getDailySummary: (date) => ipcRenderer.invoke('reports:getDailySummary', date),
    getWeeklySummary: (startDate, endDate) => ipcRenderer.invoke('reports:getWeeklySummary', startDate, endDate),
    getMonthlySummary: (year, month) => ipcRenderer.invoke('reports:getMonthlySummary', year, month),
    getIncomeByDateRange: (startDate, endDate) => ipcRenderer.invoke('reports:getIncomeByDateRange', startDate, endDate),
  },

  // ==================== LICENCIA ====================
  license: {
    activate: (code) => ipcRenderer.invoke('license:activate', code),
    getStatus: () => ipcRenderer.invoke('license:getStatus'),
    validate: () => ipcRenderer.invoke('license:validate'),
    getInfo: () => ipcRenderer.invoke('license:getInfo'),
  },

  // ==================== COMPROBANTE ====================
  receipt: {
    copyToClipboard: (dataUrl) => ipcRenderer.invoke('receipt:copyToClipboard', dataUrl),
    getOrderForReceipt: (orderId) => ipcRenderer.invoke('receipt:getOrderForReceipt', orderId),
  },

  // ==================== APP ====================
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    minimize: () => ipcRenderer.invoke('app:minimize'),
    maximize: () => ipcRenderer.invoke('app:maximize'),
    close: () => ipcRenderer.invoke('app:close'),
    isMaximized: () => ipcRenderer.invoke('app:isMaximized'),
    loadPage: (page) => ipcRenderer.invoke('app:loadPage', page),
    relaunch: () => ipcRenderer.invoke('app:relaunch'),
  }
});
