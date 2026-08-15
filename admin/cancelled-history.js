(()=>{
  if(window.__EL_CUBANO_CANCELLED_HISTORY_V1__)return;
  window.__EL_CUBANO_CANCELLED_HISTORY_V1__=true;

  function cancelledDate(o){
    const v=o?.cancelledAt||o?.createdAt||o?.createdAtClient;
    if(!v)return null;
    if(typeof v.toDate==='function')return v.toDate();
    const d=new Date(v);
    return Number.isNaN(d.getTime())?null:d;
  }

  const originalRenderOrders=window.renderOrders;
  const originalRenderHistory=window.renderHistory;
  if(typeof originalRenderOrders!=='function'||typeof originalRenderHistory!=='function')return;

  window.renderOrders=function(){
    const hidden=[];
    for(let i=orders.length-1;i>=0;i--){
      if(orders[i]?.status==='cancelado')hidden.unshift(orders.splice(i,1)[0]);
    }
    try{return originalRenderOrders();}
    finally{if(hidden.length)orders.push(...hidden);}
  };

  window.renderHistory=function(){
    originalRenderHistory();
    const list=document.getElementById('historyList');
    if(!list)return;
    const cancelled=orders.filter(o=>o?.status==='cancelado').sort((a,b)=>{
      const ad=cancelledDate(a)?.getTime()||0,bd=cancelledDate(b)?.getTime()||0;
      return bd-ad;
    });
    if(!cancelled.length)return;

    if(list.querySelector('.empty'))list.innerHTML='';
    const wrap=document.createElement('section');
    wrap.className='cancelled-history-block';
    wrap.innerHTML='<h3 style="margin:4px 0 9px;color:#8c2424">Pedidos cancelados</h3>';
    cancelled.forEach(o=>{
      const d=cancelledDate(o);
      const when=d?d.toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'}):'';
      const row=document.createElement('div');
      row.className='movement';
      row.innerHTML=`<div><strong>Pedido cancelado · ${orderTitle(o)}</strong><small>${o.customer||'Cliente'}${when?` · ${when}`:''}<br>${o.deliveryDate||''} ${o.time||''}</small></div><div class="money" style="color:#8c2424">${money(o.total)}</div>`;
      wrap.appendChild(row);
    });
    list.prepend(wrap);
  };

  try{renderAll();}catch(e){console.error('No se pudo actualizar la vista de cancelados:',e);}
})();