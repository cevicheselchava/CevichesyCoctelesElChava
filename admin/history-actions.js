(()=>{
  if(window.__EL_CUBANO_HISTORY_ACTIONS_V2__)return;
  window.__EL_CUBANO_HISTORY_ACTIONS_V2__=true;

  const round3h=n=>Math.round((Number(n)+Number.EPSILON)*1000)/1000;
  const escH=v=>String(v??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

  const style=document.createElement('style');
  style.textContent=`
    #historyList .movement{cursor:pointer;transition:transform .12s ease,box-shadow .12s ease}
    #historyList .movement:active{transform:scale(.99)}
    .history-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}
    .history-detail-box{border:1px solid #ded7c8;border-radius:12px;padding:11px;background:#fff}
    .history-detail-box.full{grid-column:1/-1}
    .history-detail-box small{display:block;color:#687386;font-weight:900;margin-bottom:4px}
    .history-detail-box b{color:#174f2b;font-size:17px}
    .history-edit-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}
    .history-edit-grid .full{grid-column:1/-1}
    .history-modal-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}
    .history-modal-actions button{border:0;border-radius:12px;padding:13px;font-weight:1000}
    @media(max-width:560px){.history-detail-grid,.history-edit-grid{grid-template-columns:1fr}.history-detail-box.full,.history-edit-grid .full{grid-column:1}}
  `;
  document.head.appendChild(style);

  const modal=document.createElement('div');
  modal.className='modal';
  modal.id='historyDetailModalV2';
  modal.hidden=true;
  modal.innerHTML=`<section class="sheet">
    <h2 id="historyDetailTitleV2">Detalle</h2>
    <p id="historyDetailIntroV2"></p>
    <div id="historyDetailBodyV2"></div>
    <div id="historyEditBodyV2" hidden></div>
    <div class="history-modal-actions" id="historyViewActionsV2">
      <button class="secondary" id="historyCloseV2">Cerrar</button>
      <button class="warning-btn" id="historyEditV2" hidden>✏️ Editar compra</button>
      <button class="danger" id="historyDeleteV2" hidden>🗑️ Borrar compra</button>
    </div>
    <div class="history-modal-actions" id="historyEditActionsV2" hidden>
      <button class="secondary" id="historyEditCancelV2">Cancelar</button>
      <button class="primary" id="historyEditSaveV2">Guardar cambios</button>
    </div>
  </section>`;
  document.body.appendChild(modal);

  let activeId='';
  const getMove=id=>(movements||[]).find(m=>m.id===id);
  const itemFor=m=>ITEMS?.[m?.itemKey]||null;
  const dateText=m=>{const d=typeof timestampDate==='function'?timestampDate(m?.date):null;return d?d.toLocaleString('es-MX',{dateStyle:'medium',timeStyle:'short'}):'Sin fecha'};
  const oldInternal=m=>{
    const stored=Number(m?.internalQty);
    if(Number.isFinite(stored))return round3h(stored);
    const qty=Number(m?.qty||0),factor=Number(m?.contentPerUnit||itemFor(m)?.factor||1);
    return round3h(qty*factor);
  };
  const unitPrice=m=>{
    const u=Number(m?.unitPrice);
    if(Number.isFinite(u))return u;
    const q=Number(m?.qty||0),c=Number(m?.cost||0);
    return q>0?c/q:0;
  };
  const presentation=m=>{
    const qty=Number(m?.qty||0),unit=String(m?.unit||itemFor(m)?.purchaseEntryUnit||itemFor(m)?.purchaseUnit||'unidad');
    const f=Number(m?.contentPerUnit),cu=String(m?.contentUnit||itemFor(m)?.unit||'');
    return Number.isFinite(f)&&f>0&&cu?`${qty} ${unit} · ${f} ${cu} c/u`:`${qty} ${unit}`;
  };

  function renderView(m){
    const body=document.getElementById('historyDetailBodyV2');
    const edit=document.getElementById('historyEditV2');
    const del=document.getElementById('historyDeleteV2');
    document.getElementById('historyEditBodyV2').hidden=true;
    body.hidden=false;
    document.getElementById('historyViewActionsV2').hidden=false;
    document.getElementById('historyEditActionsV2').hidden=true;

    if(m.type==='purchase'){
      document.getElementById('historyDetailTitleV2').textContent='🛒 Compra';
      document.getElementById('historyDetailIntroV2').textContent=m.name||'Compra registrada';
      body.innerHTML=`<div class="history-detail-grid">
        <div class="history-detail-box full"><small>Producto</small><b>${escH(m.name||itemFor(m)?.name||'')}</b></div>
        <div class="history-detail-box"><small>Cantidad / presentación</small><b>${escH(presentation(m))}</b></div>
        <div class="history-detail-box"><small>Precio por unidad</small><b>${money(unitPrice(m))}</b></div>
        <div class="history-detail-box"><small>Total pagado</small><b>${money(m.cost)}</b></div>
        <div class="history-detail-box"><small>Tienda</small><b>${escH(m.store||'Sin tienda')}</b></div>
        <div class="history-detail-box full"><small>Fecha</small><b>${escH(dateText(m))}</b></div>
      </div>`;
      const canChange=Boolean(m.itemKey&&ITEMS?.[m.itemKey]);
      edit.hidden=!canChange;
      del.hidden=!canChange;
    }else if(m.type==='sale'){
      document.getElementById('historyDetailTitleV2').textContent='💵 Venta entregada';
      document.getElementById('historyDetailIntroV2').textContent=m.name||'Pedido';
      body.innerHTML=`<div class="history-detail-grid">
        <div class="history-detail-box"><small>Venta</small><b>${money(m.total)}</b></div>
        <div class="history-detail-box"><small>Costo</small><b>${m.cost==null?'Pendiente':money(m.cost)}</b></div>
        <div class="history-detail-box"><small>Utilidad</small><b>${m.profit==null?'Pendiente':money(m.profit)}</b></div>
        <div class="history-detail-box"><small>Pago</small><b>${escH(m.payment||'No indicado')}</b></div>
        <div class="history-detail-box full"><small>Fecha</small><b>${escH(dateText(m))}</b></div>
      </div>`;
      edit.hidden=true;del.hidden=true;
    }else{
      document.getElementById('historyDetailTitleV2').textContent=m.type==='prep'?'🥣 Preparación':'✏️ Ajuste de inventario';
      document.getElementById('historyDetailIntroV2').textContent=m.name||'Movimiento';
      if(m.type==='prep'){
        body.innerHTML=`<div class="history-detail-grid"><div class="history-detail-box full"><small>Producto</small><b>${escH(m.name||'')}</b></div><div class="history-detail-box"><small>Cantidad usada</small><b>${escH(`${m.qty??0} ${m.unit||''}`)}</b></div><div class="history-detail-box full"><small>Fecha</small><b>${escH(dateText(m))}</b></div></div>`;
      }else{
        body.innerHTML=`<div class="history-detail-grid"><div class="history-detail-box full"><small>Producto</small><b>${escH(m.name||'')}</b></div><div class="history-detail-box"><small>Antes</small><b>${escH(`${m.beforeQty??0} ${m.unit||''}`)}</b></div><div class="history-detail-box"><small>Después</small><b>${escH(`${m.afterQty??0} ${m.unit||''}`)}</b></div><div class="history-detail-box full"><small>Fecha</small><b>${escH(dateText(m))}</b></div></div>`;
      }
      edit.hidden=true;del.hidden=true;
    }
  }

  function openDetail(m){
    if(!m)return;
    activeId=m.id;
    renderView(m);
    modal.hidden=false;
  }

  function showEdit(){
    const m=getMove(activeId);if(!m||m.type!=='purchase'||!m.itemKey||!ITEMS?.[m.itemKey])return;
    const item=ITEMS[m.itemKey];
    const variable=Boolean(item.variableContentUnit);
    const factor=Number(m.contentPerUnit||item.factor||1);
    document.getElementById('historyDetailBodyV2').hidden=true;
    document.getElementById('historyViewActionsV2').hidden=true;
    document.getElementById('historyEditBodyV2').hidden=false;
    document.getElementById('historyEditActionsV2').hidden=false;
    document.getElementById('historyEditBodyV2').innerHTML=`<div class="history-edit-grid">
      <label class="full">Producto<input value="${escH(m.name||item.name)}" readonly></label>
      <label>Cantidad comprada<input id="historyQtyV2" type="number" min="0.01" step="0.01" value="${Number(m.qty||0)}"></label>
      <label>Presentación<input value="${escH(m.unit||item.purchaseEntryUnit||item.purchaseUnit||item.unit||'unidad')}" readonly></label>
      <label id="historyContentLabelV2" ${variable?'':'hidden'}>Contenido por unidad<input id="historyContentV2" type="number" min="0.001" step="0.001" value="${factor}"></label>
      <label>Precio por unidad<input id="historyUnitPriceV2" type="number" min="0" step="0.01" value="${unitPrice(m).toFixed(2)}"></label>
      <label class="full">Tienda<input id="historyStoreV2" value="${escH(m.store||'')}"></label>
    </div><div class="summary-box" id="historyEditPreviewV2"></div>`;
    const refresh=()=>{
      const qty=Number(document.getElementById('historyQtyV2')?.value||0),price=Number(document.getElementById('historyUnitPriceV2')?.value||0),content=variable?Number(document.getElementById('historyContentV2')?.value||0):Number(item.factor||1);
      document.getElementById('historyEditPreviewV2').innerHTML=`Nuevo total: <b>${money(qty*price)}</b><br>Inventario de esta compra: <b>${round3h(qty*content)} ${escH(item.unit||'')}</b>`;
    };
    ['historyQtyV2','historyContentV2','historyUnitPriceV2'].forEach(id=>document.getElementById(id)?.addEventListener('input',refresh));
    refresh();
  }

  async function saveEdit(){
    const m=getMove(activeId);if(!m||m.type!=='purchase'||!m.itemKey||!ITEMS?.[m.itemKey])return;
    const item=ITEMS[m.itemKey],qty=Number(document.getElementById('historyQtyV2')?.value||0),price=Number(document.getElementById('historyUnitPriceV2')?.value||0),store=document.getElementById('historyStoreV2')?.value.trim()||'Sin tienda';
    const variable=Boolean(item.variableContentUnit),factor=variable?Number(document.getElementById('historyContentV2')?.value||0):Number(item.factor||1);
    if(!(qty>0))return alert('Escribe una cantidad válida.');
    if(!(factor>0))return alert('Escribe cuánto trae cada unidad.');
    if(!Number.isFinite(price)||price<0)return alert('Escribe un precio válido.');
    const newInternal=round3h(qty*factor),newCost=Number((qty*price).toFixed(2)),ref=db.collection('movimientos').doc(activeId),button=document.getElementById('historyEditSaveV2');
    button.disabled=true;
    try{
      await db.runTransaction(async tx=>{
        const ms=await tx.get(ref),is=await tx.get(inventoryRef);
        if(!ms.exists)throw new Error('La compra ya no existe.');
        const live=ms.data(),key=live.itemKey;
        if(!key||!ITEMS?.[key])throw new Error('Esta compra no está vinculada al inventario.');
        const cur={...EMPTY,...(is.exists?(is.data().items||{}):{})},before=oldInternal(live),after=round3h(Number(cur[key]||0)+(newInternal-before));
        if(after<-.0001)throw new Error('No se puede reducir tanto esta compra porque parte del inventario ya se usó.');
        cur[key]=Math.max(0,after);
        tx.set(inventoryRef,{items:cur,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
        tx.update(ref,{qty,contentPerUnit:factor,contentUnit:item.variableContentUnit||live.contentUnit||item.unit||'',internalQty:newInternal,internalUnit:item.unit||'',unitPrice:Number(price.toFixed(4)),cost:newCost,store,editedAt:firebase.firestore.FieldValue.serverTimestamp()});
      });
      modal.hidden=true;toast('Compra corregida e inventario actualizado');
    }catch(e){console.error(e);alert(e.message||'No se pudo corregir la compra.')}finally{button.disabled=false;}
  }

  async function deletePurchase(){
    const m=getMove(activeId);if(!m||m.type!=='purchase'||!m.itemKey||!ITEMS?.[m.itemKey])return;
    if(!confirm(`¿Borrar la compra de ${m.name||ITEMS[m.itemKey].name}?\n\nTambién se restará del inventario lo que esta compra agregó.`))return;
    const ref=db.collection('movimientos').doc(activeId),button=document.getElementById('historyDeleteV2');
    button.disabled=true;
    try{
      await db.runTransaction(async tx=>{
        const ms=await tx.get(ref),is=await tx.get(inventoryRef);
        if(!ms.exists)return;
        const live=ms.data(),key=live.itemKey;
        if(!key||!ITEMS?.[key])throw new Error('Esta compra no está vinculada al inventario.');
        const cur={...EMPTY,...(is.exists?(is.data().items||{}):{})},after=round3h(Number(cur[key]||0)-oldInternal(live));
        if(after<-.0001)throw new Error('No se puede borrar esta compra porque parte de ese inventario ya se usó.');
        cur[key]=Math.max(0,after);
        tx.set(inventoryRef,{items:cur,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
        tx.delete(ref);
      });
      modal.hidden=true;toast('Compra borrada e inventario corregido');
    }catch(e){console.error(e);alert(e.message||'No se pudo borrar la compra.')}finally{button.disabled=false;}
  }

  // Click robusto: no depende de agregar atributos a las tarjetas.
  document.addEventListener('click',e=>{
    const row=e.target.closest('#historyList .movement');
    if(!row)return;
    const rows=[...document.querySelectorAll('#historyList .movement')];
    const index=rows.indexOf(row);
    if(index<0)return;
    openDetail((movements||[])[index]);
  });

  document.addEventListener('keydown',e=>{
    if(e.key!=='Enter'&&e.key!==' ')return;
    const row=e.target.closest?.('#historyList .movement');
    if(!row)return;
    e.preventDefault();
    const rows=[...document.querySelectorAll('#historyList .movement')],index=rows.indexOf(row);
    if(index>=0)openDetail((movements||[])[index]);
  });

  document.getElementById('historyCloseV2').onclick=()=>modal.hidden=true;
  document.getElementById('historyEditV2').onclick=showEdit;
  document.getElementById('historyDeleteV2').onclick=deletePurchase;
  document.getElementById('historyEditCancelV2').onclick=()=>{const m=getMove(activeId);if(m)renderView(m)};
  document.getElementById('historyEditSaveV2').onclick=saveEdit;
  modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true});
})();