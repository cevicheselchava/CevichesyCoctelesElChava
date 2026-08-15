(()=>{
  if(window.__EL_CUBANO_HISTORY_BATCH_TOTAL_V1__)return;
  window.__EL_CUBANO_HISTORY_BATCH_TOTAL_V1__=true;

  function safeMoney(value){
    try{return typeof money==='function'?money(value):'$'+Number(value||0).toFixed(2);}catch{return '$'+Number(value||0).toFixed(2);}
  }
  function safeDate(value){
    try{
      const d=typeof timestampDate==='function'?timestampDate(value):(value?.toDate?value.toDate():new Date(value));
      return d&&!isNaN(d)?d.toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'}):'';
    }catch{return '';}
  }
  function escapeHtml(value){
    return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
  }

  function groupedHistory(){
    const list=document.getElementById('historyList');
    if(!list)return;
    if(typeof movements==='undefined'||!Array.isArray(movements)||!movements.length){
      list.innerHTML='<div class="empty">Todavía no hay movimientos.</div>';
      return;
    }

    const purchaseBatches=new Map();
    movements.forEach((m,index)=>{
      if(m?.type!=='purchase'||!m.batchId)return;
      if(!purchaseBatches.has(m.batchId))purchaseBatches.set(m.batchId,{firstIndex:index,lines:[]});
      purchaseBatches.get(m.batchId).lines.push(m);
    });

    const renderedBatches=new Set();
    const html=[];
    movements.forEach((m,index)=>{
      if(m?.type==='purchase'&&m.batchId){
        if(renderedBatches.has(m.batchId))return;
        renderedBatches.add(m.batchId);
        const batch=purchaseBatches.get(m.batchId);
        const lines=batch?.lines||[m];
        const total=lines.reduce((sum,line)=>sum+Number(line.cost||0),0);
        const stores=[...new Set(lines.map(line=>String(line.store||'Sin tienda').trim()).filter(Boolean))];
        const store=stores.length===1?stores[0]:stores.join(' + ');
        const label=safeDate(lines[0]?.date);
        const details=lines.map(line=>{
          const qty=line.qty!==undefined&&line.qty!==null?`${line.qty} ${line.unit||''}`.trim():'';
          return `${escapeHtml(line.name||'Producto')}${qty?` · ${escapeHtml(qty)}`:''} · ${safeMoney(line.cost)}`;
        }).join('<br>');
        html.push(`<div class="movement purchase-batch-total"><div><strong>🧾 Compra completa · ${escapeHtml(store||'Sin tienda')}</strong><small>${lines.length} producto${lines.length===1?'':'s'} · ${escapeHtml(label)}<br>${details}</small></div><div class="money">-${safeMoney(total)}</div></div>`);
        return;
      }

      const label=safeDate(m?.date);
      if(m?.type==='sale'){
        html.push(`<div class="movement"><div><strong>Venta entregada · ${escapeHtml(m.name||'Pedido')}</strong><small>${escapeHtml(label)}<br>Costo ${safeMoney(m.cost)} · Utilidad ${safeMoney(m.profit)}</small></div><div class="money">${safeMoney(m.total)}</div></div>`);
      }else{
        html.push(`<div class="movement"><div><strong>Compra · ${escapeHtml(m?.name||'Producto')}</strong><small>${escapeHtml(m?.qty??'')} ${escapeHtml(m?.unit||'')} · ${escapeHtml(m?.store||'Sin tienda')} · ${escapeHtml(label)}</small></div><div class="money">-${safeMoney(m?.cost)}</div></div>`);
      }
    });
    list.innerHTML=html.join('');
  }

  function install(){
    try{
      if(typeof renderHistory==='function')renderHistory=groupedHistory;
      groupedHistory();
    }catch(error){console.error('No se pudo agrupar el historial de compras:',error);}
  }

  install();
  setTimeout(install,500);
  setTimeout(install,1500);
})();