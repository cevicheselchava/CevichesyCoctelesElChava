(()=>{
  if(window.__EL_CUBANO_PURCHASES_SIMPLE__)return;
  window.__EL_CUBANO_PURCHASES_SIMPLE__=true;

  const r3=n=>Math.round((Number(n)+Number.EPSILON)*1000)/1000;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const n3=n=>Number(r3(n).toFixed(3));
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
    .movement-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}
    .movement-detail-box{border:1px solid #ded7c8;border-radius:12px;padding:11px;background:#fff}
    .movement-detail-box.full{grid-column:1/-1}
    .movement-detail-box small{display:block;color:#687386;font-weight:900;margin-bottom:4px}
    .movement-detail-box b{color:#174f2b;font-size:17px}
    @media(max-width:560px){.presentation-grid,.movement-detail-grid{grid-template-columns:1fr}.movement-detail-box.full{grid-column:1}}
  `;
  document.head.appendChild(style);

  // COMPRAS como apartado principal.
  const nav=document.getElementById('mainNav');
  const ordersNav=nav?.querySelector('[data-tab="orders"]');
  let purchasesNav=nav?.querySelector('[data-tab="purchases"]');
  if(!purchasesNav&&ordersNav){
    purchasesNav=document.createElement('button');
    purchasesNav.dataset.tab='purchases';
    purchasesNav.innerHTML='<span class="nav-icon">🛒</span><span class="nav-label">Compras</span>';
    ordersNav.insertAdjacentElement('afterend',purchasesNav);
  }

  let purchasesPanel=document.getElementById('purchases');
  if(!purchasesPanel){
    purchasesPanel=document.createElement('section');
    purchasesPanel.className='panel';
    purchasesPanel.id='purchases';
    purchasesPanel.innerHTML=`<div class="card"><h2>Compras</h2>
      <div class="notice">Elige lo que estás haciendo. El sistema hace las conversiones y mueve el inventario.</div>
      <div class="purchase-home-actions">
        <button class="purchase-home-choice" id="purchaseRegister"><span class="ico">🛒</span><span><b>Registrar compra</b><small>Cuando compras y te llevas el producto. Registra el gasto y lo suma al inventario.</small></span></button>
        <button class="purchase-home-choice" id="purchaseReceive"><span class="ico">📦</span><span><b>Recibir mercancía</b><small>Cuando el proveedor solamente entrega producto. Suma inventario sin registrar otro gasto.</small></span></button>
      </div></div>`;
    document.getElementById('orders')?.insertAdjacentElement('afterend',purchasesPanel);
  }
  purchasesNav?.addEventListener('click',()=>activateTab('purchases'));

  // INVENTARIO: ya no registra compras. La tarjeta corrige la existencia real.
  const oldInventoryPurchase=document.getElementById('inventoryPurchaseBtn');
  if(oldInventoryPurchase)oldInventoryPurchase.remove();
  const inventoryAdjust=document.getElementById('inventoryAdjustBtn');
  if(inventoryAdjust){
    inventoryAdjust.textContent='✏️ CORREGIR CANTIDAD REAL';
    const top=inventoryAdjust.closest('.top-actions');
    if(top)top.style.gridTemplateColumns='1fr';
  }
  window.openAdjustInventoryForKey=function(key){
    if(typeof openAdjustInventory!=='function')return;
    openAdjustInventory();
    const select=document.getElementById('adjustItem');
    if(select&&ITEMS?.[key]){
      select.value=key;
      if(typeof refreshAdjustFields==='function')refreshAdjustFields();
    }
  };

  // RECETAS: informa lo que falta, pero la compra se hace en COMPRAS.
  const recipeCard=document.getElementById('recipeType')?.closest('.card');
  if(recipeCard){
    const h=recipeCard.querySelector('h2');
    const notice=recipeCard.querySelector('.notice');
    if(h)h.textContent='Recetas';
    if(notice)notice.textContent='Elige una receta y la cantidad para ver exactamente lo que necesitas y lo que te falta.';
  }
  if(typeof recipeRow==='function'){
    recipeRow=function(key,need){
      const item=ITEMS?.[key];
      if(!item)return '';
      const have=available(key),lack=Math.max(0,r3(Number(need||0)-Number(have||0)));
      const qty=(typeof recipeQty==='function')?recipeQty:null;
      const show=(value)=>{
        if(item.unit==='lb')return `${n3(Number(value||0)*16)} oz`;
        if(item.unit==='oz')return `${n3(value)} oz`;
        if(item.unit==='fl oz')return `${n3(value)} fl oz`;
        if(item.unit==='pzas')return `${n3(value)} pzas`;
        return typeof displayQty==='function'?displayQty(key,value):`${n3(value)} ${item.unit||''}`;
      };
      return `<div class="recipe-row"><div><strong>${item.name}</strong><small>Necesitas ${show(need)} · Disponible ${show(have)}</small></div>${lack>0?`<span class="recipe-missing">Falta ${show(lack)}</span>`:'<span class="recipe-enough">✓ Hay</span>'}</div>`;
    };
    if(typeof renderRecipe==='function')renderRecipe();
  }

  // PRESENTACIONES. Nada queda forzado: el empleado elige cómo llegó/compró el producto.
  const unitLabel=u=>({lb:'lb',oz:'oz','fl oz':'fl oz',pzas:'pzas',paquete:'paquete',pieza:'pieza',bolsa:'bolsa',caja:'caja',botella:'botella',envase:'envase',manojo:'manojo'}[u]||u||'unidad');
  const cap=s=>String(s||'').charAt(0).toUpperCase()+String(s||'').slice(1);

  function conversionToInternal(item,contentUnit){
    const iu=String(item?.unit||'');
    const cu=String(contentUnit||'');
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
    const seen=new Set();
    const add=(c)=>{
      const sig=`${c.unit}|${c.factor??'custom'}|${c.content??''}|${c.contentUnit??''}`;
      if(seen.has(sig))return;
      seen.add(sig);out.push(c);
    };

    if(iu==='lb'){
      add({id:'lb',label:'Por lb',unit:'lb',factor:1});
      add({id:'oz',label:'Por oz',unit:'oz',factor:1/16});
      if(key==='shrimp')add({id:'shrimp12',label:'Bolsa 12 oz',unit:'bolsa',factor:.75,content:12,contentUnit:'oz',discrete:true});
      add({id:'bag',label:'Otra bolsa',unit:'bolsa',custom:true,contentUnits:['oz','lb'],discrete:true});
      add({id:'box',label:'Caja',unit:'caja',custom:true,contentUnits:['lb','oz'],discrete:true});
    }else if(iu==='oz'){
      add({id:'oz',label:'Por oz',unit:'oz',factor:1});
      add({id:'lb',label:'Por lb',unit:'lb',factor:16});
      const pu=String(item.purchaseUnit||'');
      const f=Number(item.factor||0);
      if(pu&&pu!=='oz'&&pu!=='lb'&&f>0)add({id:'usual',label:`${cap(pu)} habitual`,unit:pu,factor:f,content:f,contentUnit:'oz',discrete:true});
      add({id:'bag',label:'Bolsa',unit:'bolsa',custom:true,contentUnits:['oz','lb'],discrete:true});
      add({id:'box',label:'Caja',unit:'caja',custom:true,contentUnits:['lb','oz'],discrete:true});
    }else if(iu==='fl oz'){
      add({id:'floz',label:'Por fl oz',unit:'fl oz',factor:1});
      const pu=String(item.purchaseUnit||'');
      const f=Number(item.factor||0);
      if(pu&&pu!=='fl oz'&&f>1)add({id:'usual',label:`${cap(pu)} habitual · ${n3(f)} fl oz`,unit:pu,factor:f,content:f,contentUnit:'fl oz',discrete:true});
      add({id:'bottle',label:'Otra botella',unit:'botella',custom:true,contentUnits:['fl oz'],discrete:true});
      add({id:'container',label:'Otro envase',unit:'envase',custom:true,contentUnits:['fl oz'],discrete:true});
    }else if(iu==='pzas'){
      add({id:'piece',label:'Por pieza',unit:'pieza',factor:1,discrete:true});
      const pu=String(item.purchaseUnit||'');
      const f=Number(item.factor||0);
      if(pu&& !/^(pzas|pieza)$/i.test(pu) && f>1)add({id:'usual',label:`${cap(pu)} habitual · ${n3(f)} pzas`,unit:pu,factor:f,content:f,contentUnit:'pzas',discrete:true});
      add({id:'pack',label:'Paquete',unit:'paquete',custom:true,contentUnits:['pzas'],discrete:true});
      add({id:'box',label:'Caja',unit:'caja',custom:true,contentUnits:['pzas'],discrete:true});
    }else{
      const pu=String(item.purchaseUnit||iu||'unidad'),f=Math.max(.001,Number(item.factor||1));
      add({id:'usual',label:cap(pu),unit:pu,factor:f,discrete:/paquete|caja|bolsa|pieza/.test(pu)});
      add({id:'other',label:'Otra presentación',unit:'unidad',custom:true,contentUnits:[iu||'unidad'],discrete:true});
    }
    return out;
  }

  let entryMode='purchase',entryKey='',entryPresentation=null,entryCart=[];
  const stockModal=document.getElementById('stockModal');
  stockModal.innerHTML=`<section class="sheet">
    <h2 id="entryTitle">🛒 Registrar compra</h2>
    <p id="entryIntro"></p>
    <div class="grid">
      <label class="full">Producto<select id="entryItem"></select></label>
      <div class="full"><label style="margin-bottom:7px">¿Cómo lo compraste / recibiste?</label><div class="presentation-grid" id="entryPresentations"></div></div>
      <label class="full" id="entryQtyLabel"><span id="entryQtyQuestion">Cantidad</span><div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center"><input id="entryQty" type="number" min="0.01" step="0.01" value="1"><strong id="entryQtyUnit" style="padding:12px 14px;border-radius:13px;background:#eef3f8;color:#123458;white-space:nowrap">—</strong></div></label>
      <label class="full" id="entryContentWrap" hidden><span id="entryContentQuestion">¿Cuánto trae cada unidad?</span><div style="display:grid;grid-template-columns:1fr 110px;gap:8px"><input id="entryContent" type="number" min="0.01" step="0.01"><select id="entryContentUnit"></select></div></label>
      <label class="full" id="entryCostWrap"><span>¿Cuánto pagaste en total por este producto?</span><input id="entryCost" type="number" min="0" step="0.01" placeholder="$0.00"></label>
      <div class="summary-box full" id="entryPreview">Elige cómo viene el producto.</div>
      <label class="full"><span id="entryStoreText">Tienda / proveedor (opcional)</span><input id="entryStore" placeholder="H-E-B, proveedor…"></label>
    </div>
    <button class="secondary" id="entryAddLine" style="width:100%;border-radius:12px;padding:13px;font-weight:1000;margin-top:10px">➕ AGREGAR OTRO PRODUCTO</button>
    <div class="summary-box" id="entryCart">Si es una sola cosa, llena los datos y guarda.</div>
    <div class="modal-actions"><button class="secondary" id="entryCancel">Cancelar</button><button class="primary" id="entrySave">Guardar</button></div>
  </section>`;

  const E=id=>document.getElementById(id);
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
    return '¿Cuánto?';
  }

  function internalText(key,value){
    const item=ITEMS?.[key],v=n3(value),u=String(item?.unit||'');
    if(u==='lb')return `${n3(Number(value||0)*16)} oz (${v} lb)`;
    return `${v} ${unitLabel(u)}`;
  }

  function renderPresentations(){
    const choices=choicesFor(entryKey);
    E('entryPresentations').innerHTML=choices.map(c=>`<button type="button" class="presentation-btn ${entryPresentation?.id===c.id?'active':''}" data-presentation="${esc(c.id)}">${esc(c.label)}</button>`).join('');
  }

  function selectPresentation(id){
    entryPresentation=choicesFor(entryKey).find(c=>c.id===id)||null;
    E('entryContent').value='';
    renderPresentations();
    syncEntryFields();
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
    if(!p)return {error:'Elige cómo viene el producto.'};
    if(!(qty>0))return {error:'Escribe una cantidad válida.'};
    if(p.discrete&&!Number.isInteger(qty))return {error:`Escribe ${qtyQuestion(p.unit).replace('¿','').replace('?','').toLowerCase()} completas.`};
    const factor=presentationFactor();
    if(!(factor>0))return {error:`Escribe cuánto trae cada ${p.unit}.`};
    let cost=null;
    if(entryMode==='purchase'){
      const raw=String(E('entryCost').value||'').trim();
      if(requireComplete&&raw==='')return {error:'Escribe cuánto pagaste en total.'};
      if(raw==='')return null;
      cost=Number(raw);
      if(!Number.isFinite(cost)||cost<0)return {error:'Escribe un total válido.'};
    }
    const internalQty=r3(qty*factor);
    const contentPerUnit=p.custom?Number(E('entryContent').value||0):(p.content??null);
    const contentUnit=p.custom?E('entryContentUnit').value:(p.contentUnit??null);
    return {k:entryKey,name:item.name,qty,unit:p.unit,internalPerUnit:r3(factor),internalQty,contentPerUnit,contentUnit,cost,unitPrice:entryMode==='purchase'&&qty>0?Number((cost/qty).toFixed(4)):null,presentationLabel:p.label};
  }

  function syncEntryFields(){
    const p=entryPresentation,item=ITEMS?.[entryKey];
    E('entryQtyQuestion').textContent=p?qtyQuestion(p.unit):'Cantidad';
    E('entryQtyUnit').textContent=p?unitLabel(p.unit):'—';
    E('entryQty').step=p?.discrete?'1':'0.01';
    E('entryQty').min=p?.discrete?'1':'0.01';
    const wrap=E('entryContentWrap');
    if(p?.custom){
      wrap.hidden=false;
      E('entryContentQuestion').textContent=`¿Cuánto trae cada ${p.unit}?`;
      E('entryContentUnit').innerHTML=(p.contentUnits||[item?.unit||'unidad']).map(u=>`<option value="${esc(u)}">${esc(unitLabel(u))}</option>`).join('');
    }else wrap.hidden=true;
    updatePreview();
  }

  function updatePreview(){
    const p=entryPresentation,qty=Number(E('entryQty').value||0),factor=presentationFactor();
    if(!p){E('entryPreview').textContent='Elige cómo viene el producto.';return;}
    if(!(factor>0)){E('entryPreview').innerHTML=`Escribe cuánto trae cada <b>${esc(p.unit)}</b>.`;return;}
    const total=r3(Math.max(0,qty)*factor);
    let text=`Entrarán <b>${internalText(entryKey,total)}</b> al inventario.`;
    if(p.content!=null)text=`Cada <b>${esc(p.unit)}</b> trae <b>${n3(p.content)} ${esc(p.contentUnit)}</b>.<br>${text}`;
    if(entryMode==='purchase'&&String(E('entryCost').value||'').trim()!=='')text+=`<br>Total pagado: <b>${money(Number(E('entryCost').value||0))}</b>`;
    E('entryPreview').innerHTML=text;
  }

  function resetCurrent(){
    entryPresentation=null;
    E('entryQty').value=1;
    E('entryContent').value='';
    E('entryCost').value='';
    renderPresentations();
    syncEntryFields();
  }

  function renderCart(){
    if(!entryCart.length){E('entryCart').textContent=entryMode==='purchase'?'Si es una sola cosa, llena los datos y guarda.':'Si recibiste una sola cosa, llena los datos y toca Recibir mercancía.';return;}
    const total=entryCart.reduce((s,l)=>s+Number(l.cost||0),0);
    E('entryCart').innerHTML=`<b>YA AGREGADO</b>${entryCart.map((l,i)=>`<div class="movement" style="margin-top:8px"><div><strong>${esc(l.name)}</strong><small>${esc(`${l.qty} ${l.unit}`)}${l.contentPerUnit?` · ${esc(`${l.contentPerUnit} ${l.contentUnit} c/u`)}`:''}<br>Inventario: +${esc(internalText(l.k,l.internalQty))}${entryMode==='purchase'?` · ${money(l.cost)}`:''}</small></div><button type="button" class="danger" data-remove-entry="${i}" style="border:0;border-radius:10px;padding:8px 10px;font-weight:1000">✕</button></div>`).join('')}${entryMode==='purchase'?`<div style="margin-top:10px"><b>Total agregado: ${money(total)}</b></div>`:''}`;
  }

  function openEntry(mode,key=''){
    entryMode=mode==='receipt'?'receipt':'purchase';
    entryCart=[];
    E('entryItem').innerHTML=itemOptions();
    entryKey=key&&ITEMS?.[key]?key:Object.keys(ITEMS||{})[0];
    E('entryItem').value=entryKey;
    E('entryStore').value='';
    E('entryTitle').textContent=entryMode==='purchase'?'🛒 Registrar compra':'📦 Recibir mercancía';
    E('entryIntro').textContent=entryMode==='purchase'?'Registra lo que compraste. El gasto y el inventario se guardan juntos.':'Registra únicamente lo que físicamente llegó. No se agrega otro gasto.';
    E('entryCostWrap').hidden=entryMode!=='purchase';
    E('entryStoreText').textContent=entryMode==='purchase'?'Tienda / proveedor (opcional)':'Proveedor (opcional)';
    E('entryAddLine').textContent=entryMode==='purchase'?'➕ AGREGAR OTRO PRODUCTO':'➕ RECIBIR OTRO PRODUCTO';
    E('entrySave').textContent=entryMode==='purchase'?'Guardar compra':'Recibir mercancía';
    resetCurrent();renderCart();
    stockModal.hidden=false;
  }

  window.openStock=(key='',need=null)=>openEntry('purchase',key);
  window.openReceiveStock=(key='')=>openEntry('receipt',key);
  E('entryItem').onchange=()=>{entryKey=E('entryItem').value;resetCurrent();};
  E('entryPresentations').onclick=e=>{const b=e.target.closest('[data-presentation]');if(b)selectPresentation(b.dataset.presentation);};
  ['entryQty','entryContent','entryContentUnit','entryCost'].forEach(id=>E(id).addEventListener('input',updatePreview));
  E('entryContentUnit').addEventListener('change',updatePreview);
  E('entryCancel').onclick=()=>{stockModal.hidden=true;entryCart=[];};
  E('entryCart').onclick=e=>{const b=e.target.closest('[data-remove-entry]');if(!b)return;entryCart.splice(Number(b.dataset.removeEntry),1);renderCart();};
  E('entryAddLine').onclick=()=>{
    const line=currentLine(true);
    if(!line||line.error)return alert(line?.error||'Completa los datos.');
    entryCart.push(line);renderCart();resetCurrent();toast('Producto agregado');
  };

  E('entrySave').onclick=async()=>{
    let lines=entryCart.map(x=>({...x}));
    const hasCurrent=entryPresentation||Number(E('entryQty').value||0)!==1||String(E('entryCost').value||'').trim()!==''||String(E('entryContent').value||'').trim()!=='';
    if(hasCurrent||!lines.length){
      const line=currentLine(true);
      if(!line||line.error)return alert(line?.error||'Completa los datos.');
      lines.push(line);
    }
    if(!lines.length)return alert('Agrega por lo menos un producto.');
    const store=E('entryStore').value.trim()||(entryMode==='purchase'?'Sin tienda':'Sin proveedor');
    const batchId=`${entryMode}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    const refs=lines.map(()=>db.collection('movimientos').doc());
    const keys=[...new Set(lines.map(l=>l.k))];
    E('entrySave').disabled=true;
    try{
      await db.runTransaction(async tx=>{
        const snap=await tx.get(inventoryRef),cur={...EMPTY,...(snap.exists?(snap.data().items||{}):{})},stamp=firebase.firestore.FieldValue.serverTimestamp();
        lines.forEach(l=>cur[l.k]=r3(Number(cur[l.k]||0)+Number(l.internalQty||0)));
        tx.set(inventoryRef,{items:cur,tracked:firebase.firestore.FieldValue.arrayUnion(...keys),updatedAt:stamp},{merge:true});
        lines.forEach((l,i)=>{
          const data={type:entryMode==='purchase'?'purchase':'receipt',date:stamp,day:localDay(),name:l.name,itemKey:l.k,qty:l.qty,unit:l.unit,presentationLabel:l.presentationLabel,contentPerUnit:l.contentPerUnit,contentUnit:l.contentUnit,internalPerUnit:l.internalPerUnit,internalQty:l.internalQty,internalUnit:ITEMS[l.k]?.unit||'',store,batchId};
          if(entryMode==='purchase'){data.cost=l.cost;data.unitPrice=l.unitPrice;data.purchaseId=batchId;}else data.receiptId=batchId;
          tx.set(refs[i],data);
        });
      });
      const total=lines.reduce((s,l)=>s+Number(l.cost||0),0);
      stockModal.hidden=true;entryCart=[];
      toast(entryMode==='purchase'?`Compra guardada · ${money(total)}`:'Mercancía recibida e inventario actualizado');
    }catch(e){console.error(e);alert(e.message||'No se pudo guardar.');}finally{E('entrySave').disabled=false;}
  };

  document.getElementById('purchaseRegister').onclick=()=>openEntry('purchase');
  document.getElementById('purchaseReceive').onclick=()=>openEntry('receipt');

  // HISTORIAL: mostrar claramente compras y mercancía recibida.
  const dateText=m=>{const d=typeof timestampDate==='function'?timestampDate(m?.date):null;return d?d.toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'}):'';};
  const movementPresentation=m=>{
    const q=Number(m?.qty||0),u=String(m?.unit||'unidad'),c=Number(m?.contentPerUnit),cu=String(m?.contentUnit||'');
    return Number.isFinite(c)&&c>0&&cu?`${q} ${u} · ${n3(c)} ${cu} c/u`:`${q} ${u}`;
  };

  renderHistory=function(){
    if(!(movements||[]).length){E('historyList').innerHTML='<div class="empty">Todavía no hay movimientos.</div>';return;}
    E('historyList').innerHTML=(movements||[]).map(m=>{
      const label=dateText(m),id=esc(m.id||'');
      if(m.type==='sale')return `<div class="movement" data-movement-id="${id}"><div><strong>Venta entregada · ${esc(m.name||'Pedido')}</strong><small>${esc(label)}<br>Costo ${m.cost==null?'Pendiente':money(m.cost)} · Utilidad ${m.profit==null?'Pendiente':money(m.profit)}</small></div><div class="money">${money(m.total)}</div></div>`;
      if(m.type==='purchase')return `<div class="movement" data-movement-id="${id}"><div><strong>🛒 Compra · ${esc(m.name||'')}</strong><small>${esc(movementPresentation(m))} · ${esc(m.store||'')} · ${esc(label)}</small></div><div class="money">-${money(m.cost)}</div></div>`;
      if(m.type==='receipt')return `<div class="movement" data-movement-id="${id}"><div><strong>📦 Mercancía recibida · ${esc(m.name||'')}</strong><small>${esc(movementPresentation(m))} · ${esc(m.store||'')} · ${esc(label)}</small></div><div class="money">RECIBIDO</div></div>`;
      if(m.type==='adjustment')return `<div class="movement" data-movement-id="${id}"><div><strong>Ajuste inventario · ${esc(m.name||'')}</strong><small>${esc(`${m.beforeQty??0} ${m.unit||''} → ${m.afterQty??0} ${m.unit||''}`)} · ${esc(label)}</small></div><div class="money">AJUSTE</div></div>`;
      if(m.type==='prep')return `<div class="movement" data-movement-id="${id}"><div><strong>Preparación · ${esc(m.name||'')}</strong><small>${esc(`${m.qty??0} ${m.unit||''}`)} · ${esc(label)}</small></div><div class="money">USADO</div></div>`;
      return `<div class="movement" data-movement-id="${id}"><div><strong>${esc(m.name||'Movimiento')}</strong><small>${esc(label)}</small></div><div class="money">—</div></div>`;
    }).join('');
  };

  // Detalle/edición robustos para Compras y Mercancía recibida.
  const detail=document.createElement('div');
  detail.className='modal';detail.id='purchaseMovementModal';detail.hidden=true;
  detail.innerHTML=`<section class="sheet"><h2 id="pmTitle">Detalle</h2><p id="pmIntro"></p><div id="pmBody"></div><div id="pmEdit" hidden></div><div class="modal-actions" id="pmViewActions"><button class="secondary" id="pmClose">Cerrar</button><button class="warning-btn" id="pmEditBtn">✏️ Editar</button></div><div class="modal-actions" id="pmDeleteActions"><button class="danger" id="pmDelete">🗑️ Borrar registro</button><span></span></div><div class="modal-actions" id="pmEditActions" hidden><button class="secondary" id="pmEditCancel">Cancelar</button><button class="primary" id="pmEditSave">Guardar cambios</button></div></section>`;
  document.body.appendChild(detail);
  let activeMovementId='';
  const internalFactor=m=>{
    const f=Number(m?.internalPerUnit);if(f>0)return f;
    const q=Number(m?.qty||0),iq=Number(m?.internalQty);if(q>0&&Number.isFinite(iq))return iq/q;
    return Number(ITEMS?.[m?.itemKey]?.factor||1);
  };
  const internalAmount=m=>{const iq=Number(m?.internalQty);return Number.isFinite(iq)?iq:r3(Number(m?.qty||0)*internalFactor(m));};

  function openMovement(m){
    activeMovementId=m.id;
    E('pmTitle').textContent=m.type==='purchase'?'🛒 Compra':'📦 Mercancía recibida';
    E('pmIntro').textContent=m.name||'Registro';
    E('pmBody').hidden=false;E('pmEdit').hidden=true;E('pmViewActions').hidden=false;E('pmDeleteActions').hidden=false;E('pmEditActions').hidden=true;
    E('pmBody').innerHTML=`<div class="movement-detail-grid"><div class="movement-detail-box full"><small>Producto</small><b>${esc(m.name||'')}</b></div><div class="movement-detail-box"><small>Cantidad / presentación</small><b>${esc(movementPresentation(m))}</b></div><div class="movement-detail-box"><small>Entró al inventario</small><b>${esc(internalText(m.itemKey,internalAmount(m)))}</b></div>${m.type==='purchase'?`<div class="movement-detail-box"><small>Total pagado</small><b>${money(m.cost)}</b></div>`:''}<div class="movement-detail-box"><small>${m.type==='purchase'?'Tienda / proveedor':'Proveedor'}</small><b>${esc(m.store||'Sin dato')}</b></div><div class="movement-detail-box full"><small>Fecha</small><b>${esc(dateText(m))}</b></div></div>`;
    detail.hidden=false;
  }

  function showMovementEdit(){
    const m=movementById(activeMovementId);if(!m||!['purchase','receipt'].includes(m.type))return;
    E('pmBody').hidden=true;E('pmViewActions').hidden=true;E('pmDeleteActions').hidden=true;E('pmEdit').hidden=false;E('pmEditActions').hidden=false;
    E('pmEdit').innerHTML=`<div class="grid"><label class="full">Producto<input value="${esc(m.name||'')}" readonly></label><label>Cantidad<input id="pmQty" type="number" min="0.01" step="${/^(bolsa|caja|botella|envase|paquete|pieza|manojo)$/i.test(String(m.unit||''))?'1':'0.01'}" value="${Number(m.qty||0)}"></label><label>Presentación<input value="${esc(m.unit||'unidad')}" readonly></label>${m.type==='purchase'?`<label class="full">Total pagado<input id="pmCost" type="number" min="0" step="0.01" value="${Number(m.cost||0).toFixed(2)}"></label>`:''}<label class="full">${m.type==='purchase'?'Tienda / proveedor':'Proveedor'}<input id="pmStore" value="${esc(m.store||'')}"></label></div><div class="summary-box" id="pmPreview"></div>`;
    const refresh=()=>{const q=Number(E('pmQty').value||0),amount=r3(q*internalFactor(m));E('pmPreview').innerHTML=`Con esa cantidad quedarán <b>${esc(internalText(m.itemKey,amount))}</b> registrados por este movimiento.`;};
    E('pmQty').addEventListener('input',refresh);refresh();
  }

  async function saveMovementEdit(){
    const m=movementById(activeMovementId);if(!m||!['purchase','receipt'].includes(m.type)||!m.itemKey)return;
    const qty=Number(E('pmQty').value||0),discrete=/^(bolsa|caja|botella|envase|paquete|pieza|manojo)$/i.test(String(m.unit||''));
    if(!(qty>0)||discrete&&!Number.isInteger(qty))return alert('Escribe una cantidad válida.');
    const factor=internalFactor(m),newInternal=r3(qty*factor),store=E('pmStore').value.trim()||(m.type==='purchase'?'Sin tienda':'Sin proveedor');
    let cost=null;if(m.type==='purchase'){cost=Number(E('pmCost').value||0);if(!Number.isFinite(cost)||cost<0)return alert('Escribe un total válido.');}
    const ref=db.collection('movimientos').doc(m.id);E('pmEditSave').disabled=true;
    try{
      await db.runTransaction(async tx=>{
        const ms=await tx.get(ref),is=await tx.get(inventoryRef);if(!ms.exists)throw new Error('El registro ya no existe.');
        const live=ms.data(),key=live.itemKey,cur={...EMPTY,...(is.exists?(is.data().items||{}):{})},before=internalAmount(live),after=r3(Number(cur[key]||0)+(newInternal-before));
        if(after<-.0001)throw new Error('No se puede reducir tanto porque parte de ese inventario ya se usó.');
        cur[key]=Math.max(0,after);tx.set(inventoryRef,{items:cur,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
        const upd={qty,internalQty:newInternal,internalPerUnit:factor,store,editedAt:firebase.firestore.FieldValue.serverTimestamp()};
        if(live.type==='purchase'){upd.cost=cost;upd.unitPrice=qty>0?Number((cost/qty).toFixed(4)):0;}
        tx.update(ref,upd);
      });
      detail.hidden=true;toast('Registro corregido e inventario actualizado');
    }catch(e){console.error(e);alert(e.message||'No se pudo corregir.');}finally{E('pmEditSave').disabled=false;}
  }

  async function deleteMovement(){
    const m=movementById(activeMovementId);if(!m||!['purchase','receipt'].includes(m.type)||!m.itemKey)return;
    if(!confirm(`¿Borrar este registro de ${m.name||'producto'}?\n\nTambién se restará del inventario lo que agregó.`))return;
    const ref=db.collection('movimientos').doc(m.id);E('pmDelete').disabled=true;
    try{
      await db.runTransaction(async tx=>{
        const ms=await tx.get(ref),is=await tx.get(inventoryRef);if(!ms.exists)return;
        const live=ms.data(),key=live.itemKey,cur={...EMPTY,...(is.exists?(is.data().items||{}):{})},after=r3(Number(cur[key]||0)-internalAmount(live));
        if(after<-.0001)throw new Error('No se puede borrar porque parte de ese inventario ya se usó.');
        cur[key]=Math.max(0,after);tx.set(inventoryRef,{items:cur,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});tx.delete(ref);
      });
      detail.hidden=true;toast('Registro borrado e inventario corregido');
    }catch(e){console.error(e);alert(e.message||'No se pudo borrar.');}finally{E('pmDelete').disabled=false;}
  }

  // Captura Compras/Recepciones antes del detalle viejo del Historial.
  document.addEventListener('click',e=>{
    const row=e.target.closest?.('#historyList .movement[data-movement-id]');if(!row)return;
    const m=movementById(row.dataset.movementId);if(!m||!['purchase','receipt'].includes(m.type))return;
    e.preventDefault();e.stopImmediatePropagation();openMovement(m);
  },true);
  document.addEventListener('keydown',e=>{
    if(e.key!=='Enter'&&e.key!==' ')return;const row=e.target.closest?.('#historyList .movement[data-movement-id]');if(!row)return;
    const m=movementById(row.dataset.movementId);if(!m||!['purchase','receipt'].includes(m.type))return;
    e.preventDefault();e.stopImmediatePropagation();openMovement(m);
  },true);
  E('pmClose').onclick=()=>detail.hidden=true;E('pmEditBtn').onclick=showMovementEdit;E('pmDelete').onclick=deleteMovement;E('pmEditCancel').onclick=()=>{const m=movementById(activeMovementId);if(m)openMovement(m);};E('pmEditSave').onclick=saveMovementEdit;detail.addEventListener('click',e=>{if(e.target===detail)detail.hidden=true;});

  if(typeof renderAll==='function')renderAll();
})();