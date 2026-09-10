import { InventoryStore } from './data.js';
import { RecipeStore } from './recipes-data.js';
import { registerPurchase, purchasePreview } from './purchases-data.js';
import { BusinessCore } from './business-core.js';

const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const money = new Intl.NumberFormat('es-US',{style:'currency',currency:'USD'});
const CALCULATOR_KEY = 'panel-next-purchase-calculator-v3';
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
const SERVICE_ITEMS = [
  {name:'Contenedor ceviche 1 lb',label:'Contenedor',qty:1,unit:'pieza'},
  {name:'Tapa ceviche · ½ lb / 1 lb',label:'Tapa',qty:1,unit:'pieza'},
  {name:'Cuchara',label:'Cuchara',qty:1,unit:'pieza'},
  {name:'',label:'Paquete de tostadas',qty:1,unit:'paquete'}
];

let activePurchaseCategory = '';

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

function pluralUnit(unit, qty) {
  if (Number(qty) === 1) return unit;
  const map = {
    bolsa:'bolsas',caja:'cajas',paquete:'paquetes',botella:'botellas',lata:'latas',manojo:'manojos',charola:'charolas',
    bote:'botes',cubeta:'cubetas',rollo:'rollos',costal:'costales',pieza:'piezas',unidad:'unidades'
  };
  return map[unit] || unit;
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

function selectedRecipe() {
  const id = $('#purchaseRecipeId')?.value || readCalculator().recipeId || '';
  return finalRecipes().find(recipe=>recipe.id===id) || null;
}

function purchaseSuggestionByNeed(name, needQty, needUnit) {
  const item = inventoryItemByName(name);
  if (!item || !(Number(needQty) >= 0)) return `${cleanNumber(needQty)} ${pluralUnit(needUnit,needQty)}`.trim();

  const purchaseUnit = String(item.purchaseUnit || item.unit || '').trim();
  const contentQty = Number(item.contentQty || 0);
  const contentUnit = String(item.contentUnit || item.unit || '').trim();

  if (DIRECT_UNITS.has(purchaseUnit)) {
    const direct = convertQty(needQty,needUnit,purchaseUnit);
    if (direct !== null) return `${cleanNumber(direct)} ${pluralUnit(purchaseUnit,direct)}`;
  }

  if (PACKAGE_UNITS.has(purchaseUnit) && contentQty > 0 && contentUnit) {
    const inContentUnit = convertQty(needQty,needUnit,contentUnit);
    if (inContentUnit !== null) {
      const count = Math.max(1,Math.ceil((inContentUnit/contentQty)-1e-9));
      return `${count} ${pluralUnit(purchaseUnit,count)} de ${cleanNumber(contentQty)} ${pluralUnit(contentUnit,contentQty)}`;
    }
  }

  return `${cleanNumber(needQty)} ${pluralUnit(needUnit,needQty)}`.trim();
}

function calculatorRows(recipe, targetQty) {
  const yieldQty = Number(recipe?.yieldQty || 0);
  if (!recipe || !(targetQty > 0) || !(yieldQty > 0)) return [];
  const scale = targetQty / yieldQty;

  const ingredientRows = recipe.ingredients.map(ingredient=>{
    if (ingredient.fixed === false) return {name:ingredient.name,exact:'Al gusto',buy:'Al gusto'};
    const exactQty = Number(ingredient.qty || 0) * scale;
    const unit = String(ingredient.unit || '').trim();
    return {
      name:ingredient.name,
      exact:`${cleanNumber(exactQty)} ${pluralUnit(unit,exactQty)}`.trim(),
      buy:purchaseSuggestionByNeed(ingredient.name,exactQty,unit)
    };
  });

  const serviceCount = Math.max(1,Math.ceil(scale-1e-9));
  const serviceRows = SERVICE_ITEMS.map(item=>{
    const exactQty = serviceCount * item.qty;
    const exact = `${cleanNumber(exactQty)} ${pluralUnit(item.unit,exactQty)}`;
    return {
      name:item.label,
      exact,
      buy:item.name ? purchaseSuggestionByNeed(item.name,exactQty,item.unit) : exact
    };
  });

  return [...ingredientRows,...serviceRows];
}

function whatItIncludes(recipe) {
  if (!recipe) return [];
  return [
    ...recipe.ingredients.map(item=>item.name),
    ...SERVICE_ITEMS.map(item=>item.label)
  ];
}

function renderRecipeSelection() {
  const state = readCalculator();
  const recipes = finalRecipes();
  const selectedId = recipes.some(recipe=>recipe.id===state.recipeId) ? state.recipeId : (recipes[0]?.id || '');
  const selected = recipes.find(recipe=>recipe.id===selectedId) || null;
  return `
    <input id="purchaseRecipeId" type="hidden" value="${selectedId}">
    <section class="purchase-dish-section">
      <div class="purchase-block-title">Platillo</div>
      <div class="purchase-dish-buttons">
        ${recipes.map(recipe=>`<button type="button" class="purchase-dish-button ${recipe.id===selectedId?'active':''}" data-purchase-recipe="${recipe.id}">${recipe.name}</button>`).join('')}
      </div>
    </section>
    <section class="purchase-includes-section" id="purchaseIncludesSection">
      <div class="purchase-block-title">Qué lleva</div>
      <div class="purchase-includes-list">
        ${selected ? whatItIncludes(selected).map(name=>`<span>${name}</span>`).join('') : '<span>Selecciona un platillo</span>'}
      </div>
    </section>
    <section class="purchase-quantity-section">
      <div class="purchase-block-title">Comprar para</div>
      <div class="purchase-final-qty">
        <input id="purchaseRecipeQty" type="number" min="0.01" step="0.01" inputmode="decimal" value="${state.qty ?? ''}" placeholder="0">
        <span id="purchaseRecipeUnit">${selected?.yieldUnit || ''}</span>
      </div>
    </section>
    <div id="purchaseCalculatorResult"></div>`;
}

function renderCalculatorResult() {
  const result = $('#purchaseCalculatorResult');
  const qtyInput = $('#purchaseRecipeQty');
  const unit = $('#purchaseRecipeUnit');
  if (!result || !qtyInput) return;

  const recipe = selectedRecipe();
  const qty = Number(qtyInput.value || 0);
  if (unit) unit.textContent = recipe?.yieldUnit || '';
  writeCalculator({recipeId:recipe?.id || '',qty:qtyInput.value});

  const includes = $('#purchaseIncludesSection .purchase-includes-list');
  if (includes) includes.innerHTML = recipe ? whatItIncludes(recipe).map(name=>`<span>${name}</span>`).join('') : '<span>Selecciona un platillo</span>';

  if (!recipe) {
    result.innerHTML = '<div class="purchase-final-empty">No hay platillos configurados.</div>';
    return;
  }
  if (!(qty > 0)) {
    result.innerHTML = '<div class="purchase-final-empty">Escribe cuánto vas a preparar y aquí sale lo que necesitas comprar.</div>';
    return;
  }

  const rows = calculatorRows(recipe,qty);
  result.innerHTML = `
    <div class="purchase-final-heading"><span>Qué necesitas comprar</span><strong>${cleanNumber(qty)} ${recipe.yieldUnit} · ${recipe.name}</strong></div>
    <div class="purchase-final-list">
      ${rows.map(row=>`<div class="purchase-final-row"><div><strong>${row.name}</strong><small>Necesitas ${row.exact}</small></div><b>${row.buy}</b></div>`).join('')}
    </div>`;
}

function itemCategory(item) {
  const name = normalize(item?.name);
  const stored = String(item?.category || '').trim();
  if (/camaron|pescado|filete|pulpo|calamar|tilapia|salmon|atun|ostion/.test(name)) return 'Mariscos';
  if (/tomate|cebolla|pepino|aguacate|cilantro|limon entero|chile|mango|pina/.test(name)) return 'Verduras';
  if (/salsa|clamato|catsup|pure|jugo de limon|maggi|inglesa|chipotle|morita|mayonesa/.test(name)) return 'Salsas y líquidos';
  if (/contenedor|tapa/.test(name)) return 'Empaques';
  if (/cuchara|tenedor|servilleta|tostada|popote/.test(name)) return 'Desechables';
  if (/refresco|bebida|agua|coca|sprite|fanta/.test(name)) return 'Bebidas';
  if (/limpieza|cloro|jabon|desinfectante|bolsa basura/.test(name)) return 'Limpieza';
  if (stored && normalize(stored) !== 'ingrediente') return stored;
  return 'Otros';
}

function purchaseCategories() {
  return [...new Set(InventoryStore.list().map(itemCategory))].sort((a,b)=>a.localeCompare(b,'es',{sensitivity:'base'}));
}

function itemsForCategory(category) {
  return InventoryStore.list()
    .filter(item=>itemCategory(item)===category)
    .sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'es',{sensitivity:'base'}));
}

function selectedItem() {
  const id = $('#simplePurchaseProduct')?.value || '';
  return InventoryStore.list().find(item=>item.id===id) || null;
}

function presentationChoices(item) {
  if (!item) return [];
  const category = itemCategory(item);
  const defaults = {
    Mariscos:['bolsa','lb','oz'],
    Verduras:['lb','pieza','manojo','bolsa'],
    'Salsas y líquidos':['botella','galón','L','fl oz','ml'],
    Empaques:['paquete','caja','bolsa','pieza'],
    Desechables:['paquete','caja','bolsa','pieza'],
    Bebidas:['caja','paquete','botella','lata','pieza'],
    Limpieza:['botella','galón','paquete','pieza']
  };
  const values = [item.purchaseUnit,item.unit,...(defaults[category] || ['bolsa','paquete','pieza','lb','oz'])]
    .filter(Boolean)
    .filter((value,index,array)=>array.indexOf(value)===index)
    .filter(value=>PRESENTATIONS.includes(value));
  return values;
}

function contentUnitChoices(item) {
  const preferred = [item?.contentUnit,item?.unit].filter(Boolean);
  const group = UNIT_META[item?.unit]?.group;
  const groupUnits = group === 'mass' ? ['oz','lb','g','kg'] : group === 'volume' ? ['fl oz','ml','L','galón'] : group === 'count' ? ['pieza','unidad'] : CONTENT_UNITS;
  return [...preferred,...groupUnits].filter((value,index,array)=>array.indexOf(value)===index && CONTENT_UNITS.includes(value));
}

function renderCategoryButtons() {
  const host = $('#purchaseCategoryButtons');
  if (!host) return;
  const categories = purchaseCategories();
  if (!activePurchaseCategory || !categories.includes(activePurchaseCategory)) activePurchaseCategory = categories[0] || '';
  host.innerHTML = categories.map(category=>`<button type="button" class="purchase-choice-button ${category===activePurchaseCategory?'active':''}" data-purchase-category="${encodeURIComponent(category)}">${category}</button>`).join('');
}

function renderProductButtons() {
  const host = $('#purchaseProductButtons');
  if (!host) return;
  const selectedId = $('#simplePurchaseProduct')?.value || '';
  const rows = itemsForCategory(activePurchaseCategory);
  host.innerHTML = rows.length
    ? rows.map(item=>`<button type="button" class="purchase-product-button ${item.id===selectedId?'active':''}" data-purchase-product="${item.id}">${item.name}</button>`).join('')
    : '<div class="purchase-choice-empty">No hay productos en esta categoría.</div>';
}

function renderPresentationButtons() {
  const host = $('#purchasePresentationButtons');
  const hidden = $('#simplePurchasePresentation');
  const item = selectedItem();
  if (!host || !hidden) return;
  if (!item) {
    host.innerHTML = '<div class="purchase-choice-empty">Primero selecciona un producto.</div>';
    return;
  }
  const values = presentationChoices(item);
  if (!values.includes(hidden.value)) hidden.value = values[0] || item.purchaseUnit || item.unit || 'pieza';
  host.innerHTML = values.map(value=>`<button type="button" class="purchase-choice-button ${value===hidden.value?'active':''}" data-purchase-presentation="${value}">${value}</button>`).join('');
}

function renderContentUnitButtons() {
  const host = $('#purchaseContentUnitButtons');
  const hidden = $('#simplePurchaseContentUnit');
  const item = selectedItem();
  if (!host || !hidden || !item) return;
  const values = contentUnitChoices(item);
  if (!values.includes(hidden.value)) hidden.value = values[0] || 'pieza';
  host.innerHTML = values.map(value=>`<button type="button" class="purchase-choice-button small ${value===hidden.value?'active':''}" data-purchase-content-unit="${value}">${value}</button>`).join('');
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
        <input id="simplePurchaseProduct" type="hidden" required>
        <input id="simplePurchasePresentation" type="hidden" required>
        <input id="simplePurchaseContentUnit" type="hidden" required>
        <div class="purchase-form-section purchase-button-form">
          <div class="purchase-choice-label">Categoría</div>
          <div class="purchase-choice-grid categories" id="purchaseCategoryButtons"></div>
          <div class="purchase-choice-label">Producto</div>
          <div class="purchase-product-grid" id="purchaseProductButtons"></div>
          <div class="purchase-choice-label">Presentación</div>
          <div class="purchase-choice-grid" id="purchasePresentationButtons"></div>
          <div class="purchase-form-grid purchase-number-grid">
            <label>Cantidad<input id="simplePurchaseQty" type="number" min="0.01" step="0.01" inputmode="decimal" value="1" required></label>
            <label><span id="simplePurchasePriceLabel">Precio</span><input id="simplePurchasePrice" type="number" min="0" step="0.01" inputmode="decimal" required></label>
          </div>
          <div id="simpleContentBlock" class="purchase-content-block">
            <label>Contenido de cada presentación<input id="simplePurchaseContentQty" type="number" min="0.01" step="0.01" inputmode="decimal" required></label>
            <div class="purchase-choice-label compact">Unidad del contenido</div>
            <div class="purchase-choice-grid compact" id="purchaseContentUnitButtons"></div>
          </div>
          <label class="purchase-store-label">Tienda <small>(opcional)</small><input id="simplePurchaseStore" placeholder="Walmart, H-E-B…"></label>
          <div class="purchase-preview" id="simplePurchasePreview">Selecciona un producto.</div>
        </div>
        <div class="purchase-modal-actions"><button class="cancel" id="cancelSimplePurchase" type="button">Cancelar</button><button class="save" type="submit">Registrar compra</button></div>
      </form>
    </section>`;
  document.body.appendChild(modal);

  $('#closeSimplePurchase').addEventListener('click',closeModal);
  $('#cancelSimplePurchase').addEventListener('click',closeModal);
  modal.addEventListener('click',event=>{ if (event.target === modal) closeModal(); });
  ['simplePurchaseQty','simplePurchaseContentQty','simplePurchasePrice'].forEach(id=>$('#'+id).addEventListener('input',updatePreview));
  $('#simplePurchaseForm').addEventListener('submit',savePurchase);
}

function openModal(productId='') {
  ensureModal();
  $('#simplePurchaseForm').reset();
  $('#simplePurchaseProduct').value = productId || '';
  $('#simplePurchaseQty').value = '1';
  const item = selectedItem();
  activePurchaseCategory = item ? itemCategory(item) : (purchaseCategories()[0] || '');
  renderCategoryButtons();
  renderProductButtons();
  if (item) applyItemDefaults();
  else {
    $('#simplePurchasePresentation').value = '';
    $('#simplePurchaseContentQty').value = '1';
    $('#simplePurchaseContentUnit').value = 'pieza';
    $('#simplePurchasePrice').value = '';
    renderPresentationButtons();
    $('#purchaseContentUnitButtons').innerHTML = '';
    $('#simpleContentBlock').hidden = true;
    updatePreview();
  }
  $('#simplePurchaseModal').hidden = false;
  document.body.classList.add('modal-open');
}

function closeModal() {
  if ($('#simplePurchaseModal')) $('#simplePurchaseModal').hidden = true;
  document.body.classList.remove('modal-open');
}

function selectProduct(id) {
  const hidden = $('#simplePurchaseProduct');
  if (!hidden) return;
  hidden.value = id;
  const item = selectedItem();
  if (!item) return;
  activePurchaseCategory = itemCategory(item);
  renderCategoryButtons();
  renderProductButtons();
  applyItemDefaults();
}

function applyItemDefaults() {
  const item = selectedItem();
  if (!item) return;
  $('#simplePurchasePresentation').value = item.purchaseUnit || item.unit || 'pieza';
  $('#simplePurchaseQty').value = '1';
  $('#simplePurchaseContentQty').value = String(Number(item.contentQty || 1));
  $('#simplePurchaseContentUnit').value = item.contentUnit || item.unit || 'pieza';
  $('#simplePurchasePrice').value = Number(item.purchasePrice || 0) > 0 ? String(Number(item.purchasePrice)) : '';
  renderPresentationButtons();
  renderContentUnitButtons();
  applyPresentation(false);
}

function applyPresentation(reset=true) {
  const item = selectedItem();
  const presentation = $('#simplePurchasePresentation').value;
  const direct = DIRECT_UNITS.has(presentation);
  $('#simpleContentBlock').hidden = direct;
  $('#simplePurchasePriceLabel').textContent = presentation ? `Precio por ${presentation}` : 'Precio';
  if (direct && reset) {
    $('#simplePurchaseContentQty').value = '1';
    $('#simplePurchaseContentUnit').value = CONTENT_UNITS.includes(presentation) ? presentation : (item?.unit || 'pieza');
  } else if (!direct && reset && item) {
    $('#simplePurchaseContentQty').value = String(Number(item.contentQty || 1));
    $('#simplePurchaseContentUnit').value = item.contentUnit || item.unit || 'pieza';
  }
  renderPresentationButtons();
  if (!direct) renderContentUnitButtons();
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
  const stockPerPresentation = convertQty(contentQty,contentUnit,item.unit);
  const cost = stockPerPresentation && price >= 0 ? price / stockPerPresentation : 0;
  box.innerHTML = `
    <div class="purchase-preview-row"><span>Compras</span><strong>${cleanNumber(quantity)} ${pluralUnit(presentation,quantity)}</strong></div>
    <div class="purchase-preview-row"><span>Entra a inventario</span><strong>${preview.automatic ? `+${cleanNumber(inventoryQty)} ${pluralUnit(inventoryUnit,inventoryQty)}` : 'Revisa presentación'}</strong></div>
    <div class="purchase-preview-row"><span>Total</span><strong>${money.format(Math.max(0,quantity*price))}</strong></div>
    <div class="purchase-preview-row"><span>Costo por ${item.unit || inventoryUnit}</span><strong>${money.format(cost)}</strong></div>`;
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
  if (!presentation) return showToast('Selecciona la presentación');
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
    .purchase-block-title,.purchase-choice-label{font-size:13px;font-weight:1000;color:#536159;text-transform:uppercase;letter-spacing:.02em;margin:0 0 8px}
    .purchase-dish-section,.purchase-includes-section,.purchase-quantity-section{margin-top:14px}
    .purchase-dish-buttons{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
    .purchase-dish-button,.purchase-choice-button,.purchase-product-button{border:2px solid #d8e2dd;background:#fff;color:#223129;border-radius:10px;min-height:54px;padding:10px 12px;font-size:16px;font-weight:1000;text-align:center}
    .purchase-dish-button.active,.purchase-choice-button.active,.purchase-product-button.active{background:#078844;color:#fff;border-color:#078844}
    .purchase-includes-list{display:flex;flex-wrap:wrap;gap:7px}.purchase-includes-list span{background:#eef5f1;border:1px solid #dce6e1;border-radius:9px;padding:8px 10px;font-size:13px;font-weight:850;color:#33423a}
    .purchase-quantity-section{max-width:330px}.purchase-final-qty{display:flex;align-items:center;gap:10px}.purchase-final-qty input{width:100%;min-height:58px;border:2px solid #d7e1dc;border-radius:10px;background:#fff;padding:10px 12px;font-size:22px;font-weight:1000;color:#1f2c25}.purchase-final-qty span{min-width:46px;font-size:20px;font-weight:1000}
    .purchase-final-heading{margin-top:15px;border:1px solid #d9e4de;background:#eef7f2;border-radius:10px;padding:12px 13px;display:flex;align-items:center;justify-content:space-between;gap:12px}.purchase-final-heading span{font-size:13px;font-weight:1000;color:#526159;text-transform:uppercase}.purchase-final-heading strong{font-size:17px;text-align:right}
    .purchase-final-list{display:grid;gap:7px;margin-top:9px}.purchase-final-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px;border:1px solid #dde5e1;background:#fff;border-radius:10px;padding:12px 13px}.purchase-final-row>div{display:grid;gap:3px}.purchase-final-row strong{font-size:16px}.purchase-final-row small{font-size:12px;color:#748179;font-weight:800}.purchase-final-row>b{font-size:16px;color:#078844;text-align:right;max-width:230px}
    .purchase-final-empty{margin-top:14px;border:1px dashed #cbd7d1;border-radius:10px;padding:16px;text-align:center;color:#6c7972;font-weight:800}
    .purchase-button-form{display:grid;gap:12px}.purchase-choice-label.compact{margin-top:9px;margin-bottom:6px}.purchase-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.purchase-choice-grid.categories{grid-template-columns:repeat(2,minmax(0,1fr))}.purchase-choice-grid.compact{grid-template-columns:repeat(4,minmax(0,1fr))}.purchase-choice-button.small{min-height:44px;font-size:14px;padding:7px 8px}
    .purchase-product-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.purchase-product-button{min-height:58px;font-size:15px}.purchase-choice-empty{grid-column:1/-1;padding:12px;border:1px dashed #ced9d3;border-radius:10px;color:#718078;font-weight:800;text-align:center}
    .purchase-number-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important}.purchase-number-grid label,.purchase-content-block label,.purchase-store-label{display:grid;gap:6px;font-size:13px;font-weight:1000;color:#536159}.purchase-number-grid input,.purchase-content-block input,.purchase-store-label input{width:100%;min-height:54px;border:2px solid #d7e1dc;border-radius:10px;background:#fff;padding:10px 12px;font-size:18px;font-weight:900;color:#1f2c25}
    .purchase-content-block{border:1px solid #dce5e0;border-radius:10px;padding:12px;background:#f8faf9}.purchase-content-block[hidden]{display:none!important}
    @media(max-width:720px){
      .purchase-dish-buttons{grid-template-columns:1fr 1fr}
      .purchase-dish-button{min-height:62px;font-size:15px;padding:9px}
      .purchase-final-row>b{font-size:14px;max-width:150px}
      .purchase-choice-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.purchase-choice-grid.compact{grid-template-columns:repeat(3,minmax(0,1fr))}
      .purchase-product-grid{grid-template-columns:1fr 1fr}.purchase-product-button{font-size:14px;padding:8px}
    }
  `;
  document.head.appendChild(style);
}

function renderPurchases() {
  const view = $('#purchasesView');
  if (!view) return;
  ensureStyles();
  view.innerHTML = `
    <div class="module-topbar">
      <button class="back-button" id="simplePurchasesBack" type="button">‹</button>
      <div><small>MÓDULO</small><h2>Compras</h2></div>
      <button class="new-order-button" id="simpleNewPurchase" type="button">Registrar compra</button>
    </div>
    ${renderRecipeSelection()}`;

  $('#simplePurchasesBack').addEventListener('click',()=>{ location.href=location.pathname+location.search; });
  $('#simpleNewPurchase').addEventListener('click',()=>openModal());
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
  if (event.target.closest('[data-module="compras"]')) {
    setTimeout(activateView,0);
    return;
  }

  const recipeButton = event.target.closest('[data-purchase-recipe]');
  if (recipeButton) {
    const qty = $('#purchaseRecipeQty')?.value || '';
    writeCalculator({recipeId:recipeButton.dataset.purchaseRecipe,qty});
    renderPurchases();
    return;
  }

  const categoryButton = event.target.closest('[data-purchase-category]');
  if (categoryButton) {
    activePurchaseCategory = decodeURIComponent(categoryButton.dataset.purchaseCategory || '');
    $('#simplePurchaseProduct').value = '';
    renderCategoryButtons();
    renderProductButtons();
    $('#simplePurchasePresentation').value = '';
    renderPresentationButtons();
    $('#simpleContentBlock').hidden = true;
    updatePreview();
    return;
  }

  const productButton = event.target.closest('[data-purchase-product]');
  if (productButton) {
    selectProduct(productButton.dataset.purchaseProduct || '');
    return;
  }

  const presentationButton = event.target.closest('[data-purchase-presentation]');
  if (presentationButton) {
    $('#simplePurchasePresentation').value = presentationButton.dataset.purchasePresentation || '';
    applyPresentation(true);
    return;
  }

  const unitButton = event.target.closest('[data-purchase-content-unit]');
  if (unitButton) {
    $('#simplePurchaseContentUnit').value = unitButton.dataset.purchaseContentUnit || '';
    renderContentUnitButtons();
    updatePreview();
  }
},true);

window.addEventListener('panel:open-purchase',event=>openModal(event.detail?.productId || ''),true);
window.addEventListener('panel:menu-changed',()=>{ if ($('#purchasesView')?.classList.contains('active')) renderPurchases(); });
window.addEventListener('panel:inventory-changed',()=>{ if ($('#purchasesView')?.classList.contains('active')) renderCalculatorResult(); });

new MutationObserver(()=>{
  if ($('#purchasesView')?.classList.contains('active') && !$('#purchaseRecipeId')) renderPurchases();
}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});

setTimeout(activateView,50);
