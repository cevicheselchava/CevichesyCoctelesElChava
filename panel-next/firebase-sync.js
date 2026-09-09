import './admin-shell.js';
import { OrdersStore, InventoryStore } from './data.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey:'AIzaSyBbOIXTr2Tvz1FvoTk5GZgP2jx24jpjlL4',
  authDomain:'ceviches-y-cocteles-el-chava.firebaseapp.com',
  projectId:'ceviches-y-cocteles-el-chava',
  storageBucket:'ceviches-y-cocteles-el-chava.firebasestorage.app',
  messagingSenderId:'227568387475',
  appId:'1:227568387475:web:6ccd3e67e62d1bf4b0d466',
  measurementId:'G-1MZS4J9Y4Z'
};

const app = initializeApp(firebaseConfig,'panel-operativo');
const db = getFirestore(app);
let initialSnapshotReceived = false;
let lastCloudIds = new Set();

const ORDERS_RESET_AT = Date.parse('2026-09-09T17:56:07Z');
const ORDERS_STORAGE_KEY = 'panel-next-orders-v3';
const ORDERS_ARCHIVE_SOURCE = 'archived-reset-20260909';

function clearLocalOrdersBeforeReset() {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) return;
    const rows = JSON.parse(raw);
    if (!Array.isArray(rows)) return;
    const kept = rows.filter(order=>Number(order?.createdAt || 0) > ORDERS_RESET_AT);
    if (kept.length === rows.length) return;
    localStorage.setItem(ORDERS_STORAGE_KEY,JSON.stringify(kept));
    window.dispatchEvent(new CustomEvent('panel:orders-changed',{ detail:{ source:'orders-reset' } }));
  } catch (error) {
    console.warn('No se pudieron limpiar pedidos locales:',error);
  }
}

const PRICE_MIGRATION_KEY = 'panel-next-price-migration-20260909-v2';
const FLOZ_TO_ML = 29.5735295625;

const LEGACY_PRICE_ITEMS = {
  fish:{ name:'Filete de pescado', unit:'lb', purchaseUnit:'lb', contentQty:1, contentUnit:'lb' },
  shrimp:{ name:'Camarón', unit:'lb', purchaseUnit:'bolsa', contentQty:12, contentUnit:'oz' },
  octopus:{ name:'Pulpo', unit:'lb', purchaseUnit:'lb', contentQty:1, contentUnit:'lb' },
  tomato:{ name:'Tomate', unit:'lb', purchaseUnit:'lb', contentQty:1, contentUnit:'lb' },
  onion:{ name:'Cebolla morada', unit:'lb', purchaseUnit:'lb', contentQty:1, contentUnit:'lb' },
  cucumber:{ name:'Pepino', unit:'lb', purchaseUnit:'pieza', contentQty:0.6, contentUnit:'lb' },
  cilantro:{ name:'Cilantro', unit:'oz', purchaseUnit:'manojo', contentQty:2, contentUnit:'oz' },
  avocado:{ name:'Aguacate', unit:'pieza', purchaseUnit:'pieza', contentQty:1, contentUnit:'pieza' },
  lemonJuice:{ name:'Jugo de limón', unit:'fl oz', purchaseUnit:'botella', contentQty:32, contentUnit:'fl oz' },
  clamato:{ name:'Clamato', unit:'fl oz', purchaseUnit:'botella', contentQty:32, contentUnit:'fl oz' },
  ketchup:{ name:'Salsa catsup', unit:'ml', purchaseUnit:'botella', contentQty:20 * FLOZ_TO_ML, contentUnit:'ml' },
  tomatoPuree:{ name:'Puré de tomate', unit:'ml', purchaseUnit:'fl oz', contentQty:FLOZ_TO_ML, contentUnit:'ml' },
  english:{ name:'Salsa inglesa', unit:'ml', purchaseUnit:'botella', contentQty:5 * FLOZ_TO_ML, contentUnit:'ml' },
  maggi:{ name:'Salsa Maggi', unit:'ml', purchaseUnit:'botella', contentQty:3.38 * FLOZ_TO_ML, contentUnit:'ml' }
};

const TICKET_PRICE_OVERRIDES = {
  fish:{ name:'Filete de pescado', unit:'lb', purchaseUnit:'bolsa', contentQty:2, contentUnit:'lb', purchasePrice:8.87 },
  shrimp:{ name:'Camarón', unit:'lb', purchaseUnit:'bolsa', contentQty:12, contentUnit:'oz', purchasePrice:14.84 },
  tomato:{ name:'Tomate', unit:'lb', purchaseUnit:'lb', contentQty:1, contentUnit:'lb', purchasePrice:0.97 },
  onion:{ name:'Cebolla morada', unit:'lb', purchaseUnit:'lb', contentQty:1, contentUnit:'lb', purchasePrice:1.43 },
  cucumber:{ name:'Pepino', unit:'lb', purchaseUnit:'pieza', contentQty:0.6, contentUnit:'lb', purchasePrice:0.76 },
  avocado:{ name:'Aguacate', unit:'pieza', purchaseUnit:'pieza', contentQty:1, contentUnit:'pieza', purchasePrice:0.56 }
};

function inventoryNameKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .trim()
    .toLowerCase();
}

function inventoryItemByName(name) {
  const key = inventoryNameKey(name);
  return InventoryStore.list().find(item=>inventoryNameKey(item.name) === key) || null;
}

function upsertInventoryPrice(meta, purchasePrice) {
  const price = Number(purchasePrice || 0);
  if (!(price > 0)) return false;
  const current = inventoryItemByName(meta.name);
  const patch = {
    unit:meta.unit,
    purchaseUnit:meta.purchaseUnit,
    contentQty:Number(meta.contentQty || 1),
    contentUnit:meta.contentUnit || meta.unit,
    purchasePrice:price
  };
  if (current) {
    InventoryStore.update(current.id,patch);
  } else {
    InventoryStore.create({
      name:meta.name,
      category:'Ingrediente',
      qty:0,
      minimum:0,
      ...patch
    });
  }
  return true;
}

async function migrateLegacyPurchasePrices() {
  if (localStorage.getItem(PRICE_MIGRATION_KEY) === 'done') return;
  try {
    const snapshot = await getDoc(doc(db,'inventario','principal'));
    const legacy = snapshot.exists() ? (snapshot.data() || {}) : {};
    const prices = legacy.purchasePrices || {};
    let changed = false;

    Object.entries(LEGACY_PRICE_ITEMS).forEach(([legacyKey,meta])=>{
      const price = Number(prices[legacyKey] || 0);
      if (price > 0) changed = upsertInventoryPrice(meta,price) || changed;
    });

    Object.values(TICKET_PRICE_OVERRIDES).forEach(meta=>{
      changed = upsertInventoryPrice(meta,meta.purchasePrice) || changed;
    });

    localStorage.setItem(PRICE_MIGRATION_KEY,'done');
    window.dispatchEvent(new CustomEvent('panel:inventory-changed',{ detail:{ source:'legacy-price-migration' } }));
    if (changed) window.location.reload();
  } catch (error) {
    console.warn('No se pudieron migrar precios del panel anterior:',error);
  }
}

const STATUS_MAP = {
  nuevo:'pending',
  pendiente:'pending',
  pending:'pending',
  preparando:'preparing',
  preparing:'preparing',
  listo:'ready',
  ready:'ready',
  entrega:'delivery',
  reparto:'delivery',
  delivery:'delivery',
  entregado:'delivered',
  delivered:'delivered',
  cancelado:'cancelled',
  cancelled:'cancelled'
};

const CLOUD_RELEVANT_FIELDS = new Set([
  'status','customer','phone','address','zip','date','time','payment','paymentStatus','notes','items','total',
  'deliveryStartedAt','deliveredAt','paidAt'
]);

function normalizeStatus(value) {
  const key = String(value || '').trim().toLowerCase();
  return STATUS_MAP[key] || 'pending';
}

function toMillis(value, fallback = Date.now()) {
  if (value && typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : fallback;
}

function presentationRecipeAmount(item = {}) {
  if (Number.isFinite(Number(item.recipeQty)) && item.recipeUnit) {
    return { recipeQty:Number(item.recipeQty), recipeUnit:String(item.recipeUnit) };
  }

  const qty = Number(item.qty || 0);
  const detail = String(item.detail || '').toLowerCase();
  if (detail.includes('½ libra') || detail.includes('1/2 libra') || detail.includes('0.5 lb')) {
    return { recipeQty:qty * 0.5, recipeUnit:'lb' };
  }
  if (detail.includes('1 libra') || /(^|\D)1\s*lb(\D|$)/.test(detail)) {
    return { recipeQty:qty, recipeUnit:'lb' };
  }
  const ounces = detail.match(/(\d+(?:\.\d+)?)\s*oz/);
  if (ounces) return { recipeQty:qty * Number(ounces[1]), recipeUnit:'oz' };
  return { recipeQty:qty, recipeUnit:item.unit || 'orden' };
}

function mapItem(item = {}) {
  const recipe = presentationRecipeAmount(item);
  const unitPrice = item.price ?? item.unitPrice ?? null;
  return {
    productId:item.productId || '',
    name:item.name || 'Producto',
    detail:item.detail || '',
    qty:Number(item.qty || 0),
    unit:item.unit || 'orden',
    price:unitPrice === null || unitPrice === undefined ? null : Number(unitPrice),
    lineTotal:Number(item.lineTotal ?? (Number(item.qty || 0) * Number(unitPrice || 0))),
    recipeQty:recipe.recipeQty,
    recipeUnit:recipe.recipeUnit
  };
}

function mapRemoteOrder(snapshot) {
  const raw = snapshot.data() || {};
  const createdAt = toMillis(raw.createdAt, toMillis(raw.createdAtClient,0));
  return {
    id:snapshot.id,
    firestoreId:snapshot.id,
    cloud:true,
    source:raw.source === 'app-clientes' ? 'App clientes' : (raw.source || 'Firebase'),
    customer:raw.customer || raw.name || 'Cliente',
    phone:raw.phone || '',
    address:raw.address || '',
    zip:raw.zip || '',
    date:raw.deliveryDate || raw.date || '',
    time:raw.time || '',
    payment:raw.payment || 'Al recibir',
    paymentStatus:raw.paymentStatus === 'paid' ? 'paid' : 'pending',
    notes:raw.notes && raw.notes !== 'Sin notas' ? raw.notes : '',
    status:normalizeStatus(raw.status),
    items:Array.isArray(raw.items) ? raw.items.map(mapItem) : [],
    total:raw.total === null || raw.total === undefined ? null : Number(raw.total),
    createdAt,
    cloudCreatedAt:createdAt,
    deliveredAt:toMillis(raw.deliveredAt,0) || undefined,
    paidAt:toMillis(raw.paidAt,0) || undefined,
    deliveryStartedAt:toMillis(raw.deliveryStartedAt,0) || undefined
  };
}

function dispatch(name, detail = {}) {
  window.dispatchEvent(new CustomEvent(name,{ detail }));
}

function showConnectionState(state, message = '') {
  dispatch('panel:firebase-state',{ state, message });
}

clearLocalOrdersBeforeReset();
migrateLegacyPurchasePrices();

onSnapshot(collection(db,'pedidos'),snapshot=>{
  const remote = [];
  snapshot.forEach(row=>{
    const data = row.data() || {};
    const createdAt = toMillis(data.createdAt,toMillis(data.createdAtClient,0));
    if (createdAt <= ORDERS_RESET_AT) {
      if (data.source !== ORDERS_ARCHIVE_SOURCE) {
        updateDoc(doc(db,'pedidos',row.id),{
          source:ORDERS_ARCHIVE_SOURCE,
          archivedAt:serverTimestamp()
        }).catch(error=>console.warn('No se pudo archivar pedido anterior:',error));
      }
      return;
    }
    if (data.source !== 'app-clientes') return;
    remote.push(mapRemoteOrder(row));
  });

  const nextIds = new Set(remote.map(order=>order.id));
  if (initialSnapshotReceived) {
    const newOrders = remote.filter(order=>!lastCloudIds.has(order.id));
    newOrders.forEach(order=>dispatch('panel:new-order',{ order }));
  }

  OrdersStore.syncExternal(remote);
  lastCloudIds = nextIds;
  initialSnapshotReceived = true;
  showConnectionState('connected');
},error=>{
  console.error('Firebase pedidos:',error);
  showConnectionState('error',error?.message || 'No se pudo conectar a pedidos');
});

function cloudItems(items = []) {
  return items.map(item=>({
    productId:item.productId || '',
    name:item.name || 'Producto',
    detail:item.detail || '',
    qty:Number(item.qty || 0),
    unit:item.unit || 'orden',
    unitPrice:item.price === null || item.price === undefined ? null : Number(item.price),
    lineTotal:Number(item.lineTotal ?? (Number(item.qty || 0) * Number(item.price || 0))),
    recipeQty:Number(item.recipeQty ?? item.qty ?? 0),
    recipeUnit:item.recipeUnit || item.unit || 'orden'
  }));
}

async function pushPanelOrder(order) {
  if (!order?.cloud || !order.firestoreId) return;
  const cloudStatus = order.status === 'cancelled' ? 'cancelado' : (order.status || 'pending');
  const patch = {
    status:cloudStatus,
    customer:order.customer || '',
    phone:order.phone || '',
    address:order.address || '',
    zip:order.zip || '',
    deliveryDate:order.date || '',
    time:order.time || '',
    payment:order.payment || 'Al recibir',
    paymentStatus:order.paymentStatus || 'pending',
    notes:order.notes || 'Sin notas',
    items:cloudItems(order.items || []),
    total:order.total === null || order.total === undefined ? 0 : Number(order.total || 0),
    panelUpdatedAt:serverTimestamp()
  };

  if (order.deliveryStartedAt) patch.deliveryStartedAt = Number(order.deliveryStartedAt);
  if (order.deliveredAt) patch.deliveredAt = Number(order.deliveredAt);
  if (order.paidAt) patch.paidAt = Number(order.paidAt);

  try {
    await updateDoc(doc(db,'pedidos',order.firestoreId),patch);
    showConnectionState('connected');
  } catch (error) {
    console.error('No se pudo actualizar pedido en Firebase:',error);
    showConnectionState('error',error?.message || 'No se pudo actualizar el pedido');
  }
}

window.addEventListener('panel:order-updated',event=>{
  const order = event.detail?.order;
  const changed = Object.keys(event.detail?.patch || {});
  if (!order?.cloud) return;
  if (!changed.some(field=>CLOUD_RELEVANT_FIELDS.has(field))) return;
  pushPanelOrder(order);
});

export { db };

// Compras se carga únicamente desde purchases.js.
import('./legacy-disposable-prices.js');
import('./purchase-price-sync.js');
