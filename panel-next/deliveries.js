import { OrdersStore } from './data.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

let deliveryFilter = 'ready';

function localDateISO(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0,10);
}

function deliveryOrders() {
  return OrdersStore.list().filter(order => ['ready','delivery','delivered'].includes(order.status));
}

function deliverySortValue(order) {
  const date = String(order.date || '9999-12-31');
  const time = String(order.time || '23:59').padStart(5,'0');
  return `${date}T${time}`;
}

function deliveredToday(order) {
  if (order.status !== 'delivered') return false;
  if (order.deliveredAt) return localDateISO(order.deliveredAt) === localDateISO();
  return order.date === localDateISO();
}

function ensureAssets() {
  if (!document.querySelector('link[href="./deliveries.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './deliveries.css';
    document.head.appendChild(link);
  }

  if (!$('#deliveriesView')) {
    const section = document.createElement('section');
    section.className = 'view deliveries-view';
    section.id = 'deliveriesView';
    section.dataset.view = 'entregas';
    section.innerHTML = `
      <div class="module-topbar">
        <button class="back-button" id="deliveriesBack" type="button">‹</button>
        <div><small>MÓDULO</small><h2>Entregas</h2></div>
        <div></div>
      </div>
      <div class="delivery-kpis" id="deliveryKpis"></div>
      <div class="delivery-tabs" id="deliveryTabs">
        <button class="active" data-delivery-filter="ready">Listos</button>
        <button data-delivery-filter="delivery">En ruta</button>
        <button data-delivery-filter="delivered">Entregados</button>
      </div>
      <div class="delivery-list" id="deliveryList"></div>`;
    document.querySelector('main.content')?.appendChild(section);
  }
}

function statusLabel(order) {
  if (order.status === 'ready') return 'LISTO';
  if (order.status === 'delivery') return 'EN RUTA';
  return 'ENTREGADO';
}

function deliveryKpis() {
  const rows = deliveryOrders();
  return [
    ['Listos', rows.filter(order=>order.status === 'ready').length, 'ready'],
    ['En ruta', rows.filter(order=>order.status === 'delivery').length, 'route'],
    ['Entregados hoy', rows.filter(deliveredToday).length, 'done']
  ];
}

function matchesFilter(order) {
  return order.status === deliveryFilter;
}

function itemText(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  return items.map(item=>{
    const base = `${item.qty || 0} ${item.unit || ''} · ${item.name || 'Producto'}`;
    return item.detail ? `${base} (${item.detail})` : base;
  }).join(' · ') || 'Sin productos';
}

function paymentHtml(order) {
  return order.paymentStatus === 'paid'
    ? '<span class="delivery-paid">✓ Pagado</span>'
    : '<span class="delivery-unpaid">Cobro pendiente</span>';
}

function mapsUrl(order) {
  const target = [order.address,order.zip].filter(Boolean).join(' ');
  return target ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(target)}` : '';
}

function phoneUrl(order) {
  const phone = String(order.phone || '').replace(/[^\d+]/g,'');
  return phone ? `tel:${phone}` : '';
}

function deliveryCard(order) {
  const map = mapsUrl(order);
  const phone = phoneUrl(order);
  const deliveredTime = order.deliveredAt
    ? new Intl.DateTimeFormat('es-MX',{hour:'numeric',minute:'2-digit'}).format(new Date(order.deliveredAt))
    : '';

  return `
    <article class="delivery-card ${order.status}">
      <div class="delivery-card-head">
        <div><span class="delivery-folio">${order.id}</span><h3>${order.customer || 'Cliente'}</h3></div>
        <span class="delivery-status ${order.status}">${statusLabel(order)}</span>
      </div>
      <div class="delivery-items">${itemText(order)}</div>
      <div class="delivery-info">
        <div><small>Entrega</small><strong>${order.date === localDateISO() ? 'Hoy' : (order.date || '—')} · ${order.time || '--:--'}</strong></div>
        <div><small>Teléfono</small><strong>${order.phone || '—'}</strong></div>
        <div class="full"><small>Dirección</small><strong>${order.address || 'Sin dirección'}${order.zip ? ` · ${order.zip}` : ''}</strong></div>
        <div><small>Pago</small><strong>${order.payment || '—'}</strong></div>
        <div><small>Estado</small><strong>${paymentHtml(order)}</strong></div>
      </div>
      ${deliveredTime ? `<div class="delivery-done-note">✓ Entregado a las ${deliveredTime}</div>` : ''}
      ${order.notes ? `<div class="delivery-note">📝 ${order.notes}</div>` : ''}
      <div class="delivery-quick-actions">
        ${phone ? `<a class="delivery-link phone" href="${phone}">☎ Llamar</a>` : ''}
        ${map ? `<a class="delivery-link map" href="${map}" target="_blank" rel="noopener">⌖ Mapa</a>` : ''}
      </div>
      <div class="delivery-actions">
        ${order.paymentStatus !== 'paid' ? `<button class="delivery-action payment" data-delivery-action="paid" data-id="${order.id}" type="button">$ Marcar cobrado</button>` : ''}
        ${order.status === 'ready' ? `<button class="delivery-action start" data-delivery-action="start" data-id="${order.id}" type="button">Salir a entregar</button>` : ''}
        ${order.status === 'delivery' ? `<button class="delivery-action delivered" data-delivery-action="delivered" data-id="${order.id}" type="button">✓ Marcar entregado</button>` : ''}
      </div>
    </article>`;
}

function renderDeliveries() {
  if (!$('#deliveryKpis') || !$('#deliveryList')) return;
  $('#deliveryKpis').innerHTML = deliveryKpis().map(([label,value,tone])=>`
    <article class="delivery-kpi ${tone}"><small>${label}</small><strong>${value}</strong></article>`).join('');

  const rows = deliveryOrders()
    .filter(matchesFilter)
    .sort((a,b)=>deliverySortValue(a).localeCompare(deliverySortValue(b)) || Number(a.createdAt || 0) - Number(b.createdAt || 0));
  $('#deliveryList').innerHTML = rows.length
    ? rows.map(deliveryCard).join('')
    : `<div class="delivery-empty"><span>🛵</span><h3>No hay entregas aquí</h3><p>Los pedidos listos y en ruta aparecerán automáticamente.</p></div>`;
}

function openDeliveries() {
  ensureAssets();
  $$('.view').forEach(view=>view.classList.toggle('active',view.id === 'deliveriesView'));
  $('#hero')?.classList.remove('compact');
  $('#bottomNav')?.classList.add('hidden');
  if (location.hash !== '#entregas') history.replaceState(null,'','#entregas');
  renderDeliveries();
  window.scrollTo({top:0,behavior:'auto'});
}

function goHome() {
  const clean = location.pathname + location.search;
  location.href = clean;
}

function showDeliveryToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),1800);
}

function handleDeliveryAction(button) {
  const id = button.dataset.id;
  const action = button.dataset.deliveryAction;
  const order = OrdersStore.get(id);
  if (!order) return;

  if (action === 'start' && order.status === 'ready') {
    OrdersStore.update(id,{status:'delivery',deliveryStartedAt:Date.now()});
    showDeliveryToast('Pedido en ruta');
  } else if (action === 'delivered' && order.status === 'delivery') {
    OrdersStore.update(id,{status:'delivered',deliveredAt:Date.now()});
    showDeliveryToast(order.paymentStatus === 'paid' ? 'Entrega completada' : 'Entregado · cobro pendiente');
  } else if (action === 'paid' && order.paymentStatus !== 'paid') {
    OrdersStore.update(id,{paymentStatus:'paid',paidAt:Date.now()});
    showDeliveryToast('Pago registrado');
  }

  renderDeliveries();
}

ensureAssets();

document.addEventListener('click',event=>{
  const module = event.target.closest('[data-module="entregas"]');
  if (module) {
    event.preventDefault();
    event.stopImmediatePropagation();
    openDeliveries();
    return;
  }

  const action = event.target.closest('[data-delivery-action]');
  if (action) {
    event.preventDefault();
    handleDeliveryAction(action);
  }
},true);

$('#deliveriesBack')?.addEventListener('click',goHome);
$('#deliveriesView [data-back-home]')?.addEventListener('click',goHome);
$('#deliveryTabs')?.addEventListener('click',event=>{
  const button = event.target.closest('[data-delivery-filter]');
  if (!button) return;
  deliveryFilter = button.dataset.deliveryFilter;
  $$('#deliveryTabs button').forEach(item=>item.classList.toggle('active',item === button));
  renderDeliveries();
});

window.addEventListener('panel:orders-changed',()=>{
  if ($('#deliveriesView')?.classList.contains('active')) renderDeliveries();
});

if (location.hash === '#entregas') openDeliveries();
