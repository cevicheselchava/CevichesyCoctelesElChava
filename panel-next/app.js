import { BUSINESS, MODULES, UNITS, ORDER_STATUSES, PAYMENT_METHODS, ORDER_SOURCES } from './config.js';
import { OrdersStore, MenuStore, InventoryStore } from './data.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = new Intl.NumberFormat(BUSINESS.locale, { style:'currency', currency:BUSINESS.currency });
const todayISO = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2,'0');
  const day = String(now.getDate()).padStart(2,'0');
  return `${year}-${month}-${day}`;
};
const tomorrowISO = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2,'0');
  const day = String(date.getDate()).padStart(2,'0');
  return `${year}-${month}-${day}`;
};

const OPERATIONAL_RESET_KEY = 'panel-next-operational-reset-20260909-v1';
function clearOldOperationalLocalData() {
  try {
    if (localStorage.getItem(OPERATIONAL_RESET_KEY) === 'done') return;
    [
      'panel-next-money-expenses-v1',
      'panel-preparation-plan-v1',
      'panel-preparation-selected-dish-v1'
    ].forEach(key=>localStorage.removeItem(key));
    localStorage.setItem(OPERATIONAL_RESET_KEY,'done');
  } catch (_) {}
}
clearOldOperationalLocalData();

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
  const low = InventoryStore.low().length;
  return [
    { label:'Pedidos', value:String(today.length), note:'Total del día', icon:'📋', tone:'mint' },
    { label:'Por preparar', value:`${active.length} ${active.length === 1 ? 'pedido' : 'pedidos'}`, note:'En cocina', icon:'👨‍🍳', tone:'cream' },
    { label:'Por comprar', value:String(low), note:low === 1 ? 'Producto faltante' : 'Productos faltantes', icon:'📦', tone:'pink' },
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

function updateBell() {
  const badge = $('.badge-notify');
  if (!badge) return;
  const count = activeOrders().length;
  badge.textContent = String(count);
  badge.hidden = count === 0;
}

function renderHome() {
  $('#moduleGrid').innerHTML = MODULES.map(moduleCard).join('');
  $('#summaryGrid').innerHTML = homeSummary().map(summaryCard).join('');
  const date = new Intl.DateTimeFormat('es-MX',{weekday:'short',day:'2-digit',month:'short',year:'numeric'}).format(new Date());
  $('#todayDate').textContent = date.replace('.', '');
  updateBell();
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
  return [order.id, order.customer, order.phone, order.address, ...(order.items || []).map(i=>i.name)].join(' ').toLowerCase().includes(query);
}

function orderAction(order) {
  if (order.status === 'pending') return `<button class="order-action primary" data-order-action="prepare" data-id="${order.id}">Enviar a cocina</button>`;
  return '';
}

function itemLabel(item) {
  const base = `${item.qty ?? 0} ${item.unit || ''} · ${item.name || 'Producto'}`;
  return item.detail ? `${base} (${item.detail})` : base;
}

function orderCard(order) {
  const status = statusMeta(order.status);
  const items = (order.items || []).map(itemLabel).join(' · ');
  const pay = order.paymentStatus === 'paid' ? '<span class="paid">Pagado</span>' : '<span class="unpaid">Pago pendiente</span>';
  return `
    <article class="order-card" data-order-id="${order.id}">
      <div class="order-card-head">
        <div><span class="folio">${order.id}</span><h3>${order.customer || 'Cliente'}</h3></div>
        <span class="status ${order.status}">${status.label}</span>
      </div>
      <div class="order-main-line"><strong>${items || 'Sin productos'}</strong><b>${priceText(order.total)}</b></div>
      <div class="order-info-grid">
        <div><small>Entrega</small><strong>${order.date === todayISO() ? 'Hoy' : (order.date || '—')} · ${order.time || '--:--'}</strong></div>
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
  updateBell();
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

function ensureSelectValue(select, value) {
  if (!select || !value) return;
  if (![...select.options].some(option=>option.value === value)) {
    select.insertAdjacentHTML('beforeend',`<option value="${value}">${value}</option>`);
  }
  select.value = value;
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
    ensureSelectValue($('#orderSource'),order.source || ORDER_SOURCES[0]);
    $('#orderDate').value = order.date || todayISO();
    $('#orderTime').value = order.time || '13:00';
    ensureSelectValue($('#orderPayment'),order.payment || PAYMENT_METHODS[0]);
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

function lineTotal(item) {
  if (item.lineTotal !== null && item.lineTotal !== undefined && Number.isFinite(Number(item.lineTotal))) return Number(item.lineTotal);
  if (item.price !== null && item.price !== undefined) return Number(item.qty || 0) * Number(item.price || 0);
  return 0;
}

function invalidOrderField(selector, message) {
  const field = $(selector);
  if (field) {
    field.focus();
    if (typeof field.reportValidity === 'function') field.reportValidity();
  }
  showToast(message);
  return false;
}

function validateOrderForm() {
  const productName = $('#orderProductName').value.trim();
  const unit = $('#orderUnit').value.trim();
  const qty = Number($('#orderQty').value || 0);
  const rawPrice = $('#orderPrice').value;
  const price = rawPrice === '' ? null : Number(rawPrice);
  const customer = $('#orderCustomer').value.trim();
  const date = $('#orderDate').value;
  const time = $('#orderTime').value;

  if (!productName) return invalidOrderField('#orderProductName','Falta el producto');
  if (!(qty > 0)) return invalidOrderField('#orderQty','Revisa la cantidad');
  if (!unit) return invalidOrderField('#orderUnit','Falta la unidad');
  if (price === null || !Number.isFinite(price) || price < 0) return invalidOrderField('#orderPrice','Revisa el precio');
  if (!customer) return invalidOrderField('#orderCustomer','Falta el nombre del cliente');
  if (!date) return invalidOrderField('#orderDate','Falta el día de entrega');
  if (!time) return invalidOrderField('#orderTime','Falta la hora de entrega');
  return true;
}

function showSavedOrder(order) {
  if (!order) return;
  state.orders = OrdersStore.list();
  const statusFilter = ['delivered','cancelled'].includes(order.status) ? 'all' : 'active';
  state.orderFilter = statusFilter;
  $$('#statusTabs button').forEach(button=>button.classList.toggle('active',button.dataset.status === statusFilter));

  if (order.date !== todayISO()) {
    state.dayFilter = 'all';
    $('#orderDayFilter').value = 'all';
  }

  renderOrders();
  requestAnimationFrame(()=>{
    if (order.date === tomorrowISO()) {
      document.querySelector('[data-local-order-day="tomorrow"]')?.click();
    }
    requestAnimationFrame(()=>{
      document.querySelector(`[data-order-id="${order.id}"]`)?.scrollIntoView({ behavior:'smooth', block:'center' });
    });
  });
}

function saveOrder(event) {
  event.preventDefault();
  if (!validateOrderForm()) return;

  const wasEditing = Boolean(state.editingOrderId);
  const productName = $('#orderProductName').value.trim();
  const unit = $('#orderUnit').value.trim();
  const qty = Number($('#orderQty').value || 0);
  const price = Number($('#orderPrice').value);

  const existing = state.editingOrderId ? OrdersStore.get(state.editingOrderId) : null;
  const oldItems = Array.isArray(existing?.items) ? existing.items : [];
  const firstItem = {
    ...(oldItems[0] || {}),
    name:productName,
    qty,
    unit,
    price,
    lineTotal:qty * price
  };
  const items = [firstItem,...oldItems.slice(1)];
  const total = items.reduce((sum,item)=>sum + lineTotal(item),0);

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
    items,
    total
  };

  let savedOrder = null;
  try {
    if (wasEditing) {
      savedOrder = OrdersStore.update(state.editingOrderId, payload);
      if (!savedOrder) throw new Error('No se encontró el pedido para actualizar');
    } else {
      savedOrder = OrdersStore.create(payload);
      if (!savedOrder) throw new Error('No se creó el pedido');
    }
  } catch (error) {
    console.error('No se pudo guardar el pedido:',error);
    showToast('No se pudo guardar el pedido');
    return;
  }

  closeOrderModal();
  showSavedOrder(savedOrder);
  showToast(wasEditing ? 'Pedido actualizado' : 'Pedido guardado');
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
  $('#bellButton').addEventListener('click',()=>showToast(`${activeOrders().length} pedidos activos`));
  $$('.bottom-nav button').forEach(button=>button.addEventListener('click',()=>{
    $$('.bottom-nav button').forEach(item=>item.classList.remove('active'));
    button.classList.add('active');
    if(button.dataset.nav !== 'inicio') showToast(`${button.textContent.trim()}: módulo pendiente`);
  }));

  window.addEventListener('hashchange',()=>{
    if(location.hash === '#pedidos') setView('pedidos');
    else if(!location.hash) setView('home');
  });

  window.addEventListener('panel:orders-changed',()=>{
    state.orders = OrdersStore.list();
    if (state.view === 'pedidos') renderOrders();
    if (state.view === 'home') renderHome();
    updateBell();
  });

  window.addEventListener('panel:new-order',event=>{
    const order = event.detail?.order;
    if (navigator.vibrate) navigator.vibrate([180,80,180]);
    showToast(`Nuevo pedido${order?.customer ? ` · ${order.customer}` : ''}`);
  });

  window.addEventListener('panel:firebase-state',event=>{
    if (event.detail?.state === 'error') showToast('Sin conexión con pedidos de Firebase');
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
