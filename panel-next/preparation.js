import { OrdersStore } from './data.js';
import { recipePlanForItem, consumeInventoryForOrder } from './recipe-engine.js';
import './inventory.js';
import './purchases.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const localISO = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
};
const todayISO = () => localISO();
const PLAN_KEY = 'panel-preparation-plan-v1';

let prepFilter = 'preparing';

function prepOrders() {
  return OrdersStore.list().filter(order => ['preparing','ready'].includes(order.status));
}

function prepKpis() {
  const orders = prepOrders();
  const kitchen = orders.filter(order => order.status === 'preparing').length;
  const ready = orders.filter(order => order.status === 'ready').length;
  const today = OrdersStore.list().filter(order => order.date === todayISO() && order.status !== 'cancelled').length;
  return [
    ['En cocina', kitchen, 'kitchen'],
    ['Listos', ready, 'ready'],
    ['Pedidos hoy', today, 'total']
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

function readPlan() {
  try {
    const raw = JSON.parse(localStorage.getItem(PLAN_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch (_) {
    return {};
  }
}

function writePlan(plan) {
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
}

function productKey(name, unit) {
  return `${String(name || '').trim().toLowerCase()}__${String(unit || '').trim().toLowerCase()}`;
}

function formatQty(value) {
  const qty = Number(value || 0);
  return Number.isInteger(qty) ? String(qty) : String(Math.round(qty * 100) / 100);
}

function formatDay(dateISO) {
  const [y,m,d] = String(dateISO).split('-').map(Number);
  if (!y || !m || !d) return dateISO;
  return new Intl.DateTimeFormat('es-US',{weekday:'long',day:'numeric',month:'long'}).format(new Date(y,m-1,d));
}

function aggregateOrders(dateISO) {
  const map = new Map();
  OrdersStore.list()
    .filter(order => order.date === dateISO && order.status !== 'cancelled')
    .forEach(order => {
      (Array.isArray(order.items) ? order.items : []).forEach(item => {
        const name = String(item.name || 'Producto').trim() || 'Producto';
        const unit = String(item.unit || '').trim();
        const key = productKey(name,unit);
        if (!map.has(key)) map.set(key,{ key, name, unit, qty:0 });
        map.get(key).qty += Number(item.qty || 0);
      });
    });
  return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name,'es'));
}

function requirementPreview(row, plannedQty) {
  if (!(plannedQty > 0)) return '';
  const plan = recipePlanForItem({
    name: row.name,
    qty: plannedQty,
    unit: row.unit,
    recipeQty: plannedQty,
    recipeUnit: row.unit
  });
  if (!plan.recipe || !plan.compatible) return '';
  const ingredients = plan.ingredients.map(ingredient => `${ingredient.name}: ${amountText(ingredient)}`).join(' · ');
  if (!ingredients) return '';
  return `<div class="prep-plan-recipe"><strong>Ingredientes:</strong> ${ingredients}</div>`;
}

function planRow(row, savedValue) {
  const hasValue = savedValue !== '' && savedValue !== null && savedValue !== undefined;
  const planned = hasValue ? Number(savedValue) : 0;
  const available = hasValue ? planned - row.qty : null;
  const shortage = hasValue && available < 0;
  const encodedKey = encodeURIComponent(row.key);
  const availableText = !hasValue
    ? '—'
    : shortage
      ? `Faltan ${formatQty(Math.abs(available))} ${row.unit}`.trim()
      : `${formatQty(available)} ${row.unit}`.trim();

  return `
    <article class="prep-plan-row ${shortage ? 'shortage' : ''}">
      <div class="prep-plan-product">
        <strong>${row.name}</strong>
        <small>${row.unit || 'unidad sin definir'}</small>
      </div>
      <div class="prep-plan-metrics">
        <div class="prep-plan-stat">
          <small>Pedidos confirmados</small>
          <strong>${formatQty(row.qty)} ${row.unit}</strong>
        </div>
        <label class="prep-plan-input">
          <small>Cantidad por preparar</small>
          <div><input type="number" min="0" step="0.01" inputmode="decimal" data-prep-plan-key="${encodedKey}" value="${hasValue ? formatQty(planned) : ''}" placeholder="Escribe cantidad"><span>${row.unit}</span></div>
        </label>
        <div class="prep-plan-stat available">
          <small>Disponible para vender</small>
          <strong>${availableText}</strong>
        </div>
      </div>
      ${requirementPreview(row,planned)}
    </article>`;
}

function upcomingSummary() {
  const today = todayISO();
  const dates = [...new Set(OrdersStore.list()
    .filter(order => order.status !== 'cancelled' && order.date && order.date > today)
    .map(order => order.date))]
    .sort()
    .slice(0,7);

  if (!dates.length) return '';

  const blocks = dates.map(date => {
    const rows = aggregateOrders(date);
    const products = rows.map(row => `<span><strong>${formatQty(row.qty)} ${row.unit}</strong> ${row.name}</span>`).join('');
    return `<div class="prep-upcoming-day"><small>${formatDay(date)}</small><div>${products || '<span>Sin productos</span>'}</div></div>`;
  }).join('');

  return `
    <section class="prep-upcoming">
      <div class="prep-upcoming-title"><strong>Próximos pedidos</strong><small>Solo pedidos confirmados. La cantidad por preparar se define ese mismo día.</small></div>
      ${blocks}
    </section>`;
}

function renderDailyPlan() {
  const host = $('#prepDailyPlan');
  if (!host) return;
  const date = todayISO();
  const rows = aggregateOrders(date);
  const plan = readPlan();
  const dayPlan = plan[date] || {};

  const content = rows.length
    ? rows.map(row => planRow(row, dayPlan[row.key] ?? '')).join('')
    : `<div class="prep-plan-empty">No hay pedidos confirmados para hoy. Si entra uno, aparecerá aquí automáticamente.</div>`;

  host.innerHTML = `
    <section class="prep-daily-plan-card">
      <div class="prep-plan-head">
        <div><small>PLAN DEL DÍA</small><h3>${formatDay(date)}</h3></div>
        <span>Se actualiza con todos los pedidos</span>
      </div>
      <p class="prep-plan-help">Los pedidos se suman solos. Tú solo defines <strong>Cantidad por preparar</strong> el mismo día.</p>
      <div class="prep-plan-rows">${content}</div>
    </section>
    ${upcomingSummary()}`;
}

function ensureDailyPlanHost() {
  if ($('#prepDailyPlan')) return;
  const kpis = $('#prepKpis');
  if (!kpis) return;
  const host = document.createElement('div');
  host.id = 'prepDailyPlan';
  host.className = 'prep-daily-plan';
  kpis.insertAdjacentElement('afterend',host);
}

function ensurePlanStyles() {
  if ($('#prepDailyPlanStyles')) return;
  const style = document.createElement('style');
  style.id = 'prepDailyPlanStyles';
  style.textContent = `
    .prep-daily-plan{margin:0 0 14px}.prep-daily-plan-card,.prep-upcoming{background:#fff;border:1px solid #dfe6e2;border-radius:22px;padding:18px;box-shadow:0 8px 22px rgba(25,46,37,.055)}
    .prep-plan-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.prep-plan-head small{font-size:11px;font-weight:1000;color:#078844;letter-spacing:.06em}.prep-plan-head h3{margin:3px 0 0;font-size:25px;text-transform:capitalize}.prep-plan-head>span{background:#eef7f2;border-radius:999px;padding:8px 11px;color:#3b6650;font-size:12px;font-weight:900;text-align:center}
    .prep-plan-help{margin:12px 0 15px;color:#617068;font-size:15px;line-height:1.35}.prep-plan-rows{display:grid;gap:11px}.prep-plan-row{border:1px solid #e1e8e4;border-radius:18px;padding:14px;background:#fbfdfc}.prep-plan-row.shortage{border-color:#f0b8b8;background:#fff9f9}.prep-plan-product{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:11px}.prep-plan-product strong{font-size:20px}.prep-plan-product small{font-size:12px;color:#77837d;font-weight:800}
    .prep-plan-metrics{display:grid;grid-template-columns:1fr 1.25fr 1fr;gap:8px}.prep-plan-stat,.prep-plan-input{border-radius:14px;background:#f1f5f3;padding:11px}.prep-plan-stat small,.prep-plan-input small{display:block;margin-bottom:6px;color:#68756e;font-size:11px;font-weight:900;text-transform:uppercase}.prep-plan-stat strong{font-size:18px}.prep-plan-stat.available{background:#eaf7ef}.prep-plan-row.shortage .prep-plan-stat.available{background:#fdeaea;color:#a12b2b}
    .prep-plan-input{background:#fff7d8}.prep-plan-input>div{display:flex;align-items:center;gap:7px}.prep-plan-input input{width:100%;min-width:0;border:1px solid #d8c878;background:#fff;border-radius:10px;padding:10px 9px;font-size:18px;font-weight:900}.prep-plan-input span{font-size:14px;font-weight:900;color:#665d2a}.prep-plan-recipe{margin-top:10px;padding:10px 12px;border-radius:12px;background:#f4f0ff;color:#54416d;font-size:13px;line-height:1.35}.prep-plan-empty{padding:18px;border:1px dashed #cbd8d1;border-radius:15px;color:#68756e;text-align:center;font-weight:700}
    .prep-upcoming{margin-top:12px}.prep-upcoming-title{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:10px}.prep-upcoming-title strong{font-size:18px}.prep-upcoming-title small{max-width:380px;color:#77837d;font-size:12px;text-align:right}.prep-upcoming-day{padding:11px 0;border-top:1px solid #edf1ef}.prep-upcoming-day>small{display:block;margin-bottom:5px;color:#078844;font-size:12px;font-weight:1000;text-transform:capitalize}.prep-upcoming-day>div{display:flex;gap:8px;flex-wrap:wrap}.prep-upcoming-day span{background:#f3f6f4;border-radius:999px;padding:7px 10px;font-size:13px}
    @media(max-width:720px){.prep-daily-plan-card,.prep-upcoming{padding:15px}.prep-plan-head{display:block}.prep-plan-head>span{display:inline-block;margin-top:8px}.prep-plan-metrics{grid-template-columns:1fr}.prep-plan-stat,.prep-plan-input{padding:10px}.prep-upcoming-title{display:block}.prep-upcoming-title small{display:block;margin-top:4px;text-align:left}.prep-plan-product strong{font-size:19px}}
  `;
  document.head.appendChild(style);
}

function renderPreparation() {
  if (!$('#prepKpis') || !$('#prepList')) return;
  ensurePlanStyles();
  ensureDailyPlanHost();

  $('#prepKpis').innerHTML = prepKpis().map(([label,value,tone]) => `
    <article class="prep-kpi ${tone}"><small>${label}</small><strong>${value}</strong></article>`).join('');

  renderDailyPlan();

  const filtered = prepOrders().filter(order => prepFilter === 'all' || order.status === prepFilter);
  $('#prepList').innerHTML = filtered.length
    ? filtered.map(prepCard).join('')
    : `<div class="prep-empty"><span>👨‍🍳</span><h3>No hay pedidos en esta etapa</h3><p>El plan del día de arriba ya cuenta todos los pedidos confirmados; no necesitas enviarlos uno por uno para saber cuánto preparar.</p></div>`;
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

function saveDailyPlanValue(input) {
  const encodedKey = input.dataset.prepPlanKey;
  if (!encodedKey) return;
  const key = decodeURIComponent(encodedKey);
  const date = todayISO();
  const plan = readPlan();
  if (!plan[date]) plan[date] = {};
  const raw = input.value.trim();
  if (raw === '') delete plan[date][key];
  else plan[date][key] = Math.max(0,Number(raw) || 0);
  writePlan(plan);
  renderDailyPlan();
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

document.addEventListener('change', event => {
  const input = event.target.closest('[data-prep-plan-key]');
  if (!input) return;
  saveDailyPlanValue(input);
});

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
