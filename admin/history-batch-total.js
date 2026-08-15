(()=>{
  if(window.__EL_CUBANO_HISTORY_BATCH_TOTAL_V2__)return;
  window.__EL_CUBANO_HISTORY_BATCH_TOTAL_V2__=true;

  const style=document.createElement('style');
  style.id='el-cubano-history-total-v2-style';
  style.textContent=`
    #historyPurchaseSummary{margin:0 0 14px;padding:15px 16px;border-radius:18px;border:1px solid #b9d9bf;border-left:6px solid #267642;background:linear-gradient(135deg,#eef9ef,#fffdf4);box-shadow:0 7px 18px rgba(18,52,88,.07)}
    #historyPurchaseSummary .history-total-label{font-size:12px;font-weight:1000;letter-spacing:.05em;color:#667184}
    #historyPurchaseSummary .history-total-row{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-top:5px}
    #historyPurchaseSummary .history-total-title{font-size:18px;line-height:1.2;font-weight:1000;color:#123458}
    #historyPurchaseSummary .history-total-meta{margin-top:5px;color:#687386;font-size:13px;font-weight:800;line-height:1.35}
    #historyPurchaseSummary .history-total-money{font-size:30px;line-height:1;font-weight:1000;color:#267642;white-space:nowrap}
    @media(max-width:430px){#historyPurchaseSummary .history-total-row{align-items:flex-start;flex-direction:column}#historyPurchaseSummary .history-total-money{font-size:32px}}
  `;
  document.head.appendChild(style);

  function esc(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));}
  function fmtMoney(value){return '$'+Number(value||0).toFixed(2);}
  function toDate(value){
    try{
      if(!value)return null;
      if(typeof value.toDate==='function')return value.toDate();
      const d=new Date(value);
      return isNaN(d)?null:d;
    }catch{return null;}
  }

  function getLatestBatch(){
    try{
      if(typeof movements==='undefined'||!Array.isArray(movements))return null;
      const purchases=movements.filter(m=>m&&m.type==='purchase'&&m.batchId);
      if(!purchases.length)return null;
      const latestId=purchases[0].batchId;
      const lines=purchases.filter(m=>m.batchId===latestId);
      if(!lines.length)return null;
      const total=lines.reduce((sum,line)=>sum+Number(line.cost||0),0);
      const stores=[...new Set(lines.map(line=>String(line.store||'Sin tienda').trim()).filter(Boolean))];
      const date=toDate(lines[0]?.date);
      return {id:latestId,lines,total,store:stores.length===1?stores[0]:stores.join(' + '),date};
    }catch(error){
      console.error('No se pudo calcular el total de la compra:',error);
      return null;
    }
  }

  function ensureSummary(){
    const history=document.getElementById('history');
    const list=document.getElementById('historyList');
    const card=list?.closest('.card');
    if(!history||!list||!card)return;

    let box=document.getElementById('historyPurchaseSummary');
    if(!box){
      box=document.createElement('div');
      box.id='historyPurchaseSummary';
      card.insertBefore(box,list);
    }

    const batch=getLatestBatch();
    if(!batch){box.hidden=true;return;}
    box.hidden=false;
    const label=batch.date?batch.date.toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'}):'';
    const next=`<div class="history-total-label">🧾 TOTAL DE LA ÚLTIMA COMPRA</div><div class="history-total-row"><div><div class="history-total-title">${esc(batch.store||'Sin tienda')}</div><div class="history-total-meta">${batch.lines.length} producto${batch.lines.length===1?'':'s'}${label?` · ${esc(label)}`:''}<br>Este es el total calculado por el panel.</div></div><div class="history-total-money">${fmtMoney(batch.total)}</div></div>`;
    if(box.innerHTML!==next)box.innerHTML=next;
  }

  let queued=false;
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;ensureSummary();});
  }

  schedule();
  setTimeout(schedule,400);
  setTimeout(schedule,1200);
  setInterval(schedule,2000);
  const observer=new MutationObserver(schedule);
  observer.observe(document.body,{childList:true,subtree:true});
})();