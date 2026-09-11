import { OrdersStore } from './data.js';

const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const PLAN_KEY = 'panel-preparation-plan-v1';

let selectedDay = null;
let expandedOrderId = null;
let wasOrdersActive = false;
let rendering = false;

function localDateISO(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0,10);
}

function dayISO(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return localDateISO(date);
}

function shortDate(value) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-MX',{day:'2-digit',month:'2-digit'}).format(date);
}

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .trim()
    .toLowerCase();
}

function productKey(name, unit) {
  return `${String(name || '').trim().toLowerCase()}__${String(unit || '').trim().toLowerCase()}`;
}

function formatQty(value) {
  const qty = Number(value || 0);
  return Number.isInteger(qty) ? String(qty) : String(Math.round(qty * 100) / 100);
}

function readPlan() {
  try {
    const raw = JSON.parse(localStorage.getItem(PLAN_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch (_) {
    return {};
  }
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
        if (!map.has(key)) map.set(key,{key,name,unit,qty:0});
        map.get(key).qty += Number(item.qty || 0);
      });
    });
  return map;
}

function knownProducts(dateISO) {
  const map = aggregateOrders(dateISO);
  return new Map([...map.values()].map(row=>[row.key,row]));
}

function extrasForDay(dateISO) {
  const dayPlan = readPlan()[dateISO] || {};
  const ordered = aggregateOrders(dateISO);
  const known = knownProducts(dateISO);
  const rows = [];

  Object.entries(dayPlan).forEach(([key,plannedRaw])=>{
    const planned = Number(plannedRaw || 0);
    if (!(planned > 0)) return;
    const orderRow = ordered.get(key);
    const available = planned - Number(orderRow?.qty || 0);
    const parsed = key.split('__');
    rows.push({
      key,
      name:orderRow?.name || known.get(key)?.name || parsed[0] || 'Producto',
      unit:orderRow?.unit || known.get(key)?.unit || parsed[1] || '',
      planned,
      ordered:Number(orderRow?.qty || 0),
      available
    });
  });
  return rows;
}

function countForDay(value) {
  return OrdersStore.list().filter(order => String(order.date || '') === value && order.status !== 'cancelled').length;
}

function money(value) {
  if (value === null || value === undefined || value === '') return '—';
  return new Intl.NumberFormat('es-US',{style:'currency',currency:'USD'}).format(Number(value || 0));
}

function installStyles() {
  if ($('#ordersJoyStyles')) return;
  const style = document.createElement('style');
  style.id = 'ordersJoyStyles';
  style.textContent = `
    #ordersView{position:relative}
    #ordersView:before{content:"";position:absolute;inset:72px -12px auto;height:180px;pointer-events:none;z-index:-1;background:radial-gradient(circle at 12% 25%,rgba(255,210,51,.16),transparent 34%),radial-gradient(circle at 88% 15%,rgba(20,169,93,.13),transparent 36%)}
    #ordersView #orderKpis{display:none!important}
    #ordersView #orderDayFilter{display:none!important}
    #ordersView .module-topbar{background:linear-gradient(135deg,#f8fff9,#fff9df);border:1px solid #dbe9df;border-radius:18px;padding:10px 11px;box-shadow:0 8px 18px rgba(26,48,39,.06)}
    #ordersView #newOrderButton{background:linear-gradient(135deg,#078844,#12aa5b)!important;color:#fff!important;border:0!important;box-shadow:0 8px 18px rgba(7,136,68,.22)!important}
    #ordersView .orders-toolbar{margin-top:12px}
    #ordersView .orders-search{background:#fff!important;border:1px solid #d8e5dd!important;border-radius:16px!important;box-shadow:0 5px 14px rgba(30,50,42,.05)!important}
    #ordersView [data-order-action="prepare"]{display:none!important}
    .orders-extra-stock{margin:12px 0 2px;border:1px solid #cfe9d9;border-radius:18px;padding:14px;background:linear-gradient(135deg,#eafff1,#fff8cf);box-shadow:0 7px 17px rgba(25,46,37,.06)}
    .orders-extra-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.orders-extra-head small{font-size:11px;font-weight:1000;letter-spacing:.05em;color:#08713a}.orders-extra-head strong{font-size:19px;color:#173c27}
    .orders-extra-chips{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.orders-extra-chip{border-radius:999px;padding:7px 10px;background:#fff;color:#2d3b33;font-size:13px;font-weight:900;border:1px solid #dce8e0}.orders-extra-chip b{color:#078844}.orders-extra-none{margin-top:7px;color:#6f786f;font-size:13px;font-weight:800}
    .orders-day-choices{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0 10px}
    .orders-day-button{position:relative;overflow:hidden;border:0;border-radius:18px;min-height:88px;padding:13px 14px;display:grid;grid-template-columns:1fr auto;align-items:center;text-align:left;color:#fff;box-shadow:0 8px 18px rgba(30,50,42,.12)}
    .orders-day-button:before{content:"";position:absolute;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,.12);right:-24px;top:-24px}
    .orders-day-button.today{background:linear-gradient(135deg,#078844,#13ad61)}
    .orders-day-button.tomorrow{background:linear-gradient(135deg,#f09a18,#ffbd36);color:#4b2f00}
    .orders-day-button.active{outline:3px solid rgba(26,38,31,.16);transform:translateY(-1px)}
    .orders-day-copy{display:grid;gap:3px;position:relative;z-index:1}.orders-day-copy strong{font-size:18px;line-height:1;font-weight:1000}.orders-day-copy small{font-size:13px;font-weight:900;opacity:.92}
    .orders-day-count{position:relative;z-index:1;display:grid;place-items:center;min-width:42px;height:42px;padding:0 10px;border-radius:50%;background:rgba(255,255,255,.92);color:#078844;font-size:20px;font-weight:1000;box-shadow:0 4px 10px rgba(0,0,0,.10)}
    .orders-day-button.tomorrow .orders-day-count{color:#8a5500}
    #ordersView .status-tabs{margin-top:8px!important;padding:3px 1px 9px!important}#ordersView .status-tabs button{border:0!important;box-shadow:0 4px 10px rgba(26,48,39,.06)}
    #ordersView .status-tabs button[data-status="active"]{background:#dff5e9;color:#08713a}#ordersView .status-tabs button[data-status="pending"]{background:#fff0b9;color:#715300}#ordersView .status-tabs button[data-status="ready"]{background:#dff3ff;color:#145b80}#ordersView .status-tabs button[data-status="delivered"]{background:#eee6ff;color:#51318c}#ordersView .status-tabs button[data-status="all"]{display:inline-flex!important;background:#eef1ef;color:#39443e}#ordersView .status-tabs button.active{background:#111!important;color:#fff!important}
    .orders-start-card,.orders-day-empty{margin-top:12px;border-radius:20px;padding:28px 18px;text-align:center;border:1px dashed #cfe0d6;background:linear-gradient(145deg,#f2fff7,#fff9df);color:#526159}.orders-start-card .orders-start-icon,.orders-day-empty .orders-start-icon{font-size:38px;display:block;margin-bottom:8px}.orders-start-card strong,.orders-day-empty strong{display:block;font-size:20px;color:#173c27}.orders-start-card small,.orders-day-empty small{display:block;margin-top:5px;font-size:14px;font-weight:800}
    #ordersView .orders-list{gap:10px!important}#ordersView .order-card{position:relative;border-radius:17px!important;border:1px solid #dce7e1!important;border-left:6px solid #078844!important;box-shadow:0 7px 17px rgba(25,46,37,.07)!important;overflow:hidden!important;transition:.16s ease;background:linear-gradient(145deg,#fff,#fbfffc)!important}#ordersView .order-card:nth-of-type(3n+2){border-left-color:#f1ae25!important}#ordersView .order-card:nth-of-type(3n+3){border-left-color:#8d72d9!important}#ordersView .order-card-head{cursor:pointer;align-items:center!important}
    .order-accordion-summary{display:flex;align-items:center;gap:9px;margin-left:auto;padding-left:8px}.order-accordion-total{font-size:20px;font-weight:1000;color:#078844;white-space:nowrap}.order-accordion-chevron{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#eef7f1;color:#078844;font-size:21px;font-weight:1000;transition:transform .16s ease}#ordersView .order-card:not(.order-collapsed) .order-accordion-chevron{transform:rotate(180deg)}
    #ordersView .order-card.order-collapsed{padding-top:14px!important;padding-bottom:14px!important}#ordersView .order-card.order-collapsed .order-main-line,#ordersView .order-card.order-collapsed .order-info-grid,#ordersView .order-card.order-collapsed .order-note,#ordersView .order-card.order-collapsed .order-card-actions{display:none!important}#ordersView .order-card:not(.order-collapsed){box-shadow:0 10px 24px rgba(7,136,68,.11)!important}#ordersView .order-card-actions{padding-top:3px}#ordersView .order-action{border-radius:10px!important}
    .prep-morning-summary{margin:0 0 12px;border-radius:20px;padding:15px;background:linear-gradient(135deg,#078844,#12a75a);color:#fff;box-shadow:0 9px 20px rgba(7,136,68,.18)}.prep-morning-summary small{display:block;font-size:11px;font-weight:1000;letter-spacing:.06em;opacity:.88}.prep-morning-summary h3{margin:4px 0 0;font-size:22px}.prep-morning-total{font-size:30px!important;font-weight:1000}.prep-morning-breakdown{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.prep-morning-breakdown span{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.23);border-radius:999px;padding:7px 10px;font-size:13px;font-weight:900}
    @media(max-width:560px){.orders-day-button{min-height:82px;padding:12px 11px}.orders-day-copy strong{font-size:16px}.orders-day-count{min-width:38px;height:38px;font-size:18px}.order-accordion-summary{gap:6px}.order-accordion-total{font-size:17px}.order-accordion-chevron{width:28px;height:28px}#ordersView .order-card-head{gap:7px!important}#ordersView .order-card h3{font-size:21px!important}#ordersView .status{font-size:10px!important;padding:7px 8px!important}}
  `;
  document.head.appendChild(style);
}

function ensureExtraStock() {
  const view = $('#ordersView');
  const toolbar = view?.querySelector('.orders-toolbar');
  if (!view || !toolbar) return null;
  let host = $('#ordersExtraStock');
  if (!host) {
    host = document.createElement('div');
    host.id = 'ordersExtraStock';
    host.className = 'orders-extra-stock';
    toolbar.insertAdjacentElement('beforebegin',host);
  }
  return host;
}

function renderExtraStock() {
  const host = ensureExtraStock();
  if (!host) return;
  const rows = extrasForDay(dayISO(0)).filter(row=>row.available > 0.0001);
  const lbTotal = rows.filter(row=>normalize(row.unit) === 'lb').reduce((sum,row)=>sum+row.available,0);
  host.innerHTML = `
    <div class="orders-extra-head"><div><small>PRODUCCIÓN DE ESTA MAÑANA</small><strong>Extras disponibles</strong></div><strong>${formatQty(lbTotal)} lb</strong></div>
    ${rows.length
      ? `<div class="orders-extra-chips">${rows.map(row=>`<span class="orders-extra-chip">${row.name}: <b>${formatQty(row.available)} ${row.unit}</b></span>`).join('')}</div>`
      : '<div class="orders-extra-none">Sin producto extra disponible registrado hoy.</div>'}`;
}

function ensureDayChoices() {
  const view = $('#ordersView');
  const toolbar = view?.querySelector('.orders-toolbar');
  if (!view || !toolbar) return null;
  let host = $('#ordersDayChoices');
  if (!host) {
    host = document.createElement('div');
    host.id = 'ordersDayChoices';
    host.className = 'orders-day-choices';
    toolbar.insertAdjacentElement('beforebegin',host);
  }
  return host;
}

function renderDayChoices() {
  const host = ensureDayChoices();
  if (!host) return;
  const today = dayISO(0);
  const tomorrow = dayISO(1);
  host.innerHTML = `
    <button type="button" class="orders-day-button today ${selectedDay === 'today' ? 'active' : ''}" data-local-order-day="today"><span class="orders-day-copy"><strong>📅 PEDIDOS HOY</strong><small>${shortDate(today)}</small></span><span class="orders-day-count">${countForDay(today)}</span></button>
    <button type="button" class="orders-day-button tomorrow ${selectedDay === 'tomorrow' ? 'active' : ''}" data-local-order-day="tomorrow"><span class="orders-day-copy"><strong>☀️ PEDIDOS MAÑANA</strong><small>${shortDate(tomorrow)}</small></span><span class="orders-day-count">${countForDay(tomorrow)}</span></button>`;
}

function ensureStartCard() {
  const list = $('#ordersList');
  if (!list) return null;
  let card = $('#ordersStartCard');
  if (!card) {
    card = document.createElement('div');
    card.id = 'ordersStartCard';
    card.className = 'orders-start-card';
    card.innerHTML = '<span class="orders-start-icon">🌞</span><strong>¿Qué pedidos quieres ver?</strong><small>Toca Hoy o Mañana para desplegarlos.</small>';
    list.insertAdjacentElement('beforebegin',card);
  }
  return card;
}

function ensureDayEmpty() {
  let empty = $('#ordersDayEmpty');
  const list = $('#ordersList');
  if (!list) return null;
  if (!empty) {
    empty = document.createElement('div');
    empty.id = 'ordersDayEmpty';
    empty.className = 'orders-day-empty';
    empty.innerHTML = '<span class="orders-start-icon">🌿</span><strong>No hay pedidos en esta vista</strong><small>Prueba otro estado o registra un + Pedido.</small>';
    list.insertAdjacentElement('afterend',empty);
  }
  return empty;
}

function renderMorningSummary() {
  const kpis = $('#prepKpis');
  if (!kpis) return;
  let host = $('#prepMorningSummary');
  if (!host) {
    host = document.createElement('section');
    host.id = 'prepMorningSummary';
    host.className = 'prep-morning-summary';
    kpis.insertAdjacentElement('afterend',host);
  }
  const rows = [...aggregateOrders(dayISO(0)).values()];
  const lbTotal = rows.filter(row=>normalize(row.unit) === 'lb').reduce((sum,row)=>sum+row.qty,0);
  host.innerHTML = `<small>PEDIDOS CONFIRMADOS DE HOY</small><h3>Encargado para preparar</h3><div class="prep-morning-total">${formatQty(lbTotal)} lb</div>${rows.length ? `<div class="prep-morning-breakdown">${rows.map(row=>`<span>${row.name}: ${formatQty(row.qty)} ${row.unit}</span>`).join('')}</div>` : '<div class="prep-morning-breakdown"><span>Sin pedidos registrados para hoy</span></div>'}`;

  $$('.prep-dish-input small').forEach(node=>{ if (/cantidad por preparar/i.test(node.textContent || '')) node.textContent = 'Preparar hoy'; });
  $$('.prep-dish-stat.available small').forEach(node=>{ node.textContent = 'Extras disponibles'; });
}

function forceAllDatesForApp() {
  const select = $('#orderDayFilter');
  if (!select || select.value === 'all') return false;
  select.value = 'all';
  select.dispatchEvent(new Event('change',{bubbles:true}));
  return true;
}

function showAllStatuses() {
  const button = $('#statusTabs [data-status="all"]');
  if (!button || button.classList.contains('active')) return false;
  button.click();
  return true;
}

function decorateCard(card, order) {
  const head = $('.order-card-head',card);
  if (!head || !order) return;
  let summary = $('.order-accordion-summary',head);
  if (!summary) {
    summary = document.createElement('div');
    summary.className = 'order-accordion-summary';
    head.appendChild(summary);
  }
  summary.innerHTML = `<span class="order-accordion-total">${money(order.total)}</span><span class="order-accordion-chevron" aria-hidden="true">⌄</span>`;
  head.setAttribute('role','button');
  head.setAttribute('tabindex','0');
  const expanded = expandedOrderId === order.id;
  card.classList.toggle('order-collapsed',!expanded);
  card.setAttribute('aria-expanded',String(expanded));
}

function applyDayVisibility() {
  const list = $('#ordersList');
  const start = ensureStartCard();
  const dayEmpty = ensureDayEmpty();
  if (!list || !start || !dayEmpty) return;
  if (!selectedDay) {
    list.style.display = 'none';
    start.hidden = false;
    dayEmpty.hidden = true;
    return;
  }
  start.hidden = true;
  list.style.display = '';
  const targetDate = selectedDay === 'tomorrow' ? dayISO(1) : dayISO(0);
  let visible = 0;
  const ordersById = new Map(OrdersStore.list().map(order=>[order.id,order]));
  $$('.order-card[data-order-id]',list).forEach(card=>{
    const order = ordersById.get(card.dataset.orderId);
    const show = Boolean(order) && String(order.date || '') === targetDate;
    card.hidden = !show;
    if (show) { visible += 1; decorateCard(card,order); }
  });
  $$('.orders-empty',list).forEach(node=>node.hidden = true);
  dayEmpty.hidden = visible > 0;
}

function resetWhenEnteringOrders() {
  const active = $('#ordersView')?.classList.contains('active') || false;
  if (active && !wasOrdersActive) { selectedDay = null; expandedOrderId = null; }
  wasOrdersActive = active;
}

function applyOrdersUi() {
  if (rendering) return;
  rendering = true;
  try {
    installStyles();
    resetWhenEnteringOrders();
    renderExtraStock();
    renderDayChoices();
    applyDayVisibility();
    renderMorningSummary();
  } finally {
    rendering = false;
  }
}

function chooseDay(day) {
  selectedDay = day;
  expandedOrderId = null;
  renderDayChoices();
  const changedDay = forceAllDatesForApp();
  const changedStatus = showAllStatuses();
  if (changedDay || changedStatus) {
    requestAnimationFrame(applyOrdersUi);
    return;
  }
  applyDayVisibility();
}

function toggleOrder(id) {
  const previousId = expandedOrderId;
  expandedOrderId = previousId === id ? null : id;
  if (previousId && previousId !== id) {
    const previous = $(`#ordersList .order-card[data-order-id="${CSS.escape(previousId)}"]`);
    if (previous) { previous.classList.add('order-collapsed'); previous.setAttribute('aria-expanded','false'); }
  }
  const card = $(`#ordersList .order-card[data-order-id="${CSS.escape(id)}"]`);
  if (!card) return;
  const expanded = expandedOrderId === id;
  card.classList.toggle('order-collapsed',!expanded);
  card.setAttribute('aria-expanded',String(expanded));
}

document.addEventListener('click',event=>{
  const dayButton = event.target.closest('[data-local-order-day]');
  if (dayButton) { event.preventDefault(); chooseDay(dayButton.dataset.localOrderDay); return; }
  const statusButton = event.target.closest('#statusTabs [data-status]');
  if (statusButton) { requestAnimationFrame(applyDayVisibility); return; }
  const card = event.target.closest('#ordersList .order-card[data-order-id]');
  if (!card || event.target.closest('button,a,input,select,textarea,label')) return;
  toggleOrder(card.dataset.orderId);
});

document.addEventListener('keydown',event=>{
  if (!['Enter',' '].includes(event.key)) return;
  const head = event.target.closest?.('#ordersList .order-card-head');
  if (!head) return;
  event.preventDefault();
  const card = head.closest('.order-card[data-order-id]');
  if (card) toggleOrder(card.dataset.orderId);
});

document.addEventListener('change',event=>{
  if (!event.target.closest?.('[data-prep-plan-key]')) return;
  requestAnimationFrame(()=>{ renderExtraStock(); renderMorningSummary(); });
});

document.addEventListener('input',event=>{
  if (event.target.id === 'orderSearch') requestAnimationFrame(applyDayVisibility);
});

window.addEventListener('panel:orders-changed',event=>{
  const created = event.detail?.source === 'local-create' ? event.detail?.order : null;
  if (created?.date === dayISO(0)) selectedDay = 'today';
  if (created?.date === dayISO(1)) selectedDay = 'tomorrow';
  requestAnimationFrame(applyOrdersUi);
});
window.addEventListener('hashchange',()=>requestAnimationFrame(applyOrdersUi));

requestAnimationFrame(applyOrdersUi);
