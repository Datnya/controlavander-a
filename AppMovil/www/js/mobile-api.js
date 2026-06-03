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
            order.client = await db.clients.get(order.client_id);
            order.service = await db.services.get(order.service_id);
            return order;
        }),
        create: (data) => wrap(async () => {
            const id = await db.orders.add({ 
                ...data, 
                created_at: getNow(), 
                updated_at: getNow() 
            });
            return id;
        }),
        update: (id, data) => wrap(() => db.orders.update(id, { ...data, updated_at: getNow() })),
        updateStatus: (id, status) => wrap(async () => {
            const updateData = { status, updated_at: getNow() };
            if (status === 'delivered') updateData.delivered_date = getNow();
            return db.orders.update(id, updateData);
        }),
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
                service_name: servicesMap.get(o.service_id)?.name || 'Desconocido'
            }));
        }),
        getToday: () => wrap(async () => {
            const today = new Date().toISOString().split('T')[0];
            const orders = await db.orders.filter(o => o.received_date && o.received_date.startsWith(today)).toArray();
            return orders;
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
        getDashboardStats: () => wrap(async () => {
            const today = new Date().toISOString().split('T')[0];
            const allOrders = await db.orders.toArray();
            const todayOrders = allOrders.filter(o => o.received_date && o.received_date.startsWith(today));
            const activeOrders = allOrders.filter(o => o.status !== 'delivered');
            const deliveredToday = allOrders.filter(o => o.status === 'delivered' && o.delivered_date && o.delivered_date.startsWith(today));
            
            const income = allOrders
                .filter(o => o.status === 'delivered' && o.delivered_date && o.delivered_date.startsWith(today))
                .reduce((sum, o) => sum + (Number(o.final_amount) || 0), 0);
                
            return {
                today_orders: todayOrders.length,
                active_orders: activeOrders.length,
                today_income: income,
                delivered_today: deliveredToday.length
            };
        }),
        getDailySummary: (date) => wrap(async () => {
            const allOrders = await db.orders.toArray();
            const orders = allOrders.filter(o => o.received_date && o.received_date.startsWith(date));
            const count = orders.length;
            const income = orders.reduce((sum, o) => sum + (Number(o.final_amount) || 0), 0);
            return { date, count, income };
        }),
        getIncomeByDateRange: (start, end) => wrap(async () => {
            const allOrders = await db.orders.toArray();
            const orders = allOrders.filter(o => {
                if (!o.received_date) return false;
                const d = o.received_date.split('T')[0];
                return d >= start && d <= end;
            });
            const income = orders.reduce((sum, o) => sum + (Number(o.final_amount) || 0), 0);
            return { income, count: orders.length };
        }),
        getMonthlySummary: (year, month) => wrap(async () => {
            const prefix = `${year}-${String(month).padStart(2, '0')}`;
            const allOrders = await db.orders.toArray();
            const orders = allOrders.filter(o => o.received_date && o.received_date.startsWith(prefix));
            const income = orders.reduce((sum, o) => sum + (Number(o.final_amount) || 0), 0);
            return { month: prefix, count: orders.length, income };
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
                
                // Si la licencia tiene otro device_id que no sea este o vacío, fallar (simplificado para offline web)
                if (lic.activated_device && lic.activated_device !== "" && lic.activated_device !== deviceId) {
                    throw new Error("La licencia ya está en uso en otro dispositivo");
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
                        if (!onlineLic || onlineLic.status !== 'active') {
                            await db.license.update(1, { status: 'suspended' });
                            return { valid: false, reason: 'suspended' };
                        }
                        await db.license.update(1, { last_validated: getNow() });
                        return { valid: true };
                    }
                } catch (e) {
                    return { valid: false, reason: 'no-internet' };
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
        isMaximized: () => wrap(() => true)
    }
};

console.log("Lavanderia Mobile API Initialized.");
