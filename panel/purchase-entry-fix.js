(()=>{
'use strict';
if(window.__PANEL_PURCHASE_ENTRY_FIX__)return;
window.__PANEL_PURCHASE_ENTRY_FIX__=true;

const PROFILE=window.PANEL_PROFILE||{};
const ITEMS=PROFILE.items||{};
const E=id=>document.getElementById(id);
const r3=n=>Math.round((Number(n||0)+Number.EPSILON)*1000)/1000;
const n2=n=>Number(Number(n||0).toFixed(2));
const money=n=>'$'+Number(n||0).toFixed(2);
const localDay=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':'&quot;',"'":'&#39;'}[c]));

const itemEl=E('purchaseItem'),qtyEl=E('purchaseQty'),priceEl=E('purchaseCost'),storeEl=E('purchaseStore'),saveEl=E('savePurchaseBtn'),previewEl=E('purchasePreview');
let unitEl=E('purchaseUnit');
if(!itemEl||!qtyEl||!priceEl||!storeEl||!saveEl||!previewEl||!unitEl)return;

const UNITS=[
  ['lb','lb'],['oz','oz'],['pza','pza'],['bolsa','bolsa'],['paquete','paquete'],['caja','caja'],
  ['botella','botella'],['galón','galón'],['litro','litro'],['fl oz','fl oz'],['manojo','manojo'],['envase','envase']
];

if(unitEl.tagName!=='SELECT'){
  const select=document.createElement('select');
  select.id='purchaseUnit';
  select.innerHTML=UNITS.map(([v,t])=>`<option value="${v}">${t}</option>`).join('');
  unitEl.replaceWith(select);
  unitEl=select;
}else{
  unitEl.innerHTML=UNITS.map(([v,t])=>`<option value="${v}">${t}</option>`).join('');
}

const priceLabel=priceEl.closest('label');
if(priceLabel){
  const text=[...priceLabel.childNodes].find(n=>n.nodeType===Node.TEXT_NODE);
  if(text)text.nodeValue='Precio';
}
priceEl.placeholder='$0.00';

let contentWrap=E('purchaseContentWrap');
if(!contentWrap){
  contentWrap=document.createElement('label');
  contentWrap.id='purchaseContentWrap';
  contentWrap.className='full';
  contentWrap.hidden=true;
  contentWrap.innerHTML='<span id="purchaseContentLabel">Contenido de cada unidad</span><div style="display:grid;grid-template-columns:1fr 120px;gap:8px"><input id="purchaseContentQty" type="number" min="0.01" step="0.01" inputmode="decimal"><select id="purchaseContentUnit"></select></div>';
  const unitLabel=unitEl.closest('label');
  unitLabel?.insertAdjacentElement('afterend',contentWrap);
}
const contentQtyEl=E('purchaseContentQty'),contentUnitEl=E('purchaseContentUnit'),contentLabelEl=E('purchaseContentLabel');

function toast(text){
  const x=E('toast');
  if(!x)return;
  x.textContent=text;x.classList.add('show');
  clearTimeout(window.__purchaseFixToast);
  window.__purchaseFixToast=setTimeout(()=>x.classList.remove('show'),2200);
}
function normalizeInternal(u){
  u=String(u||'').trim().toLowerCase();
  if(u==='pzas'||u==='pieza'||u==='piezas'||u==='unit'||u==='unidad'||u==='unidades')return 'pza';
  if(u==='libras'||u==='libra')return 'lb';
  if(u==='onzas'||u==='onza')return 'oz';
  if(u==='fl. oz'||u==='floz')return 'fl oz';
  return u;
}
function configuredUnit(item){
  const s=String(item?.purchaseUnit||item?.unit||'').trim().toLowerCase();
  if(s.includes('fl oz')&&s.startsWith('botella'))return 'botella';
  if(s.includes('paquete'))return 'paquete';
  if(s.includes('botella'))return 'botella';
  if(s.includes('manojo'))return 'manojo';
  if(s.includes('bolsa'))return 'bolsa';
  if(s.includes('caja'))return 'caja';
  if(s.includes('envase'))return 'envase';
  if(s==='pzas'||s==='pieza'||s==='piezas')return 'pza';
  if(s==='lb'||s==='oz'||s==='fl oz'||s==='galón'||s==='galon'||s==='litro')return s==='galon'?'galón':s;
  return normalizeInternal(s)||'pza';
}
function contentChoices(item){
  const iu=normalizeInternal(item?.unit);
  if(iu==='lb')return [['lb','lb'],['oz','oz']];
  if(iu==='oz')return [['oz','oz'],['lb','lb']];
  if(iu==='fl oz')return [['fl oz','fl oz'],['galón','galón'],['litro','litro']];
  if(iu==='pza')return [['pza','pza']];
  return [[iu||'pza',iu||'pza']];
}
function directFactor(item,selected){
  const iu=normalizeInternal(item?.unit),su=normalizeInternal(selected),cu=configuredUnit(item);
  if(su===normalizeInternal(cu))return Number(item?.factor||1);
  if(su===iu)return 1;
  if(iu==='lb'&&su==='oz')return 1/16;
  if(iu==='oz'&&su==='lb')return 16;
  if(iu==='fl oz'&&su==='galón')return 128;
  if(iu==='fl oz'&&su==='litro')return 33.814;
  if(iu==='pza'&&su==='pza')return 1;
  return null;
}
function contentFactor(item){
  const amount=Number(contentQtyEl?.value||0);
  if(!(amount>0))return null;
  const iu=normalizeInternal(item?.unit),cu=normalizeInternal(contentUnitEl?.value);
  if(iu==='lb'&&cu==='lb')return amount;
  if(iu==='lb'&&cu==='oz')return amount/16;
  if(iu==='oz'&&cu==='oz')return amount;
  if(iu==='oz'&&cu==='lb')return amount*16;
  if(iu==='fl oz'&&cu==='fl oz')return amount;
  if(iu==='fl oz'&&cu==='galón')return amount*128;
  if(iu==='fl oz'&&cu==='litro')return amount*33.814;
  if(iu==='pza'&&cu==='pza')return amount;
  return null;
}
function effectiveFactor(item){return directFactor(item,unitEl.value)??contentFactor(item);}
function internalText(item,qty){return `${n2(qty)} ${normalizeInternal(item?.unit)||item?.unit||''}`.trim();}
function syncContent(){
  const item=ITEMS[itemEl.value]||{};
  const direct=directFactor(item,unitEl.value);
  const needs=!(direct>0);
  contentWrap.hidden=!needs;
  if(needs){
    contentLabelEl.textContent=`¿Cuánto trae cada ${unitEl.value}?`;
    const current=contentUnitEl.value;
    contentUnitEl.innerHTML=contentChoices(item).map(([v,t])=>`<option value="${v}">${t}</option>`).join('');
    if([...contentUnitEl.options].some(o=>o.value===current))contentUnitEl.value=current;
  }
}
function setDefaultUnit(){
  const item=ITEMS[itemEl.value]||{};
  const wanted=configuredUnit(item);
  unitEl.value=[...unitEl.options].some(o=>o.value===wanted)?wanted:(normalizeInternal(item.unit)||'pza');
  if(contentQtyEl)contentQtyEl.value='';
  syncContent();
  updatePreview();
}
function updatePreview(){
  const item=ITEMS[itemEl.value]||{},qty=Number(qtyEl.value||0),raw=String(priceEl.value||'').trim(),price=Number(raw),factor=effectiveFactor(item);
  syncContent();
  if(!(qty>0)){previewEl.textContent='Escribe la cantidad.';return;}
  if(!(factor>0)){
    previewEl.innerHTML=`Escribe cuánto trae cada <b>${esc(unitEl.value)}</b> para calcular lo que entra al inventario.`;
    return;
  }
  const internal=r3(qty*factor);
  let html=`Se agregarán <b>${esc(internalText(item,internal))}</b> al inventario.`;
  if(raw!==''&&Number.isFinite(price)&&price>=0){
    const total=n2(qty*price);
    html=`<b>${n2(qty)} ${esc(unitEl.value)} × ${money(price)} = ${money(total)}</b><br>${html}`;
  }else{
    html+=`<br>Escribe el <b>precio por ${esc(unitEl.value)}</b>.`;
  }
  previewEl.innerHTML=html;
}

itemEl.addEventListener('change',setDefaultUnit);
qtyEl.addEventListener('input',updatePreview);
priceEl.addEventListener('input',updatePreview);
unitEl.addEventListener('change',()=>{if(contentQtyEl)contentQtyEl.value='';syncContent();updatePreview();});
contentQtyEl?.addEventListener('input',updatePreview);
contentUnitEl?.addEventListener('change',updatePreview);

const postOpen=()=>setTimeout(setDefaultUnit,0);
E('registerPurchaseBtn')?.addEventListener('click',postOpen);
E('shoppingList')?.addEventListener('click',e=>{if(e.target.closest('[data-buy-key]'))postOpen();});

saveEl.onclick=async()=>{
  const key=itemEl.value,item=ITEMS[key];
  if(!item)return alert('Elige un producto.');
  const qty=Number(qtyEl.value||0);
  if(!(qty>0))return alert('Escribe la cantidad.');
  const priceRaw=String(priceEl.value||'').trim();
  if(priceRaw==='')return alert('Escribe el precio.');
  const unitPrice=Number(priceRaw);
  if(!Number.isFinite(unitPrice)||unitPrice<0)return alert('Escribe un precio válido.');
  const factor=effectiveFactor(item);
  if(!(factor>0))return alert(`Escribe cuánto trae cada ${unitEl.value}.`);

  const internalQty=r3(qty*factor),cost=n2(qty*unitPrice),store=storeEl.value.trim()||'Sin tienda';
  const configuredFactor=Number(item.factor||1);
  const normalizedUsualPrice=internalQty>0?n2((cost/internalQty)*configuredFactor):unitPrice;
  const db=firebase.firestore();
  const inventoryRef=db.collection('inventario').doc(PROFILE.inventoryDoc||`panel-${PROFILE.id}`);
  const movementRef=db.collection('movimientos').doc();
  const stamp=firebase.firestore.FieldValue.serverTimestamp();
  await db.runTransaction(async tx=>{
    const snap=await tx.get(inventoryRef),data=snap.data()||{};
    const items={...(data.items||{})},prices={...(data.purchasePrices||{})};
    items[key]=r3(Number(items[key]||0)+internalQty);
    prices[key]=normalizedUsualPrice;
    tx.set(inventoryRef,{items,purchasePrices:prices,updatedAt:stamp},{merge:true});
    tx.set(movementRef,{
      panelTenant:PROFILE.id||'el-cubano',type:'purchase',date:stamp,day:localDay(),name:item.name,itemKey:key,
      qty,unit:unitEl.value,unitPrice,cost,store,internalQty,
      contentQty:contentWrap.hidden?null:Number(contentQtyEl.value||0),
      contentUnit:contentWrap.hidden?null:contentUnitEl.value
    });
  });
  E('purchaseModal').hidden=true;
  toast('Compra guardada');
};

setDefaultUnit();
})();
