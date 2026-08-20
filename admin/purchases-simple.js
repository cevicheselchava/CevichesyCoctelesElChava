(()=>{
  if(window.__EL_CUBANO_PURCHASES_SIMPLE_V2__)return;
  window.__EL_CUBANO_PURCHASES_SIMPLE_V2__=true;

  const r3=n=>Math.round((Number(n)+Number.EPSILON)*1000)/1000;
  const n3=n=>Number(r3(n).toFixed(3));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const E=id=>document.getElementById(id);
  const movementById=id=>(movements||[]).find(m=>m.id===id);

  const style=document.createElement('style');
  style.textContent=`
    .purchase-home-actions{display:grid;gap:11px}
    .purchase-home-choice{width:100%;border:1px solid #ded7c8;border-radius:18px;background:#fff;padding:16px;text-align:left;display:grid;grid-template-columns:52px 1fr;gap:12px;align-items:center;box-shadow:0 5px 14px rgba(22,50,72,.07)}
    .purchase-home-choice .ico{width:52px;height:52px;border-radius:15px;display:grid;place-items:center;background:#eef8ef;font-size:29px}
    .purchase-home-choice b{display:block;color:#174f2b;font-size:19px}
    .purchase-home-choice small{display:block;color:#687386;margin-top:5px;font-weight:800;line-height:1.4}
    .presentation-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .presentation-btn{border:1px solid #d7cfbf;border-radius:13px;padding:12px 8px;background:#fff;color:#123458;font-weight:1000;min-height:52px}
    .presentation-btn.active{background:linear-gradient(135deg,#174f2b,#2b8a49);color:#fff;border-color:transparent;box-shadow:inset 0 -4px 0 #f2b632}
    .recipe-missing{font-weight:1000;color:#c8382d;background:#fff0ed;border-radius:10px;padding:8px 10px;white-space:nowrap}
    .entry-price-row{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}
    .entry-price-unit{padding:12px 14px;border-radius:13px;background:#eef3f8;color:#123458;white-space:nowrap;font-weight:1000}
    .movement-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}
    .movement-detail-box{border:1px solid #ded7c8;border-radius:12px;padding:11px;background:#fff}
    .movement-detail-box.full{grid-column:1/-1}
    .movement-detail-box small{display:block;color:#687386;font-weight:900;margin-bottom:4px}
    .movement-detail-box b{color:#174f2b;font-size:17px}
    @media(max-width:560px){.presentation-grid,.movement-detail-grid{grid-template-columns:1fr}.movement-detail-box.full{grid-column:1}}
  `;
  document.head.appendChild(style);

  const nav=document.getElementById('mainNav');
  const ordersNav=nav?.querySelector('[data-tab="orders"]');
  let purchasesNav=nav?.querySelector('[data-tab="purchases"]');
  if(!purchasesNav&&ordersNav){
    purchasesNav=document.createElement('button');
    purchasesNav.dataset.tab='purchases';
    purchasesNav.innerHTML='<span class="nav-icon">🛒</span><span class="nav-label">Compras</span>';
    ordersNav.insertAdjacentElement('afterend',purchasesNav);
  }
  let purchasesPanel=E('purchases');
  if(!purchasesPanel){
    purchasesPanel=document.createElement('section');
    purchasesPanel.className='panel';
    purchasesPanel.id='purchases';
    purchasesPanel.innerHTML=`<div class="card"><h2>Compras</h2>
      <div class="notice">Elige lo que estás haciendo. El sistema hace las cuentas y las conversiones.</div>
      <div class="purchase-home-actions">
        <button class="purchase-home-choice" id="purchaseRegister"><span class="ico">🛒</span><span><b>Registrar compra</b><small>Registra cantidad, presentación y precio. El sistema calcula el total y suma inventario.</small></span></button>
        <button class="purchase-home-choice" id="purchaseReceive"><span class="ico">📦</span><span><b>Recibir mercancía</b><small>Solo registra lo que llegó físicamente. Suma inventario sin volver a registrar gasto.</small></span></button>
      </div></div>`;
    E('orders')?.insertAdjacentElement('afterend',purchasesPanel);
  }
  purchasesNav?.addEventListener('click',()=>activateTab('purchases'));

  E('inventoryPurchaseBtn')?.remove();
  const inventoryAdjust=E('inventoryAdjustBtn');
  if(inventoryAdjust){
    inventoryAdjust.textContent='✏️ CORREGIR CANTIDAD REAL';
    const top=inventoryAdjust.closest('.top-actions');
    if(top)top.style.gridTemplateColumns='1fr';
  }
  window.openAdjustInventoryForKey=function(key){
    if(typeof openAdjustInventory!=='function')return;
    openAdjustInventory();
    const select=E('adjustItem');
    if(select&&ITEMS?.[key]){
      select.value=key;
      if(typeof refreshAdjustFields==='function')refreshAdjustFields();
    }
  };

  const recipeCard=E('recipeType')?.closest('.card');
  if(recipeCard){
    const h=recipeCard.querySelector('h2');
    const notice=recipeCard.querySelector('.notice');
    if(h)h.textContent='Recetas';
    if(notice)notice.textContent='Elige una receta y la cantidad para ver exactamente lo que necesitas y lo que te falta.';
  }
  recipeRow=function(key,need){
    const item=ITEMS?.[key];
    if(!item)return '';
    const have=available(key),lack=Math.max(0,r3(Number(need||0)-Number(have||0)));
    const show=value=>{
      if(item.unit==='lb')return `${n3(Number(value||0)*16)} oz`;
      if(item.unit==='oz')return `${n3(value)} oz`;
      if(item.unit==='fl oz')return `${n3(value)} fl oz`;
      if(item.unit==='pzas')return `${n3(value)} pzas`;
      return typeof displayQty==='function'?displayQty(key,value):`${n3(value)} ${item.unit||''}`;
    };
    return `<div class="recipe-row"><div><strong>${esc(item.name)}</strong><small>Necesitas ${show(need)} · Disponible ${show(have)}</small></div>${lack>0?`<span class="recipe-missing">Falta ${show(lack)}</span>`:'<span class="recipe-enough">✓ Hay</span>'}</div>`;
  };
  if(typeof renderRecipe==='function')renderRecipe();

  const unitLabel=u=>({lb:'lb',oz:'oz','fl oz':'fl oz',pzas:'pzas',paquete:'paquete',pieza:'pieza',bolsa:'bolsa',caja:'caja',botella:'botella',envase:'envase',manojo:'manojo'}[u]||u||'unidad');
  const cap=s=>String(s||'').charAt(0).toUpperCase()+String(s||'').slice(1);

  function conversionToInternal(item,contentUnit){
    const iu=String(item?.unit||''),cu=String(contentUnit||'');
    if(iu==='lb'&&cu==='oz')return 1/16;
    if(iu==='lb'&&cu==='lb')return 1;
    if(iu==='oz'&&cu==='lb')return 16;
    if(iu==='oz'&&cu==='oz')return 1;
    if(iu==='fl oz'&&cu==='fl oz')return 1;
    if(iu==='pzas'&&cu==='pzas')return 1;
    if(iu===cu)return 1;
    return null;
  }

  function choicesFor(key){
    const item=ITEMS?.[key]||{},iu=String(item.unit||''),out=[];
    const add=c=>out.push(c);
    if(iu==='lb'){
      add({id:'bag',label:'Bolsa',unit:'bolsa',custom:true,contentUnits:['oz','lb'],discrete:true,prefill:key==='shrimp'?12:null,prefillUnit:key==='shrimp'?'oz':null});
      add({id:'lb',label:'Por lb',unit:'lb',factor:1});
      add({id:'box',label:'Caja',unit:'caja',custom:true,contentUnits:['lb','oz'],discrete:true});
      return out;
    }
    if(iu==='oz'){
      const pu=String(item.purchaseUnit||'');
      const f=Number(item.factor||0);
      if(pu==='lb')add({id:'lb',label:'Por lb',unit:'lb',factor:16});
      else if(pu&&pu!=='oz'&&f>0)add({id:'usual',label:cap(pu),unit:pu,factor:f,content:f,contentUnit:'oz',discrete:/pieza|manojo|bolsa|caja|paquete/.test(pu)});
      add({id:'oz',label:'Por oz',unit:'oz',factor:1});
      add({id:'other',label:'Otra presentación',unit:'bolsa',custom:true,contentUnits:['oz','lb'],discrete:true});
      return out;
    }
    if(iu==='fl oz'){
      const pu=String(item.purchaseUnit||'');
      const f=Number(item.factor||0);
      if(pu&&pu!=='fl oz'&&f>1)add({id:'usual',label:cap(pu),unit:/envase|botella/i.test(pu)?(pu.match(/envase/i)?'envase':'botella'):pu,factor:f,content:f,contentUnit:'fl oz',discrete:true});
      add({id:'bottle',label:'Botella',unit:'botella',custom:true,contentUnits:['fl oz'],discrete:true});
      add({id:'container',label:'Envase',unit:'envase',custom:true,contentUnits:['fl oz'],discrete:true});
      return out;
    }
    if(iu==='pzas'){
      const pu=String(item.purchaseUnit||''),f=Number(item.factor||0);
      add({id:'piece',label:'Por pieza',unit:'pieza',factor:1,discrete:true});
      if(pu&&!/^(pzas|pieza)$/i.test(pu)&&f>1)add({id:'usual',label:cap(pu),unit:/paquete/i.test(pu)?'paquete':pu,factor:f,content:f,contentUnit:'pzas',discrete:true});
      add({id:'pack',label:'Paquete',unit:'paquete',custom:true,contentUnits:['pzas'],discrete:true});
      add({id:'box',label:'Caja',unit:'caja',custom:true,contentUnits:['pzas'],discrete:true});
      return out;
    }
    const pu=String(item.purchaseUnit||iu||'unidad'),f=Math.max(.001,Number(item.factor||1));
    add({id:'usual',label:cap(pu),unit:pu,factor:f,discrete:/paquete|caja|bolsa|pieza/.test(pu)});
    add({id:'other',label:'Otra presentación',unit:'unidad',custom:true,contentUnits:[iu||'unidad'],discrete:true});
    return out;
  }

  let entryMode='purchase',entryKey='',entryPresentation=null,entryCart=[];
  const stockModal=E('stockModal');
  stockModal.innerHTML=`<section class="sheet">
    <h2 id="entryTitle">🛒 Registrar compra</h2>
    <p id="entryIntro"></p>
    <div class="grid">
      <label class="full">Producto<select id="entryItem"></select></label>
      <div class="full"><label style="margin-bottom:7px">Presentación</label><div class="presentation-grid" id="entryPresentations"></div></div>
      <label class="full"><span id="entryQtyQuestion">Cantidad</span><div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center"><input id="entryQty" type="number" min="0.01" step="0.01" value="1"><strong id="entryQtyUnit" class="entry-price-unit">—</strong></div></label>
      <label class="full" id="entryContentWrap" hidden><span id="entryContentQuestion">¿Cuánto trae cada unidad?</span><div style="display:grid;grid-template-columns:1fr 110px;gap:8px"><input id="entryContent" type="number" min="0.01" step="0.01"><select id="entryContentUnit"></select></div></label>
      <label class="full" id="entryPriceWrap"><span id="entryPriceLabel">Precio</span><div class="entry-price-row"><input id="entryUnitPrice" type="number" min="0" step="0.01" inputmode="decimal" placeholder="$0.00"><strong id="entryPriceUnit" class="entry-price-unit">—</strong></div></label>
      <div class="summary-box full" id="entryPreview">Elige una presentación.</div>
      <label class="full"><span id="entryStoreText">Tienda / proveedor (opcional)</span><input id="entryStore" placeholder="H-E-B, Walmart, proveedor…"></label>
    </div>
    <button class="secondary" id="entryAddLine" style="width:100%;border-radius:12px;padding:13px;font-weight:1000;margin-top:10px">➕ AGREGAR OTRO PRODUCTO</button>
    <div class="summary-box" id="entryCart">Si es una sola cosa, llena los datos y guarda.</div>
    <div class="modal-actions"><button class="secondary" id="entryCancel">Cancelar</button><button class="primary" id="entrySave">Guardar compra</button></div>
  </section>`;

  const itemOptions=()=>Object.entries(ITEMS||{}).map(([k,x])=>`<option value="${k}">${esc(x.name)}</option>`).join('');

  function qtyQuestion(unit){
    const u=String(unit||'unidad').toLowerCase();
    if(u==='bolsa')return '¿Cuántas bolsas?';
    if(u==='caja')return '¿Cuántas cajas?';
    if(u==='botella')return '¿Cuántas botellas?';
    if(u==='envase')return '¿Cuántos envases?';
    if(u==='paquete')return '¿Cuántos paquetes?';
    if(u==='pieza')return '¿Cuántas piezas?';
    if(u==='manojo')return '¿Cuántos manojos?';
    if(u==='lb')return '¿Cuántas lb?';
    if(u==='oz')return '¿Cuántas oz?';
    return 'Cantidad';
  }
  function priceLabel(unit){return `Precio por ${String(unit||'unidad').toLowerCase()}`;}

  function internalText(key,value){
    const item=ITEMS?.[key],v=n3(value),u=String(item?.unit||'');
    if(u==='lb')return `${n3(Number(value||0)*16)} oz`;
    return `${v} ${unitLabel(u)}`;
  }
  function internalBaseQtyForCost(key,internalQty){
    const item=ITEMS?.[key];
    if(item?.unit==='lb')return {qty:Number(internalQty||0)*16,unit:'oz'};
    if(item?.unit==='oz')return {qty:Number(internalQty||0),unit:'oz'};
    if(item?.unit==='fl oz')return {qty:Number(internalQty||0),unit:'fl oz'};
    if(item?.unit==='pzas')return {qty:Number(internalQty||0),unit:'pieza'};
    return {qty:Number(internalQty||0),unit:item?.unit||'unidad'};
  }

  function renderPresentations(){
    E('entryPresentations').innerHTML=choicesFor(entryKey).map(c=>`<button type="button" class="presentation-btn ${entryPresentation?.id===c.id?'active':''}" data-presentation="${esc(c.id)}">${esc(c.label)}</button>`).join('');
  }
  function selectPresentation(id){
    entryPresentation=choicesFor(entryKey).find(c=>c.id===id)||null;
    E('entryContent').value='';
    if(entryPresentation?.prefill)E('entryContent').value=String(entryPresentation.prefill);
    renderPresentations();
    syncEntryFields();
    if(entryPresentation?.prefillUnit&&E('entryContentUnit')){
      E('entryContentUnit').value=entryPresentation.prefillUnit;
      updatePreview();
    }
  }
  function presentationFactor(){
    if(!entryPresentation)return 0;
    if(!entryPresentation.custom)return Number(entryPresentation.factor||0);
    const content=Number(E('entryContent').value||0),cu=E('entryContentUnit').value,item=ITEMS?.[entryKey],conv=conversionToInternal(item,cu);
    return content>0&&conv?content*conv:0;
  }

  function currentLine(requireComplete=true){
    const item=ITEMS?.[entryKey],p=entryPresentation,qty=Number(E('entryQty').value||0);
    if(!item)return {error:'Elige un producto.'};
    if(!p)return {error:'Elige una presentación.'};
    if(!(qty>0))return {error:'Escribe una cantidad válida.'};
    if(p.discrete&&!Number.isInteger(qty))return {error:`Escribe una cantidad completa de ${p.unit}.`};
    const factor=presentationFactor();
    if(!(factor>0))return {error:`Escribe cuánto trae cada ${p.unit}.`};
    let unitPrice=null,cost=null;
    if(entryMode==='purchase'){
      const raw=String(E('entryUnitPrice').value||'').trim();
      if(requireComplete&&raw==='')return {error:`Escribe el precio por ${p.unit}.`};
      if(raw==='')return null;
      unitPrice=Number(raw);
      if(!Number.isFinite(unitPrice)||unitPrice<0)return {error:'Escribe un precio válido.'};
      cost=Number((qty*unitPrice).toFixed(2));
    }
    const internalQty=r3(qty*factor);
    const contentPerUnit=p.custom?Number(E('entryContent').value||0):(p.content??null);
    const contentUnit=p.custom?E('entryContentUnit').value:(p.contentUnit??null);
    const base=internalBaseQtyForCost(entryKey,internalQty);
    const costPerInternal=entryMode==='purchase'&&base.qty>0?Number((cost/base.qty).toFixed(6)):null;
    return {k:entryKey,name:item.name,qty,unit:p.unit,presentationLabel:p.label,internalPerUnit:r3(factor),internalQty,contentPerUnit,contentUnit,unitPrice:entryMode==='purchase'?Number(unitPrice.toFixed(4)):null,cost,costPerInternalUnit:costPerInternal,costPerInternalUnitName:base.unit,costPerOz:(entryMode==='purchase'&&base.unit==='oz')?costPerInternal:null};
  }

  function syncEntryFields(){
    const p=entryPresentation,item=ITEMS?.[entryKey];
    E('entryQtyQuestion').textContent=p?qtyQuestion(p.unit):'Cantidad';
    E('entryQtyUnit').textContent=p?unitLabel(p.unit):'—';
    E('entryQty').step=p?.discrete?'1':'0.01';
    E('entryQty').min=p?.discrete?'1':'0.01';
    const contentWrap=E('entryContentWrap');
    if(p?.custom){
      contentWrap.hidden=false;
      E('entryContentQuestion').textContent=`¿Cuánto trae cada ${p.unit}?`;
      E('entryContentUnit').innerHTML=(p.contentUnits||[item?.unit||'unidad']).map(u=>`<option value="${esc(u)}">${esc(unitLabel(u))}</option>`).join('');
      if(p.prefillUnit)E('entryContentUnit').value=p.prefillUnit;
    }else contentWrap.hidden=true;
    E('entryPriceLabel').textContent=p?priceLabel(p.unit):'Precio';
    E('entryPriceUnit').textContent=p?`por ${unitLabel(p.unit)}`:'—';
    updatePreview();
  }

  function updatePreview(){
    const p=entryPresentation,qty=Number(E('entryQty').value||0),factor=presentationFactor();
    if(!p){E('entryPreview').textContent='Elige una presentación.';return;}
    if(!(factor>0)){E('entryPreview').innerHTML=`Escribe cuánto trae cada <b>${esc(p.unit)}</b>.`;return;}
    const internalQty=r3(Math.max(0,qty)*factor);
    let text=`Entrarán <b>${internalText(entryKey,internalQty)}</b> al inventario.`;
    if(entryMode==='purchase'){
      const raw=String(E('entryUnitPrice').value||'').trim(),price=Number(raw);
      if(raw!==''&&Number.isFinite(price)&&price>=0&&qty>0){
        const total=qty*price,base=internalBaseQtyForCost(entryKey,internalQty),per=base.qty>0?total/base.qty:0;
        text=`<b>${n3(qty)} ${esc(unitLabel(p.unit))} × ${money(price)} = ${money(total)}</b><br>${text}<br>Costo: <b>${money(per)} por ${esc(base.unit)}</b>`;
      }else text+=`<br>Escribe el <b>${esc(priceLabel(p.unit).toLowerCase())}</b> y el sistema calcula el total.`;
    }
    E('entryPreview').innerHTML=text;
  }

  function resetCurrent(){
    entryPresentation=null;
    E('entryQty').value=1;
    E('entryContent').value='';
    E('entryUnitPrice').value='';
    renderPresentations();
    syncEntryFields();
  }
  function renderCart(){
    if(!entryCart.length){E('entryCart').textContent=entryMode==='purchase'?'Si es una sola cosa, llena los datos y guarda.':'Si recibiste una sola cosa, llena los datos y toca Recibir mercancía.';return;}
    const total=entryCart.reduce((s,l)=>s+Number(l.cost||0),0);
    E('entryCart').innerHTML=`<b>YA AGREGADO</b>${entryCart.map((l,i)=>`<div class="movement" style="margin-top:8px"><div><strong>${esc(l.name)}</strong><small>${esc(`${l.qty} ${l.unit}`)}${l.contentPerUnit?` · ${esc(`${l.contentPerUnit} ${l.contentUnit} c/u`)}`:''}<br>Inventario: +${esc(internalText(l.k,l.internalQty))}${entryMode==='purchase'?`<br>${money(l.unitPrice)} por ${esc(l.unit)} · Total ${money(l.cost)} · ${money(l.costPerInternalUnit)} por ${esc(l.costPerInternalUnitName)}`:''}</small></div><button type="button" class="danger" data-remove-entry="${i}" style="border:0;border-radius:10px;padding:8px 10px;font-weight:1000">✕</button></div>`).join('')}${entryMode==='purchase'?`<div style="margin-top:10px"><b>Total de compra: ${money(total)}</b></div>`:''}`;
  }

  function openEntry(mode,key=''){
    entryMode=mode==='receipt'?'receipt':'purchase';
    entryCart=[];
    E('entryItem').innerHTML=itemOptions();
    entryKey=key&&ITEMS?.[key]?key:Object.keys(ITEMS||{})[0];
    E('entryItem').value=entryKey;
    E('entryStore').value='';
    E('entryTitle').textContent=entryMode==='purchase'?'🛒 Registrar compra':'📦 Recibir mercancía';
    E('entryIntro').textContent=entryMode==='purchase'?'Elige la presentación, cantidad y precio. El sistema calcula el total y el costo por unidad.':'Registra únicamente lo que físicamente llegó. No se agrega otro gasto.';
    E('entryPriceWrap').hidden=entryMode!=='purchase';
    E('entryStoreText').textContent=entryMode==='purchase'?'Tienda / proveedor (opcional)':'Proveedor (opcional)';
    E('entryAddLine').textContent=entryMode==='purchase'?'➕ AGREGAR OTRO PRODUCTO':'➕ RECIBIR OTRO PRODUCTO';
    E('entrySave').textContent=entryMode==='purchase'?'Guardar compra':'Recibir mercancía';
    resetCurrent();renderCart();stockModal.hidden=false;
  }

  window.openStock=(key='',need=null)=>openEntry('purchase',key);
  window.openReceiveStock=(key='')=>openEntry('receipt',key);
  E('entryItem').onchange=()=>{entryKey=E('entryItem').value;resetCurrent();};
  E('entryPresentations').onclick=e=>{const b=e.target.closest('[data-presentation]');if(b)selectPresentation(b.dataset.presentation);};
  ['entryQty','entryContent','entryUnitPrice'].forEach(id=>E(id).addEventListener('input',updatePreview));
  E('entryContentUnit').addEventListener('change',updatePreview);
  E('entryCancel').onclick=()=>{stockModal.hidden=true;entryCart=[];};
  E('entryCart').onclick=e=>{const b=e.target.closest('[data-remove-entry]');if(!b)return;entryCart.splice(Number(b.dataset.removeEntry),1);renderCart();};
  E('entryAddLine').onclick=()=>{const line=currentLine(true);if(!line||line.error)return alert(line?.error||'Completa los datos.');entryCart.push(line);renderCart();resetCurrent();toast('Producto agregado');};

  E('entrySave').onclick=async()=>{
    let lines=entryCart.map(x=>({...x}));
    const hasCurrent=entryPresentation||Number(E('entryQty').value||0)!==1||String(E('entryUnitPrice').value||'').trim()!==''||String(E('entryContent').value||'').trim()!=='';
    if(hasCurrent||!lines.length){const line=currentLine(true);if(!line||line.error)return alert(line?.error||'Completa los datos.');lines.push(line);}
    if(!lines.length)return alert('Agrega por lo menos un producto.');
    const store=E('entryStore').value.trim()||(entryMode==='purchase'?'Sin tienda':'Sin proveedor');
    const batchId=`${entryMode}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    const refs=lines.map(()=>db.collection('movimientos').doc()),keys=[...new Set(lines.map(l=>l.k))];
    E('entrySave').disabled=true;
    try{
      await db.runTransaction(async tx=>{
        const snap=await tx.get(inventoryRef),cur={...EMPTY,...(snap.exists?(snap.data().items||{}):{})},stamp=firebase.firestore.FieldValue.serverTimestamp();
        lines.forEach(l=>cur[l.k]=r3(Number(cur[l.k]||0)+Number(l.internalQty||0)));
        tx.set(inventoryRef,{items:cur,tracked:firebase.firestore.FieldValue.arrayUnion(...keys),updatedAt:stamp},{merge:true});
        lines.forEach((l,i)=>{
          const data={type:entryMode==='purchase'?'purchase':'receipt',date:stamp,day:localDay(),name:l.name,itemKey:l.k,qty:l.qty,unit:l.unit,presentationLabel:l.presentationLabel,contentPerUnit:l.contentPerUnit,contentUnit:l.contentUnit,internalPerUnit:l.internalPerUnit,internalQty:l.internalQty,internalUnit:ITEMS[l.k]?.unit||'',store,batchId};
          if(entryMode==='purchase'){data.unitPrice=l.unitPrice;data.cost=l.cost;data.costPerInternalUnit=l.costPerInternalUnit;data.costPerInternalUnitName=l.costPerInternalUnitName;if(l.costPerOz!=null)data.costPerOz=l.costPerOz;data.purchaseId=batchId;}else data.receiptId=batchId;
          tx.set(refs[i],data);
        });
      });
      const total=lines.reduce((s,l)=>s+Number(l.cost||0),0);
      stockModal.hidden=true;entryCart=[];toast(entryMode==='purchase'?`Compra guardada · ${money(total)}`:'Mercancía recibida e inventario actualizado');
    }catch(e){console.error(e);alert(e.message||'No se pudo guardar.');}finally{E('entrySave').disabled=false;}
  };

  E('purchaseRegister').onclick=()=>openEntry('purchase');
  E('purchaseReceive').onclick=()=>openEntry('receipt');

  const dateText=m=>{const d=typeof timestampDate==='function'?timestampDate(m?.date):null;return d?d.toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'}):'';};
  const movementPresentation=m=>{const q=Number(m?.qty||0),u=String(m?.unit||'unidad'),c=Number(m?.contentPerUnit),cu=String(m?.contentUnit||'');return Number.isFinite(c)&&c>0&&cu?`${q} ${u} · ${n3(c)} ${cu} c/u`:`${q} ${u}`;};

  renderHistory=function(){
    if(!(movements||[]).length){E('historyList').innerHTML='<div class="empty">Todavía no hay movimientos.</div>';return;}
    E('historyList').innerHTML=(movements||[]).map(m=>{
      const label=dateText(m),id=esc(m.id||'');
      if(m.type==='sale')return `<div class="movement" data-movement-id="${id}"><div><strong>Venta entregada · ${esc(m.name||'Pedido')}</strong><small>${esc(label)}<br>Costo ${m.cost==null?'Pendiente':money(m.cost)} · Utilidad ${m.profit==null?'Pendiente':money(m.profit)}</small></div><div class="money">${money(m.total)}</div></div>`;
      if(m.type==='purchase')return `<div class="movement" data-movement-id="${id}"><div><strong>🛒 Compra · ${esc(m.name||'')}</strong><small>${esc(movementPresentation(m))} · ${money(m.unitPrice)} por ${esc(m.unit||'unidad')} · ${esc(m.store||'')} · ${esc(label)}</small></div><div class="money">-${money(m.cost)}</div></div>`;
      if(m.type==='receipt')return `<div class="movement" data-movement-id="${id}"><div><strong>📦 Mercancía recibida · ${esc(m.name||'')}</strong><small>${esc(movementPresentation(m))} · ${esc(m.store||'')} · ${esc(label)}</small></div><div class="money">RECIBIDO</div></div>`;
      if(m.type==='adjustment')return `<div class="movement" data-movement-id="${id}"><div><strong>Ajuste inventario · ${esc(m.name||'')}</strong><small>${esc(`${m.beforeQty??0} ${m.unit||''} → ${m.afterQty??0} ${m.unit||''}`)} · ${esc(label)}</small></div><div class="money">AJUSTE</div></div>`;
      if(m.type==='prep')return `<div class="movement" data-movement-id="${id}"><div><strong>Preparación · ${esc(m.name||'')}</strong><small>${esc(`${m.qty??0} ${m.unit||''}`)} · ${esc(label)}</small></div><div class="money">USADO</div></div>`;
      return `<div class="movement" data-movement-id="${id}"><div><strong>${esc(m.name||'Movimiento')}</strong><small>${esc(label)}</small></div><div class="money">—</div></div>`;
    }).join('');
  };

  const detail=document.createElement('div');
  detail.className='modal';detail.id='purchaseMovementModal';detail.hidden=true;
  detail.innerHTML=`<section class="sheet"><h2 id="pmTitle">Detalle</h2><p id="pmIntro"></p><div id="pmBody"></div><div id="pmEdit" hidden></div><div class="modal-actions" id="pmViewActions"><button class="secondary" id="pmClose">Cerrar</button><button class="warning-btn" id="pmEditBtn">✏️ Editar</button></div><div class="modal-actions" id="pmDeleteActions"><button class="danger" id="pmDelete">🗑️ Borrar registro</button><span></span></div><div class="modal-actions" id="pmEditActions" hidden><button class="secondary" id="pmEditCancel">Cancelar</button><button class="primary" id="pmEditSave">Guardar cambios</button></div></section>`;
  document.body.appendChild(detail);
  let activeMovementId='';
  const internalFactor=m=>{const f=Number(m?.internalPerUnit);if(f>0)return f;const q=Number(m?.qty||0),iq=Number(m?.internalQty);if(q>0&&Number.isFinite(iq))return iq/q;return Number(ITEMS?.[m?.itemKey]?.factor||1);};
  const internalAmount=m=>{const iq=Number(m?.internalQty);return Number.isFinite(iq)?iq:r3(Number(m?.qty||0)*internalFactor(m));};
  const movementUnitPrice=m=>{const p=Number(m?.unitPrice);if(Number.isFinite(p))return p;const q=Number(m?.qty||0),c=Number(m?.cost||0);return q>0?c/q:0;};

  function openMovement(m){
    activeMovementId=m.id;
    E('pmTitle').textContent=m.type==='purchase'?'🛒 Compra':'📦 Mercancía recibida';E('pmIntro').textContent=m.name||'Registro';
    E('pmBody').hidden=false;E('pmEdit').hidden=true;E('pmViewActions').hidden=false;E('pmDeleteActions').hidden=false;E('pmEditActions').hidden=true;
    const internal=internalAmount(m),base=internalBaseQtyForCost(m.itemKey,internal),per=base.qty>0?Number(m.cost||0)/base.qty:0;
    E('pmBody').innerHTML=`<div class="movement-detail-grid"><div class="movement-detail-box full"><small>Producto</small><b>${esc(m.name||'')}</b></div><div class="movement-detail-box"><small>Cantidad / presentación</small><b>${esc(movementPresentation(m))}</b></div><div class="movement-detail-box"><small>Entró al inventario</small><b>${esc(internalText(m.itemKey,internal))}</b></div>${m.type==='purchase'?`<div class="movement-detail-box"><small>Precio por ${esc(m.unit||'unidad')}</small><b>${money(movementUnitPrice(m))}</b></div><div class="movement-detail-box"><small>Total de compra</small><b>${money(m.cost)}</b></div><div class="movement-detail-box"><small>Costo por ${esc(base.unit)}</small><b>${money(per)}</b></div>`:''}<div class="movement-detail-box"><small>${m.type==='purchase'?'Tienda / proveedor':'Proveedor'}</small><b>${esc(m.store||'Sin dato')}</b></div><div class="movement-detail-box full"><small>Fecha</small><b>${esc(dateText(m))}</b></div></div>`;
    detail.hidden=false;
  }

  function showMovementEdit(){
    const m=movementById(activeMovementId);if(!m||!['purchase','receipt'].includes(m.type))return;
    E('pmBody').hidden=true;E('pmViewActions').hidden=true;E('pmDeleteActions').hidden=true;E('pmEdit').hidden=false;E('pmEditActions').hidden=false;
    E('pmEdit').innerHTML=`<div class="grid"><label class="full">Producto<input value="${esc(m.name||'')}" readonly></label><label>Cantidad<input id="pmQty" type="number" min="0.01" step="${/^(bolsa|caja|botella|envase|paquete|pieza|manojo)$/i.test(String(m.unit||''))?'1':'0.01'}" value="${Number(m.qty||0)}"></label><label>Presentación<input value="${esc(m.unit||'unidad')}" readonly></label>${m.type==='purchase'?`<label class="full">Precio por ${esc(m.unit||'unidad')}<input id="pmUnitPrice" type="number" min="0" step="0.01" value="${movementUnitPrice(m).toFixed(2)}"></label>`:''}<label class="full">${m.type==='purchase'?'Tienda / proveedor':'Proveedor'}<input id="pmStore" value="${esc(m.store||'')}"></label></div><div class="summary-box" id="pmPreview"></div>`;
    const refresh=()=>{const q=Number(E('pmQty').value||0),amount=r3(q*internalFactor(m));let text=`Con esa cantidad quedarán <b>${esc(internalText(m.itemKey,amount))}</b> registrados por este movimiento.`;if(m.type==='purchase'){const price=Number(E('pmUnitPrice').value||0),total=q*price,base=internalBaseQtyForCost(m.itemKey,amount),per=base.qty>0?total/base.qty:0;text+=`<br>${n3(q)} ${esc(m.unit||'unidad')} × ${money(price)} = <b>${money(total)}</b><br>Costo: <b>${money(per)} por ${esc(base.unit)}</b>`;}E('pmPreview').innerHTML=text;};
    E('pmQty').addEventListener('input',refresh);E('pmUnitPrice')?.addEventListener('input',refresh);refresh();
  }

  async function saveMovementEdit(){
    const m=movementById(activeMovementId);if(!m||!['purchase','receipt'].includes(m.type)||!m.itemKey)return;
    const qty=Number(E('pmQty').value||0),discrete=/^(bolsa|caja|botella|envase|paquete|pieza|manojo)$/i.test(String(m.unit||''));
    if(!(qty>0)||discrete&&!Number.isInteger(qty))return alert('Escribe una cantidad válida.');
    const factor=internalFactor(m),newInternal=r3(qty*factor),store=E('pmStore').value.trim()||(m.type==='purchase'?'Sin tienda':'Sin proveedor');
    let unitPrice=null,cost=null,costPerInternalUnit=null,costPerInternalUnitName=null,costPerOz=null;
    if(m.type==='purchase'){unitPrice=Number(E('pmUnitPrice').value||0);if(!Number.isFinite(unitPrice)||unitPrice<0)return alert('Escribe un precio válido.');cost=Number((qty*unitPrice).toFixed(2));const base=internalBaseQtyForCost(m.itemKey,newInternal);costPerInternalUnit=base.qty>0?Number((cost/base.qty).toFixed(6)):0;costPerInternalUnitName=base.unit;if(base.unit==='oz')costPerOz=costPerInternalUnit;}
    const ref=db.collection('movimientos').doc(m.id);E('pmEditSave').disabled=true;
    try{
      await db.runTransaction(async tx=>{const ms=await tx.get(ref),is=await tx.get(inventoryRef);if(!ms.exists)throw new Error('El registro ya no existe.');const live=ms.data(),key=live.itemKey,cur={...EMPTY,...(is.exists?(is.data().items||{}):{})},before=internalAmount(live),after=r3(Number(cur[key]||0)+(newInternal-before));if(after<-.0001)throw new Error('No se puede reducir tanto porque parte de ese inventario ya se usó.');cur[key]=Math.max(0,after);tx.set(inventoryRef,{items:cur,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});const upd={qty,internalQty:newInternal,internalPerUnit:factor,store,editedAt:firebase.firestore.FieldValue.serverTimestamp()};if(live.type==='purchase'){upd.unitPrice=Number(unitPrice.toFixed(4));upd.cost=cost;upd.costPerInternalUnit=costPerInternalUnit;upd.costPerInternalUnitName=costPerInternalUnitName;if(costPerOz!=null)upd.costPerOz=costPerOz;}tx.update(ref,upd);});
      detail.hidden=true;toast('Registro corregido e inventario actualizado');
    }catch(e){console.error(e);alert(e.message||'No se pudo corregir.');}finally{E('pmEditSave').disabled=false;}
  }

  async function deleteMovement(){
    const m=movementById(activeMovementId);if(!m||!['purchase','receipt'].includes(m.type)||!m.itemKey)return;
    if(!confirm(`¿Borrar este registro de ${m.name||'producto'}?\n\nTambién se restará del inventario lo que agregó.`))return;
    const ref=db.collection('movimientos').doc(m.id);E('pmDelete').disabled=true;
    try{
      await db.runTransaction(async tx=>{const ms=await tx.get(ref),is=await tx.get(inventoryRef);if(!ms.exists)return;const live=ms.data(),key=live.itemKey,cur={...EMPTY,...(is.exists?(is.data().items||{}):{})},after=r3(Number(cur[key]||0)-internalAmount(live));if(after<-.0001)throw new Error('No se puede borrar porque parte de ese inventario ya se usó.');cur[key]=Math.max(0,after);tx.set(inventoryRef,{items:cur,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});tx.delete(ref);});
      detail.hidden=true;toast('Registro borrado e inventario corregido');
    }catch(e){console.error(e);alert(e.message||'No se pudo borrar.');}finally{E('pmDelete').disabled=false;}
  }

  document.addEventListener('click',e=>{const row=e.target.closest?.('#historyList .movement[data-movement-id]');if(!row)return;const m=movementById(row.dataset.movementId);if(!m||!['purchase','receipt'].includes(m.type))return;e.preventDefault();e.stopImmediatePropagation();openMovement(m);},true);
  document.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const row=e.target.closest?.('#historyList .movement[data-movement-id]');if(!row)return;const m=movementById(row.dataset.movementId);if(!m||!['purchase','receipt'].includes(m.type))return;e.preventDefault();e.stopImmediatePropagation();openMovement(m);},true);
  E('pmClose').onclick=()=>detail.hidden=true;E('pmEditBtn').onclick=showMovementEdit;E('pmDelete').onclick=deleteMovement;E('pmEditCancel').onclick=()=>{const m=movementById(activeMovementId);if(m)openMovement(m);};E('pmEditSave').onclick=saveMovementEdit;detail.addEventListener('click',e=>{if(e.target===detail)detail.hidden=true;});

  if(typeof renderAll==='function')renderAll();
})();