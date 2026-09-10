import { InventoryStore } from './data.js';

const $ = selector => document.querySelector(selector);

const money = new Intl.NumberFormat('es-US',{style:'currency',currency:'USD'});
const DIRECT_UNITS = new Set(['lb','oz','kg','g','L','ml','fl oz','galón','pieza']);
const PACKAGE_UNITS = new Set(['bolsa','caja','paquete','botella','lata','manojo','charola','bote']);
const UNIT_META = {
  g:{group:'mass',factor:1}, kg:{group:'mass',factor:1000}, oz:{group:'mass',factor:28.349523125}, lb:{group:'mass',factor:453.59237},
  ml:{group:'volume',factor:1}, L:{group:'volume',factor:1000}, 'fl oz':{group:'volume',factor:29.5735295625}, 'galón':{group:'volume',factor:3785.411784},
  pieza:{group:'count',factor:1}, unidad:{group:'count',factor:1}, pzas:{group:'count',factor:1}
};

let needsOpen = false;
let historyOpen = false;

function cleanNumber(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return '0';
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
}

function convertQty(qty, from, to) {
  const n = Number(qty);
  if (!Number.isFinite(n)) return null;
  if (from === to) return n;
  const source = UNIT_META[from];
  const target = UNIT_META[to];
  if (!source || !target || source.group !== target.group) return null;
  return n * source.factor / target.factor;
}

function inventoryItem(name) {
  const key = normalize(name);
  return InventoryStore.list().find(item => normalize(item.name) === key) || null;
}

function pluralUnit(unit, qty) {
  if (Number(qty) === 1) return unit;
  const map = {bolsa:'bolsas',caja:'cajas',paquete:'paquetes',botella:'botellas',lata:'latas',manojo:'manojos',charola:'charolas',bote:'botes',pieza:'piezas'};
  return map[unit] || unit;
}

function parseNeed(text) {
  const match = String(text || '').trim().match(/^([0-9]+(?:\.[0-9]+)?)\s+(.+)$/);
  return match ? { qty:Number(match[1]), unit:match[2].trim() } : null;
}

function purchaseSuggestion(name, needText) {
  const need = parseNeed(needText);
  const item = inventoryItem(name);
  if (!need || !item) return '';

  const purchaseUnit = String(item.purchaseUnit || item.unit || '').trim();
  const contentQty = Number(item.contentQty || 0);
  const contentUnit = String(item.contentUnit || item.unit || '').trim();

  if (DIRECT_UNITS.has(purchaseUnit)) {
    const directQty = convertQty(need.qty, need.unit, purchaseUnit);
    if (directQty !== null) return `Compra ${cleanNumber(directQty)} ${pluralUnit(purchaseUnit,directQty)}`;
  }

  if (PACKAGE_UNITS.has(purchaseUnit) && contentQty > 0 && contentUnit) {
    const neededInContentUnit = convertQty(need.qty, need.unit, contentUnit);
    if (neededInContentUnit !== null) {
      const packages = Math.max(1,Math.ceil((neededInContentUnit / contentQty) - 1e-9));
      return `Compra ${packages} ${pluralUnit(purchaseUnit,packages)} de ${cleanNumber(contentQty)} ${contentUnit}`;
    }
  }

  return purchaseUnit ? `Compra según presentación (${purchaseUnit})` : '';
}

function simplifyCalculator() {
  const view = $('#purchasesView');
  const result = $('#purchaseCalculatorResult');
  if (!view || !result) return;

  const subtitle = view.querySelector('.purchase-calculator-section .purchase-section-title small');
  if (subtitle) subtitle.textContent = 'Elige el platillo y cuánto quieres comprar.';

  const sourceRows = [...result.querySelectorAll('.purchase-calc-row')];
  if (!sourceRows.length) return;

  const rows = sourceRows.map(row => {
    const name = row.querySelector('strong')?.textContent?.trim() || 'Producto';
    const need = row.querySelector('b')?.textContent?.trim() || '—';
    return { name, need, buy:purchaseSuggestion(name,need) };
  });

  result.innerHTML = `
    <button class="purchase-collapse-button" data-purchase-toggle="needs" type="button" aria-expanded="${needsOpen}">
      <span>${needsOpen ? '▼' : '▶'} Compra necesaria</span><b>${rows.length}</b>
    </button>
    <div class="purchase-needs-list" ${needsOpen ? '' : 'hidden'}>
      ${rows.map(row=>`<div class="purchase-need-row"><div><strong>${row.name}</strong><small>Necesitas ${row.need}</small></div><b>${row.buy || row.need}</b></div>`).join('')}
    </div>`;
}

function simplifyHistory() {
  const view = $('#purchasesView');
  if (!view) return;

  const sections = [...view.querySelectorAll('.purchase-section')];
  const historySection = sections.find(section => section.querySelector('.purchase-history'));
  if (!historySection) return;

  const history = historySection.querySelector('.purchase-history');
  const cards = [...historySection.querySelectorAll('.purchase-history-card')];
  historySection.querySelector('.purchase-section-title')?.remove();

  let toggle = historySection.querySelector('[data-purchase-toggle="history"]');
  if (!toggle) {
    toggle = document.createElement('button');
    toggle.className = 'purchase-collapse-button history';
    toggle.dataset.purchaseToggle = 'history';
    toggle.type = 'button';
    historySection.insertBefore(toggle,history);
  }
  toggle.setAttribute('aria-expanded',String(historyOpen));
  toggle.innerHTML = `<span>${historyOpen ? '▼' : '▶'} Compras recientes</span><b>${cards.length}</b>`;
  if (history) history.hidden = !historyOpen;

  cards.forEach(card => {
    card.querySelector('.purchase-stock-ok')?.remove();
    const meta = card.querySelector('.purchase-meta');
    if (meta) [...meta.children].slice(2).forEach(node => node.remove());
  });
}

function rewritePreview() {
  const box = $('#simplePurchasePreview');
  if (!box) return;

  const item = $('#simplePurchaseProduct');
  if (!item?.value) return;

  const qty = Number($('#simplePurchaseQty')?.value || 0);
  const presentation = $('#simplePurchasePresentation')?.value || '';
  const direct = DIRECT_UNITS.has(presentation);
  const contentQty = direct ? 1 : Number($('#simplePurchaseContentQty')?.value || 0);
  const contentUnit = direct ? presentation : ($('#simplePurchaseContentUnit')?.value || '');
  const price = Number($('#simplePurchasePrice')?.value || 0);
  const rows = box.querySelectorAll('.purchase-preview-row');
  if (rows.length < 4 || !(qty > 0)) return;

  const inventoryQty = direct ? qty : qty * contentQty;
  const inventoryUnit = direct ? presentation : contentUnit;
  const inventoryStrong = rows[1].querySelector('strong');
  if (inventoryStrong && inventoryUnit) inventoryStrong.textContent = `+${cleanNumber(inventoryQty)} ${inventoryUnit}`;

  const costPerUnit = contentQty > 0 ? price / contentQty : null;
  const costLabel = rows[3].querySelector('span');
  const costStrong = rows[3].querySelector('strong');
  if (costLabel && inventoryUnit) costLabel.textContent = `Costo por ${inventoryUnit}`;
  if (costStrong && costPerUnit !== null && Number.isFinite(costPerUnit)) costStrong.textContent = money.format(costPerUnit);
}

function injectStyles() {
  if ($('#purchaseCleanupStyles')) return;
  const style = document.createElement('style');
  style.id = 'purchaseCleanupStyles';
  style.textContent = `
    .purchase-collapse-button{width:100%;margin-top:12px;border:1px solid #dce5e0;border-radius:15px;background:#fff;padding:13px 15px;display:flex;align-items:center;justify-content:space-between;gap:12px;color:#203129;font:inherit;font-weight:1000;text-align:left}.purchase-collapse-button span{font-size:18px}.purchase-collapse-button b{min-width:31px;height:31px;border-radius:999px;background:#eef7f2;color:#078844;display:grid;place-items:center;font-size:14px}.purchase-collapse-button.history{margin-top:0}
    .purchase-needs-list{display:grid;gap:7px;margin-top:8px}.purchase-needs-list[hidden],.purchase-history[hidden]{display:none!important}.purchase-need-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;background:#f6f8f7;border:1px solid #e2e8e5;border-radius:12px;padding:10px 12px}.purchase-need-row>div{display:grid;gap:2px}.purchase-need-row strong{font-size:15px}.purchase-need-row small{font-size:12px;color:#6e7b74;font-weight:800}.purchase-need-row>b{font-size:14px;text-align:right;max-width:210px;color:#078844}
    .purchase-history-card .purchase-meta{grid-template-columns:1fr 1fr!important}.purchase-history-card .purchase-stock-ok{display:none!important}
    @media(max-width:720px){.purchase-need-row{grid-template-columns:minmax(0,1fr) auto}.purchase-need-row>b{max-width:145px;font-size:13px}.purchase-history-card .purchase-meta{grid-template-columns:1fr 1fr!important}}
  `;
  document.head.appendChild(style);
}

function cleanView() {
  injectStyles();
  simplifyCalculator();
  simplifyHistory();
  rewritePreview();
}

const purchaseObserver = new MutationObserver(() => {
  purchaseObserver.disconnect();
  cleanView();
  observePurchases();
});

function observePurchases() {
  const view = $('#purchasesView');
  if (view) purchaseObserver.observe(view,{childList:true,subtree:true});
}

document.addEventListener('click',event => {
  const toggle = event.target.closest('[data-purchase-toggle]');
  if (toggle) {
    event.preventDefault();
    event.stopPropagation();
    if (toggle.dataset.purchaseToggle === 'needs') needsOpen = !needsOpen;
    if (toggle.dataset.purchaseToggle === 'history') historyOpen = !historyOpen;
    purchaseObserver.disconnect();
    cleanView();
    observePurchases();
    return;
  }
  if (event.target.closest('[data-module="compras"]')) {
    needsOpen = false;
    historyOpen = false;
    setTimeout(()=>{ purchaseObserver.disconnect(); cleanView(); observePurchases(); },20);
  }
  if (event.target.closest('#simpleNewPurchase,[data-buy-product],[data-plan-buy-product]')) setTimeout(rewritePreview,0);
},true);

document.addEventListener('input',event => {
  if (event.target.closest('#simplePurchaseModal')) setTimeout(rewritePreview,0);
},true);
document.addEventListener('change',event => {
  if (event.target.closest('#simplePurchaseModal')) setTimeout(rewritePreview,0);
},true);

cleanView();
observePurchases();
