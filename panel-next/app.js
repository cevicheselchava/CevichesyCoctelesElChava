import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getFirestore, doc, getDoc, setDoc, onSnapshot, serverTimestamp,
  collection, updateDoc
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

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const $ = s => document.querySelector(s);
const LOCAL_KEY = 'chava-panel-v3';
const CLOUD_DOC = ['panel_v3','principal'];
const DEVICE_ID_KEY = 'chava-panel-device-v3';
const VERSION = 3;
const UNITS = ['oz','lb','fl oz','ml','g','kg','pza','bolsa','paquete','botella','manojo','charola','caja','otro'];
const APP_KEYS = ['fish','shrimp','octopus','tomato','onion','cucumber','cilantro','lemonJuice','lime','clamato','tostadas','container16','lid16','container12','lid12','spoon','napkins','saltPacket','habaneroSauce','coca','cokezero','sprite','drpepper','bigred','fanta'];

let deviceId = localStorage.getItem(DEVICE_ID_KEY);
if (!deviceId) {
  deviceId = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, deviceId);
}

const blank = () => ({version:VERSION, inventory:[], recipes:[], orders:[], purchases:[], sales:[], expenses:[], updatedAt:0});
function normalize(data){
  const b=blank(); if(!data||typeof data!=='object') return b;
  return {...b,...data,version:VERSION,
    inventory:Array.isArray(data.inventory)?data.inventory:[],
    recipes:Array.isArray(data.recipes)?data.recipes:[],
    orders:Array.isArray(data.orders)?data.orders:[],
    purchases:Array.isArray(data.purchases)?data.purchases:[],
    sales:Array.isArray(data.sales)?data.sales:[],
    expenses:Array.isArray(data.expenses)?data.expenses:[],
    updatedAt:Number(data.updatedAt||0)};
}
function loadLocal(){try{return normalize(JSON.parse(localStorage.getItem(LOCAL_KEY)||'null'));}catch{return blank();}}

let dbState=loadLocal();
let publicOrders=[];
let current='home';
let editing=null;
let cloudReady=false;
let applyingRemote=false;
let syncTimer=null;

const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n||0));
const qty=n=>Number(n||0).toLocaleString('en-US',{maximumFractionDigits:3});
const today=()=>new Date().toLocaleDateString('en-CA');
const tomorrow=()=>{const d=new Date();d.setDate(d.getDate()+1);return d.toLocaleDateString('en-CA');};
const nowTime=()=>new Date().toTimeString().slice(0,5);
const id=()=>crypto.randomUUID();
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const byId=(arr,value)=>arr.find(x=>x.id===value);
const sorted=arr=>[...arr].sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'es'));
const empty=text=>`<div class="empty">${esc(text)}</div>`;

function saveLocal({sync=true}={}){dbState.updatedAt=Date.now();localStorage.setItem(LOCAL_KEY,JSON.stringify(dbState));renderCurrent();if(sync&&!applyingRemote)queueCloudSave();}
function toast(text,ms=1800){const el=$('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),ms);}
function setCloud(text,kind=''){const el=$('#cloudState');el.textContent=text;el.className=`pill ${kind}`.trim();}
function queueCloudSave(){if(!cloudReady)return;clearTimeout(syncTimer);syncTimer=setTimeout(pushCloud,450);}
async function pushCloud(){try{setCloud('Guardando…','syncing');await setDoc(doc(firestore,...CLOUD_DOC),{...dbState,sourceDevice:deviceId,serverUpdatedAt:serverTimestamp()},{merge:false});setCloud('Nube ✓','ok');}catch(e){console.error(e);setCloud('Local','warn');}}

const modules=[
 ['orders','📋','Pedidos','mod-orders'],['prep','👨‍🍳','Preparación','mod-prep'],['delivery','🚗','Entregas','mod-delivery'],
 ['inventory','📦','Inventario','mod-inventory'],['recipes','🧾','Recetas','mod-recipes'],['purchases','🛒','Compras','mod-purchases'],
 ['sales','💵','Venta','mod-sales'],['money','💰','Dinero','mod-money']
];

function allOrders(){return [...publicOrders,...dbState.orders];}
function normalizeStatus(s){return ({nuevo:'pending',pendiente:'pending',preparando:'preparing',listo:'ready',entrega:'delivery',en_entrega:'delivery',entregado:'delivered',cancelado:'cancelled'}[s]||s||'pending');}
function statusLabel(s){return ({pending:'Pendiente',preparing:'Preparando',ready:'Listo',delivery:'En entrega',delivered:'Entregado',cancelled:'Cancelado'}[normalizeStatus(s)]||s);}
function mapPublicOrder(snap){const d=snap.data()||{};return {
  id:snap.id, public:true, customer:d.customer||d.name||'Cliente', phone:d.phone||'', address:d.address||'', zip:d.zip||'',
  date:d.deliveryDate||d.date||'', time:d.time||'', total:Number(d.total||0), status:normalizeStatus(d.status),
  items:Array.isArray(d.items)?d.items:[], publicRecipe:d.recipe&&typeof d.recipe==='object'?d.recipe:{}, payment:d.payment||'', notes:d.notes||'',
  product:(Array.isArray(d.items)?d.items.map(x=>`${x.name||'Producto'}${x.qty>1?` × ${x.qty}`:''}`).join(', '):'Pedido app')
};}
function recipeName(recipeId){return byId(dbState.recipes,recipeId)?.name||'';}
function inventoryName(inventoryId){return byId(dbState.inventory,inventoryId)?.name||'';}
function orderProductText(o){if(o.public&&o.items?.length)return o.items.map(x=>`${x.name||'Producto'}${x.qty>1?` × ${x.qty}`:''}`).join(', ');return recipeName(o.recipeId)||o.product||'Pedido';}
function orderPounds(o){if(Number(o.pounds)>0)return Number(o.pounds);if(!o.public)return Number(o.qty||1);
  let pounds=0; for(const item of o.items||[]){const txt=`${item.name||''} ${item.detail||''}`.toLowerCase();const q=Number(item.qty||1);if(txt.includes('1 libra')||txt.includes('1 lb')) pounds+=1*q; else if(txt.includes('1/2')||txt.includes('½')||txt.includes('media libra')) pounds+=0.5*q;}
  return pounds || Number(o.qty||1);
}

function goHome(){current='home';$('#home').classList.add('active');$('#screen').classList.remove('active');renderHome();}
function openModule(name){current=name;$('#home').classList.remove('active');$('#screen').classList.add('active');renderModule();}
function renderCurrent(){current==='home'?renderHome():renderModule();}
function renderHome(){
 $('#modules').innerHTML=modules.map(([key,icon,label,cls])=>`<button class="card ${cls}" type="button" data-module="${key}"><span>${icon}</span><strong>${label}</strong></button>`).join('');
 const orders=allOrders(); const active=orders.filter(o=>!['delivered','cancelled'].includes(normalizeStatus(o.status))).length;
 const todayOrders=orders.filter(o=>o.date===today()&&!['cancelled'].includes(normalizeStatus(o.status))).length;
 const tomorrowOrders=orders.filter(o=>o.date===tomorrow()&&!['cancelled'].includes(normalizeStatus(o.status))).length;
 const low=dbState.inventory.filter(i=>Number(i.stock||0)<=Number(i.minimum||0)).length;
 $('#summary').innerHTML=`<div class="summary-title">Producción</div><div class="stats"><div><strong>${todayOrders}</strong><span>Pedidos hoy</span></div><div><strong>${tomorrowOrders}</strong><span>Pedidos mañana</span></div><div><strong>${active}</strong><span>Activos</span></div><div><strong>${low}</strong><span>Inventario bajo</span></div></div><button type="button" class="secondary full" data-export>Respaldar datos</button>`;
}
function renderModule(){const cfg={orders:['Pedidos','＋ Pedido'],prep:['Preparación',''],delivery:['Entregas',''],inventory:['Inventario','＋ Ingrediente'],recipes:['Recetas','＋ Receta'],purchases:['Compras',''],sales:['Venta','＋ Venta'],money:['Dinero','＋ Gasto']}[current];$('#screenTitle').textContent=cfg[0];$('#primaryBtn').textContent=cfg[1];$('#primaryBtn').hidden=!cfg[1];({orders:renderOrders,prep:renderPrep,delivery:renderDelivery,inventory:renderInventory,recipes:renderRecipes,purchases:renderPurchases,sales:renderSales,money:renderMoney}[current])();}

function dayChip(date){if(date===today())return '<span class="day-chip today">HOY</span>';if(date===tomorrow())return '<span class="day-chip tomorrow">MAÑANA</span>';return `<span class="day-chip">${esc(date||'Sin fecha')}</span>`;}
function renderOrders(){const rows=allOrders().sort((a,b)=>`${a.date||''} ${a.time||''}`.localeCompare(`${b.date||''} ${b.time||''}`));$('#content').innerHTML=rows.length?`<div class="list">${rows.map(o=>`<article class="row order-row"><div class="row-head"><div>${dayChip(o.date)}<h3>${esc(o.customer||'Cliente')}</h3><div class="muted">${esc(o.date||'')} ${esc(o.time||'')}</div></div><strong>${money(o.total)}</strong></div><div class="product-line">${esc(orderProductText(o))}</div><div class="muted">${qty(orderPounds(o))} lb</div><div class="status ${esc(normalizeStatus(o.status))}">${esc(statusLabel(o.status))}</div>${o.address?`<div class="address">${esc(o.address)}</div>`:''}<div class="actions">${!o.public&&!['delivered','cancelled'].includes(normalizeStatus(o.status))?`<button type="button" data-order-edit="${o.id}">Editar</button>`:''}${!['delivered','cancelled'].includes(normalizeStatus(o.status))?`<button type="button" class="danger" data-order-status="${o.id}" data-public="${o.public?'1':'0'}" data-status="cancelled">Cancelar</button>`:''}</div></article>`).join('')}</div>`:empty('No hay pedidos.');}

function renderPrep(){const rows=allOrders().filter(o=>['pending','preparing'].includes(normalizeStatus(o.status))).sort((a,b)=>`${a.date||''} ${a.time||''}`.localeCompare(`${b.date||''} ${b.time||''}`));const grouped={};for(const o of rows){const k=o.date||'Sin fecha';(grouped[k]??=[]).push(o);}$('#content').innerHTML=rows.length?Object.entries(grouped).map(([date,items])=>`<section class="day-section"><div class="day-title">${dayChip(date)} <strong>${qty(items.reduce((s,o)=>s+orderPounds(o),0))} lb</strong></div><div class="list">${items.map(o=>`<article class="row prep-row"><div class="row-head"><div><h3>${esc(orderProductText(o))}</h3><div class="muted">${esc(o.customer||'')} · ${esc(o.time||'')}</div></div><strong>${qty(orderPounds(o))} lb</strong></div><div class="actions">${normalizeStatus(o.status)==='pending'?`<button class="primary-inline" type="button" data-order-status="${o.id}" data-public="${o.public?'1':'0'}" data-status="preparing">Preparar</button>`:`<button class="primary-inline" type="button" data-order-status="${o.id}" data-public="${o.public?'1':'0'}" data-status="ready">Listo</button>`}</div></article>`).join('')}</div></section>`).join(''):empty('Nada por preparar.');}

function renderDelivery(){const rows=allOrders().filter(o=>['ready','delivery'].includes(normalizeStatus(o.status))).sort((a,b)=>`${a.date||''} ${a.time||''}`.localeCompare(`${b.date||''} ${b.time||''}`));$('#content').innerHTML=rows.length?`<div class="list">${rows.map(o=>`<article class="row"><div class="row-head"><div>${dayChip(o.date)}<h3>${esc(o.customer||'Cliente')}</h3></div><strong>${esc(o.time||'')}</strong></div><div>${esc(orderProductText(o))} · ${qty(orderPounds(o))} lb</div><div class="address">${esc(o.address||'Sin dirección')}</div><div class="actions">${normalizeStatus(o.status)==='ready'?`<button class="primary-inline" type="button" data-order-status="${o.id}" data-public="${o.public?'1':'0'}" data-status="delivery">Salir a entregar</button>`:`<button class="primary-inline" type="button" data-order-status="${o.id}" data-public="${o.public?'1':'0'}" data-status="delivered">Entregado</button>`}</div></article>`).join('')}</div>`:empty('No hay entregas.');}

function renderInventory(){const rows=sorted(dbState.inventory);$('#content').innerHTML=rows.length?`<div class="list">${rows.map(i=>{const low=Number(i.stock||0)<=Number(i.minimum||0);return `<article class="row ${low?'low':''}"><div class="row-head"><div><h3>${esc(i.name)}</h3><div class="muted">${low?'⚠ Inventario bajo':'Existencia'}${i.appKey?` · App: ${esc(i.appKey)}`:''}</div></div><strong>${qty(i.stock)} ${esc(i.unit)}</strong></div><div class="muted">Mínimo ${qty(i.minimum)} ${esc(i.unit)} · Costo ${money(i.costPerUnit)}/${esc(i.unit)}</div><div class="actions"><button type="button" data-inventory-edit="${i.id}">Editar</button><button type="button" class="danger" data-delete="inventory" data-id="${i.id}">Eliminar</button></div></article>`;}).join('')}</div>`:empty('Inventario vacío. Registra solamente lo que realmente usas.');}
function recipeCost(r){return (r.ingredients||[]).reduce((sum,x)=>{const inv=byId(dbState.inventory,x.inventoryId);return sum+(inv?Number(inv.costPerUnit||0)*Number(x.qty||0):0);},0);}
function renderRecipes(){const rows=sorted(dbState.recipes);$('#content').innerHTML=rows.length?`<div class="list">${rows.map(r=>{const cost=recipeCost(r);return `<article class="row"><div class="row-head"><div><h3>${esc(r.name)}</h3><div class="muted">Rinde ${qty(r.yieldLb||1)} lb · ${(r.ingredients||[]).length} ingredientes</div></div><strong>${money(r.price)}</strong></div><div class="muted">Costo estimado ${money(cost)} · Margen ${money(Number(r.price||0)-cost)}</div><div class="recipe-lines">${(r.ingredients||[]).map(x=>{const inv=byId(dbState.inventory,x.inventoryId);return inv?`<span>${esc(inv.name)}: ${qty(x.qty)} ${esc(inv.unit)}</span>`:'';}).join('')}</div><div class="actions"><button type="button" data-recipe-edit="${r.id}">Editar</button><button type="button" class="danger" data-delete="recipes" data-id="${r.id}">Eliminar</button></div></article>`;}).join('')}</div>`:empty('No hay recetas. Créala una vez y luego los pedidos la reutilizan.');}

function needMapForDate(date){const needs=new Map();const orders=allOrders().filter(o=>o.date===date&&!['cancelled','delivered'].includes(normalizeStatus(o.status)));for(const o of orders){if(o.public&&o.publicRecipe){for(const [key,val] of Object.entries(o.publicRecipe)){const inv=dbState.inventory.find(i=>i.appKey===key);if(!inv)continue;needs.set(inv.id,(needs.get(inv.id)||0)+Number(val||0));}continue;}const r=byId(dbState.recipes,o.recipeId);if(!r)continue;const mult=Number(orderPounds(o)||0)/Number(r.yieldLb||1);for(const line of r.ingredients||[])needs.set(line.inventoryId,(needs.get(line.inventoryId)||0)+Number(line.qty||0)*mult);}return {needs,orders};}
function purchaseRows(date){const {needs,orders}=needMapForDate(date);const rows=[];for(const [inventoryId,required] of needs){const inv=byId(dbState.inventory,inventoryId);if(!inv)continue;const stock=Number(inv.stock||0);rows.push({inv,required,stock,buy:Math.max(0,required-stock)});}return {rows,orders};}
function renderPurchases(){const d1=today(),d2=tomorrow();const a=purchaseRows(d1),b=purchaseRows(d2);$('#content').innerHTML=`<div class="planner-note">Compras se calcula solo con los pedidos activos y el inventario que ya tienes.</div>${renderPurchaseDay(d1,a)}${renderPurchaseDay(d2,b)}<div class="section-head"><h3>Compras realizadas</h3><button type="button" class="secondary" data-manual-purchase>＋ Registrar compra</button></div>${dbState.purchases.length?`<div class="list">${[...dbState.purchases].sort((x,y)=>String(y.date||'').localeCompare(String(x.date||''))).slice(0,20).map(p=>`<article class="row compact"><div class="row-head"><h3>${esc(inventoryName(p.inventoryId)||p.name||'Compra')}</h3><strong>${money(p.total)}</strong></div><div class="muted">${esc(p.date||'')} · ${qty(p.qty)} ${esc(p.unit||'')}</div></article>`).join('')}</div>`:empty('Todavía no hay compras registradas.')}`;}
function renderPurchaseDay(date,data){const totalLb=data.orders.reduce((s,o)=>s+orderPounds(o),0);const unlinked=data.orders.filter(o=>!o.public&&!o.recipeId).length;return `<section class="purchase-day"><div class="purchase-head"><div>${dayChip(date)}<h3>${qty(totalLb)} lb pedidas</h3><span>${data.orders.length} pedido(s)</span></div></div>${unlinked?`<div class="warning">⚠ ${unlinked} pedido(s) no tienen receta vinculada y no pueden calcular insumos todavía.</div>`:''}${data.rows.length?`<div class="shopping-list">${data.rows.map(x=>`<div class="shop-item ${x.buy>0?'buy':'ok'}"><div><strong>${esc(x.inv.name)}</strong><span>Necesitas ${qty(x.required)} ${esc(x.inv.unit)} · Tienes ${qty(x.stock)}</span></div><b>${x.buy>0?`COMPRAR ${qty(x.buy)} ${esc(x.inv.unit)}`:'YA HAY'}</b></div>`).join('')}</div>`:empty(data.orders.length?'Falta vincular ingredientes/recetas para calcular compras.':'No hay pedidos para esta fecha.')}</section>`;}

function renderSales(){const rows=[...dbState.sales].sort((a,b)=>`${b.date||''} ${b.time||''}`.localeCompare(`${a.date||''} ${a.time||''}`));$('#content').innerHTML=rows.length?`<div class="list">${rows.map(s=>`<article class="row"><div class="row-head"><h3>${esc(recipeName(s.recipeId)||s.product||'Venta')}</h3><strong>${money(s.total)}</strong></div><div class="muted">${esc(s.date||'')} ${esc(s.time||'')} · ${qty(s.qty||1)}</div></article>`).join('')}</div>`:empty('No hay ventas directas.');}
function renderMoney(){const direct=dbState.sales.reduce((s,x)=>s+Number(x.total||0),0);const delivered=allOrders().filter(o=>normalizeStatus(o.status)==='delivered').reduce((s,o)=>s+Number(o.total||0),0);const purchases=dbState.purchases.reduce((s,x)=>s+Number(x.total||0),0);const expenses=dbState.expenses.reduce((s,x)=>s+Number(x.amount||0),0);const balance=direct+delivered-purchases-expenses;$('#content').innerHTML=`<div class="money-grid"><div><span>Ventas</span><strong>${money(direct+delivered)}</strong></div><div><span>Compras</span><strong>${money(purchases)}</strong></div><div><span>Gastos</span><strong>${money(expenses)}</strong></div><div class="balance"><span>Balance</span><strong>${money(balance)}</strong></div></div>${dbState.expenses.length?`<div class="list">${dbState.expenses.map(e=>`<article class="row"><div class="row-head"><h3>${esc(e.name||'Gasto')}</h3><strong>${money(e.amount)}</strong></div><div class="muted">${esc(e.date||'')}</div></article>`).join('')}</div>`:empty('No hay gastos extras.')}`;}

function showModal(title,html,onSubmit){editing={onSubmit};$('#formTitle').textContent=title;$('#formFields').innerHTML=`<div class="fields">${html}</div>`;$('#modal').hidden=false;}
function closeModal(){editing=null;$('#modal').hidden=true;$('#form').reset();}
function input(name,label,value='',type='text',extra=''){return `<label>${esc(label)}<input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;}
function select(name,label,options,value=''){return `<label>${esc(label)}<select name="${name}">${options.map(([v,t])=>`<option value="${esc(v)}" ${String(v)===String(value)?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`;}

function openOrderForm(existing=null){const recipeOptions=[['','Sin receta / capturar producto'],...sorted(dbState.recipes).map(r=>[r.id,r.name])];showModal(existing?'Editar pedido':'Nuevo pedido',`${input('customer','Cliente',existing?.customer||'')}${select('recipeId','Receta / producto',recipeOptions,existing?.recipeId||'')}${input('product','Producto libre',existing?.product||'')}${input('pounds','Libras',existing?.pounds||existing?.qty||1,'number','min="0.25" step="0.25" required')}${input('total','Total $',existing?.total||'','number','min="0" step="0.01"')}${input('date','Fecha de entrega',existing?.date||today(),'date','required')}${input('time','Hora de entrega',existing?.time||nowTime(),'time','required')}${input('address','Dirección',existing?.address||'')}`,fd=>{const obj={id:existing?.id||id(),customer:fd.get('customer').trim(),recipeId:fd.get('recipeId'),product:fd.get('product').trim(),pounds:Number(fd.get('pounds')||0),qty:Number(fd.get('pounds')||0),total:Number(fd.get('total')||0),date:fd.get('date'),time:fd.get('time'),address:fd.get('address').trim(),status:existing?.status||'pending',inventoryApplied:existing?.inventoryApplied||false};if(existing)dbState.orders=dbState.orders.map(x=>x.id===existing.id?obj:x);else dbState.orders.push(obj);saveLocal();closeModal();toast('Pedido guardado');});}
function openInventoryForm(existing=null){const appOpts=[['','Sin vínculo con app'],...APP_KEYS.map(k=>[k,k])];showModal(existing?'Editar ingrediente':'Nuevo ingrediente',`${input('name','Ingrediente',existing?.name||'','','required')}${select('unit','Unidad',UNITS.map(x=>[x,x]),existing?.unit||'oz')}${input('stock','Existencia actual',existing?.stock||0,'number','step="0.001" min="0"')}${input('minimum','Mínimo',existing?.minimum||0,'number','step="0.001" min="0"')}${input('costPerUnit','Costo por unidad $',existing?.costPerUnit||0,'number','step="0.0001" min="0"')}${select('appKey','Vincular con ingrediente de la app (opcional)',appOpts,existing?.appKey||'')}`,fd=>{const obj={id:existing?.id||id(),name:fd.get('name').trim(),unit:fd.get('unit'),stock:Number(fd.get('stock')||0),minimum:Number(fd.get('minimum')||0),costPerUnit:Number(fd.get('costPerUnit')||0),appKey:fd.get('appKey')};if(existing)dbState.inventory=dbState.inventory.map(x=>x.id===existing.id?obj:x);else dbState.inventory.push(obj);saveLocal();closeModal();toast('Ingrediente guardado');});}
function ingredientRow(line={}){return `<div class="ingredient-row"><select name="ingredientId">${sorted(dbState.inventory).map(i=>`<option value="${i.id}" ${i.id===line.inventoryId?'selected':''}>${esc(i.name)} (${esc(i.unit)})</option>`).join('')}</select><input name="ingredientQty" type="number" min="0" step="0.001" value="${esc(line.qty||'')}" placeholder="Cantidad"><button type="button" class="icon mini" data-remove-line>×</button></div>`;}
function openRecipeForm(existing=null){if(!dbState.inventory.length){toast('Primero registra los ingredientes del inventario',2600);return;}showModal(existing?'Editar receta':'Nueva receta',`${input('name','Nombre / presentación',existing?.name||'','','required')}${input('yieldLb','Rinde (lb)',existing?.yieldLb||1,'number','min="0.25" step="0.25" required')}${input('price','Precio de venta $',existing?.price||0,'number','min="0" step="0.01"')}<div class="section-head"><strong>Ingredientes</strong><button type="button" class="secondary" data-add-line>＋ Ingrediente</button></div><div id="ingredientLines">${(existing?.ingredients?.length?existing.ingredients:[{}]).map(ingredientRow).join('')}</div>`,fd=>{const ids=fd.getAll('ingredientId'),qs=fd.getAll('ingredientQty');const ingredients=ids.map((inventoryId,i)=>({inventoryId,qty:Number(qs[i]||0)})).filter(x=>x.inventoryId&&x.qty>0);const obj={id:existing?.id||id(),name:fd.get('name').trim(),yieldLb:Number(fd.get('yieldLb')||1),price:Number(fd.get('price')||0),ingredients};if(existing)dbState.recipes=dbState.recipes.map(x=>x.id===existing.id?obj:x);else dbState.recipes.push(obj);saveLocal();closeModal();toast('Receta guardada');});}
function openPurchaseForm(){if(!dbState.inventory.length){toast('Primero registra ingredientes',2200);return;}showModal('Registrar compra',`${select('inventoryId','Ingrediente',sorted(dbState.inventory).map(i=>[i.id,`${i.name} (${i.unit})`]))}${input('qty','Cantidad comprada','','number','min="0.001" step="0.001" required')}${input('total','Total pagado $','','number','min="0" step="0.01" required')}${input('date','Fecha',today(),'date','required')}`,fd=>{const inventoryId=fd.get('inventoryId'),q=Number(fd.get('qty')||0),total=Number(fd.get('total')||0);const inv=byId(dbState.inventory,inventoryId);if(!inv)return;inv.stock=Number(inv.stock||0)+q;if(q>0)inv.costPerUnit=total/q;dbState.purchases.push({id:id(),inventoryId,qty:q,total,date:fd.get('date'),unit:inv.unit});saveLocal();closeModal();toast('Compra registrada');});}
function openSaleForm(){if(!dbState.recipes.length){toast('Primero crea una receta',2200);return;}showModal('Nueva venta',`${select('recipeId','Producto',sorted(dbState.recipes).map(r=>[r.id,r.name]))}${input('qty','Cantidad',1,'number','min="0.25" step="0.25" required')}${input('total','Total $','','number','min="0" step="0.01" required')}${input('date','Fecha',today(),'date','required')}${input('time','Hora',nowTime(),'time','required')}`,fd=>{const recipeId=fd.get('recipeId'),q=Number(fd.get('qty')||1),r=byId(dbState.recipes,recipeId);applyRecipeInventory(r,q/Number(r?.yieldLb||1));dbState.sales.push({id:id(),recipeId,qty:q,total:Number(fd.get('total')||0),date:fd.get('date'),time:fd.get('time')});saveLocal();closeModal();toast('Venta registrada');});}
function openExpenseForm(){showModal('Nuevo gasto',`${input('name','Concepto','','','required')}${input('amount','Monto $','','number','min="0" step="0.01" required')}${input('date','Fecha',today(),'date','required')}`,fd=>{dbState.expenses.unshift({id:id(),name:fd.get('name').trim(),amount:Number(fd.get('amount')||0),date:fd.get('date')});saveLocal();closeModal();toast('Gasto guardado');});}

function applyRecipeInventory(recipe,mult=1){if(!recipe)return;for(const line of recipe.ingredients||[]){const inv=byId(dbState.inventory,line.inventoryId);if(inv)inv.stock=Number(inv.stock||0)-Number(line.qty||0)*mult;}}
function applyPublicInventory(order){for(const [key,val] of Object.entries(order.publicRecipe||{})){const inv=dbState.inventory.find(i=>i.appKey===key);if(inv)inv.stock=Number(inv.stock||0)-Number(val||0);}}
async function changeOrderStatus(orderId,status,isPublic){if(isPublic){const o=publicOrders.find(x=>x.id===orderId);if(!o)return;const firestoreStatus={pending:'nuevo',preparing:'preparando',ready:'listo',delivery:'en_entrega',delivered:'entregado',cancelled:'cancelado'}[status]||status;try{if(status==='delivered'&&!o.inventoryApplied){applyPublicInventory(o);saveLocal();o.inventoryApplied=true;}await updateDoc(doc(firestore,'pedidos',orderId),{status:firestoreStatus});toast('Pedido actualizado');}catch(e){console.error(e);toast('No se pudo actualizar',2500);}return;}const o=byId(dbState.orders,orderId);if(!o)return;if(status==='delivered'&&!o.inventoryApplied){const r=byId(dbState.recipes,o.recipeId);if(r)applyRecipeInventory(r,Number(orderPounds(o)||0)/Number(r.yieldLb||1));o.inventoryApplied=true;}o.status=status;saveLocal();toast('Pedido actualizado');}
function deleteItem(type,itemId){if(type==='inventory'){const used=dbState.recipes.some(r=>(r.ingredients||[]).some(x=>x.inventoryId===itemId));if(used){toast('Ese ingrediente está usado en una receta',2600);return;}dbState.inventory=dbState.inventory.filter(x=>x.id!==itemId);}if(type==='recipes'){const used=dbState.orders.some(o=>o.recipeId===itemId&&!['delivered','cancelled'].includes(normalizeStatus(o.status)));if(used){toast('Esa receta tiene pedidos activos',2500);return;}dbState.recipes=dbState.recipes.filter(x=>x.id!==itemId);}saveLocal();}
function exportData(){const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),data:dbState},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`panel-el-chava-${today()}.json`;a.click();URL.revokeObjectURL(a.href);}

$('#homeBtn').addEventListener('click',goHome);$('#backBtn').addEventListener('click',goHome);$('#closeModal').addEventListener('click',closeModal);$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal();});
$('#primaryBtn').addEventListener('click',()=>({orders:()=>openOrderForm(),inventory:()=>openInventoryForm(),recipes:()=>openRecipeForm(),sales:()=>openSaleForm(),money:()=>openExpenseForm()}[current]?.()));
$('#form').addEventListener('submit',e=>{e.preventDefault();if(!editing?.onSubmit)return;editing.onSubmit(new FormData(e.currentTarget));});
document.addEventListener('click',e=>{const m=e.target.closest('[data-module]');if(m){openModule(m.dataset.module);return;}if(e.target.closest('[data-export]')){exportData();return;}if(e.target.closest('[data-manual-purchase]')){openPurchaseForm();return;}const ie=e.target.closest('[data-inventory-edit]');if(ie){openInventoryForm(byId(dbState.inventory,ie.dataset.inventoryEdit));return;}const re=e.target.closest('[data-recipe-edit]');if(re){openRecipeForm(byId(dbState.recipes,re.dataset.recipeEdit));return;}const oe=e.target.closest('[data-order-edit]');if(oe){openOrderForm(byId(dbState.orders,oe.dataset.orderEdit));return;}const os=e.target.closest('[data-order-status]');if(os){changeOrderStatus(os.dataset.orderStatus,os.dataset.status,os.dataset.public==='1');return;}const del=e.target.closest('[data-delete]');if(del){deleteItem(del.dataset.delete,del.dataset.id);return;}if(e.target.closest('[data-add-line]')){$('#ingredientLines').insertAdjacentHTML('beforeend',ingredientRow());return;}const rm=e.target.closest('[data-remove-line]');if(rm){rm.closest('.ingredient-row')?.remove();return;}});

async function initCloud(){setCloud('Conectando…','syncing');try{const ref=doc(firestore,...CLOUD_DOC);const snap=await getDoc(ref);if(snap.exists()){const remote=normalize(snap.data());if(remote.updatedAt>dbState.updatedAt){dbState=remote;localStorage.setItem(LOCAL_KEY,JSON.stringify(dbState));}}else if(dbState.updatedAt){await setDoc(ref,{...dbState,sourceDevice:deviceId,serverUpdatedAt:serverTimestamp()});}cloudReady=true;setCloud('Nube ✓','ok');onSnapshot(ref,s=>{if(!s.exists())return;const data=normalize(s.data());if(s.data().sourceDevice===deviceId)return;if(data.updatedAt<=dbState.updatedAt)return;applyingRemote=true;dbState=data;localStorage.setItem(LOCAL_KEY,JSON.stringify(dbState));renderCurrent();applyingRemote=false;});onSnapshot(collection(firestore,'pedidos'),snapshot=>{publicOrders=snapshot.docs.map(mapPublicOrder);renderCurrent();});}catch(e){console.error(e);setCloud('Local','warn');}}

goHome();initCloud();
