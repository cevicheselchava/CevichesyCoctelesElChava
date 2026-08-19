(()=>{
  if(window.__EL_CUBANO_HISTORY_ACTIONS__)return;
  window.__EL_CUBANO_HISTORY_ACTIONS__=true;

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const round=n=>Math.round((Number(n)+Number.EPSILON)*1000)/1000;

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
    .history-modal-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
    .history-modal-actions button{border:0;border-radius:12px;padding:13px;font-weight:1000}
    @media(max-width:560px){.history-detail-grid,.history-edit-grid{grid-template-columns:1fr}.history-detail-box.full,.history-edit-grid .full{grid-column:1}}
  `;
  document.head.appendChild(style);

  const modal=document.createElement('div');
  modal.className='modal';
  modal.id='historyDetailModal';
  modal.hidden=true;
  modal.innerHTML=`<section class="sheet">
    <h2 id="historyDetailTitle">Detalle</h2>
    <p id="historyDetailIntro"></p>
    <div id="historyDetailBody"></div>
    <div id="historyEditBody" hidden></div>
    <div class="history-modal-actions" id="historyViewActions">
      <button class="secondary" id="historyClose">Cerrar</button>
      <button class="warning-btn" id="historyEdit" hidden>✏️ Editar compra</button>
      <button class="danger" id="historyDelete" hidden>🗑️ Borrar compra</button>
    </div>
    <div class="history-modal-actions" id="historyEditActions" hidden>
      <button class="secondary" id="historyEditCancel">Cancelar</button>
      <button class="primary" id="historyEditSave">Guardar cambios</button>
    </div>
  </section>`;
  document.body.appendChild(modal);

  let activeId='';

  function getMove(id){return (movements||[]).find(x=>x.id===id)}
  function itemFor(m){return ITEMS?.[m?.itemKey]||null}
  function dateText(m){
    const d=typeof timestampDate==='function'?timestampDate(m?.date):null;
    return d?d.toLocaleString('es-MX',{dateStyle:'medium',timeStyle:'short'}):'Sin fecha';
  }
  function oldInternal(m){
    const stored=Number(m?.internalQty);
    if(Number.isFinite(stored))return round(stored);
    const qty=Number(m?.qty||0),factor=Number(m?.contentPerUnit||itemFor(m)?.factor||1);
    return round(qty*factor);
  }
  function contentUnit(m){return String(m?.contentUnit||itemFor(m)?.unit||'').trim()}
  function unitPrice(m){
    const u=Number(m?.unitPrice);
    if(Number.isFinite(u))return u;
    const q=Number(m?.qty||0),c=Number(m?.cost||0);
    return q>0?c/q:0;
  }
  function presentationText(m){
    const qty=Number(m?.qty||0),unit=String(m?.unit||itemFor(m)?.purchaseEntryUnit||itemFor(m)?.purchaseUnit||'unidad');
    const factor=Number(m?.contentPerUnit);
    const cunit=contentUnit(m);
    return Number.isFinite(factor)&&factor>0&&cunit?`${qty} ${unit} · ${factor} ${cunit} c/u`:`${qty} ${unit}`;
  }

  function renderView(m){
    const body=document.getElementById('historyDetailBody');
    const edit=document.getElementById('historyEdit');
    const del=document.getElementById('historyDelete');
    document.getElementById('historyEditBody').hidden=true;
    document.getElementById('historyDetailBody').hidden=false;
    document.getElementById('historyViewActions').hidden=false;
    document.getElementById('historyEditActions').hidden=true;

    if(m.type==='purchase'){
      document.getElementById('historyDetailTitle').textContent='🛒 Compra';
      document.getElementById('historyDetailIntro').textContent=m.name||'Compra registrada';
      body.innerHTML=`<div class="history-detail-grid">
        <div class="history-detail-box full"><small>Producto</small><b>${esc(m.name||itemFor(m)?.name||'')}</b></div>
        <div class="history-detail-box"><small>Cantidad / presentación</small><b>${esc(presentationText(m))}</b></div>
        <div class="history-detail-box"><small>Precio por ${esc(m.unit||'unidad')}</small><b>${money(unitPrice(m))}</b></div>
        <div class="history-detail-box"><small>Total pagado</small><b>${money(m.cost)}</b></div>
        <div class="history-detail-box"><small>Tienda</small><b>${esc(m.store||'Sin tienda')}</b></div>
        <div class="history-detail-box full"><small>Fecha</small><b>${esc(dateText(m))}</b></div>
      </div>${m.itemKey&&ITEMS[m.itemKey]?'':'<div class="notice" style="margin-top:12px">Esta compra es de una versión anterior y no tiene vínculo suficiente con inventario para editarla o borrarla con seguridad.</div>'}`;
      const canChange=Boolean(m.itemKey&&ITEMS[m.itemKey]);
      edit.hidden=!canChange;
      del.hidden=!canChange;
    }else if(m.type==='sale'){
      document.getElementById('historyDetailTitle').textContent='💵 Venta entregada';
      document.getElementById('historyDetailIntro').textContent=m.name||'Pedido';
      body.innerHTML=`<div class="history-detail-grid">
        <div class="history-detail-box"><small>Venta</small><b>${money(m.total)}</b></div>
        <div class="history-detail-box"><small>Costo</small><b>${m.cost==null?'Pendiente':money(m.cost)}</b></div>
        <div class="history-detail-box"><small>Utilidad</small><b>${m.profit==null?'Pendiente':money(m.profit)}</b></div>
        <div class="history-detail-box"><small>Pago</small><b>${esc(m.payment||'No indicado')}</b></div>
        <div class="history-detail-box full"><small>Fecha</small><b>${esc(dateText(m))}</b></div>
      </div>`;
      edit.hidden=true;del.hidden=true;
    }else{
      document.getElementById('historyDetailTitle').textContent='✏️ Ajuste de inventario';
      document.getElementById('historyDetailIntro').textContent=m.name||'Ajuste';
      body.innerHTML=`<div class="history-detail-grid">
        <div class="history-detail-box full"><small>Producto</small><b>${esc(m.name||'')}</b></div>
        <div class="history-detail-box"><small>Antes</small><b>${esc(`${m.beforeQty??0} ${m.unit||''}`)}</b></div>
        <div class="history-detail-box"><small>Después</small><b>${esc(`${m.afterQty??0} ${m.unit||''}`)}</b></div>
        <div class="history-detail-box full"><small>Fecha</small><b>${esc(dateText(m))}</b></div>
      </div>`;
      edit.hidden=true;del.hidden=true;
    }
  }

  function openDetail(id){
    const m=getMove(id);if(!m)return;
    activeId=id;
    renderView(m);
    modal.hidden=false;
  }

  function showEdit(){
    const m=getMove(activeId);if(!m||m.type!=='purchase'||!m.itemKey||!ITEMS[m.itemKey])return;
    const item=ITEMS[m.itemKey],factor=Number(m.contentPerUnit||item.factor||1),variable=Boolean(item.variableContentUnit)||Number.isFinite(Number(m.contentPerUnit));
    document.getElementById('historyDetailBody').hidden=true;
    document.getElementById('historyViewActions').hidden=true;
    document.getElementById('historyEditBody').hidden=false;
    document.getElementById('historyEditActions').hidden=false;
    document.getElementById('historyEditBody').innerHTML=`<div class="history-edit-grid">
      <label class="full">Producto<input value="${esc(m.name||item.name)}" readonly></label>
      <label>Cantidad comprada<input id="historyQty" type="number" min="0.01" step="0.01" value="${Number(m.qty||0)}"></label>
      <label>Presentación<input value="${esc(m.unit||item.purchaseEntryUnit||item.purchaseUnit||item.unit||'unidad')}" readonly></label>
      <label id="historyContentLabel" ${variable?'':'hidden'}>Contenido por unidad<input id="historyContent" type="number" min="0.001" step="0.001" value="${factor}"></label>
      <label>Precio por unidad<input id="historyUnitPrice" type="number" min="0" step="0.01" value="${unitPrice(m).toFixed(2)}"></label>
      <label class="full">Tienda<input id="historyStore" value="${esc(m.store||'')}"></label>
    </div><div class="summary-box" id="historyEditPreview"></div>`;
    const refresh=()=>{
      const qty=Number(document.getElementById('historyQty')?.value||0),price=Number(document.getElementById('historyUnitPrice')?.value||0),content=variable?Number(document.getElementById('historyContent')?.value||0):Number(item.factor||1);
      const internal=round(qty*content);
      document.getElementById('historyEditPreview').innerHTML=`Nuevo total: <b>${money(qty*price)}</b><br>Inventario que corresponde a esta compra: <b>${internal} ${esc(item.unit||'')}</b>`;
    };
    ['historyQty','historyContent','historyUnitPrice'].forEach(id=>document.getElementById(id)?.addEventListener('input',refresh));
    refresh();
  }

  async function saveEdit(){
    const m=getMove(activeId);if(!m||m.type!=='purchase'||!m.itemKey||!ITEMS[m.itemKey])return;
    const item=ITEMS[m.itemKey],qty=Number(document.getElementById('historyQty')?.value||0),price=Number(document.getElementById('historyUnitPrice')?.value||0),store=document.getElementById('historyStore')?.value.trim()||'Sin tienda';
    const hasContent=Boolean(item.variableContentUnit)||Number.isFinite(Number(m.contentPerUnit));
    const factor=hasContent?Number(document.getElementById('historyContent')?.value||0):Number(item.factor||1);
    if(!(qty>0))return alert('Escribe una cantidad válida.');
    if(!(factor>0))return alert('Escribe cuánto trae cada unidad.');
    if(!Number.isFinite(price)||price<0)return alert('Escribe un precio válido.');
    const newInternal=round(qty*factor),newCost=Number((qty*price).toFixed(2)),ref=db.collection('movimientos').doc(activeId),button=document.getElementById('historyEditSave');
    button.disabled=true;
    try{
      await db.runTransaction(async tx=>{
        const ms=await tx.get(ref),is=await tx.get(inventoryRef);
        if(!ms.exists)throw new Error('La compra ya no existe.');
        const live=ms.data(),key=live.itemKey;
        if(!key||!ITEMS[key])throw new Error('Esta compra no se puede vincular al inventario.');
        const cur={...EMPTY,...(is.exists?(is.data().items||{}):{})},before=oldInternal(live),delta=round(newInternal-before),after=round(Number(cur[key]||0)+delta);
        if(after<-.0001)throw new Error('No se puede reducir tanto esta compra porque parte de ese inventario ya se usó.');
        cur[key]=Math.max(0,after);
        tx.set(inventoryRef,{items:cur,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
        tx.update(ref,{qty,contentPerUnit:factor,contentUnit:item.variableContentUnit||live.contentUnit||item.unit||'',internalQty:newInternal,internalUnit:item.unit||'',unitPrice:Number(price.toFixed(4)),cost:newCost,store,editedAt:firebase.firestore.FieldValue.serverTimestamp()});
      });
      modal.hidden=true;
      toast('Compra corregida e inventario actualizado');
    }catch(e){console.error(e);alert(e.message||'No se pudo corregir la compra.')}finally{button.disabled=false;}
  }

  async function deletePurchase(){
    const m=getMove(activeId);if(!m||m.type!=='purchase'||!m.itemKey||!ITEMS[m.itemKey])return;
    if(!confirm(`¿Borrar la compra de ${m.name||ITEMS[m.itemKey].name}?\n\nTambién se restará del inventario lo que esta compra agregó.`))return;
    const ref=db.collection('movimientos').doc(activeId),button=document.getElementById('historyDelete');
    button.disabled=true;
    try{
      await db.runTransaction(async tx=>{
        const ms=await tx.get(ref),is=await tx.get(inventoryRef);
        if(!ms.exists)return;
        const live=ms.data(),key=live.itemKey;
        if(!key||!ITEMS[key])throw new Error('Esta compra no se puede vincular al inventario.');
        const cur={...EMPTY,...(is.exists?(is.data().items||{}):{})},remove=oldInternal(live),after=round(Number(cur[key]||0)-remove);
        if(after<-.0001)throw new Error('No se puede borrar esta compra porque parte de ese inventario ya se usó.');
        cur[key]=Math.max(0,after);
        tx.set(inventoryRef,{items:cur,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
        tx.delete(ref);
      });
      modal.hidden=true;
      toast('Compra borrada e inventario corregido');
    }catch(e){console.error(e);alert(e.message||'No se pudo borrar la compra.')}finally{button.disabled=false;}
  }

  function decorateHistory(){
    const rows=[...document.querySelectorAll('#historyList .movement')];
    rows.forEach((row,i)=>{
      const m=(movements||[])[i];if(!m)return;
      row.dataset.historyId=m.id;
      row.setAttribute('role','button');
      row.setAttribute('tabindex','0');
      row.setAttribute('aria-label','Abrir detalle del movimiento');
    });
  }

  const baseRenderHistory=renderHistory;
  renderHistory=function(...args){const out=baseRenderHistory.apply(this,args);queueMicrotask(decorateHistory);return out};

  const root=document.getElementById('historyList');
  root?.addEventListener('click',e=>{const row=e.target.closest('.movement[data-history-id]');if(row)openDetail(row.dataset.historyId)});
  root?.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const row=e.target.closest('.movement[data-history-id]');if(!row)return;e.preventDefault();openDetail(row.dataset.historyId)});
  modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true});
  document.getElementById('historyClose').onclick=()=>modal.hidden=true;
  document.getElementById('historyEdit').onclick=showEdit;
  document.getElementById('historyDelete').onclick=deletePurchase;
  document.getElementById('historyEditCancel').onclick=()=>{const m=getMove(activeId);if(m)renderView(m)};
  document.getElementById('historyEditSave').onclick=saveEdit;

  decorateHistory();
})();