import { InventoryStore } from './data.js';
import { RecipeStore } from './recipes-data.js';
import { registerPurchase, purchasePreview } from './purchases-data.js';
import { BusinessCore } from './business-core.js';

const $ = (selector, root=document) => root.querySelector(selector);
const money = new Intl.NumberFormat('es-US',{style:'currency',currency:'USD'});
const CALCULATOR_KEY = 'panel-next-purchase-calculator-v2';
const UNIT_MIGRATION_KEY = 'panel-next-operational-units-v1';

const UNIT_META = {
  g:{group:'mass',factor:1}, kg:{group:'mass',factor:1000}, oz:{group:'mass',factor:28.349523125}, lb:{group:'mass',factor:453.59237},
  ml:{group:'volume',factor:1}, L:{group:'volume',factor:1000}, 'fl oz':{group:'volume',factor:29.5735295625}, 'galón':{group:'volume',factor:3785.411784},
  pieza:{group:'count',factor:1}, unidad:{group:'count',factor:1}, pzas:{group:'count',factor:1}
};
const DIRECT_UNITS = new Set(['lb','oz','kg','g','L','ml','fl oz','galón','pieza','unidad']);
const PACKAGE_UNITS = new Set(['bolsa','caja','paquete','botella','lata','manojo','charola','bote','cubeta','rollo','costal']);
const PRESENTATIONS = ['bolsa','caja','paquete','botella','lata','manojo','charola','bote','cubeta','rollo','costal','pieza','unidad','lb','oz','kg','g','L','ml','fl oz','galón','otro'];
const CONTENT_UNITS = ['lb','oz','kg','g','pieza','unidad','ml','L','fl oz','galón','otro'];

function cleanNumber(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return '0';
  const rounded = Math.round(n * 100) / 100;
  return String(rounded);
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

function inventoryItemByName(name) {
  const key = normalize(name);
  return InventoryStore.list().find(item=>normalize(item.name)===key) || null;
}

function migrateOperationalUnits() {
  if (localStorage.getItem(UNIT_MIGRATION_KEY) === 'done') return;
  const shrimp = inventoryItemByName('Camarón');
  if (shrimp) {
    const patch = {purchaseUnit:'bolsa',contentQty:12,contentUnit:'oz'};
    if (String(shrimp.unit || '').trim() === 'lb') {
      patch.unit = 'oz';
      patch.qty = Number(shrimp.qty || 0) * 16;
      patch.minimum = Number(shrimp.minimum || 0) * 16;
    } else if (!shrimp.unit) {
      patch.unit = 'oz';
    }
    BusinessCore.withMovementContext({source:'unit-migration',reference:UNIT_MIGRATION_KEY},()=>{
      InventoryStore.update(shrimp.id,patch);
    });
  }
  localStorage.setItem(UNIT_MIGRATION_KEY,'done');
}

function finalRecipes() {
  return RecipeStore.list().filter(recipe=>String(recipe.type || '').trim().toLowerCase()==='producto final');
}

function readCalculator() {
  try {
    const value = JSON.parse(localStorage.getItem(CALCULATOR_KEY) || '{}');
    return value && typeof value === 'object' ? value : {};
  } catch (_) {
    return {};
  }
}

function writeCalculator(value) {
  try { localStorage.setItem(CALCULATOR_KEY,JSON.stringify(value)); } catch (_) {}
}

function recipeOptions(selected='') {
  return finalRecipes().map(recipe=>`<option value="${recipe.id}" ${recipe.id===selected?'selected':''}>${recipe.name}</option>`).join('');
}

function purchaseSuggestion(ingredient, qty) {
  if (ingredient.fixed === false) return 'Al gusto';
  const needQty = Number(qty || 0);
  const needUnit = String(ingredient.unit || '').trim();
  const item = inventoryItemByName(ingredient.name);
  if (!item || !(needQty >= 0)) return `${cleanNumber(needQty)} ${needUnit}`.trim();

  const purchaseUnit = String(item.purchaseUnit || item.unit || '').trim();
  const contentQty = Number(item.contentQty || 0);
  const contentUnit = String(item.contentUnit || item.unit || '').trim();

  if (DIRECT_UNITS.has(purchaseUnit)) {
    const direct = convertQty(needQty,needUnit,purchaseUnit);
    if (direct !== null) return `${cleanNumber(direct)} ${purchaseUnit}`;
  }

  if (PACKAGE_UNITS.has(purchaseUnit) && contentQty > 0 && contentUnit) {
    const inContentUnit = convertQty(needQty,needUnit,contentUnit);
    if (inContentUnit !== null) {
      const count = Math.max(1,Math.ceil((inContentUnit/contentQty)-1e-9));
      const plural = count === 1 ? purchaseUnit : ({bolsa:'bolsas',caja:'cajas',paquete:'paquetes',botella:'botellas',lata:'latas',manojo:'manojos',charola:'charolas',bote:'botes',cubeta:'cubetas',rollo:'rollos',costal:'costales'}[purchaseUnit] || purchaseUnit);
      return `${count} ${plural} de ${cleanNumber(contentQty)} ${contentUnit}`;
    }
  }

  return `${cleanNumber(needQty)} ${needUnit}`.trim();
}

function calculatorRows(recipe, targetQty) {
  const yieldQty = Number(recipe?.yieldQty || 0);
  if (!recipe || !(targetQty > 0) || !(yieldQty > 0)) return [];
  const scale = targetQty / yieldQty;
  return recipe.ingredients.map(ingredient=>{
    const exactQty = ingredient.fixed === false ? null : Number(ingredient.qty || 0) * scale;
    return {
      name:ingredient.name,
      exact:ingredient.fixed === false ? 'Al gusto' : `${cleanNumber(exactQty)} ${ingredient.unit || ''}`.trim(),
      buy:purchaseSuggestion(ingredient,exactQty)
    };
  });
}

function renderCalculatorResult() {
  const result = $('#purchaseCalculatorResult');
  const select = $('#purchaseRecipe');
  const qtyInput = $('#purchaseRecipeQty');
  const unit = $('#purchaseRecipeUnit');
  if (!result || !select || !qtyInput) return;

  const recipe = finalRecipes().find(row=>row.id===select.value) || null;
  const qty = Number(qtyInput.value || 0);
  if (unit) unit.textContent = recipe?.yieldUnit || '';
  writeCalculator({recipeId:recipe?.id || '',qty:qtyInput.value});

  if (!recipe) {
    result.innerHTML = '<div class="purchase-final-empty">No hay platillos configurados en Recetas.</div>';
    return;
  }
  if (!(qty > 0)) {
    result.innerHTML = '<div class="purchase-final-empty">Escribe la cantidad y aquí aparecerá lo que tienes que comprar.</div>';
    return;
  }

  const rows = calculatorRows(recipe,qty);
  result.innerHTML = `
    <div class="purchase-final-heading"><span>Comprar para</span><strong>${cleanNumber(qty)} ${recipe.yieldUnit} · ${recipe.name}</strong></div>
    <div class="purchase-final-list">
      ${rows.map(row=>`<div class="purchase-final-row"><div><strong>${row.name}</strong><small>${row.exact}</small></div><b>${row.buy}</b></div>`).join('')}
    </div>`;
}

function presentationOptions(selected='') {
  return PRESENTATIONS.map(value=>`<option value="${value}" ${value===selected?'selected':''}>${value}</option>`).join('');
}

function contentUnitOptions(selected='') {
  return CONTENT_UNITS.map(value=>`<option value="${value}" ${value===selected?'selected':''}>${value}</option>`).join('');
}

function itemOptions(selected='') {
  return InventoryStore.list().map(item=>`<option value="${item.id}" ${item.id===selected?'selected':''}>${item.name}</option>`).join('');
}

function selectedItem() {
  const id = $('#simplePurchaseProduct')?.value;
  return InventoryStore.list().find(item=>item.id===id) || null;
}

function ensureModal() {
  if ($('#simplePurchaseModal')) return;
  const modal = document.createElement('div');
  modal.className = 'purchase-modal';
  modal.id = 'simplePurchaseModal';
  modal.hidden = true;
  modal.innerHTML = `
    <section class="purchase-sheet" role="dialog" aria-modal="true" aria-labelledby="simplePurchaseTitle">
      <div class="modal-head"><div><small>REGISTRAR</small><h2 id="simplePurchaseTitle">Compra</h2></div><button class="modal-close" id="closeSimplePurchase" type="button">×</button></div>
      <form id="simplePurchaseForm">
        <div class="purchase-form-section">
          <div class="purchase-form-grid">
            <label class="full">Producto<select id="simplePurchaseProduct" required></select></label>
            <label>Presentación<select id="simplePurchasePresentation" required></select></label>
            <label>Cantidad<input id="simplePurchaseQty" type="number" min="0.01" step="0.01" inputmode="decimal" value="1" required></label>
            <div class="full" id="simpleContentBlock"><div class="purchase-form-grid">
              <label>Contenido de cada presentación<input id="simplePurchaseContentQty" type="number" min="0.01" step="0.01" inputmode="decimal" required></label>
              <label>Unidad<select id="simplePurchaseContentUnit" required></select></label>
            </div></div>
            <label>Precio por presentación<input id="simplePurchasePrice" type="number" min="0" step="0.01" inputmode="decimal" required></label>
            <label>Tienda <small>(opcional)</small><input id="simplePurchaseStore" placeholder="Walmart, H-E-B…"></label>
          </div>
          <div class="purchase-preview" id="simplePurchasePreview"></div>
        </div>
        <div class="purchase-modal-actions"><button class="cancel" id="cancelSimplePurchase" type="button">Cancelar</button><button class="save" type="submit">Registrar compra</button></div>
      </form>
    </section>`;
  document.body.appendChild(modal);

  $('#closeSimplePurchase').addEventListener('click',closeModal);
  $('#cancelSimplePurchase').addEventListener('click',closeModal);
  modal.addEventListener('click',event=>{ if (event.target === modal) closeModal(); });
  $('#simplePurchaseProduct').addEventListener('change',applyItemDefaults);
  $('#simplePurchasePresentation').addEventListener('change',applyPresentation);
  ['simplePurchaseQty','simplePurchaseContentQty','simplePurchasePrice'].forEach(id=>$('#'+id).addEventListener('input',updatePreview));
  $('#simplePurchaseContentUnit').addEventListener('change',updatePreview);
  $('#simplePurchaseForm').addEventListener('submit',savePurchase);
}

function openModal(productId='') {
  ensureModal();
  $('#simplePurchaseForm').reset();
  $('#simplePurchaseProduct').innerHTML = `<option value="">Selecciona producto</option>${itemOptions(productId)}`;
  $('#simplePurchasePresentation').innerHTML = presentationOptions();
  $('#simplePurchaseContentUnit').innerHTML = contentUnitOptions();
  if (productId) applyItemDefaults();
  else {
    $('#simplePurchasePresentation').value='bolsa';
    $('#simplePurchaseQty').value='1';
    $('#simplePurchaseContentQty').value='1';
    $('#simplePurchaseContentUnit').value='pieza';
    applyPresentation();
  }
  $('#simplePurchaseModal').hidden = false;
  document.body.classList.add('modal-open');
}

function closeModal() {
  if ($('#simplePurchaseModal')) $('#simplePurchaseModal').hidden = true;
  document.body.classList.remove('modal-open');
}

function applyItemDefaults() {
  const item = selectedItem();
  if (!item) return;
  const presentation = item.purchaseUnit || item.unit || 'pieza';
  $('#simplePurchasePresentation').innerHTML = presentationOptions(presentation);
  $('#simplePurchasePresentation').value = presentation;
  $('#simplePurchaseQty').value = '1';
  $('#simplePurchaseContentQty').value = String(Number(item.contentQty || 1));
  $('#simplePurchaseContentUnit').innerHTML = contentUnitOptions(item.contentUnit || item.unit);
  $('#simplePurchaseContentUnit').value = item.contentUnit || item.unit || 'pieza';
  $('#simplePurchasePrice').value = Number(item.purchasePrice || 0) > 0 ? String(Number(item.purchasePrice)) : '';
  applyPresentation(false);
}

function applyPresentation(reset=true) {
  const presentation = $('#simplePurchasePresentation').value;
  const direct = DIRECT_UNITS.has(presentation);
  $('#simpleContentBlock').hidden = direct;
  if (direct && reset) {
    $('#simplePurchaseContentQty').value = '1';
    if (CONTENT_UNITS.includes(presentation)) $('#simplePurchaseContentUnit').value = presentation;
  }
  updatePreview();
}

function updatePreview() {
  const box = $('#simplePurchasePreview');
  const item = selectedItem();
  if (!box || !item) { if (box) box.textContent = 'Selecciona un producto.'; return; }
  const quantity = Number($('#simplePurchaseQty').value || 0);
  const presentation = $('#simplePurchasePresentation').value;
  const direct = DIRECT_UNITS.has(presentation);
  const contentQty = direct ? 1 : Number($('#simplePurchaseContentQty').value || 0);
  const contentUnit = direct ? presentation : $('#simplePurchaseContentUnit').value;
  const price = Number($('#simplePurchasePrice').value || 0);
  const preview = purchasePreview(item,quantity,presentation,contentQty,contentUnit);
  const inventoryQty = direct ? quantity : quantity * contentQty;
  const inventoryUnit = direct ? presentation : contentUnit;
  const cost = contentQty > 0 ? price / contentQty : 0;
  box.innerHTML = `
    <div class="purchase-preview-row"><span>Compras</span><strong>${cleanNumber(quantity)} ${presentation}</strong></div>
    <div class="purchase-preview-row"><span>Entra a inventario</span><strong>${preview.automatic ? `+${cleanNumber(inventoryQty)} ${inventoryUnit}` : 'Revisa presentación'}</strong></div>
    <div class="purchase-preview-row"><span>Total</span><strong>${money.format(Math.max(0,quantity*price))}</strong></div>
    <div class="purchase-preview-row"><span>Costo por ${inventoryUnit || item.unit}</span><strong>${money.format(cost)}</strong></div>`;
}

function localDateISO() {
  const now = new Date();
  return new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);
}

function showToast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(()=>el.classList.remove('show'),1900);
}

function savePurchase(event) {
  event.preventDefault();
  const item = selectedItem();
  if (!item) return showToast('Selecciona un producto');
  const presentation = $('#simplePurchasePresentation').value;
  const direct = DIRECT_UNITS.has(presentation);
  const result = registerPurchase({
    productId:item.id,
    productName:item.name,
    quantity:Number($('#simplePurchaseQty').value || 0),
    unit:presentation,
    contentQty:direct ? 1 : Number($('#simplePurchaseContentQty').value || 0),
    contentUnit:direct ? presentation : $('#simplePurchaseContentUnit').value,
    unitPrice:Number($('#simplePurchasePrice').value || 0),
    store:$('#simplePurchaseStore').value.trim(),
    date:localDateISO()
  });
  if (!result.ok) return showToast(result.error || 'No se pudo registrar la compra');
  closeModal();
  window.dispatchEvent(new CustomEvent('panel:inventory-changed',{detail:{source:'purchase',purchase:result.purchase}}));
  showToast('Compra registrada · inventario actualizado');
}

function ensureStyles() {
  if ($('#purchaseFinalStyles')) return;
  const style = document.createElement('style');
  style.id = 'purchaseFinalStyles';
  style.textContent = `
    #purchasesView{max-width:900px;margin:0 auto}
    .purchase-final-controls{display:grid;grid-template-columns:1.35fr .65fr;gap:12px;margin-top:8px}
    .purchase-final-controls label{display:grid;gap:6px;color:#34443c;font-size:13px;font-weight:1000}
    .purchase-final-controls select,.purchase-final-controls input{width:100%;min-height:56px;border:2px solid #d7e1dc;border-radius:10px;background:#fff;padding:10px 12px;font-size:18px;font-weight:900;color:#1f2c25}
    .purchase-final-qty{display:flex;align-items:center;gap:8px}.purchase-final-qty span{min-width:42px;font-size:18px;font-weight:1000}
    .purchase-final-heading{margin-top:14px;border:1px solid #d9e4de;background:#eef7f2;border-radius:10px;padding:11px 13px;display:flex;align-items:center;justify-content:space-between;gap:12px}.purchase-final-heading span{font-size:12px;font-weight:1000;color:#66756d;text-transform:uppercase}.purchase-final-heading strong{font-size:17px;text-align:right}
    .purchase-final-list{display:grid;gap:7px;margin-top:9px}.purchase-final-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px;border:1px solid #dde5e1;background:#fff;border-radius:10px;padding:12px 13px}.purchase-final-row>div{display:grid;gap:3px}.purchase-final-row strong{font-size:16px}.purchase-final-row small{font-size:12px;color:#748179;font-weight:800}.purchase-final-row>b{font-size:16px;color:#078844;text-align:right;max-width:230px}
    .purchase-final-empty{margin-top:14px;border:1px dashed #cbd7d1;border-radius:10px;padding:18px;text-align:center;color:#6c7972;font-weight:800}
    @media(max-width:720px){.purchase-final-controls{grid-template-columns:1fr}.purchase-final-row>b{font-size:14px;max-width:150px}}
  `;
  document.head.appendChild(style);
}

function renderPurchases() {
  const view = $('#purchasesView');
  if (!view) return;
  ensureStyles();
  const state = readCalculator();
  const recipes = finalRecipes();
  const selectedId = recipes.some(recipe=>recipe.id===state.recipeId) ? state.recipeId : (recipes[0]?.id || '');
  const selected = recipes.find(recipe=>recipe.id===selectedId) || null;
  view.innerHTML = `
    <div class="module-topbar">
      <button class="back-button" id="simplePurchasesBack" type="button">‹</button>
      <div><small>MÓDULO</small><h2>Compras</h2></div>
      <button class="new-order-button" id="simpleNewPurchase" type="button">Registrar compra</button>
    </div>
    <div class="purchase-final-controls">
      <label>Platillo<select id="purchaseRecipe">${recipeOptions(selectedId)}</select></label>
      <label>Cantidad<div class="purchase-final-qty"><input id="purchaseRecipeQty" type="number" min="0.01" step="0.01" inputmode="decimal" value="${state.qty ?? ''}" placeholder="0"><span id="purchaseRecipeUnit">${selected?.yieldUnit || ''}</span></div></label>
    </div>
    <div id="purchaseCalculatorResult"></div>`;

  $('#simplePurchasesBack').addEventListener('click',()=>{ location.href=location.pathname+location.search; });
  $('#simpleNewPurchase').addEventListener('click',()=>openModal());
  $('#purchaseRecipe').addEventListener('change',renderCalculatorResult);
  $('#purchaseRecipeQty').addEventListener('input',renderCalculatorResult);
  renderCalculatorResult();
}

function activateView() {
  const view = $('#purchasesView');
  if (view?.classList.contains('active')) renderPurchases();
}

migrateOperationalUnits();
ensureModal();

document.addEventListener('click',event=>{
  if (event.target.closest('[data-module="compras"]')) setTimeout(activateView,0);
},true);

window.addEventListener('panel:open-purchase',event=>openModal(event.detail?.productId || ''),true);
window.addEventListener('panel:menu-changed',()=>{ if ($('#purchasesView')?.classList.contains('active')) renderPurchases(); });
window.addEventListener('panel:inventory-changed',()=>{ if ($('#purchasesView')?.classList.contains('active')) renderCalculatorResult(); });

new MutationObserver(()=>{
  if ($('#purchasesView')?.classList.contains('active') && !$('#purchaseRecipe')) renderPurchases();
}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});

setTimeout(activateView,50);
