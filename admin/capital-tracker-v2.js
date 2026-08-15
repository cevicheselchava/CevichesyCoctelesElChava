(()=>{
  if(window.__EL_CUBANO_SIMPLE_MONEY__)return;
  window.__EL_CUBANO_SIMPLE_MONEY__=true;

  const doc=document;
  if(typeof db==='undefined')return;
  const nav=doc.querySelector('.nav');
  const main=doc.querySelector('main.wrap');
  if(!nav||!main)return;

  const ref=db.collection('inventario').doc('principal');
  const defaults={ownerCapital:94,ownerWithdrawn:0};
  let cfg={...defaults};
  let sales=[];

  const num=v=>Math.max(0,Number(v)||0);
  const usd=v=>'$'+num(v).toFixed(2);

  const style=doc.createElement('style');
  style.id='simpleMoneyStyle';
  style.textContent=`
    #money .simple-money{display:grid;gap:10px}
    #money .simple-title{border-radius:18px;padding:15px;background:linear-gradient(135deg,#1f7a3b,#2a9149);color:#fff;border-bottom:7px solid #f0c21d}
    #money .simple-title b{display:block;font-size:22px}#money .simple-title span{display:block;margin-top:6px;font-weight:800;line-height:1.35}
    #money .simple-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
    #money .simple-card{border:1px solid #e2dccd;border-radius:15px;padding:12px;background:#fff;min-height:92px}
    #money .simple-card small{display:block;color:#687386;font-weight:900;line-height:1.25}#money .simple-card b{display:block;margin-top:8px;font-size:24px;color:#123458}
    #money .simple-card.yellow{background:#fff7cf}.simple-card.yellow b{color:#8a6500!important}
    #money .simple-card.green{background:#eaf8ed}.simple-card.green b{color:#1f7a3b!important}
    #money .simple-card.red{background:#fff0f0}.simple-card.red b{color:#b31d25!important}
    #money .simple-rule{border-radius:16px;padding:14px;background:#fff;border:2px solid #1f7a3b;font-weight:1000;line-height:1.45;color:#173a2a}
    #money .simple-rule strong{display:block;font-size:18px;margin-bottom:4px}
    #money .simple-pay{width:100%;border:0;border-radius:14px;padding:14px;background:#1f7a3b;color:#fff;font-weight:1000;font-size:16px}
    #money .simple-pay:disabled{opacity:.45}
    #simplePayOverlay{position:fixed;inset:0;z-index:100250;background:rgba(0,0,0,.5);display:grid;place-items:center;padding:18px}
    #simplePayOverlay .box{width:min(100%,440px);background:#fff;border-radius:20px;padding:17px;box-shadow:0 20px 60px rgba(0,0,0,.3)}
    #simplePayOverlay h3{margin:0 0 7px;color:#123458}#simplePayOverlay p{margin:0 0 12px;color:#687386;font-weight:800;line-height:1.4}
    #simplePayOverlay .actions{display:grid;grid-template-columns:1fr 1.25fr;gap:8px;margin-top:10px}
    #simplePayOverlay button{border:0;border-radius:12px;padding:12px;font-weight:1000}#simplePayOverlay .cancel{background:#e8edf4;color:#123458}#simplePayOverlay .save{background:#1f7a3b;color:#fff}
    @media(min-width:760px){#money .simple-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
  `;
  doc.head.appendChild(style);

  let tab=nav.querySelector('button[data-tab="money"]');
  if(!tab){tab=doc.createElement('button');tab.type='button';tab.dataset.tab='money';tab.textContent='Mi dinero';nav.appendChild(tab);}

  let panel=doc.getElementById('money');
  if(!panel){
    panel=doc.createElement('section');panel.className='panel';panel.id='money';
    panel.innerHTML=`<div class="card simple-money">
      <div class="simple-title"><b>Tu dinero, sin rollos</b><span>Amarillo = déjalo para el negocio. Verde = eso sí puedes sacarlo.</span></div>
      <div class="simple-grid">
        <div class="simple-card"><small>Tú pusiste</small><b id="sCapital">$94.00</b></div>
        <div class="simple-card"><small>Entró por ventas</small><b id="sSales">$0.00</b></div>
        <div class="simple-card yellow"><small>NO GASTAR · para resurtir</small><b id="sRestock">$0.00</b></div>
        <div class="simple-card green"><small>SÍ ES GANANCIA</small><b id="sProfit">$0.00</b></div>
        <div class="simple-card green"><small>Puedes pagarte ahora</small><b id="sAvailable">$0.00</b></div>
        <div class="simple-card red"><small>De tus $94 falta recuperarte</small><b id="sOwed">$94.00</b></div>
      </div>
      <div class="simple-rule" id="sRule"><strong>Por ahora: no saques dinero.</strong>Cuando entregues ventas, aquí te voy a decir cuánto guardar para volver a comprar y cuánto sí es tuyo.</div>
      <button type="button" class="simple-pay" id="simplePayBtn" disabled>💵 SACAR DINERO PARA MÍ</button>
    </div>`;
    main.appendChild(panel);
  }

  tab.addEventListener('click',()=>{
    doc.querySelectorAll('.nav button').forEach(x=>x.classList.remove('active'));
    doc.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));
    tab.classList.add('active');panel.classList.add('active');
  });

  function totals(){
    const revenue=sales.reduce((a,x)=>a+num(x.total),0);
    const known=sales.filter(x=>Number.isFinite(Number(x.cost))||Number.isFinite(Number(x.profit)));
    const hasUnknown=sales.length>known.length;
    const restock=known.reduce((a,x)=>a+(Number.isFinite(Number(x.cost))?num(x.cost):Math.max(0,num(x.total)-num(x.profit))),0);
    const profit=known.reduce((a,x)=>a+(Number.isFinite(Number(x.profit))?num(x.profit):Math.max(0,num(x.total)-num(x.cost))),0);
    const capital=num(cfg.ownerCapital),withdrawn=num(cfg.ownerWithdrawn);
    const available=Math.max(0,profit-withdrawn);
    return {revenue,restock,profit,capital,withdrawn,available,owed:Math.max(0,capital-withdrawn),hasUnknown};
  }

  function render(){
    const t=totals();
    doc.getElementById('sCapital').textContent=usd(t.capital);
    doc.getElementById('sSales').textContent=usd(t.revenue);
    doc.getElementById('sRestock').textContent=t.hasUnknown&&sales.length?'Calculando':usd(t.restock);
    doc.getElementById('sProfit').textContent=t.hasUnknown&&sales.length?'Calculando':usd(t.profit);
    doc.getElementById('sAvailable').textContent=t.hasUnknown&&sales.length?'Calculando':usd(t.available);
    doc.getElementById('sOwed').textContent=usd(t.owed);

    const btn=doc.getElementById('simplePayBtn');
    btn.disabled=t.hasUnknown||t.available<=0;
    const rule=doc.getElementById('sRule');
    if(t.hasUnknown&&sales.length){
      rule.innerHTML='<strong>No saques dinero todavía.</strong>Ya entraron ventas, pero falta calcular el costo exacto de alguna venta. Hasta que eso quede, no te voy a inventar una ganancia.';
    }else if(t.available>0){
      rule.innerHTML=`<strong>Sí puedes sacar ${usd(t.available)}.</strong>El dinero marcado en amarillo se queda para resurtir. Si te pagas, usa el botón verde para que el panel lo descuente de tus ${usd(t.capital)}.`;
    }else if(t.revenue>0){
      rule.innerHTML='<strong>Por ahora no saques dinero.</strong>Lo vendido todavía no ha dejado ganancia libre para ti.';
    }else{
      rule.innerHTML='<strong>Por ahora: no saques dinero.</strong>Cuando entregues ventas, aquí te voy a decir cuánto guardar para volver a comprar y cuánto sí es tuyo.';
    }
  }

  async function saveWithdraw(amount){
    cfg.ownerWithdrawn=num(cfg.ownerWithdrawn)+amount;
    await ref.set({capitalControl:{...cfg,updatedAt:firebase.firestore.FieldValue.serverTimestamp()}},{merge:true});
  }

  doc.getElementById('simplePayBtn').onclick=()=>{
    const t=totals();if(t.hasUnknown||t.available<=0)return;
    doc.getElementById('simplePayOverlay')?.remove();
    const o=doc.createElement('div');o.id='simplePayOverlay';
    o.innerHTML=`<div class="box"><h3>Sacar dinero para mí</h3><p>Puedes sacar hasta <b>${usd(t.available)}</b> sin tocar el dinero para resurtir.</p><label>Cantidad<input id="simplePayAmount" type="number" min="0.01" max="${t.available.toFixed(2)}" step="0.01" value="${Math.min(t.available,t.owed||t.available).toFixed(2)}"></label><div class="actions"><button type="button" class="cancel">Cancelar</button><button type="button" class="save">Registrar</button></div></div>`;
    const close=()=>o.remove();o.querySelector('.cancel').onclick=close;o.onclick=e=>{if(e.target===o)close();};
    o.querySelector('.save').onclick=async()=>{const amount=num(o.querySelector('#simplePayAmount').value);if(amount<=0||amount>t.available+.001)return alert(`Solo puedes sacar hasta ${usd(t.available)}.`);const b=o.querySelector('.save');b.disabled=true;try{await saveWithdraw(amount);close();if(typeof toast==='function')toast(`Pago para ti: ${usd(amount)}`);}catch(e){console.error(e);b.disabled=false;alert('No se pudo registrar el pago.');}};
    doc.body.appendChild(o);
  };

  ref.get().then(s=>{const current=s.exists?s.data().capitalControl:null;if(current){cfg={...defaults,...current};render();}else{return ref.set({capitalControl:{...defaults,startedAt:firebase.firestore.FieldValue.serverTimestamp()}},{merge:true});}}).catch(console.error);
  ref.onSnapshot(s=>{const current=s.exists?s.data().capitalControl:null;if(current){cfg={...defaults,...current};render();}},e=>console.error('No se pudo leer el control de dinero:',e));
  db.collection('movimientos').orderBy('date','desc').limit(500).onSnapshot(s=>{sales=s.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.type==='sale');render();},e=>console.error('No se pudieron leer las ventas:',e));
  render();
})();
