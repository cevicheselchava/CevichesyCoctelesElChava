import { InventoryStore, MenuStore } from './data.js';
import { RecipeStore } from './recipes-data.js';
import { recipePlanForItem } from './recipe-engine.js';

const PLAN_KEY = 'panel-preparation-plan-v1';
const $ = selector => document.querySelector(selector);

const UNIT_ALIASES = {
  l:'L', litro:'L', litros:'L',
  ml:'ml', mililitro:'ml', mililitros:'ml',
  'fl oz':'fl oz', floz:'fl oz',
  g:'g', gramo:'g', gramos:'g',
  kg:'kg', kilogramo:'kg', kilogramos:'kg',
  oz:'oz', onza:'oz', onzas:'oz',
  lb:'lb', lbs:'lb', libra:'lb', libras:'lb',
  pieza:'pieza', piezas:'pieza', pza:'pieza', pzas:'pieza', unidad:'pieza', unidades:'pieza',
  orden:'orden', ordenes:'orden', porcion:'orden', porciones:'orden',
  vaso:'vaso', vasos:'vaso',
  pizca:'pizca', pizcas:'pizca',
  cucharada:'cucharada', cucharadas:'cucharada',
  cucharadita:'cucharadita', cucharaditas:'cucharadita',
  taza:'taza', tazas:'taza'
};

const UNIT_META = {
  ml:{group:'volume',factor:1}, L:{group:'volume',factor:1000}, 'fl oz':{group:'volume',factor:29.5735},
  cucharada:{group:'volume',factor:14.7868}, cucharadita:{group:'volume',factor:4.92892}, taza:{group:'volume',factor:236.588},
  g:{group:'mass',factor:1}, kg:{group:'mass',factor:1000}, oz:{group:'mass',factor:28.3495}, lb:{group:'mass',factor:453.592},
  pieza:{group:'count',factor:1}, orden:{group:'serving',factor:1}, vaso:{group:'glass',factor:1}, pizca:{group:'pinch',factor:1}
};

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .trim()
    .toLowerCase();
}

function localDateISO() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0,10);
}

function cleanNumber(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return '0';
  const rounded = Math.round(number * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function normalizeUnit(unit) {
  const clean = String(unit || '').trim().toLowerCase();
  return UNIT_ALIASES[clean] || unit || '';
}

function convertQty(qty, fromUnit, toUnit) {
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);
  if (!from || !to) return null;
  if (String(from).toLowerCase() === String(to).toLowerCase()) return Number(qty || 0);
  const fromMeta = UNIT_META[from];
  const toMeta = UNIT_META[to];
  if (!fromMeta || !toMeta || fromMeta.group !== toMeta.group) return null;
  return Number(qty || 0) * fromMeta.factor / toMeta.factor;
}

function productKey(name, unit) {
  return `${String(name || '').trim().toLowerCase()}__${String(unit || '').trim().toLowerCase()}`;
}

function parsePlanKey(key) {
  const value = String(key || '');
  const cut = value.lastIndexOf('__');
  if (cut < 0) return { name:value, unit:'' };
  return { name:value.slice(0,cut), unit:value.slice(cut + 2) };
}

function readPlan() {
  try {
    const raw = JSON.parse(localStorage.getItem(PLAN_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch (_) {
    return {};
  }
}

function writePlan(plan) {
  localStorage.setItem(PLAN_KEY,JSON.stringify(plan));
  window.dispatchEvent(new CustomEvent('panel:preparation-plan-changed'));
}

function catalogProducts() {
  const map = new Map();

  RecipeStore.list()
    .filter(recipe => String(recipe?.type || '').trim().toLowerCase() === 'producto final')
    .forEach(recipe => {
      const name = String(recipe?.menuItem || recipe?.name || '').trim();
      if (!name) return;
      const unit = String(recipe?.yieldUnit || 'unidad').trim() || 'unidad';
      map.set(normalize(name),{ name, unit, key:productKey(name,unit) });
    });

  MenuStore.list().forEach(item => {
    const name = String(item?.name || '').trim();
    if (!name) return;
    const unit = String(item?.unit || 'unidad').trim() || 'unidad';
    if (!map.has(normalize(name))) map.set(normalize(name),{ name, unit, key:productKey(name,unit) });
  });

  return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name,'es'));
}

function plannedProducts() {
  const today = readPlan()[localDateISO()] || {};
  return Object.entries(today)
    .map(([key,value])=>({ key, ...parsePlanKey(key), qty:Number(value || 0) }))
    .filter(row=>Number.isFinite(row.qty) && row.qty > 0);
}

function requirements() {
  const products = plannedProducts();
  const map = new Map();
  const warnings = [];

  products.forEach(product => {
    const plan = recipePlanForItem({
      name:product.name,
      qty:product.qty,
      unit:product.unit,
      recipeQty:product.qty,
      recipeUnit:product.unit
    });

    if (!plan.recipe) {
      warnings.push(`${product.name}: falta vincular una receta`);
      return;
    }
    if (!plan.compatible) {
      warnings.push(`${plan.recipe.name}: no se puede calcular ${cleanNumber(product.qty)} ${product.unit}`);
      return;
    }

    plan.ingredients.forEach(ingredient => {
      if (!ingredient.fixed) return;
      if (!ingredient.inventoryItem) {
        warnings.push(`${ingredient.name}: no está vinculado a Inventario`);
        return;
      }

      const needed = convertQty(ingredient.qty, ingredient.unit, ingredient.inventoryItem.unit);
      if (needed === null) {
        warnings.push(`${ingredient.name}: no se puede convertir ${ingredient.unit} a ${ingredient.inventoryItem.unit}`);
        return;
      }

      const id = ingredient.inventoryItem.id;
      if (!map.has(id)) map.set(id,{ item:ingredient.inventoryItem, needed:0 });
      map.get(id).needed += Number(needed || 0);
    });
  });

  const rows = [...map.values()].map(row => {
    const current = InventoryStore.get(row.item.id) || row.item;
    return {
      item:current,
      needed:Math.round(row.needed * 100) / 100,
      have:Number(current.qty || 0),
      minimum:Number(current.minimum || 0)
    };
  }).sort((a,b)=>String(a.item.name || '').localeCompare(String(b.item.name || ''),'es'));

  return { products, rows, warnings:[...new Set(warnings)] };
}

function ensureStyles() {
  if ($('#purchasePlanStyles')) return;
  const style = document.createElement('style');
  style.id = 'purchasePlanStyles';
  style.textContent = `
    .purchase-plan-summary{display:grid;gap:12px}.purchase-plan-products{display:flex;gap:8px;flex-wrap:wrap}.purchase-plan-pill{background:#fff7d8;border:1px solid #eadb8a;border-radius:999px;padding:8px 11px;font-size:13px;font-weight:900;color:#625a2d}
    .purchase-plan-editor{display:grid;grid-template-columns:1.6fr .8fr auto;gap:9px;align-items:end;background:#fff;border:1px solid #dfe6e2;border-radius:18px;padding:14px}.purchase-plan-editor label{font-size:10px;font-weight:1000;color:#68756e;text-transform:uppercase}.purchase-plan-editor select,.purchase-plan-editor input{display:block;width:100%;min-height:48px;margin-top:6px;border:1px solid #d7e0db;border-radius:12px;background:#fff;padding:0 11px;font-size:17px;color:#17211c}.purchase-plan-editor button{min-height:48px;border:0;border-radius:12px;background:#078844;color:#fff;padding:0 15px;font-size:14px;font-weight:1000}
    .purchase-plan-card{background:#fff;border:1px solid #dfe6e2;border-radius:18px;padding:14px}.purchase-plan-head h4{margin:0;font-size:19px}.purchase-plan-head small{display:block;margin-top:4px;color:#6f7b75;font-size:12px;font-weight:800}
    .purchase-plan-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:11px}.purchase-plan-metrics div{background:#f3f6f4;border-radius:12px;padding:10px}.purchase-plan-metrics small{display:block;color:#6e7974;font-size:10px;font-weight:900;text-transform:uppercase}.purchase-plan-metrics strong{display:block;margin-top:4px;font-size:16px}
    .purchase-plan-action{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;margin-top:11px}.purchase-plan-action label{font-size:10px;font-weight:1000;color:#68756e;text-transform:uppercase}.purchase-plan-action-field{display:flex;align-items:center;gap:7px;margin-top:6px}.purchase-plan-action input{width:100%;min-height:46px;border:1px solid #d7e0db;border-radius:12px;padding:0 11px;font-size:18px;font-weight:900}.purchase-plan-action span{white-space:nowrap;font-size:13px;font-weight:900;color:#65716b}.purchase-plan-buy{min-height:46px;border:0;border-radius:12px;background:#078844;color:#fff;padding:0 14px;font-size:14px;font-weight:1000;white-space:nowrap}
    .purchase-plan-warning{padding:12px 13px;border-radius:13px;background:#fff0dc;color:#6d5129;font-size:13px;font-weight:800}.purchase-plan-empty{padding:16px;border:1px dashed #cad7d1;border-radius:15px;color:#66736c;text-align:center;font-weight:700}
    .prep-dish-metrics{display:none!important}
    @media(max-width:720px){.purchase-plan-editor{grid-template-columns:1fr}.purchase-plan-metrics{grid-template-columns:1fr}.purchase-plan-action{grid-template-columns:1fr}.purchase-plan-head h4{font-size:18px}}
  `;
  document.head.appendChild(style);
}

function ensureSection() {
  const view = $('#purchasesView');
  const kpis = $('#purchaseKpis');
  if (!view || !kpis) return null;
  let section = $('#purchasePlanSection');
  if (section) return section;

  section = document.createElement('section');
  section.className = 'purchase-section';
  section.id = 'purchasePlanSection';
  section.innerHTML = `
    <div class="purchase-section-title">
      <div><h3>Para preparar hoy</h3><small>Define cuánto vas a preparar y revisa lo necesario para comprar</small></div>
    </div>
    <div class="purchase-plan-summary" id="purchasePlanSummary"></div>`;
  kpis.insertAdjacentElement('afterend',section);
  return section;
}

function planEditor(products) {
  const catalog = catalogProducts();
  const selectedKey = catalog[0]?.key || '';
  const options = catalog.map(item=>`<option value="${encodeURIComponent(item.key)}">${item.name} · ${item.unit}</option>`).join('');
  return `
    <div class="purchase-plan-editor">
      <label>Platillo<select id="purchasePlanProduct">${options || '<option value="">No hay platillos configurados</option>'}</select></label>
      <label>Cantidad a preparar<input id="purchasePlanQty" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Cantidad"></label>
      <button id="savePurchasePlanQty" type="button" ${selectedKey ? '' : 'disabled'}>Guardar</button>
    </div>
    ${products.length ? `<div class="purchase-plan-products">${products.map(product=>`<span class="purchase-plan-pill">${cleanNumber(product.qty)} ${product.unit} · ${product.name}</span>`).join('')}</div>` : ''}`;
}

function requirementCard(row) {
  const purchaseUnit = row.item.purchaseUnit || row.item.unit || 'unidad';
  return `
    <article class="purchase-plan-card" data-purchase-plan-card="${row.item.id}">
      <div class="purchase-plan-head"><h4>${row.item.name}</h4></div>
      <div class="purchase-plan-metrics">
        <div><small>Para preparar</small><strong>${cleanNumber(row.needed)} ${row.item.unit}</strong></div>
        <div><small>Inventario actual</small><strong>${cleanNumber(row.have)} ${row.item.unit}</strong></div>
        <div><small>Stock mínimo</small><strong>${cleanNumber(row.minimum)} ${row.item.unit}</strong></div>
      </div>
      <div class="purchase-plan-action">
        <label>Cantidad a comprar<div class="purchase-plan-action-field"><input type="number" min="0.01" step="0.01" inputmode="decimal" data-purchase-qty="${row.item.id}" placeholder="Cantidad"><span>${purchaseUnit}</span></div></label>
        <button class="purchase-plan-buy" data-plan-buy-product="${row.item.id}" type="button">Registrar compra</button>
      </div>
    </article>`;
}

function savePlannedQuantity() {
  const select = $('#purchasePlanProduct');
  const input = $('#purchasePlanQty');
  if (!select || !input || !select.value) return;
  const key = decodeURIComponent(select.value);
  const raw = input.value.trim();
  if (raw === '') return;
  const qty = Math.max(0,Number(raw) || 0);
  const date = localDateISO();
  const plan = readPlan();
  if (!plan[date]) plan[date] = {};
  if (qty > 0) plan[date][key] = qty;
  else delete plan[date][key];
  writePlan(plan);
  render();
}

function render() {
  ensureStyles();
  if (!ensureSection()) return;
  const host = $('#purchasePlanSummary');
  if (!host) return;
  const info = requirements();
  const editor = planEditor(info.products);

  if (!info.products.length) {
    host.innerHTML = `${editor}<div class="purchase-plan-empty">Pon arriba cuántas unidades, libras u órdenes vas a preparar. Con eso salen las cantidades de ingredientes para esta compra.</div>`;
    return;
  }

  const warnings = info.warnings.length ? `<div class="purchase-plan-warning">⚠ ${info.warnings.join(' · ')}</div>` : '';
  const rows = info.rows.length ? info.rows.map(requirementCard).join('') : `<div class="purchase-plan-empty">No hay ingredientes calculables todavía. Revisa la receta y su vínculo con Inventario.</div>`;
  host.innerHTML = `${editor}${warnings}${rows}`;
}

function init() {
  let attempts = 0;
  const findView = () => {
    const view = $('#purchasesView');
    if (!view) {
      attempts += 1;
      if (attempts < 24) setTimeout(findView,250);
      return;
    }

    render();
    new MutationObserver(()=>{
      if (view.classList.contains('active')) render();
    }).observe(view,{attributes:true,attributeFilter:['class']});

    const history = $('#purchaseHistory');
    if (history) new MutationObserver(()=>{
      if (view.classList.contains('active')) render();
    }).observe(history,{childList:true});
  };
  findView();
}

document.addEventListener('click',event=>{
  if (event.target.closest('#savePurchasePlanQty')) {
    event.preventDefault();
    savePlannedQuantity();
    return;
  }

  const buy = event.target.closest('[data-plan-buy-product]');
  if (buy) {
    event.preventDefault();
    const productId = buy.dataset.planBuyProduct;
    const input = document.querySelector(`[data-purchase-qty="${productId}"]`);
    const quantity = Number(input?.value || 0);
    window.dispatchEvent(new CustomEvent('panel:open-purchase',{detail:{productId,quantity:quantity > 0 ? quantity : null}}));
  }
});

window.addEventListener('panel:menu-changed',render);
window.addEventListener('panel:preparation-plan-changed',render);

init();
