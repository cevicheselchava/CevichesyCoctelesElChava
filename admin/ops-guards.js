(()=>{
  if(window.__EL_CUBANO_OPS_GUARDS_V1__) return;
  window.__EL_CUBANO_OPS_GUARDS_V1__=true;

  const doc=document;
  const SLOT_MINUTES=30;

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

  const originalSetStatus=window.setStatus;
  if(typeof originalSetStatus==='function'){
    window.setStatus=async function(id,next){
      if(next!=='confirmado')return originalSetStatus(id,next);
      let order=null;
      try{order=orders.find(o=>o.id===id)||null;}catch(_){ }
      if(!order||['entregado','cancelado'].includes(order.status))return;
      const warnings=inventoryWarnings(order,id);
      if(warnings.length){
        const ok=confirm(`Aviso de inventario:\n\n${warnings.join('\n')}\n\n¿Confirmar el pedido de todos modos?`);
        if(!ok)return;
      }
      try{
        await db.collection('pedidos').doc(id).update({status:'confirmado',confirmedAt:firebase.firestore.FieldValue.serverTimestamp()});
        if(typeof toast==='function')toast(warnings.length?'Pedido confirmado con aviso de inventario':'Ingredientes apartados');
      }catch(e){
        console.error(e);
        if(typeof showError==='function')showError(e);
        alert('No se pudo confirmar el pedido.');
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
  style.textContent='.route-block.slot-conflict .route-block-title{background:#ffe2e2!important;color:#94151b!important}.slot-conflict-badge{display:inline-block;margin-left:7px;padding:3px 7px;border-radius:999px;background:#94151b;color:#fff;font-size:11px;font-weight:1000;vertical-align:middle}';
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