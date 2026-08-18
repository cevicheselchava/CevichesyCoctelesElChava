(()=>{
  if(window.__EL_CUBANO_PURCHASE_ENTRY_V2__)return;
  window.__EL_CUBANO_PURCHASE_ENTRY_V2__=true;

  const UNIT_TEXT={lb:'lb',oz:'oz',pieza:'pieza',paquete:'paquete',botella:'botella',galon:'galón',caja:'caja'};
  const INTERNAL_TEXT={'fl oz':'oz',pzas:'pzas',oz:'oz',lb:'lb'};
  let cart=[];
  let purchaseKey='';

  function internalText(k,value){
    const x=ITEMS[k],amount=round3(Number(value||0));
    return `${Number(amount.toFixed(3))} ${INTERNAL_TEXT[x?.unit]||x?.unit||''}`;
  }

  displayQty=function(k,value){return internalText(k,value)};

  function defaultSpec(k){
    const x=ITEMS[k],pu=String(x?.purchaseUnit||'').toLowerCase(),factor=Number(x?.factor||1);
    if(pu.startsWith('botella'))return {unit:'botella',content:factor};
    if(pu.startsWith('paquete'))return {unit:'paquete',content:factor};
    if(pu.startsWith('caja'))return {unit:'caja',content:factor};
    if(pu.startsWith('manojo'))return {unit:'paquete',content:factor};
    if(pu==='lb')return {unit:'lb',content:x.unit==='oz'?16:1};
    if(pu==='pzas')return {unit:'pieza',content:1};
    return {unit:(x.unit==='fl oz'||x.unit==='oz')?'oz':x.unit==='lb'?'lb':'pieza',content:1};
  }

  function fixedFactor(k,unit){
    const iu=ITEMS[k]?.unit;
    if(iu==='lb'&&unit==='lb')return 1;
    if(iu==='lb'&&unit==='oz')return 1/16;
    if(iu==='oz'&&unit==='oz')return 1;
    if(iu==='oz'&&unit==='lb')return 16;
    if(iu==='fl oz'&&unit==='oz')return 1;
    if(iu==='fl oz'&&unit==='galon')return 128;
    if(iu==='pzas'&&unit==='pieza')return 1;
    return null;
  }

  const modal=document.getElementById('stockModal');
  modal.innerHTML=`<section class="sheet"><h2 id="stockTitle">🛒 Registrar compra</h2><p id="stockCurrent"></p><div class="grid"><label class="full">Producto<select id="stockItem"></select></label><label>Cantidad comprada<input id="stockQty" type="number" min="0.01" step="0.01" value="1"></label><label>Unidad de compra<select id="stockPurchaseUnit"><option value="lb">lb</option><option value="oz">oz</option><option value="pieza">pieza</option><option value="paquete">paquete</option><option value="botella">botella</option><option value="galon">galón</option><option value="caja">caja</option></select></label><label class="full" id="stockContentLabel"><span id="stockContentCaption">Contenido por unidad</span><input id="stockContent" type="number" min="0.001" step="0.001" value="1"></label><label class="full">Precio por unidad de compra<input id="stockUnitPrice" type="number" min="0" step="0.01" value="0"></label><div class="summary-box full" id="stockLineTotal">Este producto: $0.00</div><label class="full">Tienda<input id="stockStore" placeholder="H-E-B, Walmart, Sam's…"></label></div><button class="secondary" id="stockAddLine" style="width:100%;border-radius:12px;padding:13px;font-weight:1000;margin-top:10px">➕ AGREGAR A LA COMPRA</button><div class="summary-box" id="stockCart">Todavía no agregas productos.</div><div class="modal-actions"><button class="secondary" id="stockCancel">Cancelar</button><button class="primary" id="stockSave" disabled>Guardar compra</button></div></section>`;

  function itemOptions(){return Object.entries(ITEMS).map(([k,x])=>`<option value="${k}">${x.name}</option>`).join('')}
  function factor(){
    const unit=$('stockPurchaseUnit').value,fixed=fixedFactor(purchaseKey,unit);
    return fixed!==null?fixed:Number($('stockContent').value||0);
  }
  function lineTotal(){
    const qty=Number($('stockQty').value||0),price=Number($('stockUnitPrice').value||0);
    $('stockLineTotal').innerHTML=`Este producto: <b>${money(qty*price)}</b>`;
  }
  function conversionUI(reset=false){
    purchaseKey=$('stockItem').value||purchaseKey;
    const x=ITEMS[purchaseKey],unit=$('stockPurchaseUnit').value,fixed=fixedFactor(purchaseKey,unit),spec=defaultSpec(purchaseKey);
    $('stockContentLabel').hidden=fixed!==null;
    if(fixed===null){
      $('stockContentCaption').textContent=`Contenido de cada ${UNIT_TEXT[unit]||unit} en ${INTERNAL_TEXT[x.unit]||x.unit}`;
      if(reset)$('stockContent').value=unit===spec.unit?spec.content:'';
    }else if(reset){$('stockContent').value=fixed}
    $('stockCurrent').innerHTML=`Inventario actual: <b>${internalText(purchaseKey,inventory[purchaseKey]||0)}</b>.<br>Al guardar se sumará en <b>${INTERNAL_TEXT[x.unit]||x.unit}</b>, que es como lo usa la receta.`;
    lineTotal();
  }
  function renderCart(){
    const total=cart.reduce((a,l)=>a+Number(l.cost||0),0);
    $('stockCart').innerHTML=cart.length
      ? `<div style="font-weight:1000;margin-bottom:8px">COMPRA ACTUAL</div>${cart.map((l,i)=>`<div class="movement"><div><strong>${ITEMS[l.k]?.name||l.k}</strong><small>${Number(l.qty.toFixed(3))} ${UNIT_TEXT[l.unit]||l.unit} × ${money(l.unitPrice)} = ${money(l.cost)}<br>Inventario: +${internalText(l.k,l.internalQty)}</small></div><button type="button" data-remove-purchase="${i}" class="danger" style="border:0;border-radius:10px;padding:8px 10px;font-weight:1000">✕</button></div>`).join('')}<div style="margin-top:10px;font-size:20px"><b>TOTAL A PAGAR: ${money(total)}</b></div>`
      : 'Todavía no agregas productos.';
    $('stockSave').disabled=!cart.length;
    $('stockSave').textContent=cart.length?`Guardar compra · ${money(total)}`:'Guardar compra';
  }

  openStock=function(k='',need=null){
    $('stockItem').innerHTML=itemOptions();
    purchaseKey=k&&ITEMS[k]?k:Object.keys(ITEMS)[0];
    $('stockItem').value=purchaseKey;
    $('stockQty').value=1;
    $('stockUnitPrice').value=0;
    $('stockStore').value='';
    cart=[];
    const spec=defaultSpec(purchaseKey);
    $('stockPurchaseUnit').value=spec.unit;
    $('stockContent').value=spec.content;
    conversionUI(false);
    if(need!==null){const f=factor();if(f>0)$('stockQty').value=Math.max(.01,round3(Number(need||0)/f))}
    lineTotal();renderCart();modal.hidden=false;
  };

  $('stockItem').onchange=()=>{
    purchaseKey=$('stockItem').value;
    $('stockQty').value=1;$('stockUnitPrice').value=0;
    const spec=defaultSpec(purchaseKey);
    $('stockPurchaseUnit').value=spec.unit;$('stockContent').value=spec.content;
    conversionUI(false);
  };
  $('stockPurchaseUnit').onchange=()=>conversionUI(true);
  $('stockQty').oninput=lineTotal;$('stockUnitPrice').oninput=lineTotal;$('stockContent').oninput=lineTotal;
  $('stockCart').onclick=e=>{const b=e.target.closest('[data-remove-purchase]');if(!b)return;cart.splice(Number(b.dataset.removePurchase),1);renderCart()};
  $('stockAddLine').onclick=()=>{
    purchaseKey=$('stockItem').value||purchaseKey;
    const x=ITEMS[purchaseKey],qty=Number($('stockQty').value||0),unit=$('stockPurchaseUnit').value,unitPrice=Number($('stockUnitPrice').value||0),f=factor();
    if(!(qty>0))return alert('Escribe cuánto compraste.');
    if(!Number.isFinite(unitPrice)||unitPrice<0)return alert('Escribe el precio por unidad.');
    if(!(f>0))return alert(`Escribe cuántos ${INTERNAL_TEXT[x.unit]||x.unit} trae cada ${UNIT_TEXT[unit]||unit}.`);
    const internalQty=round3(qty*f),cost=Number((qty*unitPrice).toFixed(2));
    cart.push({k:purchaseKey,qty,unit,unitPrice,contentPerUnit:f,internalQty,cost});
    renderCart();$('stockQty').value=1;$('stockUnitPrice').value=0;lineTotal();
  };
  $('stockCancel').onclick=()=>{modal.hidden=true;cart=[]};
  $('stockSave').onclick=async()=>{
    if(!cart.length)return;
    const lines=cart.map(x=>({...x})),total=Number(lines.reduce((a,l)=>a+Number(l.cost||0),0).toFixed(2)),store=$('stockStore').value.trim()||'Sin tienda',purchaseId=`purchase_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,refs=lines.map(()=>db.collection('movimientos').doc()),keys=[...new Set(lines.map(l=>l.k))];
    $('stockSave').disabled=true;
    try{
      await db.runTransaction(async tx=>{
        const snap=await tx.get(inventoryRef),cur={...EMPTY,...(snap.exists?(snap.data().items||{}):{})},stamp=firebase.firestore.FieldValue.serverTimestamp();
        lines.forEach(l=>cur[l.k]=round3(Number(cur[l.k]||0)+Number(l.internalQty||0)));
        tx.set(inventoryRef,{items:cur,tracked:firebase.firestore.FieldValue.arrayUnion(...keys),updatedAt:stamp},{merge:true});
        lines.forEach((l,i)=>tx.set(refs[i],{type:'purchase',date:stamp,day:localDay(),name:ITEMS[l.k]?.name||l.k,itemKey:l.k,qty:l.qty,unit:UNIT_TEXT[l.unit]||l.unit,contentPerUnit:l.contentPerUnit,internalQty:l.internalQty,internalUnit:ITEMS[l.k]?.unit||'',unitPrice:l.unitPrice,cost:l.cost,store,purchaseId}));
      });
      cart=[];modal.hidden=true;toast(`Compra guardada · ${money(total)}`);
    }catch(e){console.error(e);alert(e.message||'No se pudo guardar la compra.');}
    finally{$('stockSave').disabled=false}
  };

  renderAll();
})();