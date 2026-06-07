// mobile-api.js - Implementación de la base de datos local (IndexedDB) para la versión móvil
// Reemplaza a preload.js y database.js de la versión PC

// Inicializar Dexie (Base de datos local)
const db = new Dexie("LavanderiaDB");
db.version(1).stores({
    clients: '++id, full_name, phone, document_id, is_frequent, created_at',
    services: '++id, name, is_active, sort_order',
    orders: '++id, order_number, client_id, service_id, status, received_date, delivered_date, created_at',
    settings: 'key',
    license: 'id'
});

// Inicializar datos por defecto
db.on('populate', () => {
    db.services.bulkAdd([
        { name: 'Lavado por Kilo', price_per_kg: 0, fixed_price: 0, is_per_kg: 1, is_active: 1, sort_order: 1 },
        { name: 'Lavado y Planchado', price_per_kg: 0, fixed_price: 0, is_per_kg: 1, is_active: 1, sort_order: 2 },
        { name: 'Lavado en Seco', price_per_kg: 0, fixed_price: 0, is_per_kg: 0, is_active: 1, sort_order: 3 },
        { name: 'Lavado de Edredones', price_per_kg: 0, fixed_price: 0, is_per_kg: 0, is_active: 1, sort_order: 4 }
    ]);
    db.settings.bulkAdd([
        { key: 'business_name', value: '' },
        { key: 'business_address', value: '' },
        { key: 'business_phone', value: '' },
        { key: 'receipt_message', value: 'Gracias por su preferencia' },
        { key: 'receipt_footer', value: '' }
    ]);
});

// Utilidad para obtener fechas
const getNow = () => new Date().toISOString();
const getLocalString = (dateString) => {
    const d = dateString ? new Date(dateString) : new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
};

// Wrapper para simular el comportamiento de IPC (async y retorna {success, data} o {success, error})
const wrap = async (fn) => {
    try {
        const data = await fn();
        return { success: true, data };
    } catch (error) {
        console.error("API Error:", error);
        return { success: false, error: error.message };
    }
};

window.api = {
    clients: {
        getAll: () => wrap(() => db.clients.toArray()),
        getById: (id) => wrap(() => db.clients.get(id)),
        search: (query) => wrap(() => {
            if (!query) return db.clients.toArray();
            const q = query.toLowerCase();
            return db.clients.filter(c => 
                (c.full_name && c.full_name.toLowerCase().includes(q)) || 
                (c.phone && c.phone.includes(q))
            ).toArray();
        }),
        create: (data) => wrap(async () => {
            const id = await db.clients.add({ ...data, is_frequent: 0, created_at: getNow(), updated_at: getNow() });
            return id;
        }),
        update: (id, data) => wrap(() => db.clients.update(id, { ...data, updated_at: getNow() })),
        delete: (id) => wrap(() => db.clients.delete(id)),
        getFrequent: () => wrap(() => db.clients.where('is_frequent').equals(1).toArray())
    },
    
    orders: {
        getAll: (filters = {}) => wrap(async () => {
            let query = db.orders.orderBy('id').reverse();
            if (filters.status && filters.status !== 'all') {
                query = db.orders.where('status').equals(filters.status).reverse();
            }
            let orders = await query.toArray();
            
            // Llenar datos de cliente y servicio (JOIN manual)
            const clientsMap = new Map((await db.clients.toArray()).map(c => [c.id, c]));
            const servicesMap = new Map((await db.services.toArray()).map(s => [s.id, s]));
            
            orders = orders.map(o => ({
                ...o,
                client_name: clientsMap.get(o.client_id)?.full_name || 'Desconocido',
                client_phone: clientsMap.get(o.client_id)?.phone || '',
                service_name: servicesMap.get(o.service_id)?.name || 'Desconocido'
            }));

            if (filters.payment === 'pending_or_partial') {
                orders = orders.filter(o => o.payment_status === 'pending' || o.payment_status === 'partial' || !o.payment_status);
            }

            if (filters.dateFrom || filters.dateTo) {
                orders = orders.filter(o => {
                    if (!o.received_date) return false;
                    const d = o.received_date.split('T')[0];
                    if (filters.dateFrom && d < filters.dateFrom) return false;
                    if (filters.dateTo && d > filters.dateTo) return false;
                    return true;
                });
            }

            if (filters.search) {
                const q = filters.search.toLowerCase();
                orders = orders.filter(o => 
                    (o.order_number && o.order_number.toLowerCase().includes(q)) || 
                    (o.client_name && o.client_name.toLowerCase().includes(q))
                );
            }
            return orders;
        }),
        getById: (id) => wrap(async () => {
            const order = await db.orders.get(id);
            if (!order) throw new Error("Order not found");
            const client = await db.clients.get(order.client_id);
            const service = await db.services.get(order.service_id);
            order.client_name = client ? client.full_name : 'Desconocido';
            order.client_phone = client ? client.phone : '';
            order.client_doc = client ? client.document_id : '';
            order.service_name = service ? service.name : 'Desconocido';
            return order;
        }),
        create: (data) => wrap(async () => {
            const rec = { ...data, created_at: getNow(), updated_at: getNow() };
            // Fecha de cobro completo (para reportes por fecha de pago)
            if (data.payment_status === 'paid' && !rec.payment_date) rec.payment_date = getNow();
            const id = await db.orders.add(rec);
            return id;
        }),
        update: (id, data) => wrap(() => {
            const patch = { ...data, updated_at: getNow() };
            if (data.payment_status === 'paid' && !patch.payment_date) patch.payment_date = getNow();
            return db.orders.update(id, patch);
        }),
        updateStatus: (id, status) => wrap(async () => {
            const updateData = { status, updated_at: getNow() };
            if (status === 'delivered') updateData.delivered_date = getNow();
            return db.orders.update(id, updateData);
        }),
        delete: (id) => wrap(() => db.orders.delete(id)),
        getByClient: (clientId) => wrap(() => db.orders.where('client_id').equals(clientId).reverse().toArray()),
        getNextNumber: () => wrap(async () => {
            const last = await db.orders.orderBy('id').last();
            const nextId = last ? last.id + 1 : 1;
            return `ORD-${String(nextId).padStart(4, '0')}`;
        }),
        getActive: () => wrap(async () => {
            const orders = await db.orders.filter(o => o.status !== 'delivered').toArray();
            const clientsMap = new Map((await db.clients.toArray()).map(c => [c.id, c]));
            const servicesMap = new Map((await db.services.toArray()).map(s => [s.id, s]));
            return orders.map(o => ({
                ...o,
                client_name: clientsMap.get(o.client_id)?.full_name || 'Desconocido',
                client_phone: clientsMap.get(o.client_id)?.phone || '',
                service_name: servicesMap.get(o.service_id)?.name || 'Desconocido'
            }));
        }),
        getToday: () => wrap(async () => {
            const today = getLocalString();
            const orders = await db.orders.filter(o => o.received_date && getLocalString(o.received_date) === today).toArray();
            const clientsMap = new Map((await db.clients.toArray()).map(c => [c.id, c]));
            const servicesMap = new Map((await db.services.toArray()).map(s => [s.id, s]));
            return orders.map(o => ({
                ...o,
                client_name: clientsMap.get(o.client_id)?.full_name || 'Desconocido',
                service_name: servicesMap.get(o.service_id)?.name || 'Desconocido'
            }));
        })
    },

    services: {
        getAll: () => wrap(() => db.services.orderBy('sort_order').toArray()),
        getActive: () => wrap(() => db.services.where('is_active').equals(1).sortBy('sort_order')),
        create: (data) => wrap(() => db.services.add(data)),
        update: (id, data) => wrap(() => db.services.update(id, data)),
        toggleActive: (id) => wrap(async () => {
            const service = await db.services.get(id);
            return db.services.update(id, { is_active: service.is_active ? 0 : 1 });
        })
    },

    settings: {
        get: (key) => wrap(async () => {
            const s = await db.settings.get(key);
            return s ? s.value : null;
        }),
        getAll: () => wrap(async () => {
            const all = await db.settings.toArray();
            const res = {};
            all.forEach(s => res[s.key] = s.value);
            return res;
        }),
        set: (key, value) => wrap(() => db.settings.put({ key, value })),
        getBulk: (keys) => wrap(async () => {
            const all = await db.settings.where('key').anyOf(keys).toArray();
            const res = {};
            all.forEach(s => res[s.key] = s.value);
            return res;
        })
    },

    reports: {
        _generateReportSummary: async (isDateInRange, basis) => {
            const allOrders = await db.orders.toArray();
            const services = await db.services.toArray();
            const servicesDict = Object.fromEntries(services.map(s => [s.id, s.name]));

            // basis 'payment' -> por fecha de cobro (solo pagados, monto total).
            // basis 'reception' (por defecto) -> por fecha de recepción
            //   (pagado -> total; parcial -> adelanto; pendiente -> 0).
            const dateFieldOf = (o) => basis === 'payment' ? o.payment_date : o.received_date;
            const incomeOf = (o) => {
                if (basis === 'payment') return o.payment_status === 'paid' ? (parseFloat(o.final_amount) || 0) : 0;
                if (o.payment_status === 'paid') return parseFloat(o.final_amount) || 0;
                if (o.payment_status === 'partial') return parseFloat(o.advance_payment) || 0;
                return 0;
            };

            let total_income = 0;
            let total_orders = 0;
            const clientsSet = new Set();
            const incomeByDate = {};   // fecha -> { total, total_orders }
            const serviceMap = {};     // service_id -> { revenue, count }

            allOrders.forEach(o => {
                const df = dateFieldOf(o);
                if (!df) return;
                const date = getLocalString(df);
                if (!isDateInRange(date)) return;

                const income = incomeOf(o);
                total_income += income;
                total_orders += 1;
                if (o.client_id != null) clientsSet.add(o.client_id);

                if (!incomeByDate[date]) incomeByDate[date] = { total: 0, total_orders: 0 };
                incomeByDate[date].total += income;
                incomeByDate[date].total_orders += 1;

                if (!serviceMap[o.service_id]) serviceMap[o.service_id] = { revenue: 0, count: 0 };
                serviceMap[o.service_id].revenue += income;
                serviceMap[o.service_id].count += 1;
            });

            return {
                total_income,
                total_orders,
                unique_clients: clientsSet.size,
                income_by_date: Object.entries(incomeByDate)
                    .map(([date, v]) => ({ date, total: v.total, total_orders: v.total_orders }))
                    .sort((a, b) => a.date.localeCompare(b.date)),
                services_breakdown: Object.entries(serviceMap)
                    .map(([id, v]) => ({ service_name: servicesDict[id] || 'Desconocido', total_amount: v.revenue, order_count: v.count }))
                    .sort((a, b) => b.total_amount - a.total_amount)
            };
        },
        getDashboardStats: () => wrap(async () => {
            const today = getLocalString();
            const allOrders = await db.orders.toArray();
            
            const todayOrders = allOrders.filter(o => o.received_date && getLocalString(o.received_date) === today);
            const activeOrders = allOrders.filter(o => o.status !== 'delivered');
            const deliveredToday = allOrders.filter(o => o.delivered_date && getLocalString(o.delivered_date) === today);
            
            // Ingreso de hoy por fecha de recepción (mismo criterio que Reportes y
            // que la versión PC): pagado -> total; parcial -> adelanto; pendiente -> 0.
            // Antes se usaba created_at/updated_at, lo que inflaba el ingreso del día
            // con solo cambiar el estado de un pedido viejo ya pagado.
            let income = 0;
            todayOrders.forEach(o => {
                if (o.payment_status === 'paid') income += parseFloat(o.final_amount) || 0;
                else if (o.payment_status === 'partial') income += parseFloat(o.advance_payment) || 0;
            });

            return {
                today_clients: new Set(todayOrders.map(o => o.client_id)).size,
                received: todayOrders.length,
                in_progress: activeOrders.filter(o => o.status === 'in_progress').length,
                ready: activeOrders.filter(o => o.status === 'ready').length,
                today_orders: todayOrders.length,
                active_orders: activeOrders.length,
                today_income: income,
                delivered_today: deliveredToday.length
            };
        }),
        getDailySummary: (date, basis) => wrap(async () => {
            return await window.api.reports._generateReportSummary(d => d === date, basis);
        }),
        getWeeklySummary: (start, end, basis) => wrap(async () => {
            return await window.api.reports._generateReportSummary(d => d >= start && d <= end, basis);
        }),
        getMonthlySummary: (year, month, basis) => wrap(async () => {
            const prefix = `${year}-${String(month).padStart(2, '0')}`;
            return await window.api.reports._generateReportSummary(d => d.startsWith(prefix), basis);
        }),
        getIncomeByDateRange: (start, end, basis) => wrap(async () => {
            return await window.api.reports._generateReportSummary(d => d >= start && d <= end, basis);
        }),
        exportCSV: async (csvData, filename) => wrap(async () => {
            try {
                const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return { success: true };
            } catch (e) {
                console.error('Export error', e);
                throw new Error("No se pudo exportar el archivo");
            }
        }),
        clearOld: () => wrap(async () => {
            // Eliminar solo si están entregados y su pago está cancelado
            const oldOrders = await db.orders.filter(o => o.status === 'delivered' && o.payment_status === 'paid').toArray();
            if (oldOrders.length > 0) {
                const ids = oldOrders.map(o => o.id);
                await db.orders.bulkDelete(ids);
            }
            return { count: oldOrders.length };
        }),
        // Vacía el historial: borra pedidos ENTREGADOS (nunca los activos en
        // servicio). Con { from, to } limita por fecha de recepción; sin rango,
        // borra todos los entregados.
        clearOrders: (filters = {}) => wrap(async () => {
            const toDelete = await db.orders.filter(o => {
                if (o.status !== 'delivered') return false;
                if (filters.from || filters.to) {
                    const d = o.received_date ? o.received_date.split('T')[0] : '';
                    if (filters.from && d < filters.from) return false;
                    if (filters.to && d > filters.to) return false;
                }
                return true;
            }).toArray();
            const ids = toDelete.map(o => o.id);
            if (ids.length) await db.orders.bulkDelete(ids);
            return { count: ids.length };
        })
    },

    license: {
        activate: (code) => wrap(async () => {
            // Generar o recuperar device id falso (o usar plugin si está disponible)
            let deviceId = localStorage.getItem('lavanderia_device_id');
            if (!deviceId) {
                deviceId = 'MOB-' + Math.random().toString(36).substr(2, 9).toUpperCase();
                localStorage.setItem('lavanderia_device_id', deviceId);
            }
            
            try {
                const res = await fetch('https://raw.githubusercontent.com/Datnya/controlavander-a/main/licenses.json?t=' + Date.now());
                if (!res.ok) throw new Error("No se pudo conectar al servidor");
                const json = await res.json();
                
                const lic = json.licenses.find(l => l.code === code);
                if (!lic) throw new Error("Código de licencia inválido");
                if (lic.status !== 'active') throw new Error("Esta licencia ha sido suspendida");
                
                // Seguridad Estricta: La licencia debe tener este deviceId específico.
                if (!lic.activated_device || lic.activated_device !== deviceId) {
                    throw new Error("Esta licencia no está asignada a este dispositivo. Comunícate con el administrador.");
                }
                
                // Guardar en local
                await db.license.put({
                    id: 1,
                    code: code,
                    machine_id: deviceId,
                    activated_at: getNow(),
                    last_validated: getNow(),
                    status: 'active'
                });
                
                return { success: true };
            } catch (err) {
                throw new Error(err.message || "Error al verificar la licencia");
            }
        }),
        getStatus: () => wrap(async () => {
            const lic = await db.license.get(1);
            if (!lic) return { valid: false, reason: 'no-license' };
            
            // Validar si pasaron 7 horas
            const lastVal = new Date(lic.last_validated).getTime();
            const now = Date.now();
            if (now - lastVal > 7 * 60 * 60 * 1000) {
                // Forzar revalidación online
                try {
                    const res = await fetch('https://raw.githubusercontent.com/Datnya/controlavander-a/main/licenses.json?t=' + now);
                    if (res.ok) {
                        const json = await res.json();
                        const onlineLic = json.licenses.find(l => l.code === lic.code);
                        const deviceId = localStorage.getItem('lavanderia_device_id');
                        if (!onlineLic || onlineLic.status !== 'active' || onlineLic.activated_device !== deviceId) {
                            await db.license.update(1, { status: 'suspended' });
                            return { valid: false, reason: 'suspended' };
                        }
                        await db.license.update(1, { last_validated: getNow() });
                        return { valid: true };
                    }
                    // El servidor respondió no-OK (ej. límite de tasa): gracia offline.
                    return { valid: lic.status === 'active', reason: lic.status === 'active' ? '' : 'suspended' };
                } catch (e) {
                    // Sin internet: GRACIA. No se bloquea a un cliente con licencia
                    // local activa solo por no tener conexión (igual que en PC).
                    return { valid: lic.status === 'active', reason: lic.status === 'active' ? '' : 'no-internet' };
                }
            }

            return { valid: lic.status === 'active', reason: lic.status === 'active' ? '' : 'suspended' };
        }),
        validate: () => window.api.license.getStatus(),
        getInfo: () => wrap(() => db.license.get(1))
    },

    receipt: {
        copyToClipboard: (dataUrl) => wrap(async () => {
            // En móvil/web, copiar imagen al portapapeles es diferente.
            // Usaremos la API nativa de portapapeles si está disponible.
            try {
                const response = await fetch(dataUrl);
                const blob = await response.blob();
                await navigator.clipboard.write([
                    new ClipboardItem({ [blob.type]: blob })
                ]);
                return true;
            } catch (e) {
                console.error("No se pudo copiar la imagen en móvil", e);
                throw new Error("No soportado en este dispositivo");
            }
        }),
        getOrderForReceipt: (orderId) => wrap(async () => {
            const order = await window.api.orders.getById(orderId);
            const settings = await window.api.settings.getAll();
            return { order: order.data, settings: settings.data };
        })
    },

    app: {
        getVersion: () => wrap(() => "1.0.0-Mobile"),
        quit: () => wrap(() => {
            if (window.Capacitor && window.Capacitor.Plugins.App) {
                window.Capacitor.Plugins.App.exitApp();
            } else {
                console.log("Quit app not supported in browser");
            }
        }),
        minimize: () => wrap(() => { /* No-op in mobile */ }),
        maximize: () => wrap(() => { /* No-op in mobile */ }),
        isMaximized: () => wrap(() => true),
        relaunch: () => wrap(() => { window.location.reload(); }),
        close: () => wrap(() => {
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
                window.Capacitor.Plugins.App.exitApp();
            }
        })
    }
};

console.log("Lavanderia Mobile API Initialized.");
