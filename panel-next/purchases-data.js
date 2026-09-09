import { InventoryStore } from './data.js';

const PURCHASE_STORAGE_KEY = 'panel-next-purchases-v1';

const localDateISO = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0,10);
};

const UNIT_META = {
  g:{group:'mass',factor:1}, kg:{group:'mass',factor:1000}, oz:{group:'mass',factor:28.349523125}, lb:{group:'mass',factor:453.59237},
  ml:{group:'volume',factor:1}, L:{group:'volume',factor:1000}, 'fl oz':{group:'volume',factor:29.5735295625}, 'galón':{group:'volume',factor:3785.411784},
  pieza:{group:'count',factor:1}, unidad:{group:'count',factor:1}, pzas:{group:'count',factor:1}
};

function convertQty(qty, from, to) {
  const number = Number(qty);
  if (!Number.isFinite(number)) return null;
  if (from === to) return number;
  const source = UNIT_META[from];
  const target = UNIT_META[to];
  if (!source || !target || source.group !== target.group) return null;
  return number * source.factor / target.factor;
}

function normalizePurchase(row = {}) {
  const quantity = Number(row.quantity || 0);
  const unitPrice = Number(row.unitPrice || 0);
  const contentQty = Number(row.contentQty || 0);
  return {
    ...row,
    productId:String(row.productId || ''),
    productName:String(row.productName || '').trim(),
    quantity:Number.isFinite(quantity) ? quantity : 0,
    unit:String(row.unit || '').trim(),
    contentQty:Number.isFinite(contentQty) ? contentQty : 0,
    contentUnit:String(row.contentUnit || '').trim(),
    unitPrice:Number.isFinite(unitPrice) ? unitPrice : 0,
    total:Number.isFinite(Number(row.total)) ? Number(row.total) : quantity * unitPrice,
    store:String(row.store || '').trim(),
    date:String(row.date || localDateISO()),
    stockAdded:Number(row.stockAdded || 0),
    stockUnit:String(row.stockUnit || '').trim(),
    unitCost:Number(row.unitCost || 0),
    autoStock:Boolean(row.autoStock),
    expenseStatus:String(row.expenseStatus || 'pending-dinero')
  };
}

function readPurchases() {
  try {
    const raw = localStorage.getItem(PURCHASE_STORAGE_KEY);
    return raw ? JSON.parse(raw).map(normalizePurchase) : [];
  } catch {
    return [];
  }
}

function writePurchases(rows) {
  const normalized = rows.map(normalizePurchase);
  localStorage.setItem(PURCHASE_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

function nextPurchaseId(rows) {
  const next = rows.reduce((max,row)=>Math.max(max,Number(String(row.id || '').replace(/\D/g,'')) || 0),1000) + 1;
  return `C-${next}`;
}

function findInventoryItem(productId, productName) {
  const items = InventoryStore.list();
  return items.find(item => item.id === productId)
    || items.find(item => String(item.name || '').trim().toLowerCase() === String(productName || '').trim().toLowerCase())
    || null;
}

export function stockPerPurchaseUnit(item, contentQty = null, contentUnit = null) {
  if (!item) return null;
  const qty = contentQty === null || contentQty === undefined || contentQty === '' ? Number(item.contentQty || 1) : Number(contentQty);
  const unit = contentUnit || item.contentUnit || item.unit;
  if (!(qty > 0)) return null;
  return convertQty(qty, unit, item.unit);
}

export function suggestedPurchaseQuantity(item) {
  if (!item) return 1;
  const gap = Math.max(0, Number(item.minimum || 0) - Number(item.qty || 0));
  if (gap <= 0) return 1;
  const perUnit = stockPerPurchaseUnit(item);
  if (!perUnit || perUnit <= 0) return 1;
  return Math.max(1, Math.ceil(gap / perUnit));
}

export function purchasePreview(item, quantity, purchaseUnit, contentQty = null, contentUnit = null) {
  const qty = Number(quantity || 0);
  if (!item || !Number.isFinite(qty) || qty <= 0) return { stockAdded:null, stockUnit:item?.unit || '', automatic:false };

  const explicitContent = contentQty !== null && contentQty !== undefined && contentQty !== '' && contentUnit;
  if (explicitContent) {
    const perUnit = stockPerPurchaseUnit(item,contentQty,contentUnit);
    if (perUnit !== null) return { stockAdded:qty * perUnit, stockUnit:item.unit, automatic:true, stockPerPresentation:perUnit };
  }

  if (purchaseUnit === item.purchaseUnit) {
    const perUnit = stockPerPurchaseUnit(item);
    if (perUnit !== null) return { stockAdded:qty * perUnit, stockUnit:item.unit, automatic:true, stockPerPresentation:perUnit };
  }

  const direct = convertQty(qty, purchaseUnit, item.unit);
  if (direct !== null) return { stockAdded:direct, stockUnit:item.unit, automatic:true, stockPerPresentation:qty ? direct/qty : null };

  return { stockAdded:null, stockUnit:item.unit, automatic:false, stockPerPresentation:null };
}

export function registerPurchase(payload = {}) {
  const item = findInventoryItem(payload.productId, payload.productName);
  if (!item) return { ok:false, error:'Producto no encontrado en inventario' };

  const quantity = Number(payload.quantity || 0);
  const unitPrice = Number(payload.unitPrice || 0);
  const unit = String(payload.unit || item.purchaseUnit || '').trim();
  const contentQty = payload.contentQty === null || payload.contentQty === undefined || payload.contentQty === ''
    ? Number(item.contentQty || 1)
    : Number(payload.contentQty);
  const contentUnit = String(payload.contentUnit || item.contentUnit || item.unit || '').trim();

  if (!Number.isFinite(quantity) || quantity <= 0) return { ok:false, error:'Cantidad inválida' };
  if (!Number.isFinite(unitPrice) || unitPrice < 0) return { ok:false, error:'Precio inválido' };
  if (!unit) return { ok:false, error:'Falta la presentación de compra' };
  if (!Number.isFinite(contentQty) || contentQty <= 0) return { ok:false, error:'Falta cuánto trae cada presentación' };
  if (!contentUnit) return { ok:false, error:'Falta la unidad del contenido' };

  const preview = purchasePreview(item, quantity, unit, contentQty, contentUnit);
  if (!preview.automatic || !Number.isFinite(preview.stockAdded)) return { ok:false, error:`No se puede convertir ${contentUnit} a ${item.unit}` };

  const before = Number(item.qty || 0);
  const after = before + preview.stockAdded;
  const stockPerPresentation = Number(preview.stockPerPresentation || 0);
  const unitCost = stockPerPresentation > 0 ? unitPrice / stockPerPresentation : 0;

  InventoryStore.update(item.id, {
    qty:after,
    purchaseUnit:unit,
    contentQty,
    contentUnit,
    purchasePrice:unitPrice
  });

  const rows = readPurchases();
  const created = normalizePurchase({
    id:nextPurchaseId(rows),
    productId:item.id,
    productName:item.name,
    quantity,
    unit,
    contentQty,
    contentUnit,
    unitPrice,
    total:quantity * unitPrice,
    store:payload.store,
    date:payload.date || localDateISO(),
    createdAt:Date.now(),
    inventoryBefore:before,
    inventoryAfter:after,
    stockAdded:preview.stockAdded,
    stockUnit:item.unit,
    unitCost,
    autoStock:true,
    expenseStatus:'pending-dinero'
  });
  rows.unshift(created);
  writePurchases(rows);
  return { ok:true, purchase:created, item:InventoryStore.get(item.id), autoStock:true };
}

export const PurchaseStore = {
  list() { return readPurchases().sort((a,b)=>(b.createdAt || 0)-(a.createdAt || 0)); },
  today() { const today = localDateISO(); return this.list().filter(row=>row.date === today); },
  get(id) { return readPurchases().find(row=>row.id === id) || null; },
  reset() { return writePurchases([]); }
};
