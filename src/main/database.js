const path = require('path');
const Database = require('better-sqlite3');
const { app } = require('electron');

let db = null;

/**
 * Inicializa la base de datos SQLite.
 * Crea las tablas necesarias y los datos por defecto.
 */
function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'control-lavanderia.db');
  db = new Database(dbPath);

  // Configuración de rendimiento
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');

  createTables();
  insertDefaults();

  console.log('Base de datos inicializada en:', dbPath);
  return db;
}

/**
 * Crea todas las tablas del sistema.
 */
function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      phone TEXT,
      document_id TEXT,
      notes TEXT,
      is_frequent INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT (datetime('now','localtime')),
      updated_at DATETIME DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price_per_kg REAL DEFAULT 0,
      fixed_price REAL DEFAULT 0,
      is_per_kg INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      client_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      weight_kg REAL DEFAULT 0,
      garment_count INTEGER DEFAULT 0,
      garment_detail TEXT,
      garment_observations TEXT,
      special_services TEXT,
      status TEXT DEFAULT 'received' CHECK(status IN ('received','in_progress','ready','delivered')),
      base_amount REAL NOT NULL DEFAULT 0,
      discount REAL DEFAULT 0,
      final_amount REAL NOT NULL DEFAULT 0,
      received_date DATETIME DEFAULT (datetime('now','localtime')),
      estimated_delivery DATE,
      delivered_date DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT (datetime('now','localtime')),
      updated_at DATETIME DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (service_id) REFERENCES services(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS license (
      id INTEGER PRIMARY KEY DEFAULT 1,
      code TEXT NOT NULL,
      machine_id TEXT NOT NULL,
      activated_at DATETIME DEFAULT (datetime('now','localtime')),
      last_validated DATETIME,
      status TEXT DEFAULT 'active'
    );

    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_client ON orders(client_id);
    CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(received_date);
    CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(full_name);
    CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
  `);

  // Migración para añadir columnas de pago si no existen
  try {
    db.exec("ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending'");
    db.exec("ALTER TABLE orders ADD COLUMN advance_payment REAL DEFAULT 0");
  } catch (e) {
    // Si la columna ya existe, SQLite lanzará un error que podemos ignorar
  }
  // Fecha de cobro completo (para filtrar/contar ingresos por fecha de pago)
  try {
    db.exec("ALTER TABLE orders ADD COLUMN payment_date DATETIME");
    // Backfill: pedidos ya pagados toman su fecha de recepción como fecha de cobro
    db.exec("UPDATE orders SET payment_date = received_date WHERE payment_status = 'paid' AND payment_date IS NULL");
  } catch (e) {
    // Columna ya existe
  }
}

/**
 * Inserta datos por defecto si las tablas están vacías.
 */
function insertDefaults() {
  const serviceCount = db.prepare('SELECT COUNT(*) as count FROM services').get();
  if (serviceCount.count === 0) {
    const insertService = db.prepare(
      'INSERT INTO services (name, price_per_kg, fixed_price, is_per_kg, sort_order) VALUES (?, ?, ?, ?, ?)'
    );
    insertService.run('Lavado por Kilo', 0, 0, 1, 1);
    insertService.run('Lavado y Planchado', 0, 0, 1, 2);
    insertService.run('Lavado en Seco', 0, 0, 0, 3);
    insertService.run('Lavado de Edredones', 0, 0, 0, 4);
  }

  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get();
  if (settingsCount.count === 0) {
    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    insertSetting.run('business_name', '');
    insertSetting.run('business_address', '');
    insertSetting.run('business_phone', '');
    insertSetting.run('receipt_message', 'Gracias por su preferencia');
    insertSetting.run('receipt_footer', '');
  }
}

// ==================== CLIENTES ====================

function getAllClients() {
  return db.prepare(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM orders WHERE client_id = c.id) as order_count
    FROM clients c ORDER BY c.full_name ASC
  `).all();
}

function getClientById(id) {
  return db.prepare(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM orders WHERE client_id = c.id) as order_count
    FROM clients c WHERE c.id = ?
  `).get(id);
}

function searchClients(query) {
  const searchTerm = `%${query}%`;
  return db.prepare(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM orders WHERE client_id = c.id) as order_count
    FROM clients c 
    WHERE c.full_name LIKE ? OR c.phone LIKE ? OR c.document_id LIKE ?
    ORDER BY c.full_name ASC
  `).all(searchTerm, searchTerm, searchTerm);
}

function createClient(data) {
  const result = db.prepare(`
    INSERT INTO clients (full_name, phone, document_id, notes, is_frequent)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.full_name, data.phone || '', data.document_id || '', data.notes || '', data.is_frequent ? 1 : 0);
  return { id: result.lastInsertRowid, ...data };
}

function updateClient(id, data) {
  db.prepare(`
    UPDATE clients SET full_name = ?, phone = ?, document_id = ?, notes = ?, is_frequent = ?,
    updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(data.full_name, data.phone || '', data.document_id || '', data.notes || '', data.is_frequent ? 1 : 0, id);
  return getClientById(id);
}

function deleteClient(id) {
  // Verificar si tiene pedidos asociados
  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders WHERE client_id = ?').get(id);
  if (orderCount.count > 0) {
    throw new Error('No se puede eliminar un cliente con pedidos asociados');
  }
  db.prepare('DELETE FROM clients WHERE id = ?').run(id);
  return true;
}

function getFrequentClients() {
  return db.prepare(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM orders WHERE client_id = c.id) as order_count
    FROM clients c WHERE c.is_frequent = 1 ORDER BY c.full_name ASC
  `).all();
}

// ==================== SERVICIOS ====================

function getAllServices() {
  return db.prepare('SELECT * FROM services ORDER BY sort_order ASC').all();
}

function getActiveServices() {
  return db.prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order ASC').all();
}

function createService(data) {
  const maxOrder = db.prepare('SELECT MAX(sort_order) as max_order FROM services').get();
  const result = db.prepare(`
    INSERT INTO services (name, price_per_kg, fixed_price, is_per_kg, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.name, data.price_per_kg || 0, data.fixed_price || 0, data.is_per_kg ? 1 : 0, (maxOrder.max_order || 0) + 1);
  return { id: result.lastInsertRowid, ...data };
}

function updateService(id, data) {
  db.prepare(`
    UPDATE services SET name = ?, price_per_kg = ?, fixed_price = ?, is_per_kg = ?
    WHERE id = ?
  `).run(data.name, data.price_per_kg || 0, data.fixed_price || 0, data.is_per_kg ? 1 : 0, id);
  return db.prepare('SELECT * FROM services WHERE id = ?').get(id);
}

function toggleServiceActive(id) {
  db.prepare('UPDATE services SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?').run(id);
  return db.prepare('SELECT * FROM services WHERE id = ?').get(id);
}

// ==================== PEDIDOS ====================

function getNextOrderNumber() {
  const last = db.prepare("SELECT order_number FROM orders ORDER BY id DESC LIMIT 1").get();
  if (!last) return 'ORD-0001';
  const num = parseInt(last.order_number.replace('ORD-', '')) + 1;
  return `ORD-${String(num).padStart(4, '0')}`;
}

function getAllOrders(filters = {}) {
  let query = `
    SELECT o.*, c.full_name as client_name, c.phone as client_phone, s.name as service_name
    FROM orders o
    JOIN clients c ON o.client_id = c.id
    JOIN services s ON o.service_id = s.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.status) {
    query += ' AND o.status = ?';
    params.push(filters.status);
  }
  if (filters.dateFrom) {
    query += ' AND DATE(o.received_date) >= ?';
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    query += ' AND DATE(o.received_date) <= ?';
    params.push(filters.dateTo);
  }
  if (filters.clientId) {
    query += ' AND o.client_id = ?';
    params.push(filters.clientId);
  }
  if (filters.search) {
    query += ' AND (c.full_name LIKE ? OR c.phone LIKE ? OR o.order_number LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  query += ' ORDER BY o.id DESC';

  if (filters.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }

  return db.prepare(query).all(...params);
}

function getOrderById(id) {
  return db.prepare(`
    SELECT o.*, c.full_name as client_name, c.phone as client_phone, 
           c.document_id as client_document, s.name as service_name,
           s.is_per_kg as service_is_per_kg
    FROM orders o
    JOIN clients c ON o.client_id = c.id
    JOIN services s ON o.service_id = s.id
    WHERE o.id = ?
  `).get(id);
}

function createOrder(data) {
  const orderNumber = getNextOrderNumber();
  const result = db.prepare(`
    INSERT INTO orders (order_number, client_id, service_id, weight_kg, garment_count,
      garment_detail, garment_observations, special_services, status, base_amount,
      discount, final_amount, estimated_delivery, notes, payment_status, advance_payment, payment_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'received', ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 'paid' THEN datetime('now','localtime') ELSE NULL END)
  `).run(
    orderNumber, data.client_id, data.service_id,
    data.weight_kg || 0, data.garment_count || 0,
    data.garment_detail || '', data.garment_observations || '',
    data.special_services || '', data.base_amount,
    data.discount || 0, data.final_amount,
    data.estimated_delivery || null, data.notes || '',
    data.payment_status || 'pending', data.advance_payment || 0,
    data.payment_status || 'pending'
  );
  return getOrderById(result.lastInsertRowid);
}

function updateOrder(id, data) {
  db.prepare(`
    UPDATE orders SET client_id = ?, service_id = ?, weight_kg = ?, garment_count = ?,
      garment_detail = ?, garment_observations = ?, special_services = ?,
      base_amount = ?, discount = ?, final_amount = ?, estimated_delivery = ?, notes = ?,
      payment_status = ?, advance_payment = ?,
      payment_date = CASE WHEN ? = 'paid' THEN COALESCE(payment_date, datetime('now','localtime')) ELSE payment_date END,
      updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(
    data.client_id, data.service_id, data.weight_kg || 0, data.garment_count || 0,
    data.garment_detail || '', data.garment_observations || '',
    data.special_services || '', data.base_amount, data.discount || 0,
    data.final_amount, data.estimated_delivery || null, data.notes || '',
    data.payment_status || 'pending', data.advance_payment || 0,
    data.payment_status || 'pending', id
  );
  return getOrderById(id);
}

function updateOrderStatus(id, status) {
  const updates = { status };
  let query = "UPDATE orders SET status = ?, updated_at = datetime('now','localtime')";
  const params = [status];

  if (status === 'delivered') {
    query += ", delivered_date = datetime('now','localtime')";
  }

  query += ' WHERE id = ?';
  params.push(id);

  db.prepare(query).run(...params);
  return getOrderById(id);
}

function getOrdersByClient(clientId) {
  return db.prepare(`
    SELECT o.*, s.name as service_name
    FROM orders o
    JOIN services s ON o.service_id = s.id
    WHERE o.client_id = ?
    ORDER BY o.id DESC
  `).all(clientId);
}

function getActiveOrders() {
  return db.prepare(`
    SELECT o.*, c.full_name as client_name, c.phone as client_phone, s.name as service_name
    FROM orders o
    JOIN clients c ON o.client_id = c.id
    JOIN services s ON o.service_id = s.id
    WHERE o.status != 'delivered'
    ORDER BY 
      CASE o.status 
        WHEN 'ready' THEN 1 
        WHEN 'in_progress' THEN 2 
        WHEN 'received' THEN 3 
      END,
      o.id DESC
  `).all();
}

function getTodayOrders() {
  return db.prepare(`
    SELECT o.*, c.full_name as client_name, c.phone as client_phone, s.name as service_name
    FROM orders o
    JOIN clients c ON o.client_id = c.id
    JOIN services s ON o.service_id = s.id
    WHERE DATE(o.received_date) = DATE('now','localtime')
    ORDER BY o.id DESC
  `).all();
}

// ==================== CONFIGURACIÓN ====================

function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function getAllSettings() {
  const rows = db.prepare('SELECT * FROM settings').all();
  const settings = {};
  rows.forEach(r => { settings[r.key] = r.value; });
  return settings;
}

function setSetting(key, value) {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
  return true;
}

function getBulkSettings(keys) {
  const placeholders = keys.map(() => '?').join(',');
  const rows = db.prepare(`SELECT * FROM settings WHERE key IN (${placeholders})`).all(...keys);
  const settings = {};
  rows.forEach(r => { settings[r.key] = r.value; });
  return settings;
}

// ==================== REPORTES ====================

function getDashboardStats() {
  // Fecha local del dispositivo (no UTC), consistente con received_date que se
  // guarda con datetime('now','localtime'). Evita que tras las 19:00 (UTC-5) el
  // dashboard cambie de día y muestre cifras incorrectas.
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const todayReceived = db.prepare(`
    SELECT COUNT(*) as count FROM orders WHERE DATE(received_date) = ? AND status = 'received'
  `).get(today);

  const inProgress = db.prepare(`
    SELECT COUNT(*) as count FROM orders WHERE status = 'in_progress'
  `).get();

  const ready = db.prepare(`
    SELECT COUNT(*) as count FROM orders WHERE status = 'ready'
  `).get();

  const todayDelivered = db.prepare(`
    SELECT COUNT(*) as count FROM orders WHERE DATE(delivered_date) = ? AND status = 'delivered'
  `).get(today);

  const todayIncome = db.prepare(`
    SELECT COALESCE(SUM(
      CASE 
        WHEN payment_status = 'paid' THEN final_amount
        WHEN payment_status = 'partial' THEN advance_payment
        ELSE 0
      END
    ), 0) as total FROM orders 
    WHERE DATE(received_date) = ?
  `).get(today);

  const todayClients = db.prepare(`
    SELECT COUNT(DISTINCT client_id) as count FROM orders WHERE DATE(received_date) = ?
  `).get(today);

  return {
    received: todayReceived.count,
    in_progress: inProgress.count,
    ready: ready.count,
    delivered: todayDelivered.count,
    today_income: todayIncome.total,
    today_clients: todayClients.count
  };
}

// Helpers para elegir la BASE de fecha del reporte: 'reception' (cuándo se
// recibió la ropa; pagado->total, parcial->adelanto) o 'payment' (cuándo se
// cobró por completo; solo cuenta pedidos pagados, en su fecha de cobro).
function _reportDateCol(basis) {
  return basis === 'payment' ? 'payment_date' : 'received_date';
}
function _reportIncomeExpr(basis) {
  if (basis === 'payment') {
    return "CASE WHEN payment_status = 'paid' THEN final_amount ELSE 0 END";
  }
  return "CASE WHEN payment_status = 'paid' THEN final_amount WHEN payment_status = 'partial' THEN advance_payment ELSE 0 END";
}

function _summaryByRange(startDate, endDate, basis) {
  const col = _reportDateCol(basis);
  const inc = _reportIncomeExpr(basis);

  const summary = db.prepare(`
    SELECT COUNT(*) as total_orders, COUNT(DISTINCT client_id) as unique_clients,
           COALESCE(SUM(${inc}), 0) as total_income
    FROM orders WHERE DATE(${col}) BETWEEN ? AND ?
  `).get(startDate, endDate);

  const income_by_date = db.prepare(`
    SELECT DATE(${col}) as date, COUNT(*) as total_orders,
           COALESCE(SUM(${inc}), 0) as total
    FROM orders WHERE DATE(${col}) BETWEEN ? AND ?
    GROUP BY DATE(${col}) ORDER BY date ASC
  `).all(startDate, endDate);

  const services_breakdown = db.prepare(`
    SELECT s.name as service_name, COUNT(*) as order_count,
           COALESCE(SUM(${inc}), 0) as total_amount
    FROM orders o JOIN services s ON o.service_id = s.id
    WHERE DATE(o.${col}) BETWEEN ? AND ?
    GROUP BY s.id ORDER BY total_amount DESC
  `).all(startDate, endDate);

  return {
    total_income: summary.total_income,
    total_orders: summary.total_orders,
    unique_clients: summary.unique_clients,
    income_by_date,
    services_breakdown
  };
}

function getDailySummary(date, basis = 'reception') {
  const res = _summaryByRange(date, date, basis);
  // Para el día, asegurar una sola barra en el gráfico aunque no haya pedidos.
  res.income_by_date = [{ date, total_orders: res.total_orders, total: res.total_income }];
  return res;
}

function _pad2(n) { return String(n).padStart(2, '0'); }
function _localStr(d) { return `${d.getFullYear()}-${_pad2(d.getMonth() + 1)}-${_pad2(d.getDate())}`; }
const _MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Total de ingresos (según base) en un rango [from, to].
function _incomeForRange(from, to, basis) {
  const col = _reportDateCol(basis);
  const inc = _reportIncomeExpr(basis);
  const r = db.prepare(`SELECT COALESCE(SUM(${inc}), 0) as total, COUNT(*) as cnt FROM orders WHERE DATE(${col}) BETWEEN ? AND ?`).get(from, to);
  return { total: r.total, total_orders: r.cnt };
}

function getWeeklySummary(startDate, endDate, basis = 'reception') {
  // Resumen (totales/servicios) de la semana seleccionada.
  const base = _summaryByRange(startDate, endDate, basis);
  // Gráfico: tendencia de 5 semanas (4 anteriores + la actual).
  const s = new Date(startDate + 'T00:00:00');
  const e = new Date(endDate + 'T00:00:00');
  const buckets = [];
  for (let k = 4; k >= 0; k--) {
    const ws = new Date(s); ws.setDate(ws.getDate() - 7 * k);
    const we = new Date(e); we.setDate(we.getDate() - 7 * k);
    const r = _incomeForRange(_localStr(ws), _localStr(we), basis);
    buckets.push({ date: _localStr(ws), label: `${_pad2(ws.getDate())}/${_pad2(ws.getMonth() + 1)}`, total: r.total, total_orders: r.total_orders });
  }
  base.income_by_date = buckets;
  return base;
}

function getMonthlySummary(year, month, basis = 'reception') {
  const y = parseInt(year), m = parseInt(month);
  const startDate = `${year}-${_pad2(m)}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const endDate = `${year}-${_pad2(m)}-${_pad2(lastDay)}`;
  // Resumen (totales/servicios) del mes seleccionado.
  const base = _summaryByRange(startDate, endDate, basis);
  // Gráfico: tendencia de 5 meses (4 anteriores + el actual).
  const buckets = [];
  for (let k = 4; k >= 0; k--) {
    const d = new Date(y, m - 1 - k, 1);
    const by = d.getFullYear(), bm = d.getMonth() + 1;
    const from = `${by}-${_pad2(bm)}-01`;
    const ld = new Date(by, bm, 0).getDate();
    const to = `${by}-${_pad2(bm)}-${_pad2(ld)}`;
    const r = _incomeForRange(from, to, basis);
    buckets.push({ date: from, label: `${_MESES[bm - 1]} ${String(by).slice(2)}`, total: r.total, total_orders: r.total_orders });
  }
  base.income_by_date = buckets;
  return base;
}

function getIncomeByDateRange(startDate, endDate) {
  return db.prepare(`
    SELECT 
      DATE(received_date) as date,
      COUNT(*) as total_orders,
      COALESCE(SUM(
        CASE 
          WHEN payment_status = 'paid' THEN final_amount
          WHEN payment_status = 'partial' THEN advance_payment
          ELSE 0
        END
      ), 0) as total_income,
      COALESCE(SUM(discount), 0) as total_discounts
    FROM orders 
    WHERE DATE(received_date) BETWEEN ? AND ?
    GROUP BY DATE(received_date)
    ORDER BY date ASC
  `).all(startDate, endDate);
}

// ==================== LICENCIA ====================

function getLicense() {
  return db.prepare('SELECT * FROM license WHERE id = 1').get();
}

function saveLicense(code, machineId) {
  db.prepare(`
    INSERT OR REPLACE INTO license (id, code, machine_id, activated_at, last_validated, status)
    VALUES (1, ?, ?, datetime('now','localtime'), datetime('now','localtime'), 'active')
  `).run(code, machineId);
  return getLicense();
}

function updateLicenseValidation() {
  db.prepare("UPDATE license SET last_validated = datetime('now','localtime') WHERE id = 1").run();
}

function updateLicenseStatus(status) {
  db.prepare('UPDATE license SET status = ? WHERE id = 1').run(status);
}

function getDatabase() {
  return db;
}

function clearOldOrders() {
  const result = db.prepare("DELETE FROM orders WHERE status = 'delivered'").run();
  return result.changes;
}

/**
 * Elimina un pedido por su id. Se usa cuando el pedido fue registrado por error;
 * al borrarlo deja de contar en reportes, dashboard e ingresos.
 */
function deleteOrder(id) {
  const result = db.prepare('DELETE FROM orders WHERE id = ?').run(id);
  return result.changes > 0;
}

/**
 * Vacía el historial: borra pedidos ENTREGADOS (nunca los que siguen activos en
 * servicio). Si se pasa { from, to } limita el borrado a ese rango de fechas de
 * recepción; sin rango, borra todos los entregados.
 */
function clearOrders(filters = {}) {
  let query = "DELETE FROM orders WHERE status = 'delivered'";
  const params = [];
  if (filters.from) { query += " AND DATE(received_date) >= ?"; params.push(filters.from); }
  if (filters.to) { query += " AND DATE(received_date) <= ?"; params.push(filters.to); }
  const result = db.prepare(query).run(...params);
  return result.changes;
}

module.exports = {
  initDatabase, getDatabase,
  // Clientes
  getAllClients, getClientById, searchClients, createClient, updateClient, deleteClient, getFrequentClients,
  // Servicios
  getAllServices, getActiveServices, createService, updateService, toggleServiceActive,
  // Pedidos
  getNextOrderNumber, getAllOrders, getOrderById, createOrder, updateOrder, updateOrderStatus,
  getOrdersByClient, getActiveOrders, getTodayOrders, clearOldOrders, deleteOrder, clearOrders,
  // Configuración
  getSetting, getAllSettings, setSetting, getBulkSettings,
  // Reportes
  getDashboardStats, getDailySummary, getWeeklySummary, getMonthlySummary, getIncomeByDateRange,
  // Licencia
  getLicense, saveLicense, updateLicenseValidation, updateLicenseStatus
};
