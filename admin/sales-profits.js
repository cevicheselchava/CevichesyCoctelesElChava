(()=>{
  if(window.__EL_CUBANO_SALES_PROFITS__)return;
  window.__EL_CUBANO_SALES_PROFITS__=true;

  const nav=document.getElementById('mainNav');
  const oldMoneyNav=nav?.querySelector('[data-tab="money"]');
  const oldMoneyPanel=document.getElementById('money');
  if(!nav||!oldMoneyNav||!oldMoneyPanel)return;

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const num=v=>Number(v||0);
  const validNumber=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));

  const style=document.createElement('style');
  style.textContent=`
    #mainNav [data-tab="sales"]:after{background:#267642}
    #mainNav [data-tab="profits"]:after{background:#f2b632}
    .sales-profit-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
    .sales-profit-card{border:1px solid #ded7c8;border-radius:14px;background:#fff;padding:12px;text-align:center}
    .sales-profit-card small{display:block;color:#687386;font-weight:900;line-height:1.25}
    .sales-profit-card b{display:block;margin-top:6px;color:#123458;font-size:23px}
    .sales-profit-card.good{background:#eaf8ed}.sales-profit-card.good b{color:#1f7a3b}
    .sales-profit-card.warn{background:#fff7cf}.sales-profit-card.warn b{color:#7d5300}
    .sales-profit-card.bad{background:#fff0f0}.sales-profit-card.bad b{color:#b31d25}
    .sales-section-title{margin:14px 0 8px;color:#174f2b;font-size:17px}
    .sales-payments,.sales-list{display:grid;gap:8px}
    .sales-payment-row,.sales-row{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;border:1px solid #e1dacd;border-radius:13px;padding:11px;background:#fff}
    .sales-payment-row strong,.sales-row strong{color:#174f2b}
    .sales-payment-row small,.sales-row small{display:block;color:#687386;margin-top:3px;font-weight:800;line-height:1.35}
    .sales-amount{font-weight:1000;color:#267642;white-space:nowrap}
    .profit-warning{margin-top:10px;border:1px solid #efc1c1;border-left:5px solid #c92f35;border-radius:12px;padding:11px;background:#fff5f5;color:#8c2424;font-weight:900;line-height:1.45}
    @media(max-width:560px){.sales-profit-grid{grid-template-columns:1fr 1fr}.sales-payment-row,.sales-row{grid-template-columns:1fr auto}}
  `;
  document.head.appendChild(style);

  // El botón viejo de "Mi dinero" pasa a ser Ventas.
  oldMoneyNav.dataset.tab='sales';
  oldMoneyNav.querySelector('.nav-icon').textContent='💵';
  oldMoneyNav.querySelector('.nav-label').textContent='Ventas';

  // Segundo botón independiente: Ganancias.
  let profitsNav=nav.querySelector('[data-tab="profits"]');
  if(!profitsNav){
    profitsNav=document.createElement('button');
    profitsNav.dataset.tab='profits';
    profitsNav.innerHTML='<span class="nav-icon">📈</span><span class="nav-label">Ganancias</span>';
    oldMoneyNav.insertAdjacentElement('afterend',profitsNav);
  }

  // Reutiliza el panel viejo como Ventas.
  oldMoneyPanel.id='sales';
  oldMoneyPanel.innerHTML=`<div class="card">
    <h2>Ventas</h2>
    <div class="notice">Aquí ves lo que realmente ha entrado por ventas entregadas.</div>
    <div class="sales-profit-grid">
      <div class="sales-profit-card good"><small>Ventas de hoy</small><b id="salesToday">$0.00</b></div>
      <div class="sales-profit-card"><small>Ventas registradas</small><b id="salesTotal">$0.00</b></div>
      <div class="sales-profit-card"><small>Pedidos cobrados</small><b id="salesCount">0</b></div>
      <div class="sales-profit-card"><small>Promedio por venta</small><b id="salesAverage">$0.00</b></div>
    </div>
    <h3 class="sales-section-title">Cómo pagaron</h3>
    <div class="sales-payments" id="salesPayments"></div>
    <h3 class="sales-section-title">Últimas ventas</h3>
    <div class="sales-list" id="salesList"></div>
  </div>`;

  // Panel separado para Ganancias.
  let profitsPanel=document.getElementById('profits');
  if(!profitsPanel){
    profitsPanel=document.createElement('section');
    profitsPanel.className='panel';
    profitsPanel.id='profits';
    profitsPanel.innerHTML=`<div class="card">
      <h2>Ganancias</h2>
      <div class="notice">Ventas no es lo mismo que ganancia. Aquí se separan costos, compras y utilidad.</div>
      <div class="sales-profit-grid">
        <div class="sales-profit-card warn"><small>Costo de lo vendido</small><b id="profitSoldCost">$0.00</b></div>
        <div class="sales-profit-card warn"><small>Gastado en compras</small><b id="profitPurchases">$0.00</b></div>
        <div class="sales-profit-card good"><small>Utilidad de ventas</small><b id="profitGross">$0.00</b></div>
        <div class="sales-profit-card good"><small>Ganancia disponible</small><b id="profitAvailable">$0.00</b></div>
        <div class="sales-profit-card"><small>Capital registrado</small><b id="profitCapital">$0.00</b></div>
        <div class="sales-profit-card bad"><small>Falta recuperar de capital</small><b id="profitCapitalOwed">$0.00</b></div>
      </div>
      <div id="profitWarning"></div>
    </div>`;
    oldMoneyPanel.insertAdjacentElement('afterend',profitsPanel);
  }

  function saleRows(){return (movements||[]).filter(m=>m?.type==='sale');}

  function renderSales(){
    const sales=saleRows();
    const today=localDay();
    const todaySales=sales.filter(s=>s.day===today);
    const total=sales.reduce((sum,s)=>sum+num(s.total),0);
    const todayTotal=todaySales.reduce((sum,s)=>sum+num(s.total),0);
    const count=sales.length;

    document.getElementById('salesToday').textContent=money(todayTotal);
    document.getElementById('salesTotal').textContent=money(total);
    document.getElementById('salesCount').textContent=String(count);
    document.getElementById('salesAverage').textContent=money(count?total/count:0);

    const byPayment={};
    sales.forEach(s=>{
      const key=String(s.payment||'Sin indicar').trim()||'Sin indicar';
      if(!byPayment[key])byPayment[key]={count:0,total:0};
      byPayment[key].count+=1;
      byPayment[key].total+=num(s.total);
    });
    const paymentEntries=Object.entries(byPayment).sort((a,b)=>b[1].total-a[1].total);
    document.getElementById('salesPayments').innerHTML=paymentEntries.length
      ? paymentEntries.map(([name,data])=>`<div class="sales-payment-row"><div><strong>${esc(name)}</strong><small>${data.count} venta${data.count===1?'':'s'}</small></div><div class="sales-amount">${money(data.total)}</div></div>`).join('')
      : '<div class="empty">Todavía no hay ventas entregadas.</div>';

    document.getElementById('salesList').innerHTML=sales.length
      ? sales.slice(0,20).map(s=>{
          const d=timestampDate(s.date);
          const date=d?d.toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'}):String(s.day||'');
          return `<div class="sales-row"><div><strong>${esc(s.name||'Venta')}</strong><small>${esc(date)}${s.payment?` · ${esc(s.payment)}`:''}</small></div><div class="sales-amount">${money(s.total)}</div></div>`;
        }).join('')
      : '<div class="empty">Todavía no hay ventas entregadas.</div>';
  }

  function profitTotals(){
    const sales=saleRows();
    let soldCost=0,profit=0,unknown=0;
    sales.forEach(s=>{
      const hasCost=validNumber(s.cost);
      const hasProfit=validNumber(s.profit);
      if(hasCost)soldCost+=Number(s.cost);
      if(hasProfit)profit+=Number(s.profit);
      else if(hasCost)profit+=Math.max(0,num(s.total)-Number(s.cost));
      else unknown+=1;
    });
    const purchases=(movements||[]).filter(m=>m?.type==='purchase'&&validNumber(m.cost)).reduce((sum,m)=>sum+Number(m.cost),0);
    const capital=Number(moneyCfg?.ownerCapital||0);
    const withdrawn=Number(moneyCfg?.ownerWithdrawn||0);
    const available=Math.max(0,profit-withdrawn);
    const capitalOwed=Math.max(0,capital-withdrawn);
    return {soldCost,profit,purchases,capital,withdrawn,available,capitalOwed,unknown};
  }

  function renderProfits(){
    const t=profitTotals();
    document.getElementById('profitSoldCost').textContent=money(t.soldCost);
    document.getElementById('profitPurchases').textContent=money(t.purchases);
    document.getElementById('profitGross').textContent=t.unknown?'Pendiente':money(t.profit);
    document.getElementById('profitAvailable').textContent=t.unknown?'Pendiente':money(t.available);
    document.getElementById('profitCapital').textContent=money(t.capital);
    document.getElementById('profitCapitalOwed').textContent=money(t.capitalOwed);
    document.getElementById('profitWarning').innerHTML=t.unknown
      ? `<div class="profit-warning">⚠️ Hay ${t.unknown} venta${t.unknown===1?'':'s'} sin costo completo. No se muestra una ganancia falsa hasta que ese costo quede definido.</div>`
      : '';
  }

  // renderAll() del panel sigue llamando renderMoney(). Ahora refresca ambos apartados.
  renderMoney=function(){renderSales();renderProfits();};

  const baseActivateTab=activateTab;
  activateTab=function(id){
    baseActivateTab(id);
    if(id==='sales')renderSales();
    if(id==='profits')renderProfits();
  };

  profitsNav.addEventListener('click',()=>activateTab('profits'));
  // El botón Ventas conserva el listener original; al cambiar data-tab ahora abre #sales.

  renderSales();
  renderProfits();
})();