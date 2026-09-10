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
    if (directQty !== null) return `${cleanNumber(directQty)} ${pluralUnit(purchaseUnit,directQty)}`;
  }

  if (PACKAGE_UNITS.has(purchaseUnit) && contentQty > 0 && contentUnit) {
    const neededInContentUnit = convertQty(need.qty, need.unit, contentUnit);
    if (neededInContentUnit !== null) {
      const packages = Math.max(1,Math.ceil((neededInContentUnit / contentQty) - 1e-9));
      return `${packages} ${pluralUnit(purchaseUnit,packages)} de ${cleanNumber(contentQty)} ${contentUnit}`;
    }
  }

  return needText;
}

function simplifyCalculator() {
  const view = $('#purchasesView');
  const result = $('#purchaseCalculatorResult');
  if (!view || !result) return;

  const kpis = view.querySelector('.purchase-kpis');
  if (kpis) kpis.hidden = true;

  const sectionTitle = view.querySelector('.purchase-calculator-section .purchase-section-title');
  if (sectionTitle) sectionTitle.hidden = true;

  const labels = [...view.querySelectorAll('.purchase-calc-controls > label')];
  if (labels[0] && labels[0].firstChild?.nodeType === Node.TEXT_NODE) labels[0].firstChild.nodeValue = 'Platillo';
  if (labels[1] && labels[1].firstChild?.nodeType === Node.TEXT_NODE) labels[1].firstChild.nodeValue = 'Cantidad';

  const newPurchase = $('#simpleNewPurchase');
  if (newPurchase) newPurchase.textContent = 'Registrar compra';

  const sourceRows = [...result.querySelectorAll('.purchase-calc-row')];
  if (!sourceRows.length) return;

  const rows = sourceRows.map(row => {
    const name = row.querySelector('strong')?.textContent?.trim() || 'Producto';
    const need = row.querySelector('b')?.textContent?.trim() || '—';
    return { name, need, buy:purchaseSuggestion(name,need) };
  });

  result.innerHTML = `<div class="purchase-direct-list">${rows.map(row=>`
    <div class="purchase-direct-row">
      <div><strong>${row.name}</strong><small>${row.need === 'Al gusto' ? 'Al gusto' : `Receta: ${row.need}`}</small></div>
      <b>${row.need === 'Al gusto' ? 'Al gusto' : row.buy}</b>
    </div>`).join('')}</div>`;
}

function hideHistory() {
  const view = $('#purchasesView');
  if (!view) return;
  const historySection = [...view.querySelectorAll('.purchase-section')].find(section => section.querySelector('.purchase-history'));
  if (historySection) historySection.hidden = true;
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
    #purchasesView .purchase-kpis[hidden],#purchasesView .purchase-section[hidden],#purchasesView .purchase-section-title[hidden]{display:none!important}
    #purchasesView .purchase-calculator-section{margin-top:8px;padding:0;background:transparent;border:0;box-shadow:none}
    #purchasesView .purchase-calc-controls{grid-template-columns:minmax(0,1.35fr) minmax(150px,.65fr);gap:12px;margin-bottom:12px}
    #purchasesView .purchase-calc-controls label{font-size:14px;color:#26362e}
    #purchasesView .purchase-calc-controls select,#purchasesView .purchase-calc-controls input{min-height:54px;border:2px solid #d7e1dc;border-radius:12px;background:#fff;font-size:18px}
    #purchasesView .purchase-calc-qty span{font-size:18px;min-width:45px}
    .purchase-direct-list{display:grid;gap:8px;margin-top:10px}
    .purchase-direct-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px;background:#fff;border:1px solid #dfe6e2;border-radius:12px;padding:12px 14px}
    .purchase-direct-row>div{display:grid;gap:3px;min-width:0}
    .purchase-direct-row strong{font-size:16px;color:#1f2d26}
    .purchase-direct-row small{font-size:12px;color:#718078;font-weight:700}
    .purchase-direct-row>b{font-size:16px;text-align:right;color:#078844;max-width:220px}
    #simpleNewPurchase{font-size:15px;white-space:nowrap}
    @media(max-width:720px){
      #purchasesView .purchase-calc-controls{grid-template-columns:1fr}
      .purchase-direct-row{grid-template-columns:minmax(0,1fr) auto;padding:11px 12px}
      .purchase-direct-row>b{font-size:14px;max-width:150px}
      #simpleNewPurchase{font-size:13px;padding-left:10px;padding-right:10px}
    }
  `;
  document.head.appendChild(style);
}

function cleanView() {
  injectStyles();
  simplifyCalculator();
  hideHistory();
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
  if (event.target.closest('[data-module="compras"]')) {
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
