import { BUSINESS, MODULES, PRODUCTS, ORDER_STATUSES, PAYMENT_METHODS, ORDER_SOURCES } from './config.js';
import { OrdersStore } from './data.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = new Intl.NumberFormat(BUSINESS.locale, { style:'currency', currency:BUSINESS.currency });
const todayISO = () => new Date().toISOString().slice(0,10);

const state = {
  view: 'home',
  orderFilter: 'active',
  dayFilter: 'today',
  query: '',
  orders: OrdersStore.list()
};

function applyBrand() {
  document.documentElement.style.setProperty('--brand-logo', `url("${BUSINESS.watermark}")`);
  $('#brandLogo').src = BUSINESS.logo;
  const parts = BUSINESS.panelTitle.split(' ');
  $('#panelTitle').innerHTML = `${parts[0] || 'PANEL'} <span>${parts.slice(1).join(' ') || 'OPERATIVO'}</span>`;
  $('#sideSlogan').innerHTML = BUSINESS.sideSlogan.replace('\n', '<br>');
  $('#footerSlogan').innerHTML = BUSINESS.footerSlogan.replace('\n', '<br>');
  $('#footerTag').innerHTML = BUSINESS.footerTag.replace('\n', '<br>');
}

function statusMeta(id) {
  return ORDER_STATUSES.find(item => item.id === id) || { id, label:id };
}

function activeOrders() {
  return state.orders.filter(order => !['delivered','cancelled'].includes(order.status));
}

function todaysOrders() {
  return state.orders.filter(order => order.date === todayISO());
}

function homeSummary() {
  const today = todaysOrders();
  const active = today.filter(order => ['pending','preparing'].includes(order.status));
  const activeLb = active.reduce((sum, order) => sum + order.items.reduce((x, item) => x + Number(item.qty || 0), 0), 0);
  const sales = today.filter(order => order.status === 'delivered').reduce((sum, order) => sum + Number(order.total || 0), 0);
  const lbText = Number.isInteger(activeLb) ? String(activeLb) : activeLb.toFixed(1);
  return [
    { label:'Pedidos', value:String(today.length), note:'Total del día', icon:'📋', tone:'mint' },
    { label:'Por preparar', value:activeLb ? `Mixto ${lbText} lb` : '0 lb', note:'En cocina', icon:'👨‍🍳', tone:'cream' },
    { label:'Por comprar', value:'8', note:'Productos faltantes', icon:'📦', tone:'pink' },
    { label:'Ventas', value:money.format(sales), note:'Entregado hoy', icon:'$', tone:'mint' }
  ];
}

function moduleCard(module) {
  const badgeCount = module.id === 'pedidos' ? activeOrders().length : 0;
  const badge = badgeCount ? `<span class="module-badge">${badgeCount}</span>` : '';
  const extra = module.wide ? '<span class="recipe-tagline">El Sabor<br>de un Buen Día</span>' : '';
  return `
    <button class="module-card ${module.color} ${module.wide ? 'wide' : ''}" data-module="${module.id}" type="button">
      ${badge}
      <span class="module-icon" aria-hidden="true">${module.icon}</span>
      <span class="module-copy"><strong>${module.label}</strong><small>${module.subtitle}</small></span>
      ${extra}
    </button>`;
}

function summaryCard(item) {
  return `<article class="summary-card ${item.tone}"><span class="summary-icon">${item.icon}</span><strong>${item.value}</strong><b>${item.label}</b><small>${item.note}</small></article>`;
}

function renderHome() {
  $('#moduleGrid').innerHTML = MODULES.map(moduleCard).join('');
  $('#summaryGrid').innerHTML = homeSummary().map(summaryCard).join('');
  const date = new Intl.DateTimeFormat('es-MX',{weekday:'short',day:'2-digit',month:'short',year:'numeric'}).format(new Date());
  $('#todayDate').textContent = date.replace('.', '');
}

function orderKpis() {
  const today = todaysOrders();
  const pending = today.filter(o => o.status === 'pending').length;
  const ready = today.filter(o => o.status === 'ready').length;
  const sales = today.filter(o => o.status === 'delivered').reduce((sum,o)=>sum+Number(o.total||0),0);
  return [
    ['Pendientes', pending, 'pending'],
    ['Hoy', today.length, 'today'],
    ['Listos', ready, 'ready'],
    ['Venta', money.format(sales), 'sales']
  ];
}

function renderOrderKpis() {
  $('#orderKpis').innerHTML = orderKpis().map(([label,value,tone]) => `<article class="order-kpi ${tone}"><small>${label}</small><strong>${value}</strong></article>`).join('');
}

function matchesFilter(order) {
  if (state.dayFilter === 'today' && order.date !== todayISO()) return false;
  if (state.orderFilter === 'active' && ['delivered','cancelled'].includes(order.status)) return false;
  if (state.orderFilter !== 'active' && state.orderFilter !== 'all' && order.status !== state.orderFilter) return false;
  const query = state.query.trim().toLowerCase();
  if (!query) return true;
  return [order.id, order.customer, order.phone, order.address, ...order.items.map(i=>i.name)].join(' ').toLowerCase().includes(query);
}

function orderAction(order) {
  if (order.status === 'pending') return `<button class="order-action primary" data-order-action="prepare" data-id="${order.id}">Enviar a cocina</button>`;
  if (order.status === 'ready') return `<button class="order-action orange" data-order-action="delivery" data-id="${order.id}">Mandar a entrega</button>`;
  return '';
}

function orderCard(order) {
  const status = statusMeta(order.status);
  const items = order.items.map(item => `${item.qty} ${item.unit} · ${item.name}`).join(' · ');
  const pay = order.paymentStatus === 'paid' ? '<span class="paid">Pagado</span>' : '<span class="unpaid">Pago pendiente</span>';
  return `
    <article class="order-card" data-order-id="${order.id}">
      <div class="order-card-head">
        <div><span class="folio">${order.id}</span><h3>${order.customer || 'Cliente'}</h3></div>
        <span class="status ${order.status}">${status.label}</span>
      </div>
      <div class="order-main-line"><strong>${items}</strong><b>${money.format(order.total || 0)}</b></div>
      <div class="order-info-grid">
        <div><small>Entrega</small><strong>${order.date === todayISO() ? 'Hoy' : order.date} · ${order.time || '--:--'}</strong></div>
        <div><small>Teléfono</small><strong>${order.phone || '—'}</strong></div>
        <div class="full"><small>Dirección</small><strong>${order.address || 'Sin dirección'}${order.zip ? ` · ${order.zip}` : ''}</strong></div>
        <div><small>Origen</small><strong>${order.source || '—'}</strong></div>
        <div><small>Pago</small><strong>${order.payment || '—'} · ${pay}</strong></div>
      </div>
      ${order.notes ? `<div class="order-note">📝 ${order.notes}</div>` : ''}
      <div class="order-card-actions">
        ${orderAction(order)}
        ${order.status === 'pending' ? `<button class="order-action ghost danger" data-order-action="cancel" data-id="${order.id}">Cancelar</button>` : ''}
      </div>
    </article>`;
}

function renderOrders() {
  renderOrderKpis();
  const filtered = state.orders.filter(matchesFilter);
  $('#ordersList').innerHTML = filtered.length ? filtered.map(orderCard).join('') : `<div class="orders-empty"><span>📋</span><h3>No hay pedidos aquí</h3><p>Cambia el filtro o registra un pedido nuevo.</p></div>`;
}

function setView(view) {
  state.view = view;
  $$('.view').forEach(item => item.classList.toggle('active', item.dataset.view === view));
  $('#hero').classList.toggle('compact', view !== 'home');
  $('#bottomNav').classList.toggle('hidden', view !== 'home');
  const nextHash = view === 'home' ? '' : `#${view}`;
  if (window.location.hash !== nextHash) window.location.hash = nextHash;
  if (view === 'home') renderHome();
  if (view === 'pedidos') renderOrders();
  window.scrollTo({top:0,behavior:'auto'});
}

function fillOrderForm() {
  $('#orderProduct').innerHTML = PRODUCTS.map((product,index)=>`<option value="${product.id}" ${index===0?'selected':''}>${product.name} · ${product.unit} · ${money.format(product.price)}</option>`).join('');
  $('#orderPayment').innerHTML = PAYMENT_METHODS.map(item=>`<option>${item}</option>`).join('');
  $('#orderSource').innerHTML = ORDER_SOURCES.map(item=>`<option>${item}</option>`).join('');
  $('#orderDate').value = todayISO();
  $('#orderTime').value = '13:00';
  syncProductPrice();
  updateOrderPreview();
}

function syncProductPrice() {
  const product = PRODUCTS.find(item => item.id === $('#orderProduct').value) || PRODUCTS[0];
  $('#orderPrice').value = Number(product?.price || 0).toFixed(2);
  updateOrderPreview();
}

function updateOrderPreview() {
  if (!$('#orderProduct')) return;
  const product = PRODUCTS.find(item => item.id === $('#orderProduct').value) || PRODUCTS[0];
  const qty = Number($('#orderQty').value || 0);
  const price = Number($('#orderPrice').value || 0);
  $('#orderPreview').innerHTML = `<span>${qty || 0} ${product?.unit || ''} · ${product?.name || ''}</span><strong>${money.format(qty * price)}</strong>`;
}

function openOrderModal() {
  $('#orderForm').reset();
  fillOrderForm();
  $('#orderModal').hidden = false;
  document.body.classList.add('modal-open');
  setTimeout(()=>$('#orderCustomer').focus(),50);
}

function closeOrderModal() {
  $('#orderModal').hidden = true;
  document.body.classList.remove('modal-open');
}

function saveOrder(event) {
  event.preventDefault();
  const product = PRODUCTS.find(item => item.id === $('#orderProduct').value) || PRODUCTS[0];
  const qty = Number($('#orderQty').value || 0);
  const price = Number($('#orderPrice').value || 0);
  if (!qty || !$('#orderCustomer').value.trim()) return;
  OrdersStore.create({
    customer: $('#orderCustomer').value.trim(),
    phone: $('#orderPhone').value.trim(),
    address: $('#orderAddress').value.trim(),
    zip: $('#orderZip').value.trim(),
    source: $('#orderSource').value,
    date: $('#orderDate').value,
    time: $('#orderTime').value,
    payment: $('#orderPayment').value,
    paymentStatus: $('#orderPaymentStatus').value,
    notes: $('#orderNotes').value.trim(),
    items: [{ productId:product.id, name:product.name, qty, unit:product.unit, price }],
    total: qty * price
  });
  state.orders = OrdersStore.list();
  closeOrderModal();
  renderOrders();
  showToast('Pedido guardado');
}

function handleOrderAction(button) {
  const id = button.dataset.id;
  const action = button.dataset.orderAction;
  if (action === 'prepare') {
    OrdersStore.update(id,{status:'preparing'});
    showToast('Pedido enviado a preparación');
  } else if (action === 'delivery') {
    OrdersStore.update(id,{status:'delivery'});
    showToast('Pedido enviado a entregas');
  } else if (action === 'cancel') {
    OrdersStore.update(id,{status:'cancelled'});
    showToast('Pedido cancelado');
  }
  state.orders = OrdersStore.list();
  renderOrders();
}

function bindInteractions() {
  document.addEventListener('click', event => {
    const moduleCard = event.target.closest('[data-module]');
    if (moduleCard) {
      if (moduleCard.dataset.module === 'pedidos') setView('pedidos');
      else showToast(`${moduleCard.dataset.module}: siguiente módulo por construir`);
      return;
    }
    const action = event.target.closest('[data-order-action]');
    if (action) handleOrderAction(action);
  });

  $('#ordersBack').addEventListener('click',()=>setView('home'));
  $('#newOrderButton').addEventListener('click',openOrderModal);
  $('#closeOrderModal').addEventListener('click',closeOrderModal);
  $('#cancelOrder').addEventListener('click',closeOrderModal);
  $('#orderModal').addEventListener('click',event=>{ if(event.target === $('#orderModal')) closeOrderModal(); });
  $('#orderForm').addEventListener('submit',saveOrder);
  $('#orderProduct').addEventListener('change',syncProductPrice);
  $('#orderQty').addEventListener('input',updateOrderPreview);
  $('#orderPrice').addEventListener('input',updateOrderPreview);
  $('#orderSearch').addEventListener('input',event=>{state.query=event.target.value;renderOrders();});
  $('#orderDayFilter').addEventListener('change',event=>{state.dayFilter=event.target.value;renderOrders();});
  $('#statusTabs').addEventListener('click',event=>{
    const button = event.target.closest('[data-status]');
    if(!button) return;
    state.orderFilter = button.dataset.status;
    $$('#statusTabs button').forEach(item=>item.classList.toggle('active',item===button));
    renderOrders();
  });

  $('#menuButton').addEventListener('click',()=>showToast('Menú general'));
  $('#bellButton').addEventListener('click',()=>showToast('3 notificaciones'));
  $$('.bottom-nav button').forEach(button=>button.addEventListener('click',()=>{
    $$('.bottom-nav button').forEach(item=>item.classList.remove('active'));
    button.classList.add('active');
    if(button.dataset.nav !== 'inicio') showToast(`${button.textContent.trim()}: módulo pendiente`);
  }));

  window.addEventListener('hashchange',()=>{
    if(location.hash === '#pedidos') setView('pedidos');
    else if(!location.hash) setView('home');
  });
}

let toastTimer;
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>toast.classList.remove('show'),1800);
}

applyBrand();
renderHome();
fillOrderForm();
bindInteractions();
if(location.hash === '#pedidos') setView('pedidos');
