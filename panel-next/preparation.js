import { OrdersStore } from './data.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const todayISO = () => new Date().toISOString().slice(0,10);

let prepFilter = 'preparing';

function prepOrders() {
  return OrdersStore.list().filter(order => ['preparing','ready'].includes(order.status));
}

function prepKpis() {
  const orders = prepOrders();
  const kitchen = orders.filter(order => order.status === 'preparing').length;
  const ready = orders.filter(order => order.status === 'ready').length;
  const today = orders.filter(order => order.date === todayISO()).length;
  return [
    ['En cocina', kitchen, 'kitchen'],
    ['Listos', ready, 'ready'],
    ['Hoy', today, 'total']
  ];
}

function stepsFor(item) {
  const raw = item?.preparationSteps || item?.steps || item?.recipe?.steps || [];
  return Array.isArray(raw) ? raw.filter(Boolean) : [];
}

function prepCard(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const products = items.map(item => {
    const steps = stepsFor(item);
    const stepsHtml = steps.length
      ? steps.map((step,index)=>`<div class="prep-step"><span>${index+1}</span><div>${step}</div></div>`).join('')
      : `<div class="prep-no-recipe">Sin receta configurada para este producto. Cuando el negocio agregue su receta, aquí aparecerán los pasos automáticamente.</div>`;
    return `
      <div class="prep-product">
        <strong>${item.qty || 0} ${item.unit || ''} · ${item.name || 'Producto'}</strong>
        <small>${order.time ? `Entrega ${order.date === todayISO() ? 'hoy' : order.date} · ${order.time}` : 'Sin hora de entrega'}</small>
      </div>
      <div class="prep-steps">
        <h4>Pasos de preparación</h4>
        ${stepsHtml}
      </div>`;
  }).join('');

  return `
    <article class="prep-card">
      <div class="prep-card-head">
        <div>
          <span class="folio">${order.id}</span>
          <h3>${order.customer || 'Cliente'}</h3>
          <div class="prep-order-meta">${order.source || 'Pedido'} · ${order.paymentStatus === 'paid' ? 'Pagado' : 'Pago pendiente'}</div>
        </div>
        <span class="status ${order.status}">${order.status === 'ready' ? 'LISTO' : 'EN COCINA'}</span>
      </div>
      ${products}
      ${order.notes ? `<div class="prep-note">📝 ${order.notes}</div>` : ''}
      <div class="prep-actions">
        ${order.status === 'preparing'
          ? `<button class="prep-ready-button" data-prep-action="ready" data-id="${order.id}" type="button">✓ Marcar listo</button>`
          : `<div class="prep-ready-label">✓ Listo para entrega</div>`}
      </div>
    </article>`;
}

function renderPreparation() {
  if (!$('#prepKpis') || !$('#prepList')) return;
  $('#prepKpis').innerHTML = prepKpis().map(([label,value,tone]) => `
    <article class="prep-kpi ${tone}"><small>${label}</small><strong>${value}</strong></article>`).join('');

  const filtered = prepOrders().filter(order => prepFilter === 'all' || order.status === prepFilter);
  $('#prepList').innerHTML = filtered.length
    ? filtered.map(prepCard).join('')
    : `<div class="prep-empty"><span>👨‍🍳</span><h3>No hay pedidos aquí</h3><p>Cuando un pedido se envíe a cocina aparecerá en esta pantalla.</p></div>`;
}

function openPreparation() {
  $$('.view').forEach(view => view.classList.toggle('active', view.id === 'preparationView'));
  $('#hero')?.classList.remove('compact');
  $('#bottomNav')?.classList.add('hidden');
  if (location.hash !== '#preparacion') history.replaceState(null,'','#preparacion');
  renderPreparation();
  window.scrollTo({top:0,behavior:'auto'});
}

function goHome() {
  const clean = location.pathname + location.search;
  location.href = clean;
}

function markReady(id) {
  OrdersStore.update(id,{status:'ready'});
  renderPreparation();
  const toast = $('#toast');
  if (toast) {
    toast.textContent = 'Pedido marcado como listo';
    toast.classList.add('show');
    setTimeout(()=>toast.classList.remove('show'),1600);
  }
}

// Captura el clic antes del manejador general para que Preparación sea un módulo real.
document.addEventListener('click', event => {
  const module = event.target.closest('[data-module="preparacion"]');
  if (module) {
    event.preventDefault();
    event.stopImmediatePropagation();
    openPreparation();
    return;
  }

  const action = event.target.closest('[data-prep-action="ready"]');
  if (action) {
    event.preventDefault();
    markReady(action.dataset.id);
  }
}, true);

$('#prepBack')?.addEventListener('click', goHome);
$('#prepTabs')?.addEventListener('click', event => {
  const button = event.target.closest('[data-prep-filter]');
  if (!button) return;
  prepFilter = button.dataset.prepFilter;
  $$('#prepTabs button').forEach(item => item.classList.toggle('active', item === button));
  renderPreparation();
});

if (location.hash === '#preparacion') openPreparation();
