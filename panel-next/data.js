const STORAGE_KEY = 'panel-next-orders-v2';
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

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedOrders();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw);
  } catch {
    return seedOrders();
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

function seedInventory() {
  return [
    {
      id:'I-1004', name:'Filete de pescado', category:'Ingrediente', qty:6.5, unit:'lb', minimum:4,
      purchaseUnit:'bolsa', contentQty:2, contentUnit:'lb', purchasePrice:9.50,
      updatedAt:Date.now()-3600000
    },
    {
      id:'I-1003', name:'Camarón', category:'Ingrediente', qty:2, unit:'lb', minimum:4,
      purchaseUnit:'bolsa', contentQty:0.75, contentUnit:'lb', purchasePrice:6.47,
      updatedAt:Date.now()-7200000
    },
    {
      id:'I-1002', name:'Tomate', category:'Ingrediente', qty:3, unit:'lb', minimum:2,
      purchaseUnit:'lb', contentQty:1, contentUnit:'lb', purchasePrice:1.25,
      updatedAt:Date.now()-9500000
    },
    {
      id:'I-1001', name:'Contenedores', category:'Empaque', qty:0, unit:'pieza', minimum:12,
      purchaseUnit:'paquete', contentQty:25, contentUnit:'pieza', purchasePrice:10.50,
      updatedAt:Date.now()-13000000
    }
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

function readInventory() {
  try {
    const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (!raw) {
      const seeded = seedInventory();
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw).map(normalizeInventoryItem);
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
    const created = { ...order, id:`P-${nextNumber}`, createdAt:Date.now(), status:'pending' };
    orders.unshift(created);
    write(orders);
    return created;
  },
  update(id, patch) {
    const orders = read();
    const index = orders.findIndex(order => order.id === id);
    if (index < 0) return null;
    orders[index] = { ...orders[index], ...patch, updatedAt:Date.now() };
    write(orders);
    return orders[index];
  },
  get(id) { return read().find(order => order.id === id) || null; },
  resetDemo() { return write(seedOrders()); }
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
  low() { return readInventory().filter(item => Number(item.qty || 0) <= Number(item.minimum || 0)); },
  resetDemo() { return writeInventory(seedInventory()); }
};
