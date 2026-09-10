import { OrdersStore, MenuStore } from './data.js';

const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const PLAN_KEY = 'panel-preparation-plan-v1';
let readying = false;
let modalTimer = null;

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
}

function localDateISO() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0,10);
}

function productKey(name, unit) {
  return `${String(name || '').trim().toLowerCase()}__${String(unit || '').trim().toLowerCase()}`;
}

function readPlan() {
  try {
    const value = JSON.parse(localStorage.getItem(PLAN_KEY) || '{}');
    return value && typeof value === 'object' ? value : {};
  } catch (_) { return {}; }
}

function aggregateOrders(dateISO, excludeId='') {
  const map = new Map();
  OrdersStore.list().filter(order => order.date === dateISO && order.status !== 'cancelled' && order.id !== excludeId).forEach(order => {
    (Array.isArray(order.items) ? order.items : []).forEach(item => {
      const key = productKey(item.name,item.unit);
      map.set(key,(map.get(key) || 0) + Number(item.qty || 0));
    });
  });
  return map;
}

function fitsPreparedProduction(order) {
  if (!order || order.status !== 'pending' || order.date !== localDateISO()) return false;
  const dayPlan = readPlan()[order.date] || {};
  const existing = aggregateOrders(order.date,order.id);
  const items = Array.isArray(order.items) ? order.items : [];
  if (!items.length) return false;
  return items.every(item => {
    const key = productKey(item.name,item.unit);
    const planned = Number(dayPlan[key] || 0);
    const qty = Number(item.qty || 0);
    return planned > 0 && qty > 0 && (Number(existing.get(key) || 0) + qty) <= planned + 0.0001;
  });
}

function reconcilePreparedOrders() {
  if (readying) return;
  readying = true;
  try {
    OrdersStore.list().filter(order => order.date === localDateISO() && order.status === 'pending').sort((a,b)=>(Number(a.createdAt || 0)-Number(b.createdAt || 0))).forEach(order => {
      const fresh = OrdersStore.get(order.id);
      if (!fitsPreparedProduction(fresh)) return;
      OrdersStore.update(order.id,{status:'ready',fulfilledFromExtra:true,fulfilledFromExtraAt:Date.now()});
    });
  } finally { readying = false; }
}

function installStyles() {
  if ($('#ordersFinalPolishStyles')) return;
  const style = document.createElement('style');
  style.id = 'ordersFinalPolishStyles';
  style.textContent = `
    #ordersView .orders-extra-head>div{display:grid;gap:3px;min-width:0}
    #ordersView .orders-extra-head small{display:block!important;line-height:1.15}
    #ordersView .orders-extra-head>div>strong{display:block!important;line-height:1.08;margin-top:1px}
    #orderModal .order-product-original{display:none!important}
    #orderModal .order-auto-field{display:none!important}
    #orderModal .order-product-buttons-wrap{grid-column:1/-1;margin:0 0 14px}
    #orderModal .order-product-buttons-title{font-size:13px;font-weight:1000;color:#737f79;text-transform:uppercase;margin:0 0 8px}
    #orderModal .order-product-buttons{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    #orderModal .order-product-choice{border:2px solid #d9e4de;background:#fff;color:#233129;border-radius:12px;min-height:58px;padding:10px 9px;font-size:15px;font-weight:1000;line-height:1.12;text-align:center}
    #orderModal .order-product-choice:nth-child(5n+1){background:#e8f8ee;border-color:#bfe4cd;color:#08713a}
    #orderModal .order-product-choice:nth-child(5n+2){background:#e8f4ff;border-color:#c7dff3;color:#155c91}
    #orderModal .order-product-choice:nth-child(5n+3){background:#fff4c9;border-color:#f1d77b;color:#6d5100}
    #orderModal .order-product-choice:nth-child(5n+4){background:#ffe8ef;border-color:#f1c7d4;color:#8a3453}
    #orderModal .order-product-choice:nth-child(5n+5){background:#eee8ff;border-color:#d8cef4;color:#543a8d}
    #orderModal .order-product-choice.active{background:#078844!important;border-color:#078844!important;color:#fff!important;box-shadow:0 5px 13px rgba(7,136,68,.18)}
    #orderModal .order-fixed-info{grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap;margin:-3px 0 12px}
    #orderModal .order-fixed-info span{background:#f1f6f3;border:1px solid #dde7e2;border-radius:999px;padding:7px 10px;font-size:13px;font-weight:900;color:#425149}
    @media(max-width:520px){#orderModal .order-product-choice{font-size:14px;min-height:56px;padding:8px}}
  `;
  document.head.appendChild(style);
}

function findDuplicateDayContainer(button) {
  let node = button.parentElement;
  const view = $('#ordersView');
  for (let depth=0; node && node !== view && depth<4; depth+=1,node=node.parentElement) {
    if (node.id === 'ordersDayChoices') return null;
    const buttons = $$('button',node);
    const text = normalize(node.textContent);
    if (buttons.length >= 2 && buttons.length <= 4 && text.includes('pedidos hoy') && text.includes('pedidos manana')) return node;
  }
  return null;
}

function hideDuplicateDayButtons() {
  const view = $('#ordersView');
  if (!view) return;
  $$('button',view).forEach(button => {
    if (button.closest('#ordersDayChoices')) return;
    if (!normalize(button.textContent).includes('pedidos hoy')) return;
    const container = findDuplicateDayContainer(button);
    if (container) container.style.setProperty('display','none','important');
  });
}

function configuredProduct(name) {
  const key = normalize(name);
  return MenuStore.list().find(item => normalize(item.name) === key) || null;
}

function productChoices() {
  const menu = MenuStore.list().filter(item => String(item.name || '').trim());
  if (menu.length) return menu;
  return [
    {name:'Ceviche de camarón'},
    {name:'Ceviche de pescado'},
    {name:'Ceviche mixto'},
    {name:'Ceviche pulpo y camarón'},
    {name:'Ceviche pulpo y pescado'}
  ];
}

function updateFixedInfo() {
  const host = $('#orderFixedInfo');
  const unitField = $('#orderUnit');
  const priceField = $('#orderPrice');
  if (!host || !unitField || !priceField) return;
  const product = configuredProduct($('#orderProductName')?.value || '');
  const unitLabel = unitField.closest('label');
  const priceLabel = priceField.closest('label');
  const hasUnit = Boolean(product?.unit);
  const hasPrice = product?.price !== null && product?.price !== undefined && product?.price !== '';
  unitLabel?.classList.toggle('order-auto-field',hasUnit);
  priceLabel?.classList.toggle('order-auto-field',hasPrice);
  const bits = [];
  if (hasUnit) bits.push(`<span>Unidad: <b>${product.unit}</b></span>`);
  if (hasPrice) bits.push(`<span>Precio: <b>$${Number(product.price).toFixed(2)}</b></span>`);
  host.innerHTML = bits.join('');
  host.hidden = !bits.length;
}

function renderProductButtons() {
  const modal = $('#orderModal');
  const field = $('#orderProductName');
  if (!modal || modal.hidden || !field) return false;
  const originalLabel = field.closest('label');
  const grid = originalLabel?.parentElement;
  if (!originalLabel || !grid) return false;

  originalLabel.classList.add('order-product-original');
  originalLabel.style.setProperty('display','none','important');

  let wrap = $('#orderProductButtonsWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'orderProductButtonsWrap';
    wrap.className = 'order-product-buttons-wrap';
    grid.insertBefore(wrap,originalLabel);
  }

  const selected = normalize(field.value);
  const products = productChoices();
  wrap.innerHTML = `<div class="order-product-buttons-title">Producto</div><div class="order-product-buttons">${products.map(item=>`<button type="button" class="order-product-choice ${normalize(item.name)===selected?'active':''}" data-order-product-choice="${encodeURIComponent(item.name)}">${item.name}</button>`).join('')}</div>`;

  let info = $('#orderFixedInfo');
  if (!info) {
    info = document.createElement('div');
    info.id = 'orderFixedInfo';
    info.className = 'order-fixed-info';
    const qtyLabel = $('#orderQty')?.closest('label');
    qtyLabel?.insertAdjacentElement('afterend',info);
  }
  updateFixedInfo();
  return true;
}

function selectProduct(name) {
  const field = $('#orderProductName');
  const unit = $('#orderUnit');
  const price = $('#orderPrice');
  if (!field || !unit || !price) return;
  const item = configuredProduct(name) || {name};
  field.value = item.name || name;
  if (item.unit) unit.value = item.unit;
  if (item.price !== null && item.price !== undefined && item.price !== '') price.value = item.price;
  field.dispatchEvent(new Event('change',{bubbles:true}));
  field.dispatchEvent(new Event('input',{bubbles:true}));
  unit.dispatchEvent(new Event('input',{bubbles:true}));
  price.dispatchEvent(new Event('input',{bubbles:true}));
  renderProductButtons();
  $('#orderQty')?.focus();
}

function forceModalButtons() {
  clearTimeout(modalTimer);
  [0,40,120,300].forEach(delay=>setTimeout(renderProductButtons,delay));
  modalTimer = setTimeout(renderProductButtons,600);
}

function applyPolish() {
  installStyles();
  hideDuplicateDayButtons();
  if (!$('#orderModal')?.hidden) renderProductButtons();
}

document.addEventListener('click',event => {
  const productButton = event.target.closest('[data-order-product-choice]');
  if (productButton) {
    event.preventDefault();
    event.stopPropagation();
    selectProduct(decodeURIComponent(productButton.dataset.orderProductChoice || ''));
    return;
  }
  if (event.target.closest('#newOrderButton,[data-order-action="edit"]')) forceModalButtons();
});

document.addEventListener('pointerdown',event => {
  if (event.target.id !== 'orderProductName') return;
  if (renderProductButtons()) {
    event.preventDefault();
    event.stopPropagation();
  }
},true);

window.addEventListener('panel:orders-changed',event => {
  const source = event.detail?.source || '';
  if (!readying && source !== 'local-update') {
    setTimeout(reconcilePreparedOrders,0);
    setTimeout(reconcilePreparedOrders,300);
  }
  setTimeout(applyPolish,0);
});
window.addEventListener('panel:menu-changed',forceModalButtons);

const modal = $('#orderModal');
if (modal) new MutationObserver(()=>{ if (!modal.hidden) forceModalButtons(); }).observe(modal,{attributes:true,attributeFilter:['hidden']});

new MutationObserver(()=>requestAnimationFrame(applyPolish)).observe(document.body,{childList:true,subtree:true});

applyPolish();
setTimeout(reconcilePreparedOrders,80);
setTimeout(applyPolish,150);
