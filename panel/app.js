(()=>{
'use strict';

const firebaseConfig={apiKey:'AIzaSyBbOIXTr2Tvz1FvoTk5GZgP2jx24jpjlL4',authDomain:'ceviches-y-cocteles-el-chava.firebaseapp.com',projectId:'ceviches-y-cocteles-el-chava',storageBucket:'ceviches-y-cocteles-el-chava.firebasestorage.app',messagingSenderId:'227568387475',appId:'1:227568387475:web:6ccd3e67e62d1bf4b0d466',measurementId:'G-1MZS4J9Y4Z'};
firebase.initializeApp(firebaseConfig);
const db=firebase.firestore();
try{db.settings({experimentalForceLongPolling:true,useFetchStreams:false})}catch(_e){}

const ordersRef=db.collection('pedidos');
const inventoryRef=db.collection('inventario').doc('principal');
const movementsRef=db.collection('movimientos');
const E=id=>document.getElementById(id);
const money=n=>'$'+Number(n||0).toFixed(2);
const n2=n=>Number(Number(n||0).toFixed(2));
const r3=n=>Math.round((Number(n||0)+Number.EPSILON)*1000)/1000;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':'&quot;',"'":'&#39;'}[c]));
const localDay=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const stampDate=v=>{if(!v)return null;if(typeof v.toDate==='function')return v.toDate();const d=new Date(v);return Number.isNaN(d.getTime())?null:d};
const fmtDate=v=>{if(!v)return 'Sin fecha';const m=String(v).match(/^(\d{4})-(\d{2})-(\d{2})$/);const d=m?new Date(+m[1],+m[2]-1,+m[3]):stampDate(v);return d?d.toLocaleDateString('es-MX',{day:'numeric',month:'short'}).replace(/\./g,''):String(v)};
const fmtDateTime=v=>{const d=stampDate(v);return d?d.toLocaleString('es-MX',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}).replace(/\./g,''):'Sin fecha'};
const toast=text=>{const t=E('toast');t.textContent=text;t.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove('show'),2200)};

const GROUPS={mariscos:'Mariscos',verduras:'Verduras y frescos',salsas:'Salsas y líquidos',desechables:'Desechables',refrescos:'Refrescos'};
const ITEMS={
 fish:{name:'Filete de pescado',group:'mariscos',unit:'lb',purchaseUnit:'lb',factor:1},
 shrimp:{name:'Camarón',group:'mariscos',unit:'lb',purchaseUnit:'lb',factor:1},
 octopus:{name:'Tentáculo de pulpo',group:'mariscos',unit:'lb',purchaseUnit:'lb',factor:1},
 tomato:{name:'Tomate',group:'verduras',unit:'oz',purchaseUnit:'lb',factor:16},
 onion:{name:'Cebolla morada',group:'verduras',unit:'oz',purchaseUnit:'lb',factor:16},
 cucumber:{name:'Pepino',group:'verduras',unit:'oz',purchaseUnit:'lb',factor:16},
 cilantro:{name:'Cilantro',group:'verduras',unit:'oz',purchaseUnit:'manojo',factor:2},
 lime:{name:'Limón natural',group:'verduras',unit:'pza',purchaseUnit:'pza',factor:1},
 lemonJuice:{name:'Jugo de limón',group:'salsas',unit:'fl oz',purchaseUnit:'botella',factor:32},
 clamato:{name:'Clamato',group:'salsas',unit:'fl oz',purchaseUnit:'botella',factor:32},
 tostadas:{name:'Tostadas',group:'desechables',unit:'pza',purchaseUnit:'paquete',factor:22},
 container16:{name:'Contenedor 16 oz',group:'desechables',unit:'pza',purchaseUnit:'pza',factor:1},
 lid16:{name:'Tapa 16 oz',group:'desechables',unit:'pza',purchaseUnit:'pza',factor:1},
 container12:{name:'Contenedor 12 oz',group:'desechables',unit:'pza',purchaseUnit:'pza',factor:1},
 lid12:{name:'Tapa 12 oz',group:'desechables',unit:'pza',purchaseUnit:'pza',factor:1},
 spoon:{name:'Cuchara',group:'desechables',unit:'pza',purchaseUnit:'paquete',factor:100},
 napkins:{name:'Servilletas',group:'desechables',unit:'pza',purchaseUnit:'paquete',factor:120},
 saltPacket:{name:'Sobre de sal',group:'desechables',unit:'pza',purchaseUnit:'paquete',factor:100},
 habaneroSauce:{name:'Salsa habanera',group:'salsas',unit:'fl oz',purchaseUnit:'botella',factor:12},
 coca:{name:'Coca-Cola',group:'refrescos',unit:'pza',purchaseUnit:'pza',factor:1},
 cokezero:{name:'Coke Zero',group:'refrescos',unit:'pza',purchaseUnit:'pza',factor:1},
 sprite:{name:'Sprite',group:'refrescos',unit:'pza',purchaseUnit:'pza',factor:1},
 drpepper:{name:'Dr Pepper',group:'refrescos',unit:'pza',purchaseUnit:'pza',factor:1},
 bigred:{name:'Big Red',group:'refrescos',unit:'pza',purchaseUnit:'pza',factor:1},
 fanta:{name:'Fanta',group:'refrescos',unit:'pza',purchaseUnit:'pza',factor:1}
};

const base1={tomato:1.76,onion:1.06,cucumber:1.06,cilantro:.35,lemonJuice:1.01,lime:1,clamato:1.01,tostadas:4,container16:1,lid16:1,spoon:1,napkins:2,saltPacket:1,habaneroSauce:2};
function addRecipes(...list){const out={};list.forEach(r=>Object.entries(r||{}).forEach(([k,v])=>out[k]=r3((out[k]||0)+Number(v||0))));return out}
function halfRecipe(r){const out={};Object.entries(r).forEach(([k,v])=>{if(k==='container16'||k==='lid16')return;out[k]=['spoon','napkins','saltPacket','habaneroSauce'].includes(k)?v:r3(v/2)});out.container12=1;out.lid12=1;out.tostadas=2;return out}
const fish1=addRecipes(base1,{fish:.5}),shrimp1=addRecipes(base1,{shrimp:.5}),mixed1=addRecipes(base1,{fish:.25,shrimp:.25}),fishOct1=addRecipes(base1,{fish:.25,octopus:.25}),shrimpOct1=addRecipes(base1,{shrimp:.25,octopus:.25});
const PRODUCTS=[
 {id:'fp5',name:'Ceviche de pescado',detail:'½ libra',price:8,cost:2.20,recipe:halfRecipe(fish1)},
 {id:'fp1',name:'Ceviche de pescado',detail:'1 libra',price:15,cost:3.81,recipe:fish1},
 {id:'fc5',name:'Ceviche de camarón',detail:'½ libra',price:11,cost:3.31,recipe:halfRecipe(shrimp1)},
 {id:'fc1',name:'Ceviche de camarón',detail:'1 libra',price:20,cost:6.01,recipe:shrimp1},
 {id:'fm5',name:'Ceviche mixto',detail:'½ libra',price:13,cost:2.76,recipe:halfRecipe(mixed1)},
 {id:'fm1',name:'Ceviche mixto',detail:'1 libra',price:25,cost:4.91,recipe:mixed1},
 {id:'op5',name:'Ceviche pulpo y pescado',detail:'½ libra',price:13,cost:4.14,recipe:halfRecipe(fishOct1)},
 {id:'op1',name:'Ceviche pulpo y pescado',detail:'1 libra',price:25,cost:7.69,recipe:fishOct1},
 {id:'oc5',name:'Ceviche pulpo y camarón',detail:'½ libra',price:13,cost:4.70,recipe:halfRecipe(shrimpOct1)},
 {id:'oc1',name:'Ceviche pulpo y camarón',detail:'1 libra',price:25,cost:8.79,recipe:shrimpOct1},
 {id:'coca',name:'Coca-Cola',detail:'Lata 12 oz',price:2.5,cost:null,recipe:{coca:1}},
 {id:'cokezero',name:'Coke Zero',detail:'Lata 12 oz',price:2.5,cost:null,recipe:{cokezero:1}},
 {id:'sprite',name:'Sprite',detail:'Lata 12 oz',price:2.5,cost:null,recipe:{sprite:1}},
 {id:'drpepper',name:'Dr Pepper',detail:'Lata 12 oz',price:2.5,cost:null,recipe:{drpepper:1}},
 {id:'bigred',name:'Big Red',detail:'Lata 12 oz',price:2.5,cost:null,recipe:{bigred:1}},
 {id:'fanta',name:'Fanta',detail:'Lata 12 oz',price:2.5,cost:null,recipe:{fanta:1}}
];

let orders=[],movements=[];
let inventory={items:{},stockMinimums:{},purchasePrices:{}};
let orderFilter='pending',historyFilter='all';
let syncState={orders:false,inventory:false,movements:false};

function setSync(key,ok=true){syncState[key]=ok;const all=Object.values(syncState).every(Boolean);E('syncDot').className='dot '+(all?'ok':'');E('syncText').textContent=all?'Firebase conectado':'Sincronizando…'}
function setSyncError(){E('syncDot').className='dot bad';E('syncText').textContent='Error de conexión'}
function screenTitle(name){return {dashboard:'Inicio',orders:'Pedidos',inventory:'Inventario',purchases:'Compras',history:'Historial',recipes:'Recetas'}[name]||'Panel'}
function openScreen(name){document.querySelectorAll('.screen').forEach(x=>x.classList.toggle('active',x.dataset.view===name));document.querySelectorAll('#mainNav [data-screen]').forEach(x=>x.classList.toggle('active',x.dataset.screen===name));E('screenTitle').textContent=screenTitle(name);window.scrollTo({top:0,behavior:'instant'});renderAll()}
function stage(o){const s=String(o.status||'').toLowerCase(),d=String(o.deliveryStatus||'').toLowerCase();if(s==='cancelado'||d==='cancelado')return 'cancelled';if(s==='entregado'||d==='entregado')return 'delivered';if(d==='en_ruta')return 'route';if(d==='listo')return 'ready';return 'pending'}
function statusLabel(s){return {pending:'PENDIENTE',ready:'LISTO',route:'EN RUTA',delivered:'ENTREGADO',cancelled:'CANCELADO'}[s]||'PENDIENTE'}
function statusClass(s){return {pending:'pending',ready:'ready',route:'route',delivered:'done',cancelled:'cancel'}[s]||'pending'}
function orderText(o){return [o.id,o.customer,o.phone,o.address,o.zip,...(o.items||[]).flatMap(i=>[i.name,i.detail])].join(' ').toLowerCase()}
function orderSort(a,b){return `${a.deliveryDate||'9999'} ${a.time||''}`.localeCompare(`${b.deliveryDate||'9999'} ${b.time||''}`)}
function deliveredToday(o){if(stage(o)!=='delivered')return false;const d=stampDate(o.deliveredAt);return d?localDay(d)===localDay():String(o.deliveryDate||'')===localDay()}
function orderProfit(o){if(Number.isFinite(Number(o.profit)))return Number(o.profit);if(Number.isFinite(Number(o.cost)))return Number(o.total||0)-Number(o.cost||0);return 0}
function lowItems(){return Object.entries(ITEMS).map(([key,item])=>({key,item,qty:Number(inventory.items?.[key]||0),min:Number(inventory.stockMinimums?.[key]||0)})).filter(x=>x.min>0&&x.qty<=x.min).sort((a,b)=>(a.qty-a.min)-(b.qty-b.min))}
function displayQty(key,qty){const item=ITEMS[key];return `${n2(qty)} ${item?.unit||''}`.trim()}
function lineItems(o){return (o.items||[]).map(i=>`${n2(i.qty||1)} × ${i.name||'Producto'}`).join(' · ')||'Sin detalle'}

function renderMetrics(){const delivered=orders.filter(deliveredToday),sales=delivered.reduce((a,o)=>a+Number(o.total||0),0),profit=delivered.reduce((a,o)=>a+orderProfit(o),0),pending=orders.filter(o=>['pending','ready','route'].includes(stage(o))).length;E('metricSales').textContent=money(sales);E('metricProfit').textContent=money(profit);E('metricPending').textContent=String(pending);E('metricLow').textContent=String(lowItems().length)}
function orderCard(o,compact=false){const s=stage(o),date=`${fmtDate(o.deliveryDate)}${o.time?' · '+esc(o.time):''}`,contact=[o.customer||'Cliente',o.phone||''].filter(Boolean).join(' · '),items=lineItems(o);let actions='';if(!compact&&s==='pending')actions=`<button class="btn-prepare" data-order-action="prepare" data-id="${esc(o.id)}">PREPARAR PEDIDO</button><button class="danger" data-order-action="cancel" data-id="${esc(o.id)}">Cancelar</button>`;if(!compact&&s==='ready')actions=`<button class="btn-route" data-order-action="route" data-id="${esc(o.id)}">SALIR A ENTREGAR</button><button class="danger" data-order-action="cancel" data-id="${esc(o.id)}">Cancelar</button>`;if(!compact&&s==='route')actions=`<button class="btn-done" data-order-action="deliver" data-id="${esc(o.id)}">MARCAR ENTREGADO</button>`;return `<article class="order"><div class="order-top"><div><h3>${esc(o.id||'Pedido')} · ${money(o.total||0)}</h3><small>${esc(contact)}<br>${esc(items)}</small><div class="order-meta"><span>${esc(date)}</span>${o.address?`<span>${esc(o.address)}</span>`:''}${o.payment?`<span>${esc(o.payment)}</span>`:''}</div></div><span class="status ${statusClass(s)}">${statusLabel(s)}</span></div>${actions?`<div class="order-actions">${actions}</div>`:''}</article>`}
function renderDashboard(){const pending=orders.filter(o=>['pending','ready','route'].includes(stage(o))).sort(orderSort).slice(0,5);E('dashboardOrders').innerHTML=pending.length?pending.map(o=>orderCard(o,true)).join(''):'<div class="empty">No hay pedidos pendientes.</div>';const lows=lowItems().slice(0,8);E('dashboardLow').innerHTML=lows.length?lows.map(x=>`<div class="low-row"><div><strong>${esc(x.item.name)}</strong><small>Mínimo ${displayQty(x.key,x.min)}</small></div><span class="low-pill">${displayQty(x.key,x.qty)}</span></div>`).join(''):'<div class="empty">No hay productos bajos.</div>'}
function renderOrders(){const q=E('orderSearch').value.trim().toLowerCase();let list=orders.filter(o=>!q||orderText(o).includes(q));if(orderFilter==='pending')list=list.filter(o=>stage(o)==='pending');else if(orderFilter==='ready')list=list.filter(o=>['ready','route'].includes(stage(o)));else if(orderFilter==='delivered')list=list.filter(o=>stage(o)==='delivered');else if(orderFilter==='cancelled')list=list.filter(o=>stage(o)==='cancelled');list.sort(orderSort);E('ordersList').innerHTML=list.length?list.map(o=>orderCard(o)).join(''):'<div class="empty">No hay pedidos con ese filtro.</div>'}
function renderInventory(){const q=E('inventorySearch').value.trim().toLowerCase();E('inventoryGroups').innerHTML=Object.entries(GROUPS).map(([g,label])=>{const rows=Object.entries(ITEMS).filter(([,item])=>item.group===g&&(!q||item.name.toLowerCase().includes(q))).map(([key,item])=>{const qty=Number(inventory.items?.[key]||0),min=Number(inventory.stockMinimums?.[key]||0),price=Number(inventory.purchasePrices?.[key]||0),low=min>0&&qty<=min;return `<div class="inventory-row" data-inventory-key="${key}"><div><strong>${esc(item.name)}</strong><small>${price>0?`Último precio ${money(price)} / ${esc(item.purchaseUnit)}`:'Sin precio registrado'}${min>0?` · Mínimo ${displayQty(key,min)}`:''}</small></div><div class="inventory-value"><b>${displayQty(key,qty)}</b>${low?'<small style="color:#c93d3d;font-weight:900">BAJO</small>':''}</div></div>`}).join('');return rows?`<section class="inventory-section"><h3>${esc(label)}</h3><div class="stack">${rows}</div></section>`:''}).join('')||'<div class="empty">No encontré productos.</div>'}
function movementCard(m){const type=String(m.type||'adjustment'),label=type==='sale'?'Venta':type==='purchase'?'Compra':'Ajuste',amount=type==='sale'?Number(m.total||0):type==='purchase'?Number(m.total||m.cost||0):null,name=m.name||m.itemName||m.productName||label,detail=[m.store,m.orderId,m.quantity&&m.unit?`${m.quantity} ${m.unit}`:''].filter(Boolean).join(' · ');return `<div class="movement ${type}"><div><strong>${esc(name)}</strong><small>${esc(label)} · ${esc(fmtDateTime(m.date||m.createdAt))}${detail?' · '+esc(detail):''}</small></div>${amount!==null?`<span class="amount">${type==='purchase'?'−':'+'}${money(amount)}</span>`:''}</div>`}
function renderPurchases(){const list=movements.filter(m=>m.type==='purchase').slice(0,30);E('purchaseHistory').innerHTML=list.length?list.map(movementCard).join(''):'<div class="empty">Todavía no hay compras registradas.</div>'}
function movementText(m){return [m.name,m.itemName,m.productName,m.store,m.orderId,m.type,m.unit].join(' ').toLowerCase()}
function renderHistory(){const q=E('historySearch').value.trim().toLowerCase();let list=movements.filter(m=>(historyFilter==='all'||m.type===historyFilter)&&(!q||movementText(m).includes(q)));E('historyList').innerHTML=list.length?list.map(movementCard).join(''):'<div class="empty">No hay movimientos con ese filtro.</div>'}
function renderRecipes(){const q=E('recipeSearch').value.trim().toLowerCase();const list=PRODUCTS.filter(p=>p.recipe&&(!q||`${p.name} ${p.detail}`.toLowerCase().includes(q)));E('recipesGrid').innerHTML=list.map(p=>`<article class="recipe"><h3>${esc(p.name)}</h3><p>${esc(p.detail)}</p>${Object.entries(p.recipe).map(([key,qty])=>`<div class="recipe-row"><span>${esc(ITEMS[key]?.name||key)}</span><b>${displayQty(key,qty)}</b></div>`).join('')}</article>`).join('')||'<div class="empty">No encontré recetas.</div>'}
function renderAll(){renderMetrics();renderDashboard();renderOrders();renderInventory();renderPurchases();renderHistory();renderRecipes()}

function productById(id){return PRODUCTS.find(p=>p.id===id)}
function multiplyRecipe(recipe,qty){const out={};Object.entries(recipe||{}).forEach(([k,v])=>out[k]=r3(Number(v||0)*Number(qty||0)));return out}
function missingFor(recipe,items){return Object.entries(recipe||{}).filter(([k,v])=>Number(items?.[k]||0)<Number(v||0)).map(([k,v])=>`${ITEMS[k]?.name||k} (${displayQty(k,Number(v)-Number(items?.[k]||0))})`)}
async function prepareOrder(id){const order=orders.find(o=>o.id===id);if(!order)return;const recipe=order.recipe||{};if(!Object.keys(recipe).length)return alert('Este pedido no trae receta de inventario. Revísalo antes de prepararlo.');const button=document.querySelector(`[data-order-action="prepare"][data-id="${CSS.escape(id)}"]`);if(button)button.disabled=true;try{await db.runTransaction(async tx=>{const oRef=ordersRef.doc(id),oSnap=await tx.get(oRef);if(!oSnap.exists)throw new Error('El pedido ya no existe.');const current=oSnap.data();if(current.inventoryConsumedAt)return;const invSnap=await tx.get(inventoryRef),data=invSnap.exists?invSnap.data():{},items={...(data.items||{})},missing=missingFor(current.recipe||{},items);if(missing.length)throw new Error('Falta para preparar: '+missing.join(', '));Object.entries(current.recipe||{}).forEach(([k,v])=>items[k]=r3(Number(items[k]||0)-Number(v||0)));const stamp=firebase.firestore.FieldValue.serverTimestamp();tx.set(inventoryRef,{items,updatedAt:stamp},{merge:true});tx.update(oRef,{status:'confirmado',deliveryStatus:'listo',preparedAt:stamp,inventoryConsumedAt:stamp});});toast('Pedido preparado y descontado del inventario')}catch(err){alert(err.message||'No se pudo preparar el pedido.')}finally{if(button)button.disabled=false}}
async function routeOrder(id){try{await ordersRef.doc(id).update({status:'confirmado',deliveryStatus:'en_ruta',routeAt:firebase.firestore.FieldValue.serverTimestamp()});toast('Pedido en ruta')}catch(err){alert(err.message||'No se pudo actualizar.') }}
async function deliverOrder(id){const order=orders.find(o=>o.id===id);if(!order)return;try{await db.runTransaction(async tx=>{const oRef=ordersRef.doc(id),oSnap=await tx.get(oRef);if(!oSnap.exists)throw new Error('El pedido ya no existe.');const current=oSnap.data();if(stage(current)==='delivered')return;const stamp=firebase.firestore.FieldValue.serverTimestamp(),mRef=movementsRef.doc('sale-'+id);tx.update(oRef,{status:'entregado',deliveryStatus:'entregado',deliveredAt:stamp,saleMovementId:mRef.id});tx.set(mRef,{type:'sale',name:`Venta · ${current.customer||'Cliente'}`,orderId:id,total:Number(current.total||0),cost:current.cost??null,profit:current.profit??null,payment:current.payment||'',date:stamp,day:localDay()},{merge:true});});toast('Pedido entregado')}catch(err){alert(err.message||'No se pudo marcar entregado.') }}
async function cancelOrder(id){const o=orders.find(x=>x.id===id);if(!o||!confirm(`¿Cancelar el pedido ${id}?`))return;try{await ordersRef.doc(id).update({status:'cancelado',deliveryStatus:'cancelado',cancelledAt:firebase.firestore.FieldValue.serverTimestamp()});toast('Pedido cancelado')}catch(err){alert(err.message||'No se pudo cancelar.') }}

function modal(id,show){E(id).hidden=!show}
document.addEventListener('click',e=>{const nav=e.target.closest('[data-screen]');if(nav)openScreen(nav.dataset.screen);const jump=e.target.closest('[data-jump]');if(jump)openScreen(jump.dataset.jump);const close=e.target.closest('[data-close]');if(close)modal(close.dataset.close,false);const inv=e.target.closest('[data-inventory-key]');if(inv)openInventory(inv.dataset.inventoryKey);const act=e.target.closest('[data-order-action]');if(act){const id=act.dataset.id;if(act.dataset.orderAction==='prepare')prepareOrder(id);if(act.dataset.orderAction==='route')routeOrder(id);if(act.dataset.orderAction==='deliver')deliverOrder(id);if(act.dataset.orderAction==='cancel')cancelOrder(id)}});

function defaultPurchaseUnit(item){const p=String(item.purchaseUnit||'').toLowerCase();if(p.startsWith('lb'))return 'lb';if(p.startsWith('oz'))return 'oz';if(p.startsWith('pza'))return 'pza';if(p.startsWith('paquete'))return 'paquete';if(p.startsWith('botella'))return 'botella';if(p.startsWith('manojo'))return 'manojo';return item.unit||'pza'}
function conversionFactor(item,selected){if(!item)return null;if(selected===item.unit)return 1;if(item.unit==='pza'&&selected==='pza')return 1;if(item.unit==='oz'&&selected==='lb')return 16;if(item.unit==='lb'&&selected==='lb')return 1;if(item.unit==='fl oz'&&selected==='fl oz')return 1;const p=String(item.purchaseUnit||'').toLowerCase();if(p.startsWith(String(selected).toLowerCase()))return Number(item.factor||1);return null}
function syncPurchase(){const key=E('purchaseItem').value,item=ITEMS[key],qty=Math.max(0,Number(E('purchaseQty').value||0)),unit=E('purchaseUnit').value,price=Math.max(0,Number(E('purchasePrice').value||0)),known=conversionFactor(item,unit),wrap=E('conversionWrap');if(known===null){wrap.hidden=false;E('conversionUnitLabel').textContent=unit;E('conversionBaseLabel').textContent=item?.unit||'unidad';}else{wrap.hidden=true;E('purchaseConversion').value=''}const factor=known===null?Math.max(0,Number(E('purchaseConversion').value||0)):known,added=qty*factor;E('purchasePreview').innerHTML=`<b>${esc(item?.name||'Producto')}</b><br>${n2(qty)} ${esc(unit)} × ${money(price)} = <b>${money(qty*price)}</b>${factor>0?`<br>Entrarán al inventario: <b>${displayQty(key,added)}</b>`:'<br>Indica cuánto contiene cada presentación.'}`}
function openPurchase(key=Object.keys(ITEMS)[0]){E('purchaseItem').innerHTML=Object.entries(ITEMS).map(([k,x])=>`<option value="${k}">${esc(x.name)}</option>`).join('');E('purchaseItem').value=key;const item=ITEMS[key];E('purchaseQty').value='1';E('purchaseUnit').value=defaultPurchaseUnit(item);E('purchasePrice').value='';E('purchaseStore').value='';E('purchaseConversion').value='';syncPurchase();modal('purchaseModal',true)}
['purchaseItem','purchaseQty','purchaseUnit','purchasePrice','purchaseConversion'].forEach(id=>E(id).addEventListener('input',()=>{if(id==='purchaseItem'){const item=ITEMS[E('purchaseItem').value];E('purchaseUnit').value=defaultPurchaseUnit(item)}syncPurchase()}));
E('savePurchase').onclick=async()=>{const key=E('purchaseItem').value,item=ITEMS[key],qty=Math.max(0,Number(E('purchaseQty').value||0)),unit=E('purchaseUnit').value,unitPrice=Math.max(0,Number(E('purchasePrice').value||0)),store=E('purchaseStore').value.trim(),known=conversionFactor(item,unit),factor=known===null?Math.max(0,Number(E('purchaseConversion').value||0)):known;if(!(qty>0))return alert('Pon la cantidad.');if(!(unitPrice>=0))return alert('Pon el precio.');if(!(factor>0))return alert(`Pon cuánto contiene cada ${unit} en ${item.unit}.`);const total=n2(qty*unitPrice),internalAdded=r3(qty*factor),mRef=movementsRef.doc(),stamp=firebase.firestore.FieldValue.serverTimestamp();E('savePurchase').disabled=true;try{await db.runTransaction(async tx=>{const snap=await tx.get(inventoryRef),d=snap.exists?snap.data():{},items={...(d.items||{})},prices={...(d.purchasePrices||{})};items[key]=r3(Number(items[key]||0)+internalAdded);prices[key]=unitPrice;tx.set(inventoryRef,{items,purchasePrices:prices,updatedAt:stamp},{merge:true});tx.set(mRef,{type:'purchase',name:`Compra · ${item.name}`,itemKey:key,itemName:item.name,quantity:qty,unit,unitPrice,total,store,internalAdded,baseUnit:item.unit,date:stamp,day:localDay()});});modal('purchaseModal',false);toast('Compra registrada')}catch(err){alert(err.message||'No se pudo guardar la compra.')}finally{E('savePurchase').disabled=false}};

function openInventory(key=Object.keys(ITEMS)[0]){E('inventoryItem').innerHTML=Object.entries(ITEMS).map(([k,x])=>`<option value="${k}">${esc(x.name)}</option>`).join('');E('inventoryItem').value=key;syncInventoryForm();modal('inventoryModal',true)}
function syncInventoryForm(){const key=E('inventoryItem').value,item=ITEMS[key];E('inventoryQty').value=n2(inventory.items?.[key]||0);E('inventoryMin').value=n2(inventory.stockMinimums?.[key]||0);E('inventoryPrice').value=Number(inventory.purchasePrices?.[key]||0)||'';E('inventoryHint').innerHTML=`Las cantidades de <b>${esc(item.name)}</b> se manejan en <b>${esc(item.unit)}</b>. Precio de referencia por <b>${esc(item.purchaseUnit)}</b>.`}
E('inventoryItem').addEventListener('change',syncInventoryForm);
E('saveInventory').onclick=async()=>{const key=E('inventoryItem').value,item=ITEMS[key],qty=Math.max(0,Number(E('inventoryQty').value||0)),min=Math.max(0,Number(E('inventoryMin').value||0)),price=Math.max(0,Number(E('inventoryPrice').value||0)),mRef=movementsRef.doc(),stamp=firebase.firestore.FieldValue.serverTimestamp();E('saveInventory').disabled=true;try{await db.runTransaction(async tx=>{const snap=await tx.get(inventoryRef),d=snap.exists?snap.data():{},items={...(d.items||{})},mins={...(d.stockMinimums||{})},prices={...(d.purchasePrices||{})},before=Number(items[key]||0);items[key]=r3(qty);mins[key]=r3(min);prices[key]=price;tx.set(inventoryRef,{items,stockMinimums:mins,purchasePrices:prices,updatedAt:stamp},{merge:true});tx.set(mRef,{type:'adjustment',name:`Ajuste · ${item.name}`,itemKey:key,itemName:item.name,before,after:qty,unit:item.unit,date:stamp,day:localDay()});});modal('inventoryModal',false);toast('Inventario actualizado')}catch(err){alert(err.message||'No se pudo guardar.')}finally{E('saveInventory').disabled=false}};

function syncManualOrder(resetPrice=false){const p=productById(E('manualProduct').value),qty=Math.max(1,Number(E('manualQty').value||1));if(resetPrice)E('manualPrice').value=p?.price??0;const price=Math.max(0,Number(E('manualPrice').value||0));E('manualPreview').innerHTML=`<b>${esc(p?.name||'Producto')} · ${esc(p?.detail||'')}</b><br>${n2(qty)} × ${money(price)} = <b>${money(qty*price)}</b>`}
function openManualOrder(){E('manualProduct').innerHTML=PRODUCTS.map(p=>`<option value="${p.id}">${esc(p.name)} · ${esc(p.detail)}</option>`).join('');E('manualProduct').value=PRODUCTS[0].id;E('manualQty').value='1';E('manualCustomer').value='';E('manualPhone').value='';E('manualAddress').value='';E('manualZip').value='';const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);E('manualDate').value=localDay(tomorrow);E('manualTime').value='12:00';E('manualPayment').value='Efectivo';E('manualNotes').value='';syncManualOrder(true);modal('orderModal',true)}
E('manualProduct').addEventListener('change',()=>syncManualOrder(true));E('manualQty').addEventListener('input',()=>syncManualOrder(false));E('manualPrice').addEventListener('input',()=>syncManualOrder(false));
E('saveManualOrder').onclick=async()=>{const p=productById(E('manualProduct').value),qty=Math.max(1,Math.floor(Number(E('manualQty').value||1))),price=Math.max(0,Number(E('manualPrice').value||0)),customer=E('manualCustomer').value.trim()||'Cliente',phone=E('manualPhone').value.trim(),address=E('manualAddress').value.trim(),zip=E('manualZip').value.trim(),deliveryDate=E('manualDate').value,time=E('manualTime').value;if(!phone||!address||!zip||!deliveryDate||!time)return alert('Faltan teléfono, dirección, ZIP, día u hora.');const id='PED-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,7).toUpperCase(),recipe=multiplyRecipe(p.recipe,qty),total=n2(price*qty),cost=p.cost===null?null:n2(Number(p.cost||0)*qty),profit=cost===null?null:n2(total-cost),stamp=firebase.firestore.FieldValue.serverTimestamp();const data={id,status:'nuevo',deliveryStatus:'por_preparar',customer,phone,address,zip,deliveryDate,time,payment:E('manualPayment').value,notes:E('manualNotes').value.trim()||'Sin notas',items:[{productId:p.id,name:p.name,detail:p.detail,qty,unitPrice:price,lineTotal:total}],recipe,total,cost,profit,costComplete:cost!==null,createdAt:stamp,createdAtClient:new Date().toISOString(),source:'app-clientes',manualOrder:true,manualSource:'Panel operativo'};E('saveManualOrder').disabled=true;try{await ordersRef.doc(id).set(data);modal('orderModal',false);toast('Pedido guardado')}catch(err){alert(err.message||'No se pudo guardar el pedido.')}finally{E('saveManualOrder').disabled=false}};

E('quickPurchase').onclick=()=>openPurchase();E('purchaseBtn').onclick=()=>openPurchase();E('quickOrder').onclick=openManualOrder;E('inventoryAdjustBtn').onclick=()=>openInventory();
E('orderSearch').addEventListener('input',renderOrders);E('inventorySearch').addEventListener('input',renderInventory);E('historySearch').addEventListener('input',renderHistory);E('recipeSearch').addEventListener('input',renderRecipes);
E('orderFilters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;orderFilter=b.dataset.filter;E('orderFilters').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));renderOrders()});
E('historyFilters').addEventListener('click',e=>{const b=e.target.closest('[data-history]');if(!b)return;historyFilter=b.dataset.history;E('historyFilters').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));renderHistory()});

E('todayText').textContent=new Date().toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

ordersRef.onSnapshot(s=>{orders=s.docs.map(d=>({id:d.id,...d.data()}));setSync('orders');renderAll()},err=>{console.error(err);setSyncError()});
inventoryRef.onSnapshot(s=>{inventory=s.exists?{items:{},stockMinimums:{},purchasePrices:{},...s.data()}:{items:{},stockMinimums:{},purchasePrices:{}};setSync('inventory');renderAll()},err=>{console.error(err);setSyncError()});
movementsRef.orderBy('date','desc').limit(250).onSnapshot(s=>{movements=s.docs.map(d=>({id:d.id,...d.data()}));setSync('movements');renderAll()},err=>{console.error(err);setSyncError()});

renderAll();
})();
