const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const STORE_KEY = 'elchava-panel-v2';
const VERSION = 2;
const UNITS = ['oz','lb','g','kg','ml','l','pza'];
const ORDER_FLOW = ['pending','preparing','ready','delivery','delivered'];
const ORDER_LABEL = {pending:'Pendiente',preparing:'Preparando',ready:'Listo',delivery:'En entrega',delivered:'Entregado',cancelled:'Cancelado'};

const blankState = () => ({
  version: VERSION,
  inventory: [],
  recipes: [],
  orders: [],
  sales: [],
  purchases: [],
  expenses: []
});

function readState(){
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return blankState();
    const s = JSON.parse(raw);
    if (s.version !== VERSION) return blankState();
    return {...blankState(), ...s};
  } catch { return blankState(); }
}
let db = readState();
function persist(){ localStorage.setItem(STORE_KEY, JSON.stringify(db)); }
function uid(){ return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`; }
function today(){ return new Date().toISOString().slice(0,10); }
function money(n){ return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n||0)); }
function num(n){ return Number(n || 0); }
function escapeHtml(v=''){ return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function byDateTime(a,b){ return `${a.date||''} ${a.time||''}`.localeCompare(`${b.date||''} ${b.time||''}`); }
function toast(msg){ const el=$('#toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),1800); }

const modules = [
  ['orders','📋','Pedidos'],['prep','👨‍🍳','Preparación'],['delivery','🚗','Entregas'],['inventory','📦','Inventario'],
  ['recipes','🧾','Recetas'],['sales','💵','Ventas'],['purchases','🛒','Compras'],['money','💰','Dinero']
];
let current = 'home';
let editing = null;

function setView(id){
  current=id;
  $('#home').classList.toggle('active', id==='home');
  $('#screen').classList.toggle('active', id!=='home');
  if(id==='home') renderHome(); else renderModule();
}

function renderHome(){
  $('#modules').innerHTML = modules.map(([id,ic,n])=>`<button class="card" data-module="${id}"><span>${ic}</span><strong>${n}</strong></button>`).join('');
  const activeOrders = db.orders.filter(o=>!['delivered','cancelled'].includes(o.status)).length;
  const low = db.inventory.filter(i=>num(i.stock)<=num(i.minimum)).length;
  const salesToday = db.sales.filter(s=>s.date===today()).reduce((a,b)=>a+num(b.total),0);
  $('#summary').innerHTML = `<strong>Hoy</strong><div class="summary-grid"><span><b>${activeOrders}</b> pedidos activos</span><span><b>${low}</b> inventario bajo</span><span><b>${money(salesToday)}</b> ventas</span></div>`;
}

function configFor(id){
  return {
    orders:['Pedidos','＋ Pedido'], prep:['Preparación',''], delivery:['Entregas',''], inventory:['Inventario','＋ Ingrediente'],
    recipes:['Recetas','＋ Receta'], sales:['Ventas','＋ Venta'], purchases:['Compras','＋ Compra'], money:['Dinero','＋ Gasto']
  }[id];
}

function renderModule(){
  const cfg=configFor(current); $('#screenTitle').textContent=cfg[0]; $('#primaryBtn').textContent=cfg[1]; $('#primaryBtn').hidden=!cfg[1];
  if(current==='orders') renderOrders();
  if(current==='prep') renderPrep();
  if(current==='delivery') renderDelivery();
  if(current==='inventory') renderInventory();
  if(current==='recipes') renderRecipes();
  if(current==='sales') renderSales();
  if(current==='purchases') renderPurchases();
  if(current==='money') renderMoney();
}
function empty(t){ return `<div class="empty">${t}</div>`; }

function recipeName(id){ return db.recipes.find(r=>r.id===id)?.name || 'Producto'; }
function inventoryName(id){ return db.inventory.find(i=>i.id===id)?.name || 'Ingrediente'; }

function renderOrders(){
  const rows=[...db.orders].sort(byDateTime);
  $('#content').innerHTML = rows.length ? `<div class="list">${rows.map(o=>{
    const next = ORDER_FLOW[ORDER_FLOW.indexOf(o.status)+1];
    return `<article class="row"><div class="row-head"><div><h3>${escapeHtml(o.customer||'Cliente')}</h3><div class="muted">${escapeHtml(o.date||'')} ${escapeHtml(o.time||'')} · ${escapeHtml(recipeName(o.recipeId))} · ${num(o.qty)||1}</div></div><strong>${money(o.total)}</strong></div><div class="status">${ORDER_LABEL[o.status]||o.status}</div>${o.address?`<div class="muted">${escapeHtml(o.address)}</div>`:''}<div class="actions"><button data-edit="order" data-id="${o.id}">Editar</button>${next?`<button data-order-next="${next}" data-id="${o.id}">${next==='preparing'?'Preparar':next==='ready'?'Listo':next==='delivery'?'A entrega':'Entregado'}</button>`:''}${!['delivered','cancelled'].includes(o.status)?`<button class="danger" data-order-cancel data-id="${o.id}">Cancelar</button>`:''}</div></article>`;
  }).join('')}</div>` : empty('No hay pedidos.');
}

function renderPrep(){
  const rows=db.orders.filter(o=>['pending','preparing'].includes(o.status)).sort(byDateTime);
  $('#content').innerHTML = rows.length ? `<div class="list">${rows.map(o=>`<article class="row"><div class="row-head"><div><h3>${escapeHtml(recipeName(o.recipeId))}</h3><div>${escapeHtml(o.customer||'')} · ${num(o.qty)||1}</div><div class="muted">${escapeHtml(o.date||'')} ${escapeHtml(o.time||'')}</div></div><span class="status">${ORDER_LABEL[o.status]}</span></div><div class="actions">${o.status==='pending'?`<button data-order-next="preparing" data-id="${o.id}">Empezar</button>`:`<button data-order-next="ready" data-id="${o.id}">Marcar listo</button>`}</div></article>`).join('')}</div>` : empty('Nada por preparar.');
}

function renderDelivery(){
  const rows=db.orders.filter(o=>['ready','delivery'].includes(o.status)).sort(byDateTime);
  $('#content').innerHTML = rows.length ? `<div class="list">${rows.map(o=>`<article class="row"><div class="row-head"><div><h3>${escapeHtml(o.customer||'Cliente')}</h3><div>${escapeHtml(recipeName(o.recipeId))} · ${num(o.qty)||1}</div></div><span class="status">${ORDER_LABEL[o.status]}</span></div><div class="muted">${escapeHtml(o.address||'Sin dirección')}</div><div class="actions">${o.status==='ready'?`<button data-order-next="delivery" data-id="${o.id}">Salir a entregar</button>`:`<button data-order-next="delivered" data-id="${o.id}">Entregado</button>`}</div></article>`).join('')}</div>` : empty('No hay entregas.');
}

function renderInventory(){
  const rows=[...db.inventory].sort((a,b)=>a.name.localeCompare(b.name));
  $('#content').innerHTML = rows.length ? `<div class="list">${rows.map(i=>{ const low=num(i.stock)<=num(i.minimum); return `<article class="row ${low?'low':''}"><div class="row-head"><div><h3>${escapeHtml(i.name)}</h3><div class="muted">Costo ${money(i.costPerUnit)} / ${escapeHtml(i.unit)}</div></div><strong>${num(i.stock)} ${escapeHtml(i.unit)}</strong></div>${low?`<div class="warning">Inventario bajo · mínimo ${num(i.minimum)} ${escapeHtml(i.unit)}</div>`:`<div class="muted">Mínimo ${num(i.minimum)} ${escapeHtml(i.unit)}</div>`}<div class="actions"><button data-edit="inventory" data-id="${i.id}">Editar</button><button class="danger" data-delete="inventory" data-id="${i.id}">Eliminar</button></div></article>`; }).join('')}</div>` : empty('Inventario vacío. Aquí solo aparece lo que tú registres.');
}

function recipeCost(r){
  return (r.components||[]).reduce((sum,c)=>{ const item=db.inventory.find(i=>i.id===c.inventoryId); return sum + num(c.qty)*num(item?.costPerUnit); },0);
}
function renderRecipes(){
  const rows=[...db.recipes].sort((a,b)=>a.name.localeCompare(b.name));
  $('#content').innerHTML = rows.length ? `<div class="list">${rows.map(r=>`<article class="row"><div class="row-head"><div><h3>${escapeHtml(r.name)}</h3><div class="muted">${escapeHtml(r.presentation||'')}</div></div><strong>${money(r.price)}</strong></div><div class="muted">Costo estimado ${money(recipeCost(r))}</div><div class="components">${(r.components||[]).map(c=>`<span>${escapeHtml(inventoryName(c.inventoryId))}: ${num(c.qty)} ${escapeHtml(db.inventory.find(i=>i.id===c.inventoryId)?.unit||'')}</span>`).join('')}</div><div class="actions"><button data-edit="recipe" data-id="${r.id}">Editar</button><button class="danger" data-delete="recipe" data-id="${r.id}">Eliminar</button></div></article>`).join('')}</div>` : empty('No hay recetas. Primero registra ingredientes en Inventario y luego crea una receta.');
}

function renderSales(){
  const rows=[...db.sales].sort((a,b)=>`${b.date} ${b.createdAt||''}`.localeCompare(`${a.date} ${a.createdAt||''}`));
  $('#content').innerHTML = rows.length ? `<div class="list">${rows.map(s=>`<article class="row"><div class="row-head"><div><h3>${escapeHtml(recipeName(s.recipeId))}</h3><div class="muted">${escapeHtml(s.date)} · ${num(s.qty)} venta(s)${s.sourceOrderId?' · Pedido':''}</div></div><strong>${money(s.total)}</strong></div></article>`).join('')}</div>` : empty('No hay ventas.');
}

function renderPurchases(){
  const rows=[...db.purchases].sort((a,b)=>b.date.localeCompare(a.date));
  $('#content').innerHTML = rows.length ? `<div class="list">${rows.map(p=>`<article class="row"><div class="row-head"><div><h3>${escapeHtml(inventoryName(p.inventoryId))}</h3><div class="muted">${escapeHtml(p.date)} · +${num(p.qty)} ${escapeHtml(db.inventory.find(i=>i.id===p.inventoryId)?.unit||'')}</div></div><strong>${money(p.total)}</strong></div></article>`).join('')}</div>` : empty('No hay compras.');
}

function renderMoney(){
  const income=db.sales.reduce((s,x)=>s+num(x.total),0);
  const purchases=db.purchases.reduce((s,x)=>s+num(x.total),0);
  const expenses=db.expenses.reduce((s,x)=>s+num(x.amount),0);
  $('#content').innerHTML = `<div class="money-cards"><div><small>Entradas</small><strong>${money(income)}</strong></div><div><small>Compras</small><strong>${money(purchases)}</strong></div><div><small>Gastos</small><strong>${money(expenses)}</strong></div><div><small>Balance</small><strong>${money(income-purchases-expenses)}</strong></div></div><div class="list">${db.expenses.length?db.expenses.map(e=>`<article class="row"><div class="row-head"><div><h3>${escapeHtml(e.name)}</h3><div class="muted">${escapeHtml(e.date)}</div></div><strong>${money(e.amount)}</strong></div></article>`).join(''):empty('No hay gastos adicionales.')}</div>`;
}

function field(name,label,type='text',value='',extra=''){
  return `<label>${label}<input name="${name}" type="${type}" value="${escapeHtml(value)}" ${extra}></label>`;
}
function selectField(name,label,options,value=''){
  return `<label>${label}<select name="${name}">${options.map(([v,t])=>`<option value="${escapeHtml(v)}" ${v===value?'selected':''}>${escapeHtml(t)}</option>`).join('')}</select></label>`;
}

function openForm(type,obj=null){
  editing={type,id:obj?.id||null};
  const titles={order:'pedido',inventory:'ingrediente',recipe:'receta',sale:'venta',purchase:'compra',expense:'gasto'};
  $('#formTitle').textContent=`${obj?'Editar':'Nuevo'} ${titles[type]}`;
  if(type==='inventory') $('#formFields').innerHTML = `${field('name','Ingrediente','text',obj?.name||'', 'required')}${selectField('unit','Unidad',UNITS.map(x=>[x,x]),obj?.unit||'oz')}${field('stock','Existencia actual','number',obj?.stock??0,'step="0.01" min="0"')}${field('minimum','Mínimo','number',obj?.minimum??0,'step="0.01" min="0"')}${field('costPerUnit','Costo por unidad','number',obj?.costPerUnit??0,'step="0.01" min="0"')}`;
  if(type==='recipe') renderRecipeForm(obj);
  if(type==='order') $('#formFields').innerHTML = `${field('customer','Cliente','text',obj?.customer||'','required')}${field('phone','Teléfono','tel',obj?.phone||'')}${selectField('recipeId','Producto',db.recipes.map(r=>[r.id,`${r.name} — ${money(r.price)}`]),obj?.recipeId||db.recipes[0]?.id||'')}${field('qty','Cantidad','number',obj?.qty??1,'step="1" min="1" required')}${field('total','Total','number',obj?.total??(db.recipes.find(r=>r.id===(obj?.recipeId||db.recipes[0]?.id))?.price||0),'step="0.01" min="0" required')}${field('date','Fecha','date',obj?.date||today(),'required')}${field('time','Hora','time',obj?.time||'')}${field('address','Dirección','text',obj?.address||'')}`;
  if(type==='sale') $('#formFields').innerHTML = `${selectField('recipeId','Producto',db.recipes.map(r=>[r.id,`${r.name} — ${money(r.price)}`]),obj?.recipeId||db.recipes[0]?.id||'')}${field('qty','Cantidad','number',obj?.qty??1,'step="1" min="1" required')}${field('total','Total cobrado','number',obj?.total??(db.recipes[0]?.price||0),'step="0.01" min="0" required')}${field('date','Fecha','date',obj?.date||today(),'required')}`;
  if(type==='purchase') $('#formFields').innerHTML = `${selectField('inventoryId','Ingrediente',db.inventory.map(i=>[i.id,`${i.name} (${i.unit})`]),obj?.inventoryId||db.inventory[0]?.id||'')}${field('qty','Cantidad comprada','number',obj?.qty??0,'step="0.01" min="0.01" required')}${field('total','Total pagado','number',obj?.total??0,'step="0.01" min="0" required')}${field('date','Fecha','date',obj?.date||today(),'required')}`;
  if(type==='expense') $('#formFields').innerHTML = `${field('name','Gasto','text',obj?.name||'','required')}${field('amount','Cantidad','number',obj?.amount??0,'step="0.01" min="0" required')}${field('date','Fecha','date',obj?.date||today(),'required')}`;
  $('#modal').hidden=false;
}

function renderRecipeForm(obj){
  const comps=obj?.components?.length?obj.components:[{inventoryId:db.inventory[0]?.id||'',qty:0}];
  $('#formFields').innerHTML = `${field('name','Producto / receta','text',obj?.name||'','required')}${field('presentation','Presentación','text',obj?.presentation||'1 lb')}${field('price','Precio de venta','number',obj?.price??0,'step="0.01" min="0" required')}<div class="section-title">Ingredientes</div><div id="componentRows">${comps.map(componentRow).join('')}</div><button type="button" class="secondary wide" id="addComponent">＋ Agregar ingrediente</button>`;
  $('#addComponent').onclick=()=>$('#componentRows').insertAdjacentHTML('beforeend',componentRow({inventoryId:db.inventory[0]?.id||'',qty:0}));
}
function componentRow(c){
  return `<div class="component-row"><select name="componentId">${db.inventory.map(i=>`<option value="${i.id}" ${i.id===c.inventoryId?'selected':''}>${escapeHtml(i.name)} (${escapeHtml(i.unit)})</option>`).join('')}</select><input name="componentQty" type="number" step="0.01" min="0" value="${num(c.qty)}" placeholder="Cantidad"><button type="button" class="danger small" data-remove-component>×</button></div>`;
}
function closeForm(){ $('#modal').hidden=true; editing=null; }

function validateRecipeAvailability(recipeId, qty){
  const r=db.recipes.find(x=>x.id===recipeId); if(!r) return {ok:false,msg:'No existe la receta.'};
  const missing=[];
  for(const c of r.components||[]){ const item=db.inventory.find(i=>i.id===c.inventoryId); if(!item) continue; const need=num(c.qty)*qty; if(num(item.stock)<need) missing.push(`${item.name}: faltan ${(need-num(item.stock)).toFixed(2)} ${item.unit}`); }
  return missing.length?{ok:false,msg:`Inventario insuficiente: ${missing.join(' · ')}`}:{ok:true};
}
function deductRecipe(recipeId, qty){
  const r=db.recipes.find(x=>x.id===recipeId); if(!r) return;
  for(const c of r.components||[]){ const item=db.inventory.find(i=>i.id===c.inventoryId); if(item) item.stock=Math.max(0,num(item.stock)-num(c.qty)*qty); }
}
function addSale({recipeId,qty,total,date,sourceOrderId=null}){
  if(sourceOrderId && db.sales.some(s=>s.sourceOrderId===sourceOrderId)) return true;
  const check=validateRecipeAvailability(recipeId,qty); if(!check.ok){ toast(check.msg); return false; }
  deductRecipe(recipeId,qty);
  db.sales.push({id:uid(),recipeId,qty,total,date,sourceOrderId,createdAt:new Date().toISOString()});
  return true;
}

function submitForm(e){
  e.preventDefault(); const fd=new FormData(e.currentTarget); const type=editing.type;
  if(type==='inventory'){
    const x={id:editing.id||uid(),name:fd.get('name').trim(),unit:fd.get('unit'),stock:num(fd.get('stock')),minimum:num(fd.get('minimum')),costPerUnit:num(fd.get('costPerUnit'))};
    if(editing.id) db.inventory=db.inventory.map(i=>i.id===editing.id?x:i); else db.inventory.push(x);
  }
  if(type==='recipe'){
    const ids=fd.getAll('componentId'), qtys=fd.getAll('componentQty');
    const components=ids.map((id,i)=>({inventoryId:id,qty:num(qtys[i])})).filter(c=>c.inventoryId&&c.qty>0);
    const x={id:editing.id||uid(),name:fd.get('name').trim(),presentation:fd.get('presentation').trim(),price:num(fd.get('price')),components};
    if(editing.id) db.recipes=db.recipes.map(r=>r.id===editing.id?x:r); else db.recipes.push(x);
  }
  if(type==='order'){
    if(!db.recipes.length){toast('Primero crea una receta.');return;}
    const x={id:editing.id||uid(),customer:fd.get('customer').trim(),phone:fd.get('phone').trim(),recipeId:fd.get('recipeId'),qty:num(fd.get('qty')),total:num(fd.get('total')),date:fd.get('date'),time:fd.get('time'),address:fd.get('address').trim(),status:editing.id?(db.orders.find(o=>o.id===editing.id)?.status||'pending'):'pending'};
    if(editing.id) db.orders=db.orders.map(o=>o.id===editing.id?x:o); else db.orders.push(x);
  }
  if(type==='sale'){
    if(!db.recipes.length){toast('Primero crea una receta.');return;}
    if(!addSale({recipeId:fd.get('recipeId'),qty:num(fd.get('qty')),total:num(fd.get('total')),date:fd.get('date')})) return;
  }
  if(type==='purchase'){
    if(!db.inventory.length){toast('Primero crea un ingrediente.');return;}
    const inventoryId=fd.get('inventoryId'), qty=num(fd.get('qty')), total=num(fd.get('total'));
    db.purchases.push({id:uid(),inventoryId,qty,total,date:fd.get('date')});
    const item=db.inventory.find(i=>i.id===inventoryId); if(item){item.stock=num(item.stock)+qty; if(qty>0) item.costPerUnit=total/qty;}
  }
  if(type==='expense') db.expenses.push({id:uid(),name:fd.get('name').trim(),amount:num(fd.get('amount')),date:fd.get('date')});
  persist(); closeForm(); renderModule(); toast('Guardado');
}

function advanceOrder(id,status){
  const o=db.orders.find(x=>x.id===id); if(!o) return;
  if(status==='delivered'){
    const ok=addSale({recipeId:o.recipeId,qty:num(o.qty),total:num(o.total),date:o.date||today(),sourceOrderId:o.id});
    if(!ok) return;
  }
  o.status=status; persist(); renderModule(); toast(ORDER_LABEL[status]||'Actualizado');
}

function deleteInventory(id){
  if(db.recipes.some(r=>(r.components||[]).some(c=>c.inventoryId===id))){ toast('Ese ingrediente está usado en una receta.'); return; }
  db.inventory=db.inventory.filter(i=>i.id!==id); persist(); renderModule();
}
function deleteRecipe(id){
  if(db.orders.some(o=>o.recipeId===id&&!['delivered','cancelled'].includes(o.status))){ toast('Esa receta tiene pedidos activos.'); return; }
  db.recipes=db.recipes.filter(r=>r.id!==id); persist(); renderModule();
}

function handlePrimary(){
  if(current==='orders') return openForm('order');
  if(current==='inventory') return openForm('inventory');
  if(current==='recipes') { if(!db.inventory.length){toast('Primero registra ingredientes.');return;} return openForm('recipe'); }
  if(current==='sales') { if(!db.recipes.length){toast('Primero crea una receta.');return;} return openForm('sale'); }
  if(current==='purchases') { if(!db.inventory.length){toast('Primero registra ingredientes.');return;} return openForm('purchase'); }
  if(current==='money') return openForm('expense');
}

document.addEventListener('click', e=>{
  const mod=e.target.closest('[data-module]'); if(mod) return setView(mod.dataset.module);
  const next=e.target.closest('[data-order-next]'); if(next) return advanceOrder(next.dataset.id,next.dataset.orderNext);
  const cancel=e.target.closest('[data-order-cancel]'); if(cancel){const o=db.orders.find(x=>x.id===cancel.dataset.id); if(o){o.status='cancelled';persist();renderModule();toast('Pedido cancelado');} return;}
  const ed=e.target.closest('[data-edit]'); if(ed){
    if(ed.dataset.edit==='inventory') return openForm('inventory',db.inventory.find(x=>x.id===ed.dataset.id));
    if(ed.dataset.edit==='recipe') return openForm('recipe',db.recipes.find(x=>x.id===ed.dataset.id));
    if(ed.dataset.edit==='order') return openForm('order',db.orders.find(x=>x.id===ed.dataset.id));
  }
  const del=e.target.closest('[data-delete]'); if(del){ if(del.dataset.delete==='inventory') return deleteInventory(del.dataset.id); if(del.dataset.delete==='recipe') return deleteRecipe(del.dataset.id); }
  const rm=e.target.closest('[data-remove-component]'); if(rm) return rm.closest('.component-row')?.remove();
});

$('#backBtn').onclick=()=>setView('home');
$('#homeBtn').onclick=()=>setView('home');
$('#primaryBtn').onclick=handlePrimary;
$('#closeModal').onclick=closeForm;
$('#form').onsubmit=submitForm;
$('#modal').onclick=e=>{ if(e.target===$('#modal')) closeForm(); };

setView('home');
