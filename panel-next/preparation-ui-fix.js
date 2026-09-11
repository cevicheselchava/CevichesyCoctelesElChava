import { OrdersStore } from './data.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function localISO(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

function formatQty(value) {
  const qty = Number(value || 0);
  return Number.isInteger(qty) ? String(qty) : String(Math.round(qty * 100) / 100);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
  }[ch]));
}

function todayPreparationRows() {
  const map = new Map();
  OrdersStore.list()
    .filter(order => {
      if (String(order.date || '') !== localISO()) return false;
      if (order.directSale) return false;
      return !['cancelled','delivered'].includes(String(order.status || ''));
    })
    .forEach(order => {
      (Array.isArray(order.items) ? order.items : []).forEach(item => {
        const name = String(item.name || 'Producto').trim() || 'Producto';
        const unit = String(item.unit || '').trim();
        const key = `${name.toLowerCase()}__${unit.toLowerCase()}`;
        if (!map.has(key)) map.set(key,{ name, unit, qty:0 });
        map.get(key).qty += Number(item.qty || 0);
      });
    });
  return [...map.values()];
}

function summaryMain(rows) {
  if (!rows.length) return 'Sin pedidos por preparar';
  const units = new Set(rows.map(row => row.unit || '').filter(Boolean));
  if (units.size === 1) {
    const unit = [...units][0];
    const total = rows.reduce((sum,row)=>sum + Number(row.qty || 0),0);
    return `Por preparar: ${formatQty(total)} ${unit}`;
  }
  return `Por preparar: ${rows.length} ${rows.length === 1 ? 'producto' : 'productos'}`;
}

function removeOldSummary() {
  const view = $('#preparationView');
  if (!view) return;
  const matches = $$('article,section,div',view).filter(node => {
    if (node.id === 'prepConfirmedTop' || node.closest('#prepConfirmedTop')) return false;
    const text = String(node.textContent || '').toUpperCase();
    return text.includes('PEDIDOS CONFIRMADOS DE HOY') && text.includes('ENCARGADO PARA PREPARAR');
  });
  if (!matches.length) return;
  matches.sort((a,b)=>a.querySelectorAll('*').length - b.querySelectorAll('*').length);
  const deepest = matches[0];
  const card = deepest.closest('.prep-card,.prep-orders-summary,.prep-confirmed-summary,article,section') || deepest;
  if (card && card.id !== 'prepConfirmedTop') card.remove();
}

function ensureStyles() {
  if ($('#prepUiFixStyles')) return;
  const style = document.createElement('style');
  style.id = 'prepUiFixStyles';
  style.textContent = `
    #preparationView.active:not(.prep-ui-ready){visibility:hidden!important}
    #prepConfirmedTop{width:100%;margin:0 0 10px;border:0;border-radius:15px;background:linear-gradient(145deg,#0da653,#078844);color:#fff;padding:10px 12px;box-shadow:0 6px 14px rgba(7,136,68,.16)}
    #prepConfirmedTop .prep-confirmed-row{display:flex;align-items:center;gap:10px}
    #prepConfirmedTop .prep-confirmed-icon{font-size:24px;line-height:1;flex:0 0 auto}
    #prepConfirmedTop .prep-confirmed-copy{min-width:0;flex:1}
    #prepConfirmedTop small{display:block;font-size:10px;font-weight:1000;letter-spacing:.045em;opacity:.92;text-transform:uppercase}
    #prepConfirmedTop strong{display:block;margin-top:2px;font-size:17px;line-height:1.15}
    #prepConfirmedTop .prep-confirmed-items{display:flex;gap:6px;overflow:auto;margin-top:7px;padding-bottom:1px;scrollbar-width:none}
    #prepConfirmedTop .prep-confirmed-items::-webkit-scrollbar{display:none}
    #prepConfirmedTop .prep-confirmed-chip{flex:0 0 auto;border-radius:999px;background:rgba(255,255,255,.16);padding:5px 8px;font-size:11px;font-weight:900;white-space:nowrap}
    #prepConfirmedTop.empty{background:#eef3f0;color:#53615a;box-shadow:none;border:1px solid #dce5e0}
    .prep-dish-options{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}
    .prep-dish-option{min-height:78px!important;padding:12px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;text-align:center!important;gap:7px!important}
    .prep-dish-option span{font-size:17px!important;line-height:1.12!important}
    .prep-dish-option small{font-size:13px!important;border-radius:999px;background:#eef3f0;padding:4px 8px!important}
    .prep-dish-option.selected{box-shadow:0 0 0 2px rgba(7,136,68,.12)!important}
    @media(max-width:420px){#prepConfirmedTop{padding:9px 10px}#prepConfirmedTop strong{font-size:16px}.prep-dish-option{min-height:72px!important}.prep-dish-option span{font-size:16px!important}}
  `;
  document.head.appendChild(style);
}

function setReady(ready) {
  $('#preparationView')?.classList.toggle('prep-ui-ready',ready);
}

function renderTopSummary() {
  ensureStyles();
  const picker = $('#prepDishPicker');
  if (!picker) return;
  removeOldSummary();
  const rows = todayPreparationRows();
  let card = $('#prepConfirmedTop');
  if (!card) {
    card = document.createElement('section');
    card.id = 'prepConfirmedTop';
    picker.insertAdjacentElement('beforebegin',card);
  } else if (card.nextElementSibling !== picker) {
    picker.insertAdjacentElement('beforebegin',card);
  }
  card.classList.toggle('empty',rows.length === 0);
  card.innerHTML = `
    <div class="prep-confirmed-row">
      <span class="prep-confirmed-icon">📋</span>
      <div class="prep-confirmed-copy">
        <small>Pedidos confirmados de hoy</small>
        <strong>${escapeHtml(summaryMain(rows))}</strong>
      </div>
    </div>
    ${rows.length ? `<div class="prep-confirmed-items">${rows.map(row=>`<span class="prep-confirmed-chip">${escapeHtml(row.name)}: ${formatQty(row.qty)} ${escapeHtml(row.unit)}</span>`).join('')}</div>` : ''}
  `;
  setReady(true);
}

ensureStyles();
renderTopSummary();
window.addEventListener('panel:orders-changed',()=>{ setReady(false); queueMicrotask(renderTopSummary); });
window.addEventListener('hashchange',()=>{ setReady(false); queueMicrotask(renderTopSummary); });

document.addEventListener('click',event=>{
  if (event.target.closest('[data-module="preparacion"],#refreshPreparation,#prepDishPicker,[data-prep-select-dish]')) {
    setReady(false);
    queueMicrotask(renderTopSummary);
  }
},true);

const observer = new MutationObserver(()=>{
  if ($('#preparationView')?.classList.contains('active')) renderTopSummary();
});
observer.observe(document.body,{subtree:true,childList:true});
