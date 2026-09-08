import { OrdersStore, MenuStore } from './data.js';
import { RecipeStore } from './recipes-data.js';
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
const SELECTED_DISH_KEY = 'panel-preparation-selected-dish-v1';

let prepFilter = 'preparing';

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .trim()
    .toLowerCase();
}

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
      </div>`).join('');

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
  return [...map.values()];
}

function dailyDishes(dateISO) {
  const byName = new Map();

  RecipeStore.list()
    .filter(recipe => String(recipe.type || '').toLowerCase() === 'producto final')
    .forEach(recipe => {
      const name = String(recipe.menuItem || recipe.name || '').trim();
      if (!name) return;
      const keyName = normalize(name);
      byName.set(keyName,{
        name,
        unit:String(recipe.yieldUnit || 'unidad').trim() || 'unidad',
        qty:0,
        recipeId:recipe.id
      });
    });

  MenuStore.list().forEach(item => {
    const name = String(item.name || '').trim();
    if (!name) return;
    const keyName = normalize(name);
    if (!byName.has(keyName)) {
      byName.set(keyName,{
        name,
        unit:String(item.unit || 'unidad').trim() || 'unidad',
        qty:0,
        recipeId:null
      });
    }
  });

  aggregateOrders(dateISO).forEach(orderRow => {
    const keyName = normalize(orderRow.name);
    const existing = byName.get(keyName);
    if (!existing) {
      byName.set(keyName,{ ...orderRow, recipeId:null });
      return;
    }
    if (normalize(existing.unit) === normalize(orderRow.unit)) {
      existing.qty += Number(orderRow.qty || 0);
    }
  });

  return [...byName.values()]
    .map(row => ({ ...row, key:productKey(row.name,row.unit) }))
    .sort((a,b)=>a.name.localeCompare(b.name,'es'));
}

function readSelectedDish() {
  try { return localStorage.getItem(SELECTED_DISH_KEY) || ''; }
  catch (_) { return ''; }
}

function writeSelectedDish(key) {
  try { localStorage.setItem(SELECTED_DISH_KEY,key); }
  catch (_) {}
}

function preparationSteps(productName) {
  const name = normalize(productName);
  if (!name.includes('ceviche')) return [];

  const steps = [];
  if (name.includes('pescado') || name.includes('mixto')) {
    steps.push('Cocer el pescado y dejarlo enfriar por completo.');
  }
  if (name.includes('camaron') || name.includes('mixto')) {
    steps.push('Cocer el camarón y dejarlo enfriar por completo.');
  }
  if (name.includes('pulpo')) {
    steps.push('Tener el pulpo cocido y frío.');
  }
  steps.push('Picar tomate, pepino, cebolla morada y cilantro.');
  steps.push('Mezclar los mariscos con las verduras.');
  steps.push('Agregar el jugo de limón y el Clamato.');
  steps.push('Mezclar bien, porcionar y mantener refrigerado.');
  return steps;
}

function recipeWorkspace(row, plannedQty, hasValue) {
  const requestedQty = hasValue && plannedQty > 0 ? plannedQty : 1;
  const plan = recipePlanForItem({
    name:row.name,
    qty:requestedQty,
    unit:row.unit,
    recipeQty:requestedQty,
    recipeUnit:row.unit
  });

  if (!plan.recipe) {
    return `
      <section class="prep-dish-recipe missing">
        <h4>Receta</h4>
        <p>Este platillo todavía no tiene una receta vinculada.</p>
      </section>`;
  }

  if (!plan.compatible) {
    return `
      <section class="prep-dish-recipe missing">
        <h4>${plan.recipe.name}</h4>
        <p>La receta rinde ${formatQty(plan.recipe.yieldQty)} ${plan.recipe.yieldUnit}; la unidad del platillo es ${row.unit}. Hay que ajustar esa equivalencia.</p>
      </section>`;
  }

  const ingredientRows = plan.ingredients.map(ingredient => `
    <div class="prep-dish-ingredient">
      <span>${ingredient.name}</span>
      <strong>${amountText(ingredient)}</strong>
    </div>`).join('');

  const steps = preparationSteps(row.name);
  const procedure = steps.length
    ? `<ol>${steps.map(step=>`<li>${step}</li>`).join('')}</ol>`
    : `<p class="prep-procedure-pending">Procedimiento pendiente de configurar para este platillo.</p>`;

  const amountLabel = hasValue && plannedQty > 0
    ? `Para ${formatQty(plannedQty)} ${row.unit}`
    : `Receta base · ${formatQty(plan.recipe.yieldQty)} ${plan.recipe.yieldUnit}`;

  return `
    <section class="prep-dish-recipe">
      <div class="prep-dish-section">
        <div class="prep-dish-section-title"><h4>Ingredientes</h4><small>${amountLabel}</small></div>
        <div class="prep-dish-ingredients">${ingredientRows}</div>
      </div>
      <div class="prep-dish-section prep-dish-procedure">
        <div class="prep-dish-section-title"><h4>Preparación</h4></div>
        ${procedure}
      </div>
    </section>`;
}

function selectedDish(rows, dayPlan) {
  const stored = readSelectedDish();
  if (stored) {
    const found = rows.find(row=>row.key === stored);
    if (found) return found;
  }

  const planned = rows.find(row=>Number(dayPlan[row.key] || 0) > 0);
  if (planned) {
    writeSelectedDish(planned.key);
    return planned;
  }

  const ordered = rows.find(row=>Number(row.qty || 0) > 0);
  if (ordered) {
    writeSelectedDish(ordered.key);
    return ordered;
  }

  return null;
}

function dishWorkspace(row, dayPlan) {
  if (!row) {
    return `
      <div class="prep-dish-empty">
        <span>🍽️</span>
        <strong>Elige un platillo</strong>
        <p>Toca <b>Platillos</b> para abrir la lista y seleccionar qué vas a preparar.</p>
      </div>`;
  }

  const raw = dayPlan[row.key];
  const hasValue = raw !== '' && raw !== null && raw !== undefined;
  const planned = hasValue ? Number(raw) : 0;
  const available = hasValue ? planned - Number(row.qty || 0) : null;
  const shortage = hasValue && available < 0;
  const availableText = !hasValue
    ? '—'
    : shortage
      ? `Faltan ${formatQty(Math.abs(available))} ${row.unit}`
      : `${formatQty(available)} ${row.unit}`;
  const encodedKey = encodeURIComponent(row.key);

  return `
    <article class="prep-dish-workspace ${shortage ? 'shortage' : ''}">
      <div class="prep-dish-head">
        <div><small>PLATILLO SELECCIONADO</small><h3>${row.name}</h3></div>
        <span>${row.unit}</span>
      </div>

      <div class="prep-dish-metrics">
        <div class="prep-dish-stat">
          <small>Pedidos confirmados</small>
          <strong>${formatQty(row.qty)} ${row.unit}</strong>
        </div>
        <label class="prep-dish-input">
          <small>Cantidad por preparar</small>
          <div><input type="number" min="0" step="0.01" inputmode="decimal" data-prep-plan-key="${encodedKey}" value="${hasValue ? formatQty(planned) : ''}" placeholder="Cantidad"><span>${row.unit}</span></div>
        </label>
        <div class="prep-dish-stat available">
          <small>Disponible para vender</small>
          <strong>${availableText}</strong>
        </div>
      </div>

      ${recipeWorkspace(row,planned,hasValue)}
    </article>`;
}

function ensureDishModal() {
  if ($('#prepDishModal')) return;
  const modal = document.createElement('div');
  modal.className = 'prep-dish-modal';
  modal.id = 'prepDishModal';
  modal.hidden = true;
  modal.innerHTML = `
    <section class="prep-dish-sheet" role="dialog" aria-modal="true" aria-labelledby="prepDishModalTitle">
      <div class="prep-dish-modal-head">
        <div><small>SELECCIONA</small><h3 id="prepDishModalTitle">Platillos</h3></div>
        <button id="prepDishModalClose" type="button" aria-label="Cerrar">×</button>
      </div>
      <div class="prep-dish-options" id="prepDishOptions"></div>
    </section>`;
  document.body.appendChild(modal);
}

function renderDishOptions(rows, selectedKey) {
  ensureDishModal();
  const host = $('#prepDishOptions');
  if (!host) return;
  host.innerHTML = rows.length
    ? rows.map(row=>`
      <button class="prep-dish-option ${row.key === selectedKey ? 'selected' : ''}" data-prep-select-dish="${encodeURIComponent(row.key)}" type="button">
        <span>${row.name}</span>
        <small>${row.unit}</small>
      </button>`).join('')
    : `<div class="prep-dish-options-empty">Todavía no hay platillos configurados.</div>`;
}

function openDishModal() {
  const date = todayISO();
  const rows = dailyDishes(date);
  renderDishOptions(rows, readSelectedDish());
  $('#prepDishModal').hidden = false;
  document.body.classList.add('modal-open');
}

function closeDishModal() {
  if ($('#prepDishModal')) $('#prepDishModal').hidden = true;
  document.body.classList.remove('modal-open');
}

function renderDailyPlan() {
  const host = $('#prepDailyPlan');
  if (!host) return;
  const date = todayISO();
  const rows = dailyDishes(date);
  const plan = readPlan();
  const dayPlan = plan[date] || {};
  const selected = selectedDish(rows,dayPlan);

  host.innerHTML = `
    <section class="prep-dish-panel">
      <button class="prep-dish-picker" id="prepDishPicker" type="button">
        <span class="prep-dish-picker-icon">🍽️</span>
        <span class="prep-dish-picker-copy"><strong>Platillos</strong><small>${selected ? selected.name : 'Elegir platillo'}</small></span>
        <span class="prep-dish-picker-arrow">›</span>
      </button>
      ${dishWorkspace(selected,dayPlan)}
    </section>`;

  renderDishOptions(rows, selected?.key || '');
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
    .prep-daily-plan{margin:0 0 14px}.prep-dish-panel{display:grid;gap:12px}
    .prep-dish-picker{width:100%;border:0;border-radius:18px;background:#ffd52f;color:#1d241f;padding:14px 16px;display:flex;align-items:center;gap:12px;text-align:left;box-shadow:0 7px 18px rgba(79,67,9,.12)}.prep-dish-picker-icon{font-size:25px}.prep-dish-picker-copy{display:grid;gap:2px;flex:1}.prep-dish-picker-copy strong{font-size:20px}.prep-dish-picker-copy small{font-size:13px;font-weight:800;color:#665b23}.prep-dish-picker-arrow{font-size:34px;line-height:1;font-weight:500}
    .prep-dish-workspace{background:#fff;border:1px solid #dfe6e2;border-radius:22px;padding:17px;box-shadow:0 8px 22px rgba(25,46,37,.055)}.prep-dish-workspace.shortage{border-color:#efb5b5}.prep-dish-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.prep-dish-head small{font-size:10px;font-weight:1000;letter-spacing:.06em;color:#078844}.prep-dish-head h3{margin:4px 0 0;font-size:24px}.prep-dish-head>span{background:#eef3f0;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:1000;color:#64716a}
    .prep-dish-metrics{display:grid;grid-template-columns:1fr 1.2fr 1fr;gap:9px;margin-top:14px}.prep-dish-stat,.prep-dish-input{border-radius:14px;background:#f1f5f3;padding:11px}.prep-dish-stat small,.prep-dish-input small{display:block;margin-bottom:6px;color:#68756e;font-size:10px;font-weight:1000;text-transform:uppercase}.prep-dish-stat strong{font-size:17px}.prep-dish-stat.available{background:#eaf7ef}.prep-dish-workspace.shortage .prep-dish-stat.available{background:#fdeaea;color:#a12b2b}.prep-dish-input{background:#fff7d8}.prep-dish-input>div{display:flex;align-items:center;gap:7px}.prep-dish-input input{width:100%;min-width:0;border:1px solid #d8c878;background:#fff;border-radius:10px;padding:9px;font-size:18px;font-weight:1000}.prep-dish-input span{font-size:14px;font-weight:1000;color:#665d2a}
    .prep-dish-recipe{margin-top:14px;border:1px solid #e3e8e5;border-radius:17px;overflow:hidden}.prep-dish-recipe.missing{padding:15px;background:#fff7e9;color:#6f5328}.prep-dish-recipe.missing h4{margin:0 0 5px;font-size:18px}.prep-dish-recipe.missing p{margin:0;line-height:1.35}.prep-dish-section{padding:15px}.prep-dish-section + .prep-dish-section{border-top:1px solid #e7ece9}.prep-dish-section-title{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:10px}.prep-dish-section-title h4{margin:0;font-size:19px}.prep-dish-section-title small{font-size:12px;color:#6d7972;font-weight:900}.prep-dish-ingredients{display:grid;gap:7px}.prep-dish-ingredient{display:flex;align-items:center;justify-content:space-between;gap:15px;border-radius:11px;background:#f5f7f6;padding:10px 12px}.prep-dish-ingredient span{font-size:15px}.prep-dish-ingredient strong{font-size:16px;white-space:nowrap}.prep-dish-procedure{background:#fffaf0}.prep-dish-procedure ol{margin:0;padding-left:24px;display:grid;gap:9px}.prep-dish-procedure li{padding-left:3px;font-size:15px;line-height:1.35}.prep-procedure-pending{margin:0;color:#6a716c;font-size:14px;font-weight:700}
    .prep-dish-empty{background:#fff;border:1px dashed #cbd8d1;border-radius:20px;padding:28px 18px;text-align:center;color:#68756e}.prep-dish-empty>span{display:block;font-size:34px;margin-bottom:7px}.prep-dish-empty strong{display:block;font-size:19px;color:#263129}.prep-dish-empty p{margin:7px auto 0;max-width:380px;line-height:1.4}
    .prep-dish-modal[hidden]{display:none}.prep-dish-modal{position:fixed;inset:0;z-index:10060;background:rgba(13,20,16,.58);display:flex;align-items:flex-end;justify-content:center;padding:18px}.prep-dish-sheet{width:min(560px,100%);max-height:78vh;overflow:auto;background:#fff;border-radius:24px;padding:17px;box-shadow:0 24px 70px rgba(0,0,0,.28)}.prep-dish-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}.prep-dish-modal-head small{font-size:10px;font-weight:1000;color:#078844;letter-spacing:.07em}.prep-dish-modal-head h3{margin:2px 0 0;font-size:25px}.prep-dish-modal-head button{width:40px;height:40px;border:0;border-radius:12px;background:#f0f3f1;font-size:27px}.prep-dish-options{display:grid;gap:8px}.prep-dish-option{border:1px solid #dfe6e2;border-radius:14px;background:#fff;padding:13px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left}.prep-dish-option span{font-size:17px;font-weight:900;color:#263129}.prep-dish-option small{font-size:12px;font-weight:900;color:#738078}.prep-dish-option.selected{border-color:#078844;background:#eef8f2}.prep-dish-options-empty{padding:18px;text-align:center;color:#68756e;font-weight:800}
    @media(max-width:720px){.prep-dish-workspace{padding:14px}.prep-dish-head h3{font-size:21px}.prep-dish-metrics{grid-template-columns:1fr}.prep-dish-stat,.prep-dish-input{padding:10px}.prep-dish-section{padding:13px}.prep-dish-ingredient{padding:10px}.prep-dish-ingredient span{font-size:14px}.prep-dish-ingredient strong{font-size:15px}.prep-dish-procedure li{font-size:14px}.prep-dish-modal{padding:10px}.prep-dish-sheet{border-radius:22px 22px 16px 16px}}
  `;
  document.head.appendChild(style);
}

function renderPreparation() {
  if (!$('#prepKpis') || !$('#prepList')) return;
  ensurePlanStyles();
  ensureDailyPlanHost();
  ensureDishModal();

  $('#prepKpis').innerHTML = prepKpis().map(([label,value,tone]) => `
    <article class="prep-kpi ${tone}"><small>${label}</small><strong>${value}</strong></article>`).join('');

  renderDailyPlan();

  const filtered = prepOrders().filter(order => prepFilter === 'all' || order.status === prepFilter);
  $('#prepList').innerHTML = filtered.length
    ? filtered.map(prepCard).join('')
    : `<div class="prep-empty"><span>👨‍🍳</span><h3>No hay pedidos en esta etapa</h3><p>Usa el botón Platillos de arriba para elegir qué vas a preparar y calcular la receta.</p></div>`;
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

  if (event.target.closest('#prepDishPicker')) {
    event.preventDefault();
    openDishModal();
    return;
  }

  if (event.target.closest('#prepDishModalClose')) {
    event.preventDefault();
    closeDishModal();
    return;
  }

  const dish = event.target.closest('[data-prep-select-dish]');
  if (dish) {
    event.preventDefault();
    writeSelectedDish(decodeURIComponent(dish.dataset.prepSelectDish));
    closeDishModal();
    renderDailyPlan();
    return;
  }

  if (event.target.id === 'prepDishModal') {
    closeDishModal();
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
