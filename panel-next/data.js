const STORAGE_KEY = 'panel-next-orders-v3';
const MENU_STORAGE_KEY = 'panel-next-menu-v1';
const INVENTORY_STORAGE_KEY = 'panel-next-inventory-v2';

const todayISO = () => new Date().toISOString().slice(0, 10);

function seedOrders() {
  const today = todayISO();
  return [
    {
      id:'P-1002', customer:'María', phone:'210-555-0118', address:'Fredericksburg Rd', zip:'78201',
      source:'WhatsApp', date:today, time:'13:00', payment:'Al recibir', paymentStatus:'pending', notes:'',
      status:'pending', createdAt:Date.now()-600000,
      items:[{ name:'Producto del menú', qty:1, unit:'orden', price:null }], total:null
    },
    {
      id:'P-1001', customer:'Carlos', phone:'210-555-0145', address:'Medical Dr', zip:'78229',
      source:'Facebook', date:today, time:'13:30', payment:'Zelle', paymentStatus:'paid', notes:'',
      status:'ready', createdAt:Date.now()-1100000,
      items:[{ name:'Producto del menú', qty:2, unit:'pieza', price:null }], total:null
    }
  ];
}

function notify(name, detail = {}) {
  if (typeof window === 'undefined' || typeof CustomEvent === 'undefined') return;
  window.dispatchEvent(new CustomEvent(name,{ detail }));
}

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(orders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  return orders;
}

function readMenu() {
  try {
    const raw = localStorage.getItem(MENU_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeMenu(items) {
  localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(items));
  return items;
}

function inventorySeedItem({ id, name, unit, category='Ingrediente', qty=0, minimum=0, purchaseUnit=null, contentQty=1, contentUnit=null, purchasePrice=0, updatedAt=Date.now() }) {
  return {
    id, name, category, qty, unit, minimum,
    purchaseUnit:purchaseUnit || unit,
    contentQty,
    contentUnit:contentUnit || unit,
    purchasePrice,
    updatedAt
  };
}

function seedInventory() {
  return [
    inventorySeedItem({ id:'I-1004', name:'Filete de pescado', unit:'lb', purchaseUnit:'lb', contentQty:1, contentUnit:'lb' }),
    inventorySeedItem({ id:'I-1003', name:'Camarón', unit:'oz', purchaseUnit:'bolsa', contentQty:12, contentUnit:'oz' }),
    inventorySeedItem({ id:'I-1002', name:'Tomate', unit:'lb', purchaseUnit:'lb', contentQty:1, contentUnit:'lb' }),
    inventorySeedItem({ id:'I-1001', name:'Contenedores', category:'Empaque', unit:'pieza', purchaseUnit:'paquete', contentQty:25, contentUnit:'pieza' }),
    inventorySeedItem({ id:'I-1005', name:'Pepino', unit:'lb' }),
    inventorySeedItem({ id:'I-1006', name:'Cebolla morada', unit:'lb' }),
    inventorySeedItem({ id:'I-1007', name:'Cilantro', unit:'oz' }),
    inventorySeedItem({ id:'I-1008', name:'Jugo de limón', unit:'fl oz' }),
    inventorySeedItem({ id:'I-1009', name:'Clamato', unit:'fl oz' }),
    inventorySeedItem({ id:'I-1010', name:'Pulpo', unit:'lb' }),
    inventorySeedItem({ id:'I-1011', name:'Salsa catsup', unit:'ml' }),
    inventorySeedItem({ id:'I-1012', name:'Puré de tomate', unit:'ml' }),
    inventorySeedItem({ id:'I-1013', name:'Salsa inglesa', unit:'ml' }),
    inventorySeedItem({ id:'I-1014', name:'Salsa Maggi', unit:'ml' }),
    inventorySeedItem({ id:'I-1015', name:'Pimienta', unit:'pizca' })
  ];
}

function normalizeInventoryItem(item) {
  const unit = item.unit || item.contentUnit || 'pieza';
  const contentQty = Number(item.contentQty || 1);
  const purchasePrice = item.purchasePrice === '' || item.purchasePrice === null || item.purchasePrice === undefined
    ? (Number(item.cost || 0) * contentQty)
    : Number(item.purchasePrice || 0);
  return {
    ...item,
    unit,
    purchaseUnit:item.purchaseUnit || unit,
    contentQty:contentQty > 0 ? contentQty : 1,
    contentUnit:item.contentUnit || unit,
    purchasePrice:Number.isFinite(purchasePrice) ? purchasePrice : 0
  };
}

function inventoryNameKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .trim()
    .toLowerCase();
}

function mergeMissingInventory(items) {
  const current = Array.isArray(items) ? items.map(normalizeInventoryItem) : [];
  const names = new Set(current.map(item => inventoryNameKey(item.name)));
  const missing = seedInventory()
    .map(normalizeInventoryItem)
    .filter(item => !names.has(inventoryNameKey(item.name)));
  if (!missing.length) return current;
  const merged = [...current, ...missing];
  localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

function readInventory() {
  try {
    const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (!raw) {
      const seeded = seedInventory();
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return mergeMissingInventory(JSON.parse(raw));
  } catch {
    return seedInventory();
  }
}

function writeInventory(items) {
  const normalized = items.map(normalizeInventoryItem);
  localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export const OrdersStore = {
  list() { return read().sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0)); },
  create(order) {
    const orders = read();
    const nextNumber = orders.reduce((max, item) => Math.max(max, Number(String(item.id || '').replace(/\D/g,'')) || 0), 1000) + 1;
    const created = { ...order, id:`P-${nextNumber}`, createdAt:Date.now(), status:'pending', cloud:false };
    orders.unshift(created);
    write(orders);
    notify('panel:orders-changed',{ source:'local-create', order:created });
    return created;
  },
  update(id, patch) {
    const orders = read();
    const index = orders.findIndex(order => order.id === id);
    if (index < 0) return null;
    orders[index] = { ...orders[index], ...patch, updatedAt:Date.now() };
    write(orders);
    const updated = orders[index];
    notify('panel:order-updated',{ source:'local-update', order:updated, patch:{ ...patch } });
    notify('panel:orders-changed',{ source:'local-update', order:updated });
    return updated;
  },
  get(id) { return read().find(order => order.id === id) || null; },
  syncExternal(remoteOrders = []) {
    const current = read();
    const currentById = new Map(current.map(order => [order.id,order]));
    const localOnly = current.filter(order => !order.cloud);
    const cloud = remoteOrders.map(order => ({
      ...(currentById.get(order.id) || {}),
      ...order,
      cloud:true,
      syncedAt:Date.now()
    }));
    const merged = [...localOnly,...cloud];
    write(merged);
    notify('panel:orders-changed',{ source:'firebase-sync', count:cloud.length });
    return merged;
  },
  resetDemo() {
    const rows = write(seedOrders());
    notify('panel:orders-changed',{ source:'demo-reset' });
    return rows;
  }
};

export const MenuStore = {
  list() { return readMenu(); },
  save(items) { return writeMenu(Array.isArray(items) ? items : []); }
};

export const InventoryStore = {
  list() { return readInventory().sort((a,b) => String(a.name || '').localeCompare(String(b.name || ''), 'es')); },
  get(id) { return readInventory().find(item => item.id === id) || null; },
  create(item) {
    const items = readInventory();
    const nextNumber = items.reduce((max, row) => Math.max(max, Number(String(row.id || '').replace(/\D/g,'')) || 0), 1000) + 1;
    const created = normalizeInventoryItem({ ...item, id:`I-${nextNumber}`, createdAt:Date.now(), updatedAt:Date.now() });
    items.push(created);
    writeInventory(items);
    return created;
  },
  update(id, patch) {
    const items = readInventory();
    const index = items.findIndex(item => item.id === id);
    if (index < 0) return null;
    items[index] = normalizeInventoryItem({ ...items[index], ...patch, updatedAt:Date.now() });
    writeInventory(items);
    return items[index];
  },
  adjust(id, qty) {
    const number = Number(qty);
    if (!Number.isFinite(number) || number < 0) return null;
    return this.update(id,{ qty:number });
  },
  unitCost(item) {
    const row = normalizeInventoryItem(item || {});
    if (row.contentUnit === row.unit && row.contentQty > 0) return row.purchasePrice / row.contentQty;
    return Number(item?.cost || 0);
  },
  low() {
    return readInventory().filter(item => {
      const minimum = Number(item.minimum || 0);
      return minimum > 0 && Number(item.qty || 0) <= minimum;
    });
  },
  resetDemo() { return writeInventory(seedInventory()); }
};
