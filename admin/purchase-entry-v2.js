(()=>{
  if(window.__EL_CUBANO_PURCHASE_ENTRY_SIMPLE__)return;
  window.__EL_CUBANO_PURCHASE_ENTRY_SIMPLE__=true;

  const INTERNAL_TEXT={'fl oz':'oz',pzas:'pzas',oz:'oz',lb:'lb'};
  let cart=[];
  let purchaseKey='';

  function internalText(k,value){
    const x=ITEMS[k],amount=round3(Number(value||0));
    return `${Number(amount.toFixed(3))} ${INTERNAL_TEXT[x?.unit]||x?.unit||''}`;
  }

  function purchaseText(k){
    const x=ITEMS[k];
    return String(x?.purchaseEntryUnit||x?.purchaseUnit||x?.unit||'unidad')
      .replace(/^pzas$/i,'pieza')
      .replace(/^manojo$/i,'manojo');
  }

  function variableContentUnit(k){
    return String(ITEMS[k]?.variableContentUnit||'').trim();
  }

  function fixedContent(k){
    const x=ITEMS[k],amount=Number(x?.fixedContentPerUnit||0),unit=String(x?.fixedContentUnit||'').trim(),toInternal=Number(x?.fixedContentToInternalFactor||1);
    if(!(amount>0)||!unit||!(toInternal>0))return null;
    return {amount,unit,toInternal,internalPerUnit:round3(amount*toInternal)};
  }

  function purchaseFactor(k){
    const fixed=fixedContent(k);
    if(fixed)return fixed.internalPerUnit;
    const variable=variableContentUnit(k);
    if(variable){
      const input=document.getElementById('stockContent');
      const n=Number(input?.value||0);
      return n>0?n:0;
    }
    return Math.max(0.001,Number(ITEMS[k]?.factor||1));
  }

  function isDiscrete(k){
    const u=purchaseText(k).toLowerCase();
    return /pzas|pieza|paquete|botella|caja|manojo|envase|bolsa/.test(u);
  }

  function qtyQuestion(k){
    const custom=String(ITEMS[k]?.purchaseQuestion||'').trim();
    if(custom)return custom;
    const u=purchaseText(k).toLowerCase();
    if(u==='bolsa')return '¿Cuántas bolsas vas a comprar?';
    if(u==='paquete')return '¿Cuántos paquetes vas a comprar?';
    if(u==='envase')return '¿Cuántos envases vas a comprar?';
    if(u==='botella')return '¿Cuántas botellas vas a comprar?';
    if(u==='caja')return '¿Cuántas cajas vas a comprar?';
    if(u==='pieza')return '¿Cuántas piezas vas a comprar?';
    if(u==='manojo')return '¿Cuántos manojos vas a comprar?';
    return '¿Cuánto vas a comprar?';
  }

  displayQty=function(k,value){return internalText(k,value)};

  const modal=document.getElementById('stockModal');
  modal.innerHTML=`<section class="sheet">
    <h2 id="stockTitle">🛒 Registrar compra</h2>
    <p id="stockCurrent"></p>
    <div class="grid">
      <label class="full">Producto<select id="stockItem"></select></label>
      <label class="full" id="stockQtyLabel"><span id="stockQtyQuestion">¿Cuánto vas a comprar?</span>
        <div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center">
          <input id="stockQty" type="number" min="0.01" step="0.01" value="1">
          <strong id="stockPurchaseUnitText" style="padding:12px 14px;border-radius:13px;background:#eef3f8;color:#123458;white-space:nowrap">lb</strong>
        </div>
      </label>
      <label class="full" id="stockContentLabel" hidden><span id="stockContentLabelText">¿Cuánto trae cada unidad?</span>
        <div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center">
          <input id="stockContent" type="number" min="0.01" step="0.01" placeholder="Cantidad que trae">
          <strong id="stockContentUnitText" style="padding:12px 14px;border-radius:13px;background:#fff7cf;color:#7d5300;white-space:nowrap">oz</strong>
        </div>
      </label>
      <label class="full"><span id="stockPriceLabel">Precio / valor por lb</span><input id="stockUnitPrice" type="number" min="0" step="0.01" placeholder="$0.00"></label>
      <div class="summary-box full" id="stockLinePreview">Se agregará al inventario automáticamente.</div>
      <label class="full">Tienda <input id="stockStore" placeholder="H-E-B, Walmart, Sam's…"></label>
    </div>
    <button class="secondary" id="stockAddLine" style="width:100%;border-radius:12px;padding:13px;font-weight:1000;margin-top:10px">➕ AGREGAR OTRO PRODUCTO</button>
    <div class="summary-box" id="stockCart">Si vas a comprar una sola cosa, llena los datos y toca Guardar compra.</div>
    <div class="modal-actions"><button class="secondary" id="stockCancel">Cancelar</button><button class="primary" id="stockSave">Guardar compra</button></div>
  </section>`;

  function itemOptions(){
    return Object.entries(ITEMS).map(([k,x])=>`<option value="${k}">${x.name}</option>`).join('');
  }

  function currentLine(requirePrice=true){
    purchaseKey=$('stockItem').value||purchaseKey;
    const x=ITEMS[purchaseKey],qty=Number($('stockQty').value||0),rawPrice=String($('stockUnitPrice').value||'').trim(),variable=variableContentUnit(purchaseKey),fixed=fixedContent(purchaseKey),factor=purchaseFactor(purchaseKey);
    if(!(qty>0))return {error:'Escribe cuánto vas a comprar.'};
    if(isDiscrete(purchaseKey)&&!Number.isInteger(qty))return {error:`Escribe cuántas ${purchaseText(purchaseKey)}s completas vas a comprar.`};
    if(variable&&!(factor>0)){
      if(!requirePrice&&rawPrice==='')return null;
      return {error:`Escribe cuánto trae cada ${purchaseText(purchaseKey)}.`};
    }
    if(requirePrice&&rawPrice==='')return {error:'Escribe el precio o valor.'};
    if(rawPrice==='')return null;
    const unitPrice=Number(rawPrice);
    if(!Number.isFinite(unitPrice)||unitPrice<0)return {error:'Escribe un precio o valor válido.'};
    const internalQty=round3(qty*factor),cost=Number((qty*unitPrice).toFixed(2));
    return {
      k:purchaseKey,
      qty,
      unit:purchaseText(purchaseKey),
      unitPrice:Number(unitPrice.toFixed(4)),
      contentPerUnit:fixed?fixed.amount:factor,
      contentUnit:fixed?fixed.unit:(variable||ITEMS[purchaseKey]?.unit||''),
      internalQty,
      cost,
      name:x?.name||purchaseKey,
      showContent:Boolean(fixed||variable)
    };
  }

  function totalWithCurrent(){
    const current=currentLine(false);
    const base=cart.reduce((a,l)=>a+Number(l.cost||0),0);
    return Number((base+((current&&!current.error)?Number(current.cost||0):0)).toFixed(2));
  }

  function updatePreview(){
    purchaseKey=$('stockItem').value||purchaseKey;
    const qty=Math.max(0,Number($('stockQty').value||0)),rawPrice=String($('stockUnitPrice').value||'').trim(),unit=purchaseText(purchaseKey),variable=variableContentUnit(purchaseKey),fixed=fixedContent(purchaseKey),factor=purchaseFactor(purchaseKey),internalQty=round3(qty*factor);
    $('stockPurchaseUnitText').textContent=unit;
    $('stockQtyQuestion').textContent=qtyQuestion(purchaseKey);
    $('stockPriceLabel').textContent=`Precio / valor por ${unit}`;
    $('stockQty').step=isDiscrete(purchaseKey)?'1':'0.01';
    $('stockQty').min=isDiscrete(purchaseKey)?'1':'0.01';
    $('stockCurrent').innerHTML=`Inventario actual: <b>${internalText(purchaseKey,inventory[purchaseKey]||0)}</b>.`;

    const contentLabel=$('stockContentLabel');
    if(variable&&!fixed){
      contentLabel.hidden=false;
      $('stockContentUnitText').textContent=variable;
      $('stockContentLabelText').textContent=`¿Cuánto trae cada ${unit}?`;
    }else{
      contentLabel.hidden=true;
    }

    const unitPrice=Number(rawPrice||0),lineTotal=Number.isFinite(unitPrice)?qty*unitPrice:0;
    if(fixed){
      const totalContent=round3(qty*fixed.amount);
      $('stockLinePreview').innerHTML=`Cada <b>${unit}</b> trae <b>${Number(fixed.amount.toFixed(3))} ${fixed.unit}</b>.<br>${qty>0?`Con ${Number(qty.toFixed(0))} ${qty===1?unit:unit+'s'} entran <b>${Number(totalContent.toFixed(3))} ${fixed.unit}</b> = <b>${internalText(purchaseKey,internalQty)}</b> al inventario.`:'Escribe cuántas vas a comprar.'}${rawPrice!==''?`<br>Total: <b>${money(lineTotal)}</b>`:''}`;
    }else if(variable&&!(factor>0)){
      $('stockLinePreview').innerHTML=`Escribe cuánto trae cada <b>${unit}</b> para calcular lo que entrará al inventario.`;
    }else{
      $('stockLinePreview').innerHTML=`Se agregarán <b>${internalText(purchaseKey,internalQty)}</b> al inventario.${rawPrice!==''?`<br>Total de este producto: <b>${money(lineTotal)}</b>`:''}`;
    }
    const total=totalWithCurrent();
    $('stockSave').textContent=total>0?`Guardar compra · ${money(total)}`:'Guardar compra';
  }

  function renderCart(){
    const total=cart.reduce((a,l)=>a+Number(l.cost||0),0);
    $('stockCart').innerHTML=cart.length
      ? `<div style="font-weight:1000;margin-bottom:8px">YA AGREGADO</div>${cart.map((l,i)=>`<div class="movement"><div><strong>${l.name}</strong><small>${Number(l.qty.toFixed(3))} ${l.unit} × ${money(l.unitPrice)} = ${money(l.cost)}${l.showContent?`<br>Cada ${l.unit}: ${Number(l.contentPerUnit.toFixed(3))} ${l.contentUnit||''}`:''}<br>Al inventario: +${internalText(l.k,l.internalQty)}</small></div><button type="button" data-remove-purchase="${i}" class="danger" style="border:0;border-radius:10px;padding:8px 10px;font-weight:1000">✕</button></div>`).join('')}<div style="margin-top:10px"><b>Subtotal: ${money(total)}</b></div>`
      : 'Si vas a comprar una sola cosa, llena los datos y toca Guardar compra.';
    updatePreview();
  }

  function resetCurrent(keepProduct=true){
    if(!keepProduct)$('stockItem').selectedIndex=0;
    purchaseKey=$('stockItem').value||Object.keys(ITEMS)[0];
    $('stockQty').value=1;
    $('stockUnitPrice').value='';
    $('stockContent').value='';
    updatePreview();
  }

  openStock=function(k='',need=null){
    $('stockItem').innerHTML=itemOptions();
    purchaseKey=k&&ITEMS[k]?k:Object.keys(ITEMS)[0];
    $('stockItem').value=purchaseKey;
    cart=[];
    $('stockStore').value='';
    $('stockUnitPrice').value='';
    $('stockContent').value='';
    const variable=variableContentUnit(purchaseKey),f=variable?0:purchaseFactor(purchaseKey);
    if(need!==null&&f>0){
      const raw=Math.max(.01,Number(need||0)/f);
      $('stockQty').value=isDiscrete(purchaseKey)?Math.max(1,Math.ceil(raw)):round3(raw);
    }else $('stockQty').value=1;
    renderCart();
    modal.hidden=false;
  };

  $('stockItem').onchange=()=>{purchaseKey=$('stockItem').value;resetCurrent(true)};
  $('stockQty').oninput=updatePreview;
  $('stockContent').oninput=updatePreview;
  $('stockUnitPrice').oninput=updatePreview;
  $('stockCart').onclick=e=>{
    const b=e.target.closest('[data-remove-purchase]');
    if(!b)return;
    cart.splice(Number(b.dataset.removePurchase),1);
    renderCart();
  };

  $('stockAddLine').onclick=()=>{
    const line=currentLine(true);
    if(!line||line.error)return alert(line?.error||'Completa la compra.');
    cart.push(line);
    renderCart();
    $('stockUnitPrice').value='';
    $('stockQty').value=1;
    $('stockContent').value='';
    updatePreview();
    toast('Producto agregado. Elige el siguiente.');
  };

  $('stockCancel').onclick=()=>{modal.hidden=true;cart=[]};

  $('stockSave').onclick=async()=>{
    let lines=cart.map(x=>({...x}));
    const rawPrice=String($('stockUnitPrice').value||'').trim();
    if(rawPrice!==''||!lines.length){
      const line=currentLine(true);
      if(!line||line.error)return alert(line?.error||'Completa la compra.');
      lines.push(line);
    }
    if(!lines.length)return alert('Agrega por lo menos un producto.');

    const total=Number(lines.reduce((a,l)=>a+Number(l.cost||0),0).toFixed(2));
    const store=$('stockStore').value.trim()||'Sin tienda';
    const purchaseId=`purchase_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    const refs=lines.map(()=>db.collection('movimientos').doc());
    const keys=[...new Set(lines.map(l=>l.k))];
    $('stockSave').disabled=true;

    try{
      await db.runTransaction(async tx=>{
        const snap=await tx.get(inventoryRef),cur={...EMPTY,...(snap.exists?(snap.data().items||{}):{})},stamp=firebase.firestore.FieldValue.serverTimestamp();
        lines.forEach(l=>cur[l.k]=round3(Number(cur[l.k]||0)+Number(l.internalQty||0)));
        tx.set(inventoryRef,{items:cur,tracked:firebase.firestore.FieldValue.arrayUnion(...keys),updatedAt:stamp},{merge:true});
        lines.forEach((l,i)=>tx.set(refs[i],{
          type:'purchase',date:stamp,day:localDay(),name:l.name,itemKey:l.k,
          qty:l.qty,unit:l.unit,contentPerUnit:l.contentPerUnit,contentUnit:l.contentUnit,
          internalQty:l.internalQty,internalUnit:ITEMS[l.k]?.unit||'',unitPrice:l.unitPrice,cost:l.cost,store,purchaseId
        }));
      });
      cart=[];
      modal.hidden=true;
      toast(`Compra guardada · ${money(total)}`);
    }catch(e){
      console.error(e);
      alert(e.message||'No se pudo guardar la compra.');
    }finally{
      $('stockSave').disabled=false;
    }
  };

  renderAll();
})();