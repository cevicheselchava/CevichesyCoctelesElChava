(()=>{
  if(window.__EL_CUBANO_ORDER_TOTALS_V1__)return;
  window.__EL_CUBANO_ORDER_TOTALS_V1__=true;

  const pendingStat=document.getElementById('statPending')?.closest('.stat');
  if(pendingStat)pendingStat.hidden=true;
  const stats=document.querySelector('.stats');
  if(stats)stats.classList.add('order-totals-no-pending');

  const style=document.createElement('style');
  style.textContent=`
    .order-totals-summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 10px}
    .order-total-box{border:1px solid #d8cfbf;border-radius:13px;padding:12px 9px;background:linear-gradient(145deg,#fff,#f7f3e8);text-align:center;box-shadow:0 4px 12px rgba(22,50,72,.07)}
    .order-total-box span{display:block;color:#123458;font-size:13px;font-weight:1000}
    .order-total-box b{display:block;margin-top:5px;color:#174f2b;font-size:26px;line-height:1}
    @media(min-width:760px){.stats.order-totals-no-pending{grid-template-columns:repeat(3,minmax(0,1fr))}}
  `;
  document.head.appendChild(style);

  const filters=document.querySelector('#orders .orders-status-filter');
  if(!filters||typeof renderOrders!=='function')return;

  let summary=document.getElementById('orderTotalsSummary');
  if(!summary){
    summary=document.createElement('div');
    summary.id='orderTotalsSummary';
    summary.className='order-totals-summary';
    summary.innerHTML=`
      <div class="order-total-box"><span>PEDIDOS TOTALES</span><b id="ordersTotalCount">0</b></div>
      <div class="order-total-box"><span>LIBRAS TOTALES</span><b id="ordersTotalPounds">0 lb</b></div>
    `;
    filters.insertAdjacentElement('afterend',summary);
  }

  const poundsByProduct={
    fp5:.5,fp1:1,fc5:.5,fc1:1,fm5:.5,fm1:1,
    op5:.5,op1:1,oc5:.5,oc1:1,
    promo_constructor:1,promo_hambre:1,promo_camaradas:2
  };

  function poundsForOrder(o){
    const direct=Number(o?.pounds||0);
    if(direct>0)return direct;
    return (o?.items||[]).reduce((sum,item)=>{
      const qty=Math.max(0,Number(item?.qty||0));
      const id=String(item?.productId||'');
      if(Object.prototype.hasOwnProperty.call(poundsByProduct,id))return sum+(poundsByProduct[id]*qty);
      const detail=String(item?.detail||'').toLowerCase();
      const name=String(item?.name||'').toLowerCase();
      if(/½\s*libra|1\/2\s*libra/.test(detail))return sum+(.5*qty);
      const match=detail.match(/(\d+(?:\.\d+)?)\s*libras?/);
      if(match&&(name.includes('ceviche')||detail.includes('ceviche')))return sum+(Number(match[1])*qty);
      return sum;
    },0);
  }

  function totalOrdersToPrepare(){
    const today=typeof localDay==='function'?localDay():'';
    return (orders||[]).filter(o=>{
      if(o?.deleted||o?.directSale)return false;
      const status=String(o?.status||'nuevo');
      if(status==='cancelado'||status==='entregado')return false;
      const day=String(o?.deliveryDate||'');
      if(today&&day&&day<today)return false;
      return true;
    });
  }

  function refreshOrderTotals(){
    const list=totalOrdersToPrepare();
    const pounds=list.reduce((sum,o)=>sum+poundsForOrder(o),0);
    const count=document.getElementById('ordersTotalCount');
    const lbs=document.getElementById('ordersTotalPounds');
    if(count)count.textContent=String(list.length);
    if(lbs){
      const rounded=Math.round((pounds+Number.EPSILON)*100)/100;
      lbs.textContent=`${Number(rounded.toFixed(2))} lb`;
    }
  }

  const originalRenderOrders=renderOrders;
  renderOrders=function(){
    originalRenderOrders();
    refreshOrderTotals();
  };

  refreshOrderTotals();
})();
