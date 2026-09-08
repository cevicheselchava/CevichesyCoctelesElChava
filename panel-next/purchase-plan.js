import { InventoryStore } from './data.js';
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
    const needed = Math.round(row.needed * 100) / 100;
    const have = Number(current.qty || 0);
    const missing = Math.max(0,Math.round((needed - have) * 100) / 100);
    return { item:current, needed, have, missing };
  }).sort((a,b)=>{
    if ((a.missing > 0) !== (b.missing > 0)) return a.missing > 0 ? -1 : 1;
    return String(a.item.name || '').localeCompare(String(b.item.name || ''),'es');
  });

  return { products, rows, warnings:[...new Set(warnings)] };
}

function purchaseUnitLabel(unit, qty) {
  if (Number(qty) === 1) return unit || 'unidad';
  const plurals = {
    bolsa:'bolsas', caja:'cajas', paquete:'paquetes', pieza:'piezas', unidad:'unidades', botella:'botellas', lata:'latas',
    galón:'galones', cubeta:'cubetas', rollo:'rollos', costal:'costales', charola:'charolas'
  };
  return plurals[unit] || unit || 'unidades';
}

function buyText(row) {
  if (!(row.missing > 0)) return 'No necesitas comprar';
  const item = row.item;
  const perPurchase = convertQty(Number(item.contentQty || 1),item.contentUnit || item.unit,item.unit);
  if (!(perPurchase > 0)) return `Comprar ${cleanNumber(row.missing)} ${item.unit}`;
  const raw = row.missing / perPurchase;
  const purchaseUnit = item.purchaseUnit || item.unit;
  const fractional = String(purchaseUnit).toLowerCase() === String(item.unit).toLowerCase();
  const qty = fractional ? Math.ceil(raw * 100) / 100 : Math.ceil(raw - 1e-9);
  return `Comprar ${cleanNumber(qty)} ${purchaseUnitLabel(purchaseUnit,qty)}`;
}

function ensureStyles() {
  if ($('#purchasePlanStyles')) return;
  const style = document.createElement('style');
  style.id = 'purchasePlanStyles';
  style.textContent = `
    .purchase-plan-summary{display:grid;gap:12px}.purchase-plan-products{display:flex;gap:8px;flex-wrap:wrap}.purchase-plan-pill{background:#fff7d8;border:1px solid #eadb8a;border-radius:999px;padding:8px 11px;font-size:13px;font-weight:900;color:#625a2d}
    .purchase-plan-card{background:#fff;border:1px solid #dfe6e2;border-radius:18px;padding:14px}.purchase-plan-card.need{border-color:#f0c0b6;background:#fffafa}.purchase-plan-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.purchase-plan-head h4{margin:0;font-size:19px}.purchase-plan-head small{display:block;margin-top:4px;color:#6f7b75;font-size:12px;font-weight:800}.purchase-plan-buy{border:0;border-radius:12px;background:#078844;color:#fff;padding:10px 13px;font-size:14px;font-weight:1000;white-space:nowrap}
    .purchase-plan-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:11px}.purchase-plan-metrics div{background:#f3f6f4;border-radius:12px;padding:10px}.purchase-plan-metrics small{display:block;color:#6e7974;font-size:10px;font-weight:900;text-transform:uppercase}.purchase-plan-metrics strong{display:block;margin-top:4px;font-size:16px}.purchase-plan-metrics .missing{background:#fff1e8}.purchase-plan-metrics .ok{background:#eaf7ef;color:#08713a}.purchase-plan-warning{padding:12px 13px;border-radius:13px;background:#fff0dc;color:#6d5129;font-size:13px;font-weight:800}.purchase-plan-empty{padding:16px;border:1px dashed #cad7d1;border-radius:15px;color:#66736c;text-align:center;font-weight:700}
    @media(max-width:720px){.purchase-plan-metrics{grid-template-columns:1fr}.purchase-plan-head h4{font-size:18px}}
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
      <div><h3>Para preparar hoy</h3><small>Sale de Cantidad por preparar · Recetas · Inventario</small></div>
    </div>
    <div class="purchase-plan-summary" id="purchasePlanSummary"></div>`;
  kpis.insertAdjacentElement('afterend',section);
  return section;
}

function requirementCard(row) {
  const need = row.missing > 0;
  return `
    <article class="purchase-plan-card ${need ? 'need' : ''}">
      <div class="purchase-plan-head">
        <div><h4>${row.item.name}</h4><small>${buyText(row)}</small></div>
        ${need ? `<button class="purchase-plan-buy" data-buy-product="${row.item.id}" type="button">Comprar</button>` : ''}
      </div>
      <div class="purchase-plan-metrics">
        <div><small>Necesitas</small><strong>${cleanNumber(row.needed)} ${row.item.unit}</strong></div>
        <div><small>Tienes</small><strong>${cleanNumber(row.have)} ${row.item.unit}</strong></div>
        <div class="${need ? 'missing' : 'ok'}"><small>${need ? 'Te falta' : 'Cubierto'}</small><strong>${need ? `${cleanNumber(row.missing)} ${row.item.unit}` : '✓ Completo'}</strong></div>
      </div>
    </article>`;
}

function render() {
  ensureStyles();
  if (!ensureSection()) return;
  const host = $('#purchasePlanSummary');
  if (!host) return;
  const info = requirements();

  if (!info.products.length) {
    host.innerHTML = `<div class="purchase-plan-empty">Hoy todavía no has puesto una <strong>Cantidad por preparar</strong>. En cuanto la pongas en Preparación, aquí salen las cantidades que necesitas y lo que te falta comprar.</div>`;
    return;
  }

  const products = info.products.map(product=>`<span class="purchase-plan-pill">${cleanNumber(product.qty)} ${product.unit} · ${product.name}</span>`).join('');
  const warnings = info.warnings.length ? `<div class="purchase-plan-warning">⚠ ${info.warnings.join(' · ')}</div>` : '';
  const rows = info.rows.length ? info.rows.map(requirementCard).join('') : `<div class="purchase-plan-empty">No hay ingredientes calculables todavía. Revisa la receta y su vínculo con Inventario.</div>`;
  host.innerHTML = `<div class="purchase-plan-products">${products}</div>${warnings}${rows}`;
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

init();
