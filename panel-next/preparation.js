import { OrdersStore } from './data.js';
import { recipePlanForItem, consumeInventoryForOrder } from './recipe-engine.js';
import './inventory.js';
import './purchases.js';

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

function amountText(ingredient) {
  if (ingredient.fixed === false) return 'Al gusto';
  const qty = Number(ingredient.qty || 0);
  const shown = Number.isInteger(qty) ? qty : Math.round(qty * 100) / 100;
  return `${shown} ${ingredient.unit || ''}`.trim();
}

function requestedRecipeAmount(item) {
  return {
    qty:item.recipeQty ?? item.qty ?? 0,
    unit:item.recipeUnit || item.unit || ''
  };
}

function recipeBlock(item) {
  const plan = recipePlanForItem(item);
  if (!plan.recipe) {
    return `
      <div class="prep-steps">
        <h4>Receta</h4>
        <div class="prep-no-recipe">Sin receta vinculada a este producto. Agrégala en Recetas para que aquí aparezcan las cantidades automáticamente.</div>
      </div>`;
  }

  const recipe = plan.recipe;
  const requested = requestedRecipeAmount(item);
  const scaleNote = plan.compatible
    ? `Cantidades calculadas para ${requested.qty} ${requested.unit}.`
    : `Receta base: rinde ${recipe.yieldQty} ${recipe.yieldUnit}. El pedido requiere ${requested.qty} ${requested.unit}; falta una equivalencia compatible.`;

  const ingredients = plan.ingredients.map((ingredient,index)=>`
    <div class="prep-step">
      <span>${index+1}</span>
      <div>${ingredient.name} · <strong>${amountText(ingredient)}</strong>${ingredient.linked ? '' : ' · no vinculado a inventario'}</div>
    </div>`).join('');

  return `
    <div class="prep-steps">
      <h4>${recipe.name}</h4>
      <div class="prep-no-recipe">${scaleNote}</div>
      ${ingredients}
    </div>`;
}

function inventoryResult(order) {
  const info = order.inventoryConsumption;
  if (!info) return '';
  const alerts = Array.isArray(info.items)
    ? info.items.filter(row=>['shortage','unlinked','ingredient_unit_mismatch','order_unit_mismatch','no_recipe'].includes(row.status))
    : [];
  if (!alerts.length && info.deducted) {
    return `<div class="prep-ready-label">✓ Inventario actualizado automáticamente · ${info.deducted} ${info.deducted === 1 ? 'ingrediente' : 'ingredientes'}</div>`;
  }
  if (alerts.length) {
    const details = alerts.slice(0,2).map(row=>row.ingredient ? `${row.ingredient}: ${row.label}` : row.label).join(' · ');
    return `<div class="prep-note">⚠ Inventario: ${details}${alerts.length > 2 ? ` · +${alerts.length-2} avisos` : ''}</div>`;
  }
  return '';
}

function prepCard(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const products = items.map(item => `
      <div class="prep-product">
        <strong>${item.qty || 0} ${item.unit || ''} · ${item.name || 'Producto'}</strong>
        <small>${item.detail ? `${item.detail} · ` : ''}${order.time ? `Entrega ${order.date === todayISO() ? 'hoy' : order.date} · ${order.time}` : 'Sin hora de entrega'}</small>
      </div>
      ${recipeBlock(item)}`).join('');

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
      ${inventoryResult(order)}
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

function showPrepToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),1900);
}

function markReady(id) {
  const result = consumeInventoryForOrder(id);
  OrdersStore.update(id,{status:'ready'});
  renderPreparation();

  if (result?.deducted && result?.alerts) {
    showPrepToast(`Listo · inventario actualizado con ${result.alerts} ${result.alerts === 1 ? 'aviso' : 'avisos'}`);
  } else if (result?.deducted) {
    showPrepToast('Listo · inventario actualizado');
  } else if (result?.alerts) {
    showPrepToast(`Listo · revisa ${result.alerts} ${result.alerts === 1 ? 'dato' : 'datos'} de inventario`);
  } else {
    showPrepToast('Pedido marcado como listo');
  }
}

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

window.addEventListener('panel:orders-changed',()=>{
  if ($('#preparationView')?.classList.contains('active')) renderPreparation();
});

if (location.hash === '#preparacion') openPreparation();
