import { InventoryStore } from './data.js';

const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
}

function cleanNumber(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return '0';
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function inventoryNameForLabel(label) {
  const map = {
    'contenedor':'Contenedor ceviche 1 lb',
    'tapa':'Tapa ceviche · ½ lb / 1 lb',
    'cuchara':'Cuchara',
    'paquete de tostadas':'Tostadas'
  };
  return map[normalize(label)] || label;
}

function inventoryItem(label) {
  const wanted = normalize(inventoryNameForLabel(label));
  return InventoryStore.list().find(item=>normalize(item.name)===wanted) || null;
}

function enhancePurchaseRows() {
  const view = $('#purchasesView');
  if (!view) return;

  const heading = $('.purchase-final-heading span',view);
  if (heading && normalize(heading.textContent).includes('necesitas')) heading.textContent = 'Compra para';

  const empty = $('.purchase-final-empty',view);
  if (empty && normalize(empty.textContent).includes('necesitas comprar')) {
    empty.textContent = 'Escribe cuánto vas a preparar y aquí salen las cantidades.';
  }

  $$('.purchase-final-row',view).forEach(row=>{
    const info = row.firstElementChild;
    const name = $('strong',info)?.textContent?.trim() || '';
    const amount = $('small:not(.purchase-stock-reference)',info);
    if (amount) amount.textContent = amount.textContent.replace(/^Necesitas\s+/i,'');

    let stock = $('.purchase-stock-reference',info);
    if (!stock) {
      stock = document.createElement('small');
      stock.className = 'purchase-stock-reference';
      info?.appendChild(stock);
    }

    const item = inventoryItem(name);
    stock.textContent = item
      ? `Inventario: ${cleanNumber(item.qty)} ${item.unit || ''}`.trim()
      : 'Inventario: —';
  });
}

function installStyles() {
  if ($('#purchaseStockReferenceStyles')) return;
  const style = document.createElement('style');
  style.id = 'purchaseStockReferenceStyles';
  style.textContent = '.purchase-stock-reference{color:#078844!important;font-weight:1000!important;font-size:12px!important}';
  document.head.appendChild(style);
}

let scheduled = false;
function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(()=>{
    scheduled = false;
    enhancePurchaseRows();
  });
}

installStyles();
schedule();
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('panel:inventory-changed',schedule);
