const $ = selector => document.querySelector(selector);

const money = new Intl.NumberFormat('es-US',{style:'currency',currency:'USD'});
const DIRECT_UNITS = new Set(['lb','oz','kg','g','L','ml','fl oz','galón','pieza']);

function cleanNumber(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return '0';
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function simplifyCalculator() {
  const view = $('#purchasesView');
  if (!view) return;

  const subtitle = view.querySelector('.purchase-calculator-section .purchase-section-title small');
  if (subtitle) subtitle.textContent = 'Elige el platillo y la cantidad. Aquí ves los ingredientes necesarios.';

  view.querySelectorAll('.purchase-calc-row small').forEach(node => node.remove());
  view.querySelectorAll('[data-calculator-buy-product]').forEach(node => node.remove());
  view.querySelectorAll('.purchase-calc-summary').forEach(node => node.remove());
}

function simplifyHistory() {
  const view = $('#purchasesView');
  if (!view) return;

  const sections = [...view.querySelectorAll('.purchase-section')];
  const historySection = sections.find(section => section.querySelector('.purchase-history'));
  const subtitle = historySection?.querySelector('.purchase-section-title small');
  if (subtitle) subtitle.textContent = 'Registro de lo que realmente compraste.';

  view.querySelectorAll('.purchase-history-card').forEach(card => {
    card.querySelector('.purchase-stock-ok')?.remove();
    const meta = card.querySelector('.purchase-meta');
    if (meta) {
      [...meta.children].slice(2).forEach(node => node.remove());
    }
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
    .purchase-calc-summary{display:none!important}
    .purchase-calc-row{grid-template-columns:minmax(0,1fr) auto!important;padding:10px 12px!important;min-height:0!important}
    .purchase-calc-row div{display:block!important}
    .purchase-calc-row small,.purchase-calc-row button{display:none!important}
    .purchase-calc-row strong{font-size:16px!important}
    .purchase-calc-row b{font-size:17px!important}
    .purchase-history-card .purchase-meta{grid-template-columns:1fr 1fr!important}
    .purchase-history-card .purchase-stock-ok{display:none!important}
    @media(max-width:720px){
      .purchase-calc-row{grid-template-columns:minmax(0,1fr) auto!important}
      .purchase-history-card .purchase-meta{grid-template-columns:1fr 1fr!important}
    }
  `;
  document.head.appendChild(style);
}

function cleanView() {
  injectStyles();
  simplifyCalculator();
  simplifyHistory();
  rewritePreview();
}

let scheduled = false;
function scheduleClean() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    cleanView();
  });
}

new MutationObserver(scheduleClean).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('input',event => {
  if (event.target.closest('#simplePurchaseModal')) setTimeout(rewritePreview,0);
},true);
document.addEventListener('change',event => {
  if (event.target.closest('#simplePurchaseModal')) setTimeout(rewritePreview,0);
},true);

cleanView();
