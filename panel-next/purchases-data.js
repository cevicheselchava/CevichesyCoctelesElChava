import { InventoryStore } from './data.js';

const PURCHASE_STORAGE_KEY = 'panel-next-purchases-v1';

const localDateISO = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0,10);
};

const UNIT_META = {
  g:{group:'mass',factor:1}, kg:{group:'mass',factor:1000}, oz:{group:'mass',factor:28.349523125}, lb:{group:'mass',factor:453.59237},
  ml:{group:'volume',factor:1}, L:{group:'volume',factor:1000}, 'fl oz':{group:'volume',factor:29.5735295625}, 'galón':{group:'volume',factor:3785.411784},
  pieza:{group:'count',factor:1}, unidad:{group:'count',factor:1}
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
  return {
    ...row,
    productId:String(row.productId || ''),
    productName:String(row.productName || '').trim(),
    quantity:Number.isFinite(quantity) ? quantity : 0,
    unit:String(row.unit || '').trim(),
    unitPrice:Number.isFinite(unitPrice) ? unitPrice : 0,
    total:Number.isFinite(Number(row.total)) ? Number(row.total) : quantity * unitPrice,
    store:String(row.store || '').trim(),
    date:String(row.date || localDateISO()),
    stockAdded:Number(row.stockAdded || 0),
    stockUnit:String(row.stockUnit || '').trim(),
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

export function stockPerPurchaseUnit(item) {
  if (!item) return null;
  const contentQty = Number(item.contentQty || 1);
  const contentUnit = item.contentUnit || item.unit;
  const converted = convertQty(contentQty, contentUnit, item.unit);
  return converted === null ? null : converted;
}

export function suggestedPurchaseQuantity(item) {
  if (!item) return 1;
  const gap = Math.max(0, Number(item.minimum || 0) - Number(item.qty || 0));
  if (gap <= 0) return 1;
  const perUnit = stockPerPurchaseUnit(item);
  if (!perUnit || perUnit <= 0) return 1;
  return Math.max(1, Math.ceil(gap / perUnit));
}

export function purchasePreview(item, quantity, purchaseUnit) {
  const qty = Number(quantity || 0);
  if (!item || !Number.isFinite(qty) || qty <= 0) return { stockAdded:null, stockUnit:item?.unit || '', automatic:false };

  if (purchaseUnit === item.purchaseUnit) {
    const perUnit = stockPerPurchaseUnit(item);
    if (perUnit !== null) return { stockAdded:qty * perUnit, stockUnit:item.unit, automatic:true };
  }

  const direct = convertQty(qty, purchaseUnit, item.unit);
  if (direct !== null) return { stockAdded:direct, stockUnit:item.unit, automatic:true };

  return { stockAdded:null, stockUnit:item.unit, automatic:false };
}

export function registerPurchase(payload = {}) {
  const item = findInventoryItem(payload.productId, payload.productName);
  if (!item) return { ok:false, error:'Producto no encontrado en inventario' };

  const quantity = Number(payload.quantity || 0);
  const unitPrice = Number(payload.unitPrice || 0);
  const unit = String(payload.unit || item.purchaseUnit || '').trim();
  if (!Number.isFinite(quantity) || quantity <= 0) return { ok:false, error:'Cantidad inválida' };
  if (!Number.isFinite(unitPrice) || unitPrice < 0) return { ok:false, error:'Precio inválido' };
  if (!unit) return { ok:false, error:'Falta la unidad de compra' };

  const preview = purchasePreview(item, quantity, unit);
  const before = Number(item.qty || 0);
  let after = before;

  if (preview.automatic && Number.isFinite(preview.stockAdded)) {
    after = before + preview.stockAdded;
    const patch = { qty:after };
    if (unit === item.purchaseUnit) patch.purchasePrice = unitPrice;
    InventoryStore.update(item.id, patch);
  }

  const rows = readPurchases();
  const created = normalizePurchase({
    id:nextPurchaseId(rows),
    productId:item.id,
    productName:item.name,
    quantity,
    unit,
    unitPrice,
    total:quantity * unitPrice,
    store:payload.store,
    date:payload.date || localDateISO(),
    createdAt:Date.now(),
    inventoryBefore:before,
    inventoryAfter:after,
    stockAdded:preview.automatic ? preview.stockAdded : 0,
    stockUnit:item.unit,
    autoStock:preview.automatic,
    expenseStatus:'pending-dinero'
  });
  rows.unshift(created);
  writePurchases(rows);
  return { ok:true, purchase:created, item:InventoryStore.get(item.id), autoStock:preview.automatic };
}

export const PurchaseStore = {
  list() { return readPurchases().sort((a,b)=>(b.createdAt || 0)-(a.createdAt || 0)); },
  today() { const today = localDateISO(); return this.list().filter(row=>row.date === today); },
  get(id) { return readPurchases().find(row=>row.id === id) || null; },
  reset() { return writePurchases([]); }
};
