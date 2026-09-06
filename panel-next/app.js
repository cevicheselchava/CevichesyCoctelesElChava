import { BUSINESS, MODULES, UNITS, ORDER_STATUSES, PAYMENT_METHODS, ORDER_SOURCES } from './config.js';
import { OrdersStore, MenuStore } from './data.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = new Intl.NumberFormat(BUSINESS.locale, { style:'currency', currency:BUSINESS.currency });
const todayISO = () => new Date().toISOString().slice(0,10);

const state = {
  view: 'home',
  orderFilter: 'active',
  dayFilter: 'today',
  query: '',
  editingOrderId: null,
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

function priceText(value) {
  return value === null || value === undefined || value === '' ? 'Precio pendiente' : money.format(Number(value) || 0);
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
  const sales = today
    .filter(order => order.status === 'delivered')
    .reduce((sum, order) => sum + (order.total === null || order.total === undefined ? 0 : Number(order.total || 0)), 0);
  return [
    { label:'Pedidos', value:String(today.length), note:'Total del día', icon:'📋', tone:'mint' },
    { label:'Por preparar', value:`${active.length} ${active.length === 1 ? 'pedido' : 'pedidos'}`, note:'En cocina', icon:'👨‍🍳', tone:'cream' },
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
  const sales = today
    .filter(o => o.status === 'delivered')
    .reduce((sum,o)=>sum+(o.total === null || o.total === undefined ? 0 : Number(o.total||0)),0);
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
  const items = order.items.map(item => `${item.qty} ${item.unit || ''} · ${item.name}`).join(' · ');
  const pay = order.paymentStatus === 'paid' ? '<span class="paid">Pagado</span>' : '<span class="unpaid">Pago pendiente</span>';
  return `
    <article class="order-card" data-order-id="${order.id}">
      <div class="order-card-head">
        <div><span class="folio">${order.id}</span><h3>${order.customer || 'Cliente'}</h3></div>
        <span class="status ${order.status}">${status.label}</span>
      </div>
      <div class="order-main-line"><strong>${items}</strong><b>${priceText(order.total)}</b></div>
      <div class="order-info-grid">
        <div><small>Entrega</small><strong>${order.date === todayISO() ? 'Hoy' : order.date} · ${order.time || '--:--'}</strong></div>
        <div><small>Teléfono</small><strong>${order.phone || '—'}</strong></div>
        <div class="full"><small>Dirección</small><strong>${order.address || 'Sin dirección'}${order.zip ? ` · ${order.zip}` : ''}</strong></div>
        <div><small>Origen</small><strong>${order.source || '—'}</strong></div>
        <div><small>Pago</small><strong>${order.payment || '—'} · ${pay}</strong></div>
      </div>
      ${order.notes ? `<div class="order-note">📝 ${order.notes}</div>` : ''}
      <div class="order-card-actions">
        ${order.status !== 'cancelled' ? `<button class="order-action edit" data-order-action="edit" data-id="${order.id}">Editar</button>` : ''}
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

function populateOrderOptions() {
  const menu = MenuStore.list();
  $('#productOptions').innerHTML = menu.map(item => `<option value="${item.name}"></option>`).join('');
  $('#unitOptions').innerHTML = UNITS.map(unit => `<option value="${unit}"></option>`).join('');
  $('#orderPayment').innerHTML = PAYMENT_METHODS.map(item=>`<option>${item}</option>`).join('');
  $('#orderSource').innerHTML = ORDER_SOURCES.map(item=>`<option>${item}</option>`).join('');
}

function applyConfiguredProduct() {
  const name = $('#orderProductName').value.trim().toLowerCase();
  if (!name) return;
  const configured = MenuStore.list().find(item => String(item.name || '').trim().toLowerCase() === name);
  if (!configured) return;
  if (configured.unit) $('#orderUnit').value = configured.unit;
  if (configured.price !== null && configured.price !== undefined && configured.price !== '') $('#orderPrice').value = configured.price;
  updateOrderPreview();
}

function updateOrderPreview() {
  const name = $('#orderProductName').value.trim() || 'Producto';
  const unit = $('#orderUnit').value.trim();
  const qty = Number($('#orderQty').value || 0);
  const rawPrice = $('#orderPrice').value;
  const total = rawPrice === '' ? null : qty * Number(rawPrice || 0);
  $('#orderPreview').innerHTML = `<span>${qty || 0} ${unit} · ${name}</span><strong>${priceText(total)}</strong>`;
}

function openOrderModal(orderId = null) {
  state.editingOrderId = orderId;
  $('#orderForm').reset();
  populateOrderOptions();

  if (orderId) {
    const order = OrdersStore.get(orderId);
    if (!order) return;
    const item = order.items?.[0] || {};
    $('#orderModalEyebrow').textContent = 'EDITAR';
    $('#orderModalTitle').textContent = `Pedido ${order.id}`;
    $('#saveOrderButton').textContent = 'Guardar cambios';
    $('#orderProductName').value = item.name || '';
    $('#orderQty').value = item.qty ?? 1;
    $('#orderUnit').value = item.unit || '';
    $('#orderPrice').value = item.price === null || item.price === undefined ? '' : item.price;
    $('#orderCustomer').value = order.customer || '';
    $('#orderPhone').value = order.phone || '';
    $('#orderAddress').value = order.address || '';
    $('#orderZip').value = order.zip || '';
    $('#orderSource').value = order.source || ORDER_SOURCES[0];
    $('#orderDate').value = order.date || todayISO();
    $('#orderTime').value = order.time || '13:00';
    $('#orderPayment').value = order.payment || PAYMENT_METHODS[0];
    $('#orderPaymentStatus').value = order.paymentStatus || 'pending';
    $('#orderNotes').value = order.notes || '';
  } else {
    $('#orderModalEyebrow').textContent = 'NUEVO';
    $('#orderModalTitle').textContent = 'Pedido';
    $('#saveOrderButton').textContent = 'Guardar pedido';
    $('#orderQty').value = '1';
    $('#orderDate').value = todayISO();
    $('#orderTime').value = '13:00';
    $('#orderPaymentStatus').value = 'pending';
  }

  updateOrderPreview();
  $('#orderModal').hidden = false;
  document.body.classList.add('modal-open');
  setTimeout(()=>$('#orderProductName').focus(),50);
}

function closeOrderModal() {
  $('#orderModal').hidden = true;
  document.body.classList.remove('modal-open');
  state.editingOrderId = null;
}

function saveOrder(event) {
  event.preventDefault();
  const productName = $('#orderProductName').value.trim();
  const unit = $('#orderUnit').value.trim();
  const qty = Number($('#orderQty').value || 0);
  const rawPrice = $('#orderPrice').value;
  const price = rawPrice === '' ? null : Number(rawPrice);
  if (!productName || !unit || !qty || price === null || !Number.isFinite(price) || !$('#orderCustomer').value.trim()) return;

  const payload = {
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
    items: [{ name:productName, qty, unit, price }],
    total: qty * price
  };

  if (state.editingOrderId) {
    OrdersStore.update(state.editingOrderId, payload);
    showToast('Pedido actualizado');
  } else {
    OrdersStore.create(payload);
    showToast('Pedido guardado');
  }

  state.orders = OrdersStore.list();
  closeOrderModal();
  renderOrders();
}

function handleOrderAction(button) {
  const id = button.dataset.id;
  const action = button.dataset.orderAction;
  if (action === 'edit') {
    openOrderModal(id);
    return;
  }
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
  $('#newOrderButton').addEventListener('click',()=>openOrderModal());
  $('#closeOrderModal').addEventListener('click',closeOrderModal);
  $('#cancelOrder').addEventListener('click',closeOrderModal);
  $('#orderModal').addEventListener('click',event=>{ if(event.target === $('#orderModal')) closeOrderModal(); });
  $('#orderForm').addEventListener('submit',saveOrder);
  $('#orderProductName').addEventListener('change',applyConfiguredProduct);
  $('#orderProductName').addEventListener('input',updateOrderPreview);
  $('#orderQty').addEventListener('input',updateOrderPreview);
  $('#orderUnit').addEventListener('input',updateOrderPreview);
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
populateOrderOptions();
bindInteractions();
if(location.hash === '#pedidos') setView('pedidos');
