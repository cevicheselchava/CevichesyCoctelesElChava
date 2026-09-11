import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getFirestore, doc, getDoc, setDoc, onSnapshot, serverTimestamp
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

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const LOCAL_KEY = 'chava-panel-v2';
const CLOUD_DOC = ['panel_v2','principal'];
const DEVICE_ID_KEY = 'chava-panel-device-v2';
const VERSION = 2;
const UNITS = ['oz','lb','fl oz','ml','g','kg','pza','bolsa','paquete','botella','manojo','charola','caja','otro'];

let deviceId = localStorage.getItem(DEVICE_ID_KEY);
if (!deviceId) {
  deviceId = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, deviceId);
}

const blank = () => ({
  version: VERSION,
  inventory: [],
  recipes: [],
  orders: [],
  purchases: [],
  sales: [],
  expenses: [],
  updatedAt: 0
});

function normalize(data) {
  const b = blank();
  if (!data || typeof data !== 'object') return b;
  return {
    ...b,
    ...data,
    version: VERSION,
    inventory: Array.isArray(data.inventory) ? data.inventory : [],
    recipes: Array.isArray(data.recipes) ? data.recipes : [],
    orders: Array.isArray(data.orders) ? data.orders : [],
    purchases: Array.isArray(data.purchases) ? data.purchases : [],
    sales: Array.isArray(data.sales) ? data.sales : [],
    expenses: Array.isArray(data.expenses) ? data.expenses : [],
    updatedAt: Number(data.updatedAt || 0)
  };
}

function loadLocal() {
  try { return normalize(JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null')); }
  catch { return blank(); }
}

let dbState = loadLocal();
let current = 'home';
let editing = null;
let cloudReady = false;
let applyingRemote = false;
let syncTimer = null;
let unsubscribe = null;

const money = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n || 0));
const qty = n => Number(n || 0).toLocaleString('en-US',{maximumFractionDigits:3});
const today = () => new Date().toLocaleDateString('en-CA');
const nowTime = () => new Date().toTimeString().slice(0,5);
const id = () => crypto.randomUUID();
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const byId = (arr, value) => arr.find(x => x.id === value);
const sorted = arr => [...arr].sort((a,b) => String(a.name || '').localeCompare(String(b.name || ''),'es'));

function saveLocal({sync=true}={}) {
  dbState.updatedAt = Date.now();
  localStorage.setItem(LOCAL_KEY, JSON.stringify(dbState));
  renderCurrent();
  if (sync && !applyingRemote) queueCloudSave();
}

function toast(text, ms=1800) {
  const el = $('#toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('show'), ms);
}

function setCloud(text, kind='') {
  const el = $('#cloudState');
  el.textContent = text;
  el.className = `pill ${kind}`.trim();
}

function queueCloudSave() {
  if (!cloudReady) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(pushCloud, 500);
}

async function pushCloud() {
  try {
    setCloud('Guardando…','syncing');
    const ref = doc(firestore, ...CLOUD_DOC);
    await setDoc(ref, {
      ...dbState,
      sourceDevice: deviceId,
      serverUpdatedAt: serverTimestamp()
    }, {merge:false});
    setCloud('Nube ✓','ok');
  } catch (err) {
    console.error(err);
    setCloud('Local','warn');
  }
}

const modules = [
  ['orders','📋','Pedidos'],
  ['prep','👨‍🍳','Preparación'],
  ['delivery','🚗','Entregas'],
  ['inventory','📦','Inventario'],
  ['recipes','🧾','Recetas'],
  ['purchases','🛒','Compras'],
  ['sales','💵','Venta'],
  ['money','💰','Dinero']
];

function goHome() {
  current = 'home';
  $('#home').classList.add('active');
  $('#screen').classList.remove('active');
  renderHome();
}

function openModule(name) {
  current = name;
  $('#home').classList.remove('active');
  $('#screen').classList.add('active');
  renderModule();
}

function renderCurrent() {
  if (current === 'home') renderHome();
  else renderModule();
}

function renderHome() {
  $('#modules').innerHTML = modules.map(([key,icon,label]) => `
    <button class="card" type="button" data-module="${key}">
      <span>${icon}</span><strong>${label}</strong>
    </button>`).join('');

  const active = dbState.orders.filter(o => !['delivered','cancelled'].includes(o.status)).length;
  const low = dbState.inventory.filter(i => Number(i.stock || 0) <= Number(i.minimum || 0)).length;
  const salesToday = dbState.sales
    .filter(s => s.date === today())
    .reduce((sum,s) => sum + Number(s.total || 0),0);
  const deliveredToday = dbState.orders
    .filter(o => o.date === today() && o.status === 'delivered')
    .reduce((sum,o) => sum + Number(o.total || 0),0);

  $('#summary').innerHTML = `
    <div class="summary-title">Hoy</div>
    <div class="stats">
      <div><strong>${active}</strong><span>Pedidos activos</span></div>
      <div><strong>${low}</strong><span>Inventario bajo</span></div>
      <div><strong>${money(salesToday + deliveredToday)}</strong><span>Ventas</span></div>
    </div>
    <button type="button" class="secondary full" data-export>Respaldar datos</button>`;
}

function renderModule() {
  const cfg = {
    orders:['Pedidos','＋ Pedido'],
    prep:['Preparación',''],
    delivery:['Entregas',''],
    inventory:['Inventario','＋ Ingrediente'],
    recipes:['Recetas','＋ Receta'],
    purchases:['Compras','＋ Compra'],
    sales:['Venta','＋ Venta'],
    money:['Dinero','＋ Gasto']
  }[current];

  $('#screenTitle').textContent = cfg[0];
  $('#primaryBtn').textContent = cfg[1];
  $('#primaryBtn').hidden = !cfg[1];

  if (current === 'orders') renderOrders();
  if (current === 'prep') renderPrep();
  if (current === 'delivery') renderDelivery();
  if (current === 'inventory') renderInventory();
  if (current === 'recipes') renderRecipes();
  if (current === 'purchases') renderPurchases();
  if (current === 'sales') renderSales();
  if (current === 'money') renderMoney();
}

const empty = text => `<div class="empty">${esc(text)}</div>`;
const statusLabel = s => ({pending:'Pendiente',preparing:'Preparando',ready:'Listo',delivery:'En entrega',delivered:'Entregado',cancelled:'Cancelado'}[s] || s);

function renderOrders() {
  const rows = [...dbState.orders].sort((a,b) => `${a.date||''} ${a.time||''}`.localeCompare(`${b.date||''} ${b.time||''}`));
  $('#content').innerHTML = rows.length ? `<div class="list">${rows.map(o => `
    <article class="row">
      <div class="row-head">
        <div><h3>${esc(o.customer || 'Cliente')}</h3><div class="muted">${esc(o.date || '')} ${esc(o.time || '')}</div></div>
        <strong>${money(o.total)}</strong>
      </div>
      <div>${esc(recipeName(o.recipeId) || o.product || 'Producto')} × ${qty(o.qty || 1)}</div>
      <div class="status ${esc(o.status)}">${esc(statusLabel(o.status))}</div>
      ${o.address ? `<div class="muted">${esc(o.address)}</div>` : ''}
      <div class="actions">
        ${!['delivered','cancelled'].includes(o.status) ? `<button type="button" data-order-edit="${o.id}">Editar</button>` : ''}
        ${!['delivered','cancelled'].includes(o.status) ? `<button type="button" class="danger" data-order-status="${o.id}" data-status="cancelled">Cancelar</button>` : ''}
      </div>
    </article>`).join('')}</div>` : empty('No hay pedidos.');
}

function renderPrep() {
  const rows = dbState.orders
    .filter(o => ['pending','preparing'].includes(o.status))
    .sort((a,b) => `${a.date||''} ${a.time||''}`.localeCompare(`${b.date||''} ${b.time||''}`));
  $('#content').innerHTML = rows.length ? `<div class="list">${rows.map(o => `
    <article class="row prep-row">
      <div class="row-head">
        <div><h3>${esc(recipeName(o.recipeId) || o.product || 'Pedido')}</h3><div class="muted">${esc(o.customer || '')}</div></div>
        <strong>${esc(o.time || '')}</strong>
      </div>
      <div class="bigqty">${qty(o.qty || 1)}</div>
      <div class="actions">
        ${o.status === 'pending'
          ? `<button class="primary-inline" type="button" data-order-status="${o.id}" data-status="preparing">Preparar</button>`
          : `<button class="primary-inline" type="button" data-order-status="${o.id}" data-status="ready">Listo</button>`}
      </div>
    </article>`).join('')}</div>` : empty('Nada por preparar.');
}

function renderDelivery() {
  const rows = dbState.orders
    .filter(o => ['ready','delivery'].includes(o.status))
    .sort((a,b) => `${a.date||''} ${a.time||''}`.localeCompare(`${b.date||''} ${b.time||''}`));
  $('#content').innerHTML = rows.length ? `<div class="list">${rows.map(o => `
    <article class="row">
      <div class="row-head"><h3>${esc(o.customer || 'Cliente')}</h3><strong>${esc(o.time || '')}</strong></div>
      <div>${esc(recipeName(o.recipeId) || o.product || 'Pedido')} × ${qty(o.qty || 1)}</div>
      <div class="address">${esc(o.address || 'Sin dirección')}</div>
      <div class="actions">
        ${o.status === 'ready'
          ? `<button class="primary-inline" type="button" data-order-status="${o.id}" data-status="delivery">Salir a entregar</button>`
          : `<button class="primary-inline" type="button" data-order-status="${o.id}" data-status="delivered">Entregado</button>`}
      </div>
    </article>`).join('')}</div>` : empty('No hay entregas.');
}

function renderInventory() {
  const rows = sorted(dbState.inventory);
  $('#content').innerHTML = rows.length ? `<div class="list">${rows.map(i => {
    const low = Number(i.stock || 0) <= Number(i.minimum || 0);
    return `<article class="row ${low ? 'low' : ''}">
      <div class="row-head">
        <div><h3>${esc(i.name)}</h3><div class="muted">${low ? '⚠ Inventario bajo' : 'Existencia'}</div></div>
        <strong>${qty(i.stock)} ${esc(i.unit)}</strong>
      </div>
      <div class="muted">Mínimo ${qty(i.minimum)} ${esc(i.unit)} · Costo ${money(i.costPerUnit)}/${esc(i.unit)}</div>
      <div class="actions">
        <button type="button" data-inventory-edit="${i.id}">Editar</button>
        <button type="button" class="danger" data-delete="inventory" data-id="${i.id}">Eliminar</button>
      </div>
    </article>`;
  }).join('')}</div>` : empty('Inventario vacío. Aquí solo aparecerá lo que tú registres.');
}

function renderRecipes() {
  const rows = sorted(dbState.recipes);
  $('#content').innerHTML = rows.length ? `<div class="list">${rows.map(r => {
    const cost = recipeCost(r);
    return `<article class="row">
      <div class="row-head"><div><h3>${esc(r.name)}</h3><div class="muted">${r.ingredients.length} ingredientes</div></div><strong>${money(r.price)}</strong></div>
      <div class="muted">Costo estimado ${money(cost)} · Margen ${money(Number(r.price||0)-cost)}</div>
      <div class="recipe-lines">${r.ingredients.map(x => {
        const inv = byId(dbState.inventory,x.inventoryId);
        return inv ? `<span>${esc(inv.name)}: ${qty(x.qty)} ${esc(inv.unit)}</span>` : '';
      }).join('')}</div>
      <div class="actions">
        <button type="button" data-recipe-edit="${r.id}">Editar</button>
        <button type="button" class="danger" data-delete="recipes" data-id="${r.id}">Eliminar</button>
      </div>
    </article>`;
  }).join('')}</div>` : empty('No hay recetas. Primero registra ingredientes en Inventario.');
}

function renderPurchases() {
  const rows = [...dbState.purchases].sort((a,b) => String(b.date||'').localeCompare(String(a.date||'')));
  $('#content').innerHTML = rows.length ? `<div class="list">${rows.map(p => `
    <article class="row">
      <div class="row-head"><h3>${esc(inventoryName(p.inventoryId) || p.name || 'Compra')}</h3><strong>${money(p.total)}</strong></div>
      <div class="muted">${esc(p.date || '')} · ${qty(p.qty)} ${esc(p.unit || '')}</div>
    </article>`).join('')}</div>` : empty('No hay compras.');
}

function renderSales() {
  const rows = [...dbState.sales].sort((a,b) => `${b.date||''} ${b.time||''}`.localeCompare(`${a.date||''} ${a.time||''}`));
  $('#content').innerHTML = rows.length ? `<div class="list">${rows.map(s => `
    <article class="row">
      <div class="row-head"><h3>${esc(recipeName(s.recipeId) || s.product || 'Venta')}</h3><strong>${money(s.total)}</strong></div>
      <div class="muted">${esc(s.date || '')} ${esc(s.time || '')} · Cantidad ${qty(s.qty || 1)}</div>
    </article>`).join('')}</div>` : empty('No hay ventas directas.');
}

function renderMoney() {
  const salesIncome = dbState.sales.reduce((a,b) => a + Number(b.total || 0),0);
  const ordersIncome = dbState.orders.filter(o => o.status === 'delivered').reduce((a,b) => a + Number(b.total || 0),0);
  const purchases = dbState.purchases.reduce((a,b) => a + Number(b.total || 0),0);
  const expenses = dbState.expenses.reduce((a,b) => a + Number(b.amount || 0),0);
  const income = salesIncome + ordersIncome;
  const out = purchases + expenses;
  const rows = [...dbState.expenses].sort((a,b) => String(b.date||'').localeCompare(String(a.date||'')));

  $('#content').innerHTML = `
    <div class="money-grid">
      <div><span>Entradas</span><strong>${money(income)}</strong></div>
      <div><span>Salidas</span><strong>${money(out)}</strong></div>
      <div class="balance"><span>Balance</span><strong>${money(income-out)}</strong></div>
    </div>
    ${rows.length ? `<div class="list">${rows.map(e => `<article class="row"><div class="row-head"><h3>${esc(e.name)}</h3><strong>${money(e.amount)}</strong></div><div class="muted">${esc(e.date || '')}</div></article>`).join('')}</div>` : empty('No hay gastos registrados.')}`;
}

function inventoryName(inventoryId) {
  return byId(dbState.inventory, inventoryId)?.name || '';
}
function recipeName(recipeId) {
  return byId(dbState.recipes, recipeId)?.name || '';
}
function recipeCost(recipe) {
  return (recipe.ingredients || []).reduce((sum,x) => {
    const inv = byId(dbState.inventory,x.inventoryId);
    return sum + Number(x.qty || 0) * Number(inv?.costPerUnit || 0);
  },0);
}

function openModal(title, html, onSubmit) {
  editing = {onSubmit};
  $('#formTitle').textContent = title;
  $('#formFields').innerHTML = html;
  $('#modal').hidden = false;
}
function closeModal() {
  $('#modal').hidden = true;
  editing = null;
}
function field(label, name, value='', type='text', extra='') {
  return `<label>${esc(label)}<input name="${esc(name)}" type="${type}" value="${esc(value)}" ${extra}></label>`;
}
function selectField(label,name,options,value='') {
  return `<label>${esc(label)}<select name="${esc(name)}">${options.map(o => {
    const [val,text] = Array.isArray(o) ? o : [o,o];
    return `<option value="${esc(val)}" ${String(val)===String(value)?'selected':''}>${esc(text)}</option>`;
  }).join('')}</select></label>`;
}

function openInventoryForm(item=null) {
  const i = item || {name:'',unit:'oz',stock:0,minimum:0,costPerUnit:0};
  openModal(item ? 'Editar ingrediente' : 'Nuevo ingrediente', `
    <div class="fields">
      ${field('Ingrediente','name',i.name,'text','required')}
      ${selectField('Unidad de control','unit',UNITS,i.unit)}
      ${field('Existencia actual','stock',i.stock,'number','step="0.001" min="0" required')}
      ${field('Avisar cuando quede','minimum',i.minimum,'number','step="0.001" min="0"')}
      ${field('Costo por unidad','costPerUnit',i.costPerUnit,'number','step="0.0001" min="0"')}
    </div>`, form => {
      const d = Object.fromEntries(new FormData(form));
      const next = {
        id: item?.id || id(),
        name: d.name.trim(),
        unit: d.unit,
        stock: Number(d.stock || 0),
        minimum: Number(d.minimum || 0),
        costPerUnit: Number(d.costPerUnit || 0)
      };
      if (!next.name) return;
      if (item) dbState.inventory = dbState.inventory.map(x => x.id === item.id ? next : x);
      else dbState.inventory.push(next);
      saveLocal(); closeModal(); toast('Ingrediente guardado');
    });
}

function ingredientRow(data={}) {
  const options = sorted(dbState.inventory).map(i => [i.id,`${i.name} (${i.unit})`]);
  if (!options.length) return '';
  const selected = data.inventoryId || options[0][0];
  const inv = byId(dbState.inventory,selected) || dbState.inventory[0];
  return `<div class="ingredient-row">
    <select name="ingredientId">${options.map(([v,t])=>`<option value="${esc(v)}" ${v===selected?'selected':''}>${esc(t)}</option>`).join('')}</select>
    <input name="ingredientQty" type="number" min="0.001" step="0.001" value="${esc(data.qty || '')}" placeholder="Cantidad" required>
    <span class="unit-chip">${esc(inv?.unit || '')}</span>
    <button type="button" class="icon danger" data-remove-ingredient>×</button>
  </div>`;
}

function openRecipeForm(recipe=null) {
  if (!dbState.inventory.length) {
    toast('Primero registra ingredientes en Inventario',2500);
    return;
  }
  const r = recipe || {name:'',price:0,ingredients:[]};
  openModal(recipe ? 'Editar receta' : 'Nueva receta', `
    <div class="fields">
      ${field('Nombre / presentación','name',r.name,'text','required placeholder="Ej. Ceviche Mixto 1 lb"')}
      ${field('Precio de venta','price',r.price,'number','step="0.01" min="0" required')}
    </div>
    <div class="section-head"><strong>Ingredientes</strong><button type="button" class="secondary" data-add-ingredient>＋ Agregar</button></div>
    <div id="ingredientRows">${(r.ingredients.length ? r.ingredients : [{}]).map(ingredientRow).join('')}</div>
    <div id="recipeCostPreview" class="cost-preview"></div>`, form => {
      const fd = new FormData(form);
      const ids = fd.getAll('ingredientId');
      const qs = fd.getAll('ingredientQty');
      const ingredients = ids.map((inventoryId,index) => ({inventoryId,qty:Number(qs[index]||0)})).filter(x => x.qty > 0);
      const d = Object.fromEntries(fd);
      if (!d.name?.trim() || !ingredients.length) {
        toast('Pon nombre e ingredientes');
        return;
      }
      const next = {id:recipe?.id||id(),name:d.name.trim(),price:Number(d.price||0),ingredients};
      if (recipe) dbState.recipes = dbState.recipes.map(x => x.id === recipe.id ? next : x);
      else dbState.recipes.push(next);
      saveLocal(); closeModal(); toast('Receta guardada');
    });
  updateRecipeCostPreview();
}

function updateIngredientUnits() {
  $$('#ingredientRows .ingredient-row').forEach(row => {
    const inv = byId(dbState.inventory,row.querySelector('[name=ingredientId]')?.value);
    const chip = row.querySelector('.unit-chip');
    if (chip) chip.textContent = inv?.unit || '';
  });
  updateRecipeCostPreview();
}

function updateRecipeCostPreview() {
  const box = $('#recipeCostPreview');
  if (!box) return;
  let cost = 0;
  $$('#ingredientRows .ingredient-row').forEach(row => {
    const inv = byId(dbState.inventory,row.querySelector('[name=ingredientId]')?.value);
    const q = Number(row.querySelector('[name=ingredientQty]')?.value || 0);
    cost += q * Number(inv?.costPerUnit || 0);
  });
  const price = Number($('#form [name=price]')?.value || 0);
  box.textContent = `Costo estimado: ${money(cost)} · Margen: ${money(price-cost)}`;
}

function recipeOptions(selected='') {
  return sorted(dbState.recipes).map(r => [r.id,`${r.name} — ${money(r.price)}`]);
}

function openOrderForm(order=null) {
  if (!dbState.recipes.length) { toast('Primero crea una receta/producto',2500); return; }
  const o = order || {customer:'',recipeId:dbState.recipes[0].id,qty:1,total:dbState.recipes[0].price,date:today(),time:nowTime(),address:''};
  openModal(order ? 'Editar pedido' : 'Nuevo pedido', `
    <div class="fields">
      ${field('Cliente','customer',o.customer,'text','required')}
      ${selectField('Producto','recipeId',recipeOptions(),o.recipeId)}
      ${field('Cantidad','qty',o.qty,'number','step="1" min="1" required')}
      ${field('Total','total',o.total,'number','step="0.01" min="0" required')}
      ${field('Fecha','date',o.date,'date','required')}
      ${field('Hora','time',o.time,'time','required')}
      ${field('Dirección','address',o.address,'text','')}
    </div>`, form => {
      const d = Object.fromEntries(new FormData(form));
      const next = {
        ...(order || {}),
        id: order?.id || id(),
        customer:d.customer.trim(),
        recipeId:d.recipeId,
        qty:Number(d.qty||1),
        total:Number(d.total||0),
        date:d.date,
        time:d.time,
        address:d.address.trim(),
        status:order?.status || 'pending',
        inventoryApplied:Boolean(order?.inventoryApplied)
      };
      if (order) dbState.orders = dbState.orders.map(x => x.id === order.id ? next : x);
      else dbState.orders.push(next);
      saveLocal(); closeModal(); toast('Pedido guardado');
    });
  bindAutoTotal();
}

function bindAutoTotal() {
  const recipe = $('#form [name=recipeId]');
  const quantity = $('#form [name=qty]');
  const total = $('#form [name=total]');
  if (!recipe || !quantity || !total) return;
  const recalc = () => {
    const r = byId(dbState.recipes,recipe.value);
    total.value = (Number(r?.price||0) * Number(quantity.value||1)).toFixed(2);
  };
  recipe.addEventListener('change',recalc);
  quantity.addEventListener('input',recalc);
}

function openPurchaseForm() {
  if (!dbState.inventory.length) { toast('Primero registra un ingrediente',2500); return; }
  openModal('Nueva compra', `
    <div class="fields">
      ${selectField('Ingrediente','inventoryId',sorted(dbState.inventory).map(i=>[i.id,`${i.name} (${i.unit})`]))}
      ${field('Cantidad que entra al inventario','qty','', 'number','step="0.001" min="0.001" required')}
      ${field('Total pagado','total','', 'number','step="0.01" min="0" required')}
      ${field('Fecha','date',today(),'date','required')}
    </div>
    <div class="hint">Ejemplo: si una bolsa trae 12 oz y tu inventario está en oz, registra 12.</div>`, form => {
      const d = Object.fromEntries(new FormData(form));
      const amount = Number(d.qty||0);
      const total = Number(d.total||0);
      const inv = byId(dbState.inventory,d.inventoryId);
      if (!inv || amount <= 0) return;
      dbState.inventory = dbState.inventory.map(x => x.id === inv.id ? {...x,stock:Number(x.stock||0)+amount,costPerUnit:total>0?total/amount:Number(x.costPerUnit||0)} : x);
      dbState.purchases.push({id:id(),inventoryId:inv.id,name:inv.name,qty:amount,unit:inv.unit,total,date:d.date});
      saveLocal(); closeModal(); toast('Compra e inventario actualizados');
    });
}

function openSaleForm() {
  if (!dbState.recipes.length) { toast('Primero crea una receta/producto',2500); return; }
  openModal('Nueva venta', `
    <div class="fields">
      ${selectField('Producto','recipeId',recipeOptions())}
      ${field('Cantidad','qty',1,'number','step="1" min="1" required')}
      ${field('Total','total',dbState.recipes[0].price,'number','step="0.01" min="0" required')}
      ${field('Fecha','date',today(),'date','required')}
      ${field('Hora','time',nowTime(),'time','required')}
    </div>`, form => {
      const d = Object.fromEntries(new FormData(form));
      const q = Number(d.qty||1);
      const r = byId(dbState.recipes,d.recipeId);
      if (!r) return;
      consumeRecipe(r,q);
      dbState.sales.push({id:id(),recipeId:r.id,product:r.name,qty:q,total:Number(d.total||0),date:d.date,time:d.time,inventoryApplied:true});
      saveLocal(); closeModal(); toast('Venta guardada e inventario descontado');
    });
  bindAutoTotal();
}

function openExpenseForm() {
  openModal('Nuevo gasto', `
    <div class="fields">
      ${field('Concepto','name','','text','required')}
      ${field('Cantidad','amount','','number','step="0.01" min="0" required')}
      ${field('Fecha','date',today(),'date','required')}
    </div>`, form => {
      const d = Object.fromEntries(new FormData(form));
      dbState.expenses.push({id:id(),name:d.name.trim(),amount:Number(d.amount||0),date:d.date});
      saveLocal(); closeModal(); toast('Gasto guardado');
    });
}

function consumeRecipe(recipe, saleQty=1) {
  const shortages = [];
  recipe.ingredients.forEach(line => {
    const inv = byId(dbState.inventory,line.inventoryId);
    if (!inv) return;
    const needed = Number(line.qty||0) * Number(saleQty||1);
    if (Number(inv.stock||0) < needed) shortages.push(`${inv.name}: faltan ${qty(needed-Number(inv.stock||0))} ${inv.unit}`);
  });
  dbState.inventory = dbState.inventory.map(inv => {
    const line = recipe.ingredients.find(x => x.inventoryId === inv.id);
    if (!line) return inv;
    return {...inv,stock:Number(inv.stock||0) - Number(line.qty||0) * Number(saleQty||1)};
  });
  if (shortages.length) setTimeout(()=>toast(`Ojo: ${shortages[0]}`,3500),250);
}

function changeOrderStatus(orderId,newStatus) {
  const order = byId(dbState.orders,orderId);
  if (!order) return;
  let next = {...order,status:newStatus};
  if (newStatus === 'delivered' && !order.inventoryApplied) {
    const recipe = byId(dbState.recipes,order.recipeId);
    if (recipe) consumeRecipe(recipe,Number(order.qty||1));
    next.inventoryApplied = true;
    next.deliveredAt = Date.now();
  }
  dbState.orders = dbState.orders.map(x => x.id === orderId ? next : x);
  saveLocal();
  toast(newStatus === 'delivered' ? 'Entregado e inventario descontado' : statusLabel(newStatus));
}

function deleteRecord(type,recordId) {
  if (type === 'inventory') {
    const used = dbState.recipes.some(r => r.ingredients.some(x => x.inventoryId === recordId));
    if (used) { toast('Ese ingrediente está usado en una receta',2500); return; }
    if (!confirm('¿Eliminar este ingrediente?')) return;
    dbState.inventory = dbState.inventory.filter(x => x.id !== recordId);
  }
  if (type === 'recipes') {
    const used = dbState.orders.some(o => o.recipeId === recordId && !['delivered','cancelled'].includes(o.status));
    if (used) { toast('Esa receta tiene pedidos activos',2500); return; }
    if (!confirm('¿Eliminar esta receta?')) return;
    dbState.recipes = dbState.recipes.filter(x => x.id !== recordId);
  }
  saveLocal();
  toast('Eliminado');
}

function exportBackup() {
  const blob = new Blob([JSON.stringify(dbState,null,2)],{type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `panel-el-chava-${today()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Respaldo descargado');
}

document.addEventListener('click', e => {
  const moduleBtn = e.target.closest('[data-module]');
  if (moduleBtn) return openModule(moduleBtn.dataset.module);

  if (e.target.closest('[data-export]')) return exportBackup();

  const ie = e.target.closest('[data-inventory-edit]');
  if (ie) return openInventoryForm(byId(dbState.inventory,ie.dataset.inventoryEdit));

  const re = e.target.closest('[data-recipe-edit]');
  if (re) return openRecipeForm(byId(dbState.recipes,re.dataset.recipeEdit));

  const oe = e.target.closest('[data-order-edit]');
  if (oe) return openOrderForm(byId(dbState.orders,oe.dataset.orderEdit));

  const os = e.target.closest('[data-order-status]');
  if (os) return changeOrderStatus(os.dataset.orderStatus,os.dataset.status);

  const del = e.target.closest('[data-delete]');
  if (del) return deleteRecord(del.dataset.delete,del.dataset.id);

  if (e.target.closest('[data-add-ingredient]')) {
    $('#ingredientRows').insertAdjacentHTML('beforeend',ingredientRow({}));
    updateIngredientUnits();
    return;
  }
  const rm = e.target.closest('[data-remove-ingredient]');
  if (rm) {
    const rows = $$('#ingredientRows .ingredient-row');
    if (rows.length <= 1) { toast('La receta necesita al menos un ingrediente'); return; }
    rm.closest('.ingredient-row').remove();
    updateRecipeCostPreview();
  }
});

document.addEventListener('change', e => {
  if (e.target.matches('[name=ingredientId]')) updateIngredientUnits();
  if (e.target.matches('[name=ingredientQty], #form [name=price]')) updateRecipeCostPreview();
});
document.addEventListener('input', e => {
  if (e.target.matches('[name=ingredientQty], #form [name=price]')) updateRecipeCostPreview();
});

$('#backBtn').addEventListener('click',goHome);
$('#homeBtn').addEventListener('click',goHome);
$('#closeModal').addEventListener('click',e=>{e.preventDefault();closeModal();});
$('#modal').addEventListener('click',e=>{if(e.target===$('#modal'))closeModal();});
$('#form').addEventListener('submit',e=>{
  e.preventDefault();
  if (editing?.onSubmit) editing.onSubmit(e.currentTarget);
});
$('#primaryBtn').addEventListener('click',()=>{
  if (current === 'orders') openOrderForm();
  if (current === 'inventory') openInventoryForm();
  if (current === 'recipes') openRecipeForm();
  if (current === 'purchases') openPurchaseForm();
  if (current === 'sales') openSaleForm();
  if (current === 'money') openExpenseForm();
});

let firestore;
async function initCloud() {
  try {
    const app = initializeApp(firebaseConfig,'panel-v2');
    firestore = getFirestore(app);
    const ref = doc(firestore,...CLOUD_DOC);
    setCloud('Conectando…','syncing');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const remote = normalize(snap.data());
      if (remote.updatedAt >= dbState.updatedAt || dbState.updatedAt === 0) {
        applyingRemote = true;
        dbState = remote;
        localStorage.setItem(LOCAL_KEY,JSON.stringify(dbState));
        applyingRemote = false;
        renderCurrent();
      } else {
        await setDoc(ref,{...dbState,sourceDevice:deviceId,serverUpdatedAt:serverTimestamp()},{merge:false});
      }
    } else {
      await setDoc(ref,{...dbState,sourceDevice:deviceId,serverUpdatedAt:serverTimestamp()},{merge:false});
    }
    cloudReady = true;
    setCloud('Nube ✓','ok');

    unsubscribe = onSnapshot(ref, snap2 => {
      if (!snap2.exists()) return;
      const data = snap2.data();
      if (data.sourceDevice === deviceId) return;
      const remote = normalize(data);
      if (remote.updatedAt > dbState.updatedAt) {
        applyingRemote = true;
        dbState = remote;
        localStorage.setItem(LOCAL_KEY,JSON.stringify(dbState));
        applyingRemote = false;
        renderCurrent();
        toast('Datos actualizados');
      }
    }, err => {
      console.error(err);
      setCloud('Local','warn');
    });
  } catch (err) {
    console.error(err);
    setCloud('Local','warn');
  }
}

goHome();
initCloud();
