(()=>{
  if(window.__EL_CUBANO_CAPITAL_TRACKER_V2__)return;
  window.__EL_CUBANO_CAPITAL_TRACKER_V2__=true;

  const doc=document;
  if(typeof db==='undefined')return;
  const nav=doc.querySelector('.nav');
  const main=doc.querySelector('main.wrap');
  if(!nav||!main)return;

  const ref=db.collection('inventario').doc('principal');
  const defaults={ownerCapital:94,ownerWithdrawn:0,sellableLb:7,pricePerLb:17};
  let cfg={...defaults};
  let sales=[];
  const n=v=>Math.max(0,Number(v)||0);
  const usd=v=>'$'+n(v).toFixed(2);

  const st=doc.createElement('style');
  st.id='capitalTrackerV2Style';
  st.textContent=`
    #money .money-banner{position:relative;overflow:hidden;border:1px solid #d8ce98;border-radius:18px;padding:16px 14px 13px;background:linear-gradient(135deg,#f4fff3,#fff7cb 55%,#fff0ef)}
    #money .money-banner:before{content:"";position:absolute;left:0;right:0;top:0;height:7px;background:linear-gradient(90deg,#218b39 0 33.33%,#f0c21d 33.33% 66.66%,#c91d24 66.66%)}
    #money .money-banner b{display:block;font-size:20px;color:#173a2a}.money-banner small{display:block;margin-top:5px;color:#5f695f;font-weight:800;line-height:1.4}
    #money .money-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0}
    #money .money-stat{border:1px solid #e3decf;border-radius:14px;background:#fff;padding:11px;min-height:88px}
    #money .money-stat small{display:block;color:#687386;font-weight:900;line-height:1.25}#money .money-stat b{display:block;margin-top:7px;font-size:23px;color:#123458}
    #money .money-stat.green b{color:#218b39}#money .money-stat.red b{color:#b31d25}#money .money-stat.gold b{color:#8a6500}
    #money .money-progress{height:14px;border-radius:999px;background:#ece8dd;overflow:hidden;margin-top:10px}#money .money-progress span{display:block;height:100%;width:0;background:linear-gradient(90deg,#218b39,#f0c21d,#c91d24)}
    #money .money-progress-label{text-align:right;font-size:12px;color:#687386;font-weight:900;margin-top:4px}
    #money .money-rule{margin-top:10px;background:#103a23;color:#fff;border-radius:15px;padding:13px;font-weight:900;line-height:1.45;border-bottom:6px solid #f0c21d}
    #money .money-actions{display:grid;grid-template-columns:1.3fr 1fr;gap:8px;margin-top:10px}#money .money-actions button{border:0;border-radius:13px;padding:13px 9px;font-weight:1000}
    #moneyPay{background:#218b39;color:#fff}#moneyAdjust{background:#ffefb5;color:#684d00}
    #moneyAdjustBox{display:none;margin-top:10px;border:1px solid #ddd4b7;border-radius:14px;background:#fffdf5;padding:12px}#moneyAdjustBox.show{display:block}
    #moneyAdjustBox .fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}#moneySave{width:100%;border:0;border-radius:11px;padding:12px;margin-top:10px;background:#123458;color:#fff;font-weight:1000}
    #moneyPayOverlay{position:fixed;inset:0;z-index:100250;background:rgba(0,0,0,.48);display:grid;place-items:center;padding:18px}#moneyPayOverlay .box{width:min(100%,470px);background:#fff;border-radius:20px;padding:17px;box-shadow:0 20px 60px rgba(0,0,0,.28)}
    #moneyPayOverlay h3{margin:0 0 6px;color:#123458}#moneyPayOverlay p{margin:0 0 12px;color:#687386;font-weight:800;line-height:1.4}#moneyPayOverlay .actions{display:grid;grid-template-columns:1fr 1.3fr;gap:8px;margin-top:10px}
    #moneyPayOverlay button{border:0;border-radius:12px;padding:12px;font-weight:1000}#moneyPayOverlay .cancel{background:#e8edf4;color:#123458}#moneyPayOverlay .save{background:#218b39;color:#fff}
    @media(min-width:760px){#money .money-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
  `;
  doc.head.appendChild(st);

  let tab=nav.querySelector('button[data-tab="money"]');
  if(!tab){tab=doc.createElement('button');tab.type='button';tab.dataset.tab='money';tab.textContent='Mi dinero';nav.appendChild(tab);}

  let panel=doc.getElementById('money');
  if(!panel){
    panel=doc.createElement('section');panel.className='panel';panel.id='money';
    panel.innerHTML=`<div class="card"><h2>Mi dinero y el negocio</h2>
      <div class="money-banner"><b id="moneyPlan">7 lb listas × $17.00 = $119.00 si se venden todas</b><small>El costo de lo vendido se queda para resurtir. Solo te pagas de la ganancia libre.</small></div>
      <div class="money-grid">
        <div class="money-stat gold"><small>Dinero mío trabajando</small><b id="mCapital">$94.00</b></div>
        <div class="money-stat"><small>Ventas entregadas</small><b id="mSales">$0.00</b></div>
        <div class="money-stat gold"><small>Para reponer lo vendido</small><b id="mRestock">$0.00</b></div>
        <div class="money-stat green"><small>Ganancia real acumulada</small><b id="mProfit">$0.00</b></div>
        <div class="money-stat green"><small>Puedo pagarme ahorita</small><b id="mAvailable">$0.00</b></div>
        <div class="money-stat red"><small>Todavía me falta recuperar</small><b id="mOwed">$94.00</b></div>
      </div>
      <div class="money-progress"><span id="mProgress"></span></div><div class="money-progress-label" id="mProgressText">$0.00 de $94.00 recuperados</div>
      <div class="money-rule" id="mInstruction">Todavía no te pagues. Primero entrega ventas; el panel separará costo y ganancia.</div>
      <div class="money-actions"><button type="button" id="moneyPay">💵 PAGARME DE LA GANANCIA</button><button type="button" id="moneyAdjust">⚙️ AJUSTAR</button></div>
      <div id="moneyAdjustBox"><div class="fields"><label>Dinero que puse<input id="mCapitalInput" type="number" min="0" step="0.01"></label><label>Libras listas<input id="mLbInput" type="number" min="0" step="0.5"></label><label>Precio por libra<input id="mPriceInput" type="number" min="0" step="0.01"></label><label>Total que ya me pagué<input id="mWithdrawInput" type="number" min="0" step="0.01"></label></div><button type="button" id="moneySave">GUARDAR AJUSTES</button></div>
    </div>`;
    main.appendChild(panel);
  }

  tab.addEventListener('click',()=>{
    doc.querySelectorAll('.nav button').forEach(x=>x.classList.remove('active'));
    doc.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));
    tab.classList.add('active');panel.classList.add('active');
  });

  function totals(){
    const revenue=sales.reduce((a,x)=>a+n(x.total),0);
    const restock=sales.reduce((a,x)=>a+n(x.cost),0);
    const profit=sales.reduce((a,x)=>{
      if(x.profit!==null&&x.profit!==undefined&&Number.isFinite(Number(x.profit)))return a+Number(x.profit);
      return a+(Number.isFinite(Number(x.total))&&Number.isFinite(Number(x.cost))?Number(x.total)-Number(x.cost):0);
    },0);
    const capital=n(cfg.ownerCapital),withdrawn=n(cfg.ownerWithdrawn),recovered=Math.min(capital,withdrawn);
    return {revenue,restock,profit,capital,withdrawn,recovered,owed:Math.max(0,capital-recovered),available:Math.max(0,profit-withdrawn)};
  }

  function render(){
    const t=totals(),lb=n(cfg.sellableLb),price=n(cfg.pricePerLb);
    doc.getElementById('moneyPlan').textContent=`${lb} lb listas × ${usd(price)} = ${usd(lb*price)} si se venden todas`;
    doc.getElementById('mCapital').textContent=usd(t.capital);doc.getElementById('mSales').textContent=usd(t.revenue);doc.getElementById('mRestock').textContent=usd(t.restock);
    doc.getElementById('mProfit').textContent=usd(t.profit);doc.getElementById('mAvailable').textContent=usd(t.available);doc.getElementById('mOwed').textContent=usd(t.owed);
    const pct=t.capital?Math.min(100,t.recovered/t.capital*100):100;doc.getElementById('mProgress').style.width=pct+'%';doc.getElementById('mProgressText').textContent=`${usd(t.recovered)} de ${usd(t.capital)} recuperados`;
    let msg='Todavía no te pagues. Primero entrega ventas; el panel separará costo y ganancia.';
    if(t.available>0&&t.owed>0)msg=`Puedes pagarte hasta ${usd(t.available)} sin tocar el costo de resurtido. El panel irá bajando lo que todavía te deben de tus ${usd(t.capital)}.`;
    if(t.available>0&&t.owed===0)msg=`Ya recuperaste tus ${usd(t.capital)}. Hay ${usd(t.available)} adicionales de ganancia disponible sin tocar el resurtido.`;
    if(t.available===0&&t.profit>0)msg='La ganancia generada ya fue retirada o todavía no hay ganancia libre. No saques dinero del costo de resurtido.';
    doc.getElementById('mInstruction').textContent=msg;doc.getElementById('moneyPay').disabled=t.available<=0;
    doc.getElementById('mCapitalInput').value=t.capital.toFixed(2);doc.getElementById('mLbInput').value=lb;doc.getElementById('mPriceInput').value=price.toFixed(2);doc.getElementById('mWithdrawInput').value=t.withdrawn.toFixed(2);
  }

  async function save(part){cfg={...cfg,...part};await ref.set({capitalControl:{...cfg,updatedAt:firebase.firestore.FieldValue.serverTimestamp()}},{merge:true});}

  doc.getElementById('moneyAdjust').onclick=()=>doc.getElementById('moneyAdjustBox').classList.toggle('show');
  doc.getElementById('moneySave').onclick=async()=>{
    const b=doc.getElementById('moneySave');b.disabled=true;
    try{await save({ownerCapital:n(doc.getElementById('mCapitalInput').value),sellableLb:n(doc.getElementById('mLbInput').value),pricePerLb:n(doc.getElementById('mPriceInput').value),ownerWithdrawn:n(doc.getElementById('mWithdrawInput').value)});doc.getElementById('moneyAdjustBox').classList.remove('show');if(typeof toast==='function')toast('Control de dinero actualizado');}
    catch(e){console.error(e);alert('No se pudieron guardar los ajustes.');}finally{b.disabled=false;}
  };

  doc.getElementById('moneyPay').onclick=()=>{
    const t=totals();if(t.available<=0)return;doc.getElementById('moneyPayOverlay')?.remove();
    const o=doc.createElement('div');o.id='moneyPayOverlay';const suggested=Math.min(t.available,t.owed||t.available);
    o.innerHTML=`<div class="box"><h3>Pagarme de la ganancia</h3><p>Puedes sacar hasta <b>${usd(t.available)}</b> sin tocar el costo de lo vendido.</p><label>Cantidad<input id="moneyPayAmount" type="number" min="0.01" max="${t.available.toFixed(2)}" step="0.01" value="${suggested.toFixed(2)}"></label><div class="actions"><button type="button" class="cancel">Cancelar</button><button type="button" class="save">Registrar pago</button></div></div>`;
    const close=()=>o.remove();o.querySelector('.cancel').onclick=close;o.onclick=e=>{if(e.target===o)close();};
    o.querySelector('.save').onclick=async()=>{const amount=n(o.querySelector('#moneyPayAmount').value);if(amount<=0||amount>t.available+.001){alert(`Solo puedes pagarte hasta ${usd(t.available)}.`);return;}const b=o.querySelector('.save');b.disabled=true;try{await save({ownerWithdrawn:n(cfg.ownerWithdrawn)+amount});close();if(typeof toast==='function')toast(`Pago para ti registrado: ${usd(amount)}`);}catch(e){console.error(e);b.disabled=false;alert('No se pudo registrar el pago.');}};
    doc.body.appendChild(o);o.querySelector('#moneyPayAmount').focus();
  };

  ref.get().then(s=>{const current=s.exists?s.data().capitalControl:null;if(current){cfg={...defaults,...current};render();}else{return ref.set({capitalControl:{...defaults,startedAt:firebase.firestore.FieldValue.serverTimestamp()}},{merge:true});}}).catch(console.error);
  ref.onSnapshot(s=>{const current=s.exists?s.data().capitalControl:null;if(current){cfg={...defaults,...current};render();}},e=>console.error('No se pudo leer el control de dinero:',e));
  db.collection('movimientos').orderBy('date','desc').limit(500).onSnapshot(s=>{sales=s.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.type==='sale');render();},e=>console.error('No se pudieron leer las ventas:',e));
  render();
})();
