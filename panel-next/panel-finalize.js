import { InventoryStore } from './data.js';
import { BusinessCore } from './business-core.js';
import './orders-polish.js?v=20260910-1315';

const SHRIMP_FIX_KEY = 'panel-next-shrimp-operational-fix-v1';

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
}

function fixShrimpOperationalUnit() {
  const shrimp = InventoryStore.list().find(item=>normalize(item.name)==='camaron');
  if (!shrimp) return;

  const patch = { purchaseUnit:'bolsa', contentQty:12, contentUnit:'oz' };
  const unit = String(shrimp.unit || '').trim();
  if (unit === 'lb') {
    patch.unit = 'oz';
    patch.qty = Number(shrimp.qty || 0) * 16;
    patch.minimum = Number(shrimp.minimum || 0) * 16;
  } else if (!unit) {
    patch.unit = 'oz';
  }

  // Un recibo de 2 bolsas ($14.84) se había guardado como si fuera el precio de 1 bolsa.
  const price = Number(shrimp.purchasePrice || 0);
  if (Math.abs(price - 14.84) < 0.001) patch.purchasePrice = 7.42;

  const changed = Object.entries(patch).some(([key,value])=>String(shrimp[key] ?? '') !== String(value));
  if (!changed) return;

  BusinessCore.withMovementContext({source:'data-correction',reference:SHRIMP_FIX_KEY},()=>{
    InventoryStore.update(shrimp.id,patch);
  });
  try { localStorage.setItem(SHRIMP_FIX_KEY,'done'); } catch (_) {}
  window.dispatchEvent(new CustomEvent('panel:inventory-changed',{detail:{source:'data-correction'}}));
}

function syncHomeMode() {
  const home = document.getElementById('homeView');
  if (!home) return;
  document.body.classList.toggle('core-home',home.classList.contains('active'));
}

fixShrimpOperationalUnit();
syncHomeMode();

window.addEventListener('panel:inventory-changed',event=>{
  if (event.detail?.source === 'legacy-price-migration') setTimeout(fixShrimpOperationalUnit,0);
});

new MutationObserver(syncHomeMode).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
