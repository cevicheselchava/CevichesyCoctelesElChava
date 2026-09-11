import { OrdersStore } from './data.js';

const $ = selector => document.querySelector(selector);
const todayISO = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0,10);
};

function pendingOrders() {
  return OrdersStore.list().filter(order => order.status === 'pending');
}

function pendingCard(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const products = items.map(item => `
    <div class="prep-product">
      <strong>${item.qty || 0} ${item.unit || ''} · ${item.name || 'Producto'}</strong>
      <small>${item.detail ? `${item.detail} · ` : ''}${order.time ? `Entrega ${order.date === todayISO() ? 'hoy' : order.date} · ${order.time}` : 'Sin hora de entrega'}</small>
    </div>`).join('');

  return `
    <article class="prep-card" data-pending-order-card="${order.id}">
      <div class="prep-card-head">
        <div>
          <span class="folio">${order.id}</span>
          <h3>${order.customer || 'Cliente'}</h3>
          <div class="prep-order-meta">${order.source || 'Pedido'} · ${order.paymentStatus === 'paid' ? 'Pagado' : 'Pago pendiente'}</div>
        </div>
        <span class="status pending">PENDIENTE</span>
      </div>
      ${products}
      ${order.notes ? `<div class="prep-note">📝 ${order.notes}</div>` : ''}
      <div class="prep-actions">
        <button class="prep-ready-button" data-prep-order-ready="${order.id}" type="button">✓ Pedido listo</button>
      </div>
    </article>`;
}

function activeFilter() {
  return $('#prepTabs button.active')?.dataset.prepFilter || 'pending';
}

function pendingHtml(rows) {
  return rows.length
    ? rows.map(pendingCard).join('')
    : `<div class="prep-empty"><span>👨‍🍳</span><h3>No hay pedidos pendientes</h3><p>Cuando entre un pedido nuevo aparecerá aquí.</p></div>`;
}

function renderPendingFlow() {
  const view = $('#preparationView');
  const list = $('#prepList');
  if (!view?.classList.contains('active') || !list) return;

  const filter = activeFilter();
  const rows = pendingOrders();

  if (filter === 'pending') {
    list.innerHTML = pendingHtml(rows);
    return;
  }

  if (filter === 'all') {
    list.querySelectorAll('[data-pending-order-card]').forEach(node => node.remove());
    if (rows.length) {
      list.insertAdjacentHTML('afterbegin', rows.map(pendingCard).join(''));
    }
  }
}

function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1900);
}

function markOrderReady(id) {
  const order = OrdersStore.get(id);
  if (!order || order.status !== 'pending') return;

  OrdersStore.update(id, {
    status:'ready',
    readyAt:Date.now()
  });

  showToast('Pedido listo · enviado a Entregas');
  queueMicrotask(renderPendingFlow);
}

document.addEventListener('click', event => {
  const ready = event.target.closest('[data-prep-order-ready]');
  if (ready) {
    event.preventDefault();
    event.stopPropagation();
    markOrderReady(ready.dataset.prepOrderReady);
    return;
  }

  if (event.target.closest('#prepTabs [data-prep-filter],#refreshPreparation')) {
    setTimeout(renderPendingFlow,0);
  }
});

window.addEventListener('panel:orders-changed',()=>setTimeout(renderPendingFlow,0));

const prepView = $('#preparationView');
if (prepView) {
  new MutationObserver(() => renderPendingFlow()).observe(prepView,{ attributes:true, attributeFilter:['class'] });
}

if (location.hash === '#preparacion') setTimeout(renderPendingFlow,0);
