(()=>{
  if(window.__EL_CUBANO_OPS_GUARDS_V2__) return;
  window.__EL_CUBANO_OPS_GUARDS_V2__=true;

  const doc=document;

  function parseSlotMinutes(value){
    const s=String(value||'').toLowerCase();
    const m=s.match(/(\d{1,2}):(\d{2})\s*(a\.?\s*m\.?|p\.?\s*m\.?)?/);
    if(!m)return null;
    let h=Number(m[1]),min=Number(m[2]);
    const period=(m[3]||'').replace(/\s|\./g,'');
    if(period==='pm'&&h<12)h+=12;
    if(period==='am'&&h===12)h=0;
    return h*60+min;
  }

  function itemLabel(k){
    try{return ITEMS[k]?.name||k;}catch(_){return k;}
  }
  function itemUnit(k){
    try{return ITEMS[k]?.unit||'';}catch(_){return '';}
  }
  function itemLow(k){
    try{return Number(ITEMS[k]?.low||0);}catch(_){return 0;}
  }
  function niceNumber(n){
    const x=Math.round((Number(n)+Number.EPSILON)*1000)/1000;
    return Number.isInteger(x)?String(x):String(x);
  }

  function inventoryWarnings(order,id){
    if(!order)return [];
    let res={};
    try{res=reserved(id)||{};}catch(_){res={};}
    const lines=[];
    Object.entries(order.recipe||{}).forEach(([k,v])=>{
      const need=Number(v)||0;
      let total=0;
      try{total=Number(inventory[k]||0);}catch(_){total=0;}
      const free=total-Number(res[k]||0);
      const after=free-need;
      if(after<0){
        lines.push(`⛔ ${itemLabel(k)}: faltan ${niceNumber(Math.abs(after))} ${itemUnit(k)}`.trim());
      }else if(after<=itemLow(k)){
        lines.push(`⚠️ ${itemLabel(k)}: quedarían ${niceNumber(after)} ${itemUnit(k)}`.trim());
      }
    });
    return lines;
  }

  function askInventoryConfirmation(lines){
    return new Promise(resolve=>{
      const old=doc.getElementById('inventoryConfirmOverlay');
      if(old)old.remove();
      const overlay=doc.createElement('div');
      overlay.id='inventoryConfirmOverlay';
      overlay.innerHTML=`
        <div class="inv-confirm-card" role="dialog" aria-modal="true">
          <h3>⚠️ Aviso de inventario</h3>
          <p>Puedes confirmar el pedido aunque falte producto.</p>
          <div class="inv-confirm-list">${lines.map(x=>`<div>${x}</div>`).join('')}</div>
          <div class="inv-confirm-actions">
            <button type="button" class="inv-confirm-cancel">Cancelar</button>
            <button type="button" class="inv-confirm-ok">Confirmar de todos modos</button>
          </div>
        </div>`;
      const finish=value=>{overlay.remove();resolve(value);};
      overlay.querySelector('.inv-confirm-cancel').onclick=()=>finish(false);
      overlay.querySelector('.inv-confirm-ok').onclick=()=>finish(true);
      overlay.addEventListener('click',e=>{if(e.target===overlay)finish(false);});
      doc.body.appendChild(overlay);
    });
  }

  function setConfirmBusy(id,busy){
    doc.querySelectorAll('button').forEach(btn=>{
      const code=btn.getAttribute('onclick')||'';
      if(!code.includes(id)||!code.includes('confirm'))return;
      if(busy){
        if(!btn.dataset.oldText)btn.dataset.oldText=btn.textContent;
        btn.disabled=true;
        btn.textContent='Confirmando...';
      }else{
        btn.disabled=false;
        if(btn.dataset.oldText){btn.textContent=btn.dataset.oldText;delete btn.dataset.oldText;}
      }
    });
  }

  function withTimeout(promise,ms){
    return Promise.race([
      promise,
      new Promise((_,reject)=>setTimeout(()=>reject(new Error('TIMEOUT_CONFIRM')),ms))
    ]);
  }

  const originalSetStatus=window.setStatus;
  if(typeof originalSetStatus==='function'){
    window.setStatus=async function(id,next){
      if(next!=='confirmado')return originalSetStatus(id,next);
      let order=null;
      try{order=orders.find(o=>o.id===id)||null;}catch(_){ }
      if(!order||['entregado','cancelado'].includes(order.status))return;

      const warnings=inventoryWarnings(order,id);
      if(warnings.length){
        const ok=await askInventoryConfirmation(warnings);
        if(!ok)return;
      }

      setConfirmBusy(id,true);
      try{
        await withTimeout(
          db.collection('pedidos').doc(id).update({
            status:'confirmado',
            confirmedAt:firebase.firestore.FieldValue.serverTimestamp(),
            inventoryWarningAccepted:warnings.length>0
          }),
          8000
        );
        if(typeof toast==='function')toast(warnings.length?'Pedido confirmado aunque falte inventario':'Ingredientes apartados');
      }catch(e){
        console.error(e);
        if(e?.message==='TIMEOUT_CONFIRM'){
          alert('La confirmación tardó demasiado. Revisa la conexión e inténtalo otra vez.');
        }else{
          if(typeof showError==='function')showError(e);
          alert('No se pudo confirmar el pedido.');
        }
        setConfirmBusy(id,false);
      }
    };
    window.confirmRouteOrder=id=>window.setStatus(id,'confirmado');
  }

  async function occupiedStarts(deliveryDate,exceptId=null){
    if(!deliveryDate||typeof db==='undefined')return new Set();
    try{
      const snap=await db.collection('pedidos').where('deliveryDate','==',deliveryDate).get();
      const out=new Set();
      snap.forEach(d=>{
        if(d.id===exceptId)return;
        const o=d.data()||{};
        if(o.status==='cancelado')return;
        const start=parseSlotMinutes(o.time);
        if(start!==null)out.add(start);
      });
      return out;
    }catch(e){
      console.error('No se pudieron consultar los horarios ocupados:',e);
      return new Set();
    }
  }

  async function refreshManualSlots(){
    const date=doc.getElementById('moDate');
    const sel=doc.getElementById('moTime');
    if(!date||!sel||!date.value)return;
    const previous=sel.value;
    const occupied=await occupiedStarts(date.value);
    [...sel.options].forEach(o=>{
      if(!o.dataset.baseText)o.dataset.baseText=o.textContent;
      const start=parseSlotMinutes(o.value);
      const busy=start!==null&&occupied.has(start);
      o.disabled=busy;
      o.textContent=busy?`${o.dataset.baseText} — OCUPADO`:o.dataset.baseText;
    });
    const current=[...sel.options].find(o=>o.value===previous);
    if(current&&!current.disabled)sel.value=previous;
    else{
      const first=[...sel.options].find(o=>!o.disabled);
      if(first)sel.value=first.value;
    }
  }

  const saveBtn=doc.getElementById('saveManualOrder');
  if(saveBtn&&typeof saveBtn.onclick==='function'){
    const originalSave=saveBtn.onclick;
    saveBtn.onclick=async function(event){
      const date=doc.getElementById('moDate')?.value||'';
      const time=doc.getElementById('moTime')?.value||'';
      if(date&&time){
        const occupied=await occupiedStarts(date);
        const start=parseSlotMinutes(time);
        if(start!==null&&occupied.has(start)){
          alert('Ese horario ya tiene una entrega. Elige otro bloque de 30 minutos.');
          await refreshManualSlots();
          return;
        }
      }
      return originalSave.call(this,event);
    };
  }

  doc.getElementById('moDate')?.addEventListener('change',refreshManualSlots);
  doc.getElementById('openManualOrder')?.addEventListener('click',()=>setTimeout(refreshManualSlots,60));
  setTimeout(refreshManualSlots,350);

  const style=doc.createElement('style');
  style.textContent=`
    #inventoryConfirmOverlay{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.48);display:grid;place-items:center;padding:18px}
    .inv-confirm-card{width:min(100%,560px);max-height:84vh;overflow:auto;background:#fff;border-radius:22px;padding:18px;box-shadow:0 20px 60px rgba(0,0,0,.3)}
    .inv-confirm-card h3{margin:0 0 7px;color:#9a171b;font-size:22px}.inv-confirm-card p{margin:0 0 12px;color:#536071;font-weight:800}
    .inv-confirm-list{display:grid;gap:7px;background:#fff5d7;border:1px solid #eed49c;border-radius:13px;padding:12px;color:#704b00;font-weight:900;line-height:1.35}
    .inv-confirm-actions{display:grid;grid-template-columns:1fr 1.4fr;gap:8px;margin-top:14px}.inv-confirm-actions button{border:0;border-radius:12px;padding:13px;font-weight:1000}
    .inv-confirm-cancel{background:#e9edf3;color:#06254d}.inv-confirm-ok{background:#218b39;color:#fff}
    .route-block.slot-conflict .route-block-title{background:#ffe2e2!important;color:#94151b!important}.slot-conflict-badge{display:inline-block;margin-left:7px;padding:3px 7px;border-radius:999px;background:#94151b;color:#fff;font-size:11px;font-weight:1000;vertical-align:middle}
  `;
  doc.head.appendChild(style);

  function markRouteConflicts(){
    const root=doc.getElementById('routeList');
    if(!root)return;
    root.querySelectorAll('.route-block').forEach(block=>{
      const cards=block.querySelectorAll('.route-card');
      const title=block.querySelector('.route-block-title');
      if(!title)return;
      title.querySelector('.slot-conflict-badge')?.remove();
      const conflict=cards.length>1;
      block.classList.toggle('slot-conflict',conflict);
      if(conflict){
        const badge=doc.createElement('span');
        badge.className='slot-conflict-badge';
        badge.textContent=`⚠️ ${cards.length} ENTREGAS`;
        title.appendChild(badge);
      }
    });
  }

  const routeList=doc.getElementById('routeList');
  if(routeList){
    new MutationObserver(markRouteConflicts).observe(routeList,{childList:true,subtree:true});
    setTimeout(markRouteConflicts,400);
  }
})();