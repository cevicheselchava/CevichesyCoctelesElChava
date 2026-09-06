const STORAGE_KEY = 'panel-next-orders-v1';

const todayISO = () => new Date().toISOString().slice(0, 10);

function seedOrders() {
  const today = todayISO();
  return [
    { id:'P-1006', customer:'María', phone:'210-555-0118', address:'Fredericksburg Rd', zip:'78201', source:'WhatsApp', date:today, time:'13:00', payment:'Al recibir', paymentStatus:'pending', notes:'', status:'pending', createdAt:Date.now()-600000, items:[{ productId:'ceviche-mixto-lb', name:'Ceviche mixto', qty:1, unit:'lb', price:17 }], total:17 },
    { id:'P-1005', customer:'Carlos', phone:'210-555-0145', address:'Medical Dr', zip:'78229', source:'Facebook', date:today, time:'13:30', payment:'Zelle', paymentStatus:'paid', notes:'', status:'pending', createdAt:Date.now()-1100000, items:[{ productId:'ceviche-mixto-lb', name:'Ceviche mixto', qty:2, unit:'lb', price:17 }], total:34 },
    { id:'P-1004', customer:'Ana', phone:'210-555-0172', address:'Bandera Rd', zip:'78228', source:'WhatsApp', date:today, time:'14:00', payment:'Efectivo', paymentStatus:'pending', notes:'Llamar al llegar', status:'preparing', createdAt:Date.now()-1700000, items:[{ productId:'ceviche-mixto-lb', name:'Ceviche mixto', qty:1, unit:'lb', price:17 }], total:17 },
    { id:'P-1003', customer:'Luis', phone:'210-555-0124', address:'Babcock Rd', zip:'78240', source:'App', date:today, time:'14:30', payment:'Cash App', paymentStatus:'paid', notes:'', status:'ready', createdAt:Date.now()-2400000, items:[{ productId:'ceviche-mixto-lb', name:'Ceviche mixto', qty:1, unit:'lb', price:17 }], total:17 },
    { id:'P-1002', customer:'Patricia', phone:'210-555-0191', address:'Callaghan Rd', zip:'78228', source:'WhatsApp', date:today, time:'12:00', payment:'Efectivo', paymentStatus:'paid', notes:'', status:'delivered', createdAt:Date.now()-4000000, items:[{ productId:'ceviche-mixto-lb', name:'Ceviche mixto', qty:1, unit:'lb', price:17 }], total:17 },
    { id:'P-1001', customer:'Jorge', phone:'210-555-0160', address:'Culebra Rd', zip:'78228', source:'Facebook', date:today, time:'11:30', payment:'Zelle', paymentStatus:'paid', notes:'', status:'delivered', createdAt:Date.now()-5200000, items:[{ productId:'ceviche-mixto-lb', name:'Ceviche mixto', qty:1, unit:'lb', price:17 }], total:17 }
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
  resetDemo() { return write(seedOrders()); }
};
