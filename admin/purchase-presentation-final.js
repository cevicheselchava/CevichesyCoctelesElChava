(()=>{
  if(window.__EL_CUBANO_PURCHASE_PRESENTATION_FINAL__)return;
  window.__EL_CUBANO_PURCHASE_PRESENTATION_FINAL__=true;

  const modal=document.getElementById('stockModal');
  const purchaseButton=document.getElementById('purchaseRegister');
  const receiveButton=document.getElementById('purchaseReceive');
  if(!modal||!purchaseButton||!receiveButton)return;

  const E=id=>document.getElementById(id);
  const r3=n=>Math.round((Number(n)+Number.EPSILON)*1000)/1000;
  const clean=n=>Number(r3(n).toFixed(3));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

  const style=document.createElement('style');
  style.textContent=`
    #stockModal .purchase-final-presentations{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
    #stockModal .purchase-final-presentation{border:1px solid #d7cfbf;border-radius:14px;padding:13px 7px;background:#fff;color:#123458;font-weight:1000;min-height:58px}
    #stockModal .purchase-final-presentation.active{background:linear-gradient(135deg,#174f2b,#2b8a49);color:#fff;border-color:transparent;box-shadow:inset 0 -4px 0 #f2b632}
    #stockModal .purchase-final-row{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}
    #stockModal .purchase-final-unit{padding:12px 14px;border-radius:13px;background:#eef3f8;color:#123458;white-space:nowrap;font-weight:1000}
    #stockModal .purchase-final-summary{font-size:16px;line-height:1.5}
    @media(max-width:560px){#stockModal .purchase-final-presentations{grid-template-columns:1fr 1fr 1fr}}
  `;
  document.head.appendChild(style);

  modal.innerHTML=`<section class="sheet">
    <h2 id="pfTitle">🛒 Registrar compra</h2>
    <p id="pfIntro">Producto → presentación → cantidad → precio. El sistema hace las cuentas.</p>
    <div class="grid">
      <label class="full">Producto<select id="pfItem"></select></label>
      <div class="full">
        <label style="margin-bottom:7px">Presentación</label>
        <div class="purchase-final-presentations" id="pfPresentations"></div>
      </div>
      <label class="full"><span id="pfQtyLabel">Cantidad</span>
        <div class="purchase-final-row"><input id="pfQty" type="number" min="0.01" step="0.01" value="1"><strong class="purchase-final-unit" id="pfQtyUnit">—</strong></div>
      </label>
      <label class="full" id="pfContentWrap" hidden><span id="pfContentLabel">¿Cuánto trae cada unidad?</span>
        <div class="purchase-final-row"><input id="pfContent" type="number" min="0.01" step="0.01"><select id="pfContentUnit" style="width:105px"></select></div>
      </label>
      <label class="full" id="pfPriceWrap"><span id="pfPriceLabel">Precio</span>
        <div class="purchase-final-row"><input id="pfPrice" type="number" min="0" step="0.01" inputmode="decimal" placeholder="$0.00"><strong class="purchase-final-unit" id="pfPriceUnit">—</strong></div>
      </label>
      <div class="summary-box full purchase-final-summary" id="pfPreview">Elige una presentación.</div>
      <label class="full"><span id="pfStoreLabel">Tienda / proveedor (opcional)</span><input id="pfStore" placeholder="H-E-B, Walmart, proveedor…"></label>
    </div>
    <button class="secondary" id="pfAdd" style="width:100%;border-radius:12px;padding:13px;font-weight:1000;margin-top:10px">➕ AGREGAR OTRO PRODUCTO</button>
    <div class="summary-box" id="pfCart">Si es una sola cosa, llena los datos y guarda.</div>
    <div class="modal-actions"><button class="secondary" id="pfCancel">Cancelar</button><button class="primary" id="pfSave">Guardar compra</button></div>
  </section>`;

  let mode='purchase';
  let key='';
  let presentation=null;
  let cart=[];

  function itemOptions(){
    return Object.entries(ITEMS||{}).map(([k,x])=>`<option value="${esc(k)}">${esc(x.name)}</option>`).join('');
  }

  function presentationsFor(k){
    const item=ITEMS?.[k]||{};
    const unit=String(item.unit||'');
    const group=String(item.group||'');

    if(group==='mariscos'||unit==='lb'){
      return [
        {id:'bag',label:'Bolsa',unit:'bolsa',custom:true,contentUnits:['oz','lb'],discrete:true,defaultContent:k==='shrimp'?12:'',defaultContentUnit:k==='shrimp'?'oz':'lb'},
        {id:'lb',label:'Por lb',unit:'lb',factor:1,discrete:false},
        {id:'box',label:'Caja',unit:'caja',custom:true,contentUnits:['lb','oz'],discrete:true,defaultContentUnit:'lb'}
      ];
    }

    if(unit==='oz'){
      if(String(item.purchaseUnit||'').toLowerCase().includes('manojo')){
        return [
          {id:'bunch',label:'Manojo',unit:'manojo',factor:Number(item.factor||1),discrete:true},
          {id:'lb',label:'Por lb',unit:'lb',factor:16,discrete:false},
          {id:'bag',label:'Bolsa',unit:'bolsa',custom:true,contentUnits:['oz','lb'],discrete:true,defaultContentUnit:'oz'}
        ];
      }
      return [
        {id:'lb',label:'Por lb',unit:'lb',factor:16,discrete:false},
        {id:'bag',label:'Bolsa',unit:'bolsa',custom:true,contentUnits:['oz','lb'],discrete:true,defaultContentUnit:'oz'},
        {id:'box',label:'Caja',unit:'caja',custom:true,contentUnits:['lb','oz'],discrete:true,defaultContentUnit:'lb'}
      ];
    }

    if(unit==='fl oz'){
      const f=Math.max(0,Number(item.factor||0));
      return [
        {id:'bottle',label:'Botella',unit:'botella',custom:true,contentUnits:['fl oz'],discrete:true,defaultContent:f>1?f:'',defaultContentUnit:'fl oz'},
        {id:'container',label:'Envase',unit:'envase',custom:true,contentUnits:['fl oz'],discrete:true,defaultContentUnit:'fl oz'},
        {id:'floz',label:'Por fl oz',unit:'fl oz',factor:1,discrete:false}
      ];
    }

    if(unit==='pzas'){
      const f=Math.max(0,Number(item.factor||0));
      return [
        {id:'piece',label:'Por pieza',unit:'pieza',factor:1,discrete:true},
        {id:'pack',label:'Paquete',unit:'paquete',custom:true,contentUnits:['pzas'],discrete:true,defaultContent:f>1?f:'',defaultContentUnit:'pzas'},
        {id:'box',label:'Caja',unit:'caja',custom:true,contentUnits:['pzas'],discrete:true,defaultContentUnit:'pzas'}
      ];
    }

    return [
      {id:'unit',label:'Unidad',unit:'unidad',factor:Math.max(.001,Number(item.factor||1)),discrete:true},
      {id:'pack',label:'Paquete',unit:'paquete',custom:true,contentUnits:[unit||'unidad'],discrete:true,defaultContentUnit:unit||'unidad'},
      {id:'box',label:'Caja',unit:'caja',custom:true,contentUnits:[unit||'unidad'],discrete:true,defaultContentUnit:unit||'unidad'}
    ];
  }

  function unitQuestion(u){
    const x=String(u||'unidad').toLowerCase();
    if(x==='bolsa')return '¿Cuántas bolsas?';
    if(x==='caja')return '¿Cuántas cajas?';
    if(x==='botella')return '¿Cuántas botellas?';
    if(x==='envase')return '¿Cuántos envases?';
    if(x==='paquete')return '¿Cuántos paquetes?';
    if(x==='pieza')return '¿Cuántas piezas?';
    if(x==='manojo')return '¿Cuántos manojos?';
    if(x==='lb')return '¿Cuántas libras?';
    if(x==='oz')return '¿Cuántas onzas?';
    if(x==='fl oz')return '¿Cuántas fl oz?';
    return 'Cantidad';
  }

  function contentQuestion(u){
    const x=String(u||'unidad').toLowerCase();
    if(x==='bolsa')return '¿Cuánto pesa cada bolsa?';
    if(x==='caja')return '¿Cuánto trae cada caja?';
    if(x==='botella')return '¿Cuánto trae cada botella?';
    if(x==='envase')return '¿Cuánto trae cada envase?';
    if(x==='paquete')return '¿Cuánto trae cada paquete?';
    return `¿Cuánto trae cada ${x}?`;
  }

  function conversion(item,contentUnit){
    const iu=String(item?.unit||'');
    const cu=String(contentUnit||'');
    if(iu==='lb'&&cu==='oz')return 1/16;
    if(iu==='lb'&&cu==='lb')return 1;
    if(iu==='oz'&&cu==='lb')return 16;
    if(iu==='oz'&&cu==='oz')return 1;
    if(iu==='fl oz'&&cu==='fl oz')return 1;
    if(iu==='pzas'&&cu==='pzas')return 1;
    if(iu===cu)return 1;
    return 0;
  }

  function factor(){
    if(!presentation)return 0;
    if(!presentation.custom)return Number(presentation.factor||0);
    const item=ITEMS?.[key];
    const content=Number(E('pfContent').value||0);
    const conv=conversion(item,E('pfContentUnit').value);
    return content>0&&conv>0?content*conv:0;
  }

  function inventoryText(k,internalQty){
    const item=ITEMS?.[k];
    if(String(item?.unit||'')==='lb')return `${clean(Number(internalQty||0)*16)} oz`;
    return `${clean(internalQty)} ${item?.unit||''}`;
  }

  function lineFromForm(requireComplete=true){
    const item=ITEMS?.[key];
    if(!item)return {error:'Elige un producto.'};
    if(!presentation)return {error:'Elige una presentación.'};
    const qty=Number(E('pfQty').value||0);
    if(!(qty>0))return {error:'Escribe una cantidad válida.'};
    if(presentation.discrete&&!Number.isInteger(qty))return {error:unitQuestion(presentation.unit).replace('¿','').replace('?','')+' completas.'};
    const perUnit=factor();
    if(!(perUnit>0))return {error:contentQuestion(presentation.unit)};

    let unitPrice=null,cost=null;
    if(mode==='purchase'){
      const raw=String(E('pfPrice').value||'').trim();
      if(requireComplete&&raw==='')return {error:`Escribe el precio por ${presentation.unit}.`};
      if(raw==='')return null;
      unitPrice=Number(raw);
      if(!Number.isFinite(unitPrice)||unitPrice<0)return {error:'Escribe un precio válido.'};
      cost=Number((qty*unitPrice).toFixed(2));
    }

    const internalQty=r3(qty*perUnit);
    let costPerOz=null;
    if(mode==='purchase'&&cost!==null){
      if(item.unit==='lb'&&internalQty>0)costPerOz=cost/(internalQty*16);
      else if(item.unit==='oz'&&internalQty>0)costPerOz=cost/internalQty;
    }

    return {
      k:key,name:item.name,qty,unit:presentation.unit,presentationLabel:presentation.label,
      contentPerUnit:presentation.custom?Number(E('pfContent').value||0):(presentation.content??null),
      contentUnit:presentation.custom?E('pfContentUnit').value:(presentation.contentUnit??null),
      internalPerUnit:r3(perUnit),internalQty,internalUnit:item.unit||'',
      unitPrice:unitPrice===null?null:Number(unitPrice.toFixed(4)),cost,
      costPerInternalUnit:cost!==null&&internalQty>0?Number((cost/internalQty).toFixed(6)):null,
      costPerOz:costPerOz===null?null:Number(costPerOz.toFixed(6))
    };
  }

  function renderPresentations(){
    E('pfPresentations').innerHTML=presentationsFor(key).map(p=>`<button type="button" class="purchase-final-presentation ${presentation?.id===p.id?'active':''}" data-pf-presentation="${esc(p.id)}">${esc(p.label)}</button>`).join('');
  }

  function syncFields(){
    if(!presentation){
      E('pfQtyLabel').textContent='Cantidad';
      E('pfQtyUnit').textContent='—';
      E('pfContentWrap').hidden=true;
      E('pfPriceLabel').textContent='Precio';
      E('pfPriceUnit').textContent='—';
      E('pfPreview').textContent='Elige una presentación.';
      return;
    }

    E('pfQtyLabel').textContent=unitQuestion(presentation.unit);
    E('pfQtyUnit').textContent=presentation.unit;
    E('pfQty').step=presentation.discrete?'1':'0.01';
    E('pfQty').min=presentation.discrete?'1':'0.01';

    if(presentation.custom){
      E('pfContentWrap').hidden=false;
      E('pfContentLabel').textContent=contentQuestion(presentation.unit);
      E('pfContentUnit').innerHTML=(presentation.contentUnits||[]).map(u=>`<option value="${esc(u)}">${esc(u)}</option>`).join('');
      if(presentation.defaultContentUnit)E('pfContentUnit').value=presentation.defaultContentUnit;
    }else E('pfContentWrap').hidden=true;

    E('pfPriceLabel').textContent=`Precio por ${presentation.unit}`;
    E('pfPriceUnit').textContent=`por ${presentation.unit}`;
    updatePreview();
  }

  function choosePresentation(id){
    presentation=presentationsFor(key).find(p=>p.id===id)||null;
    E('pfQty').value='1';
    E('pfPrice').value='';
    E('pfContent').value=presentation?.defaultContent??'';
    renderPresentations();
    syncFields();
  }

  function updatePreview(){
    if(!presentation){E('pfPreview').textContent='Elige una presentación.';return;}
    const qty=Number(E('pfQty').value||0),perUnit=factor();
    if(!(qty>0)){E('pfPreview').textContent='Escribe la cantidad.';return;}
    if(!(perUnit>0)){E('pfPreview').textContent=contentQuestion(presentation.unit);return;}

    const internalQty=r3(qty*perUnit);
    let html=`Entrarán <b>${inventoryText(key,internalQty)}</b> al inventario.`;
    if(presentation.custom){
      html=`${clean(qty)} ${presentation.unit}${qty===1?'':'s'} × ${clean(Number(E('pfContent').value||0))} ${esc(E('pfContentUnit').value)}.<br>`+html;
    }
    if(mode==='purchase'){
      const raw=String(E('pfPrice').value||'').trim();
      if(raw!==''){
        const price=Number(raw);
        if(Number.isFinite(price)&&price>=0){
          const total=qty*price;
          html+=`<br>Precio por ${esc(presentation.unit)}: <b>${money(price)}</b> · Total: <b>${money(total)}</b>`;
          const item=ITEMS?.[key];
          const oz=item?.unit==='lb'?internalQty*16:item?.unit==='oz'?internalQty:0;
          if(oz>0)html+=`<br>Costo calculado por oz: <b>${money(total/oz)}</b>`;
        }
      }
    }
    E('pfPreview').innerHTML=html;
  }

  function renderCart(){
    if(!cart.length){
      E('pfCart').textContent=mode==='purchase'?'Si es una sola cosa, llena los datos y guarda.':'Si es una sola cosa, llena los datos y recibe.';
      return;
    }
    const total=cart.reduce((s,l)=>s+Number(l.cost||0),0);
    E('pfCart').innerHTML=`<b>YA AGREGADO</b>${cart.map((l,i)=>`<div class="movement" style="margin-top:8px"><div><strong>${esc(l.name)}</strong><small>${clean(l.qty)} ${esc(l.unit)}${l.contentPerUnit?` · ${clean(l.contentPerUnit)} ${esc(l.contentUnit)} c/u`:''}<br>Inventario: +${esc(inventoryText(l.k,l.internalQty))}${mode==='purchase'?` · ${money(l.cost)}`:''}</small></div><button type="button" class="danger" data-pf-remove="${i}" style="border:0;border-radius:10px;padding:8px 10px;font-weight:1000">✕</button></div>`).join('')}${mode==='purchase'?`<div style="margin-top:10px"><b>Total compra: ${money(total)}</b></div>`:''}`;
  }

  function resetForm(keepItem=true){
    if(!keepItem)E('pfItem').selectedIndex=0;
    key=E('pfItem').value||Object.keys(ITEMS||{})[0];
    presentation=null;
    E('pfQty').value='1';
    E('pfContent').value='';
    E('pfPrice').value='';
    renderPresentations();
    syncFields();
  }

  function openEntry(nextMode='purchase',initialKey=''){
    mode=nextMode==='receipt'?'receipt':'purchase';
    cart=[];
    E('pfItem').innerHTML=itemOptions();
    key=initialKey&&ITEMS?.[initialKey]?initialKey:Object.keys(ITEMS||{})[0];
    E('pfItem').value=key;
    E('pfStore').value='';
    E('pfTitle').textContent=mode==='purchase'?'🛒 Registrar compra':'📦 Recibir mercancía';
    E('pfIntro').textContent=mode==='purchase'?'Producto → presentación → cantidad → precio. El sistema calcula total y costo por unidad.':'Producto → presentación → cantidad. El sistema convierte y suma al inventario.';
    E('pfPriceWrap').hidden=mode!=='purchase';
    E('pfStoreLabel').textContent=mode==='purchase'?'Tienda / proveedor (opcional)':'Proveedor (opcional)';
    E('pfAdd').textContent=mode==='purchase'?'➕ AGREGAR OTRO PRODUCTO':'➕ RECIBIR OTRO PRODUCTO';
    E('pfSave').textContent=mode==='purchase'?'Guardar compra':'Recibir mercancía';
    resetForm(true);
    renderCart();
    modal.hidden=false;
  }

  async function saveLines(lines){
    const store=E('pfStore').value.trim()||(mode==='purchase'?'Sin tienda':'Sin proveedor');
    const batchId=`${mode}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    const refs=lines.map(()=>db.collection('movimientos').doc());
    const keys=[...new Set(lines.map(l=>l.k))];

    await db.runTransaction(async tx=>{
      const snap=await tx.get(inventoryRef);
      const cur={...EMPTY,...(snap.exists?(snap.data().items||{}):{})};
      const stamp=firebase.firestore.FieldValue.serverTimestamp();
      lines.forEach(l=>cur[l.k]=r3(Number(cur[l.k]||0)+Number(l.internalQty||0)));
      tx.set(inventoryRef,{items:cur,tracked:firebase.firestore.FieldValue.arrayUnion(...keys),updatedAt:stamp},{merge:true});
      lines.forEach((l,i)=>{
        const data={type:mode==='purchase'?'purchase':'receipt',date:stamp,day:localDay(),name:l.name,itemKey:l.k,qty:l.qty,unit:l.unit,presentationLabel:l.presentationLabel,contentPerUnit:l.contentPerUnit,contentUnit:l.contentUnit,internalPerUnit:l.internalPerUnit,internalQty:l.internalQty,internalUnit:l.internalUnit,store,batchId};
        if(mode==='purchase'){
          data.unitPrice=l.unitPrice;
          data.cost=l.cost;
          data.costPerInternalUnit=l.costPerInternalUnit;
          if(l.costPerOz!==null)data.costPerOz=l.costPerOz;
          data.purchaseId=batchId;
        }else data.receiptId=batchId;
        tx.set(refs[i],data);
      });
    });
  }

  E('pfPresentations').onclick=e=>{
    const b=e.target.closest('[data-pf-presentation]');
    if(b)choosePresentation(b.dataset.pfPresentation);
  };
  E('pfItem').onchange=()=>{key=E('pfItem').value;resetForm(true);};
  E('pfQty').oninput=updatePreview;
  E('pfContent').oninput=updatePreview;
  E('pfContentUnit').onchange=updatePreview;
  E('pfPrice').oninput=updatePreview;
  E('pfCart').onclick=e=>{
    const b=e.target.closest('[data-pf-remove]');
    if(!b)return;
    cart.splice(Number(b.dataset.pfRemove),1);
    renderCart();
  };
  E('pfCancel').onclick=()=>{modal.hidden=true;cart=[];};
  E('pfAdd').onclick=()=>{
    const line=lineFromForm(true);
    if(!line||line.error)return alert(line?.error||'Completa los datos.');
    cart.push(line);
    renderCart();
    resetForm(false);
    toast('Producto agregado.');
  };
  E('pfSave').onclick=async()=>{
    let lines=cart.map(x=>({...x}));
    const current=lineFromForm(false);
    const hasSomething=presentation||String(E('pfPrice').value||'').trim()!==''||Number(E('pfQty').value||0)!==1||String(E('pfContent').value||'').trim()!=='';
    if(hasSomething||!lines.length){
      const line=lineFromForm(true);
      if(!line||line.error)return alert(line?.error||'Completa los datos.');
      lines.push(line);
    }
    if(!lines.length)return alert('Agrega por lo menos un producto.');
    E('pfSave').disabled=true;
    try{
      await saveLines(lines);
      const total=lines.reduce((s,l)=>s+Number(l.cost||0),0);
      modal.hidden=true;cart=[];
      toast(mode==='purchase'?`Compra guardada · ${money(total)}`:'Mercancía recibida e inventario actualizado');
    }catch(err){
      console.error(err);
      alert(err.message||'No se pudo guardar.');
    }finally{E('pfSave').disabled=false;}
  };

  purchaseButton.onclick=()=>openEntry('purchase');
  receiveButton.onclick=()=>openEntry('receipt');
  window.openStock=(initialKey='',need=null)=>openEntry('purchase',initialKey);

})();