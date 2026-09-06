const STORAGE_KEY = 'panel-next-orders-v2';
const MENU_STORAGE_KEY = 'panel-next-menu-v1';

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

// Queda preparado para que Configuración administre el menú de cada food truck.
export const MenuStore = {
  list() { return readMenu(); },
  save(items) { return writeMenu(Array.isArray(items) ? items : []); }
};
