import { OrdersStore, InventoryStore } from './data.js';
import { recipePlanForItem } from './recipe-engine.js';

const CORE_EVENT_KEY = 'panel-next-business-events-v1';
const PRODUCTION_KEY = 'panel-next-production-v1';

const UNIT_META = {
  ml:{group:'volume',factor:1}, L:{group:'volume',factor:1000}, 'fl oz':{group:'volume',factor:29.5735},
  cucharada:{group:'volume',factor:14.7868}, cucharadita:{group:'volume',factor:4.92892}, taza:{group:'volume',factor:236.588},
  g:{group:'mass',factor:1}, kg:{group:'mass',factor:1000}, oz:{group:'mass',factor:28.3495}, lb:{group:'mass',factor:453.592},
  pieza:{group:'count',factor:1}, unidad:{group:'count',factor:1}, pzas:{group:'count',factor:1}
};

const ORDER_TRANSITIONS = {
  pending:new Set(['preparing','cancelled']),
  preparing:new Set(['ready','cancelled']),
  ready:new Set(['delivery','cancelled']),
  delivery:new Set(['delivered']),
  delivered:new Set(),
  cancelled:new Set()
};

const rawOrderUpdate = OrdersStore.update.bind(OrdersStore);
const rawInventoryUpdate = InventoryStore.update.bind(InventoryStore);
let movementContext = null;
let installed = false;

function readRows(key) {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch (_) {
    return [];
  }
}

function writeRows(key, rows, max = 1000) {
  const next = Array.isArray(rows) ? rows.slice(0,max) : [];
  localStorage.setItem(key,JSON.stringify(next));
  return next;
}

function nextId(prefix, rows) {
  const n = rows.reduce((max,row)=>Math.max(max,Number(String(row.id || '').replace(/\D/g,'')) || 0),1000) + 1;
  return `${prefix}-${n}`;
}

function notify(name, detail = {}) {
  if (typeof window === 'undefined' || typeof CustomEvent === 'undefined') return;
  window.dispatchEvent(new CustomEvent(name,{detail}));
}

function cleanNumber(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 10000) / 10000;
}

function normalizeUnit(unit) {
  const raw = String(unit || '').trim();
  const key = raw.toLowerCase();
  const aliases = {
    lbs:'lb', libra:'lb', libras:'lb', onza:'oz', onzas:'oz', gramos:'g', gramo:'g',
    litros:'L', litro:'L', piezas:'pieza', pza:'pieza', pzas:'pieza', unidades:'pieza', unidad:'pieza'
  };
  return aliases[key] || raw;
}

function convertQty(qty, from, to) {
  const n = Number(qty);
  const sourceUnit = normalizeUnit(from);
  const targetUnit = normalizeUnit(to);
  if (!Number.isFinite(n)) return null;
  if (sourceUnit === targetUnit) return n;
  const source = UNIT_META[sourceUnit];
  const target = UNIT_META[targetUnit];
  if (!source || !target || source.group !== target.group) return null;
  return n * source.factor / target.factor;
}

function recordEvent(type, payload = {}) {
  const rows = readRows(CORE_EVENT_KEY);
  const event = {
    id:nextId('EV',rows),
    type:String(type || 'event'),
    at:Date.now(),
    ...payload
  };
  rows.unshift(event);
  writeRows(CORE_EVENT_KEY,rows);
  notify('panel:business-event',{event});
  return event;
}

function canTransition(from, to) {
  if (!to || from === to) return true;
  const allowed = ORDER_TRANSITIONS[from];
  return !allowed || allowed.has(to);
}

function withMovementContext(context, fn) {
  const previous = movementContext;
  movementContext = context || null;
  try { return fn(); }
  finally { movementContext = previous; }
}

function installCore() {
  if (installed) return;
  installed = true;

  OrdersStore.update = function(id, patch = {}) {
    const before = OrdersStore.get(id);
    if (!before) return null;
    const nextStatus = patch.status;
    if (nextStatus && nextStatus !== before.status && !canTransition(before.status,nextStatus)) {
      recordEvent('order-transition-rejected',{orderId:id,from:before.status,to:nextStatus});
      return null;
    }

    const updated = rawOrderUpdate(id,patch);
    if (!updated) return null;

    if (nextStatus && nextStatus !== before.status) {
      recordEvent('order-status',{orderId:id,from:before.status,to:nextStatus});
    }
    if (patch.paymentStatus && patch.paymentStatus !== before.paymentStatus) {
      recordEvent('payment-status',{orderId:id,from:before.paymentStatus || 'pending',to:patch.paymentStatus});
    }
    return updated;
  };

  InventoryStore.update = function(id, patch = {}) {
    const before = InventoryStore.get(id);
    const updated = rawInventoryUpdate(id,patch);
    if (!before || !updated) return updated;

    if (Object.prototype.hasOwnProperty.call(patch,'qty')) {
      const fromQty = Number(before.qty || 0);
      const toQty = Number(updated.qty || 0);
      const delta = cleanNumber(toQty - fromQty);
      if (Math.abs(delta) > 1e-9) {
        recordEvent('inventory-movement',{
          productId:id,
          productName:updated.name,
          unit:updated.unit,
          before:cleanNumber(fromQty),
          after:cleanNumber(toQty),
          delta,
          source:movementContext?.source || 'manual',
          reference:movementContext?.reference || ''
        });
      }
    }
    return updated;
  };
}

function listProductions() {
  return readRows(PRODUCTION_KEY).sort((a,b)=>(b.createdAt || 0)-(a.createdAt || 0));
}

function registerProduction(payload = {}) {
  const productName = String(payload.productName || payload.name || '').trim();
  const qty = Number(payload.qty || payload.quantity || 0);
  const unit = String(payload.unit || '').trim();
  if (!productName) return {ok:false,error:'Falta el platillo'};
  if (!(qty > 0)) return {ok:false,error:'Revisa la cantidad'};
  if (!unit) return {ok:false,error:'Falta la unidad'};

  const plan = recipePlanForItem({name:productName,qty,unit,recipeQty:qty,recipeUnit:unit});
  if (!plan.recipe) return {ok:false,error:'Este platillo no tiene receta vinculada'};
  if (!plan.compatible) return {ok:false,error:`La receta no es compatible con ${qty} ${unit}`};

  const rows = readRows(PRODUCTION_KEY);
  const productionId = nextId('PR',rows);
  const alerts = [];
  const requiredByItem = new Map();

  for (const ingredient of plan.ingredients) {
    if (ingredient.fixed === false) continue;
    if (!ingredient.inventoryItem) {
      alerts.push({ingredient:ingredient.name,type:'unlinked',message:'No está vinculado a inventario'});
      continue;
    }
    const needed = convertQty(ingredient.qty,ingredient.unit,ingredient.inventoryItem.unit);
    if (needed === null) {
      alerts.push({ingredient:ingredient.name,type:'unit',message:`No se puede convertir ${ingredient.unit} a ${ingredient.inventoryItem.unit}`});
      continue;
    }
    const key = ingredient.inventoryItem.id;
    if (!requiredByItem.has(key)) requiredByItem.set(key,{item:ingredient.inventoryItem,qty:0});
    requiredByItem.get(key).qty += needed;
  }

  const movements = [];
  let totalCost = 0;
  withMovementContext({source:'production',reference:productionId},()=>{
    for (const entry of requiredByItem.values()) {
      const current = InventoryStore.get(entry.item.id) || entry.item;
      const before = Number(current.qty || 0);
      const used = cleanNumber(entry.qty);
      const after = cleanNumber(before - used);
      const unitCost = Number(InventoryStore.unitCost(current) || 0);
      totalCost += used * unitCost;
      rawInventoryUpdate(current.id,{qty:after});
      recordEvent('inventory-movement',{
        productId:current.id,
        productName:current.name,
        unit:current.unit,
        before:cleanNumber(before),
        after,
        delta:cleanNumber(-used),
        source:'production',
        reference:productionId
      });
      if (after < 0) {
        alerts.push({ingredient:current.name,type:'shortage',message:`Inventario queda en ${after} ${current.unit}`});
      }
      movements.push({productId:current.id,productName:current.name,qty:used,unit:current.unit,before:cleanNumber(before),after,unitCost});
    }
  });

  const production = {
    id:productionId,
    productName,
    qty,
    unit,
    recipeId:plan.recipe.id,
    recipeName:plan.recipe.name,
    movements,
    alerts,
    totalCost:cleanNumber(totalCost),
    createdAt:Date.now()
  };
  rows.unshift(production);
  writeRows(PRODUCTION_KEY,rows,500);
  recordEvent('production',{productionId,productName,qty,unit,totalCost:production.totalCost,alerts:alerts.length});
  notify('panel:production-changed',{production});
  notify('panel:inventory-changed',{source:'production',production});
  return {ok:true,production,alerts};
}

installCore();

export const BusinessCore = {
  setOrderStatus(orderId,status,extra = {}) {
    const order = OrdersStore.get(orderId);
    if (!order) return {ok:false,error:'Pedido no encontrado'};
    const updated = OrdersStore.update(orderId,{...extra,status});
    return updated ? {ok:true,order:updated} : {ok:false,error:'Cambio de estado no permitido'};
  },
  markPayment(orderId,status='paid',extra = {}) {
    const order = OrdersStore.get(orderId);
    if (!order) return {ok:false,error:'Pedido no encontrado'};
    const updated = OrdersStore.update(orderId,{...extra,paymentStatus:status});
    return updated ? {ok:true,order:updated} : {ok:false,error:'No se pudo actualizar el pago'};
  },
  registerProduction,
  listProductions,
  listEvents() { return readRows(CORE_EVENT_KEY).sort((a,b)=>(b.at || 0)-(a.at || 0)); },
  recordEvent,
  withMovementContext
};
