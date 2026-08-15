(()=>{
  if(window.__EL_CUBANO_CAPITAL_TRACKER_V1__)return;
  window.__EL_CUBANO_CAPITAL_TRACKER_V1__=true;

  const doc=document;
  if(typeof db==='undefined')return;
  const nav=doc.querySelector('.nav');
  const main=doc.querySelector('main.wrap');
  if(!nav||!main)return;

  const controlRef=db.collection('inventario').doc('principal');
  const DEFAULTS={ownerCapital:94,ownerWithdrawn:0,sellableLb:7,pricePerLb:17};
  let state={...DEFAULTS};
  let sales=[];

  const money=n=>'$'+Number(n||0).toFixed(2);
  const num=n=>Math.max(0,Number(n)||0);

  const style=doc.createElement('style');
  style.id='capitalTrackerStyle';
  style.textContent=`
    #money .capital-hero{border:1px solid #d9c97d;background:linear-gradient(135deg,#f7fff5 0%,#fff8d6 55%,#fff0ef 100%);border-radius:18px;padding:14px;margin-bottom:12px;position:relative;overflow:hidden}
    #money .capital-hero:before{content:"";position:absolute;left:0;right:0;top:0;height:7px;background:linear-gradient(90deg,#20863b 0 33.33%,#f0c21d 33.33% 66.66%,#c91d24 66.66%)}
    #money .capital-hero b{display:block;color:#173a2a;font-size:20px;margin-top:4px}
    #money .capital-hero small{display:block;color:#5c665d;font-weight:800;margin-top:5px;line-height:1.4}
    #money .capital-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0}
    #money .capital-stat{border:1px solid #e3decf;background:#fff;border-radius:14px;padding:11px;min-height:87px}
    #money .capital-stat small{display:block;color:#6c746d;font-weight:900;line-height:1.25}
    #money .capital-stat b{display:block;margin-top:7px;font-size:23px;color:#123458}
    #money .capital-stat.green b{color:#218b39}#money .capital-stat.red b{color:#b31d25}#money .capital-stat.gold b{color:#8a6500}
    #money .capital-rule{background:#0f3922;color:#fff;border-radius:15px;padding:13px;margin-top:10px;font-weight:900;line-height:1.45;border-bottom:6px solid #efc31e}
    #money .capital-progress{height:14px;background:#ece8dd;border-radius:999px;overflow:hidden;margin:10px 0 4px}
    #money .capital-progress span{display:block;height:100%;background:linear-gradient(90deg,#218b39,#efc31e,#c91d24);width:0%;transition:width .2s ease}
    #money .capital-progress-label{font-size:12px;color:#667066;font-weight:900;text-align:right}
    #money .capital-actions{display:grid;grid-template-columns:1.25fr 1fr;gap:8px;margin-top:11px}
    #money .capital-actions button{border:0;border-radius:13px;padding:13px 10px;font-weight:1000;font-size:15px}
    #money #ownerPayBtn{background:#218b39;color:#fff}#money #capitalAdjustBtn{background:#ffefb5;color:#694d00}
    #money .capital-adjust{display:none;margin-top:11px;border:1px solid #dfd7bf;border-radius:14px;padding:12px;background:#fffdf5}
    #money .capital-adjust.show{display:block}
    #money .capital-adjust-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    #money .capital-adjust button{border:0;border-radius:11px;padding:12px;background:#123458;color:#fff;font-weight:1000;width:100%;margin-top:10px}
    #ownerPayOverlay{position:fixed;inset:0;z-index:100200;background:rgba(0,0,0,.48);display:grid;place-items:center;padding:18px}
    #ownerPayOverlay .owner-pay-card{width:min(100%,470px);background:#fff;border-radius:20px;padding:17px;box-shadow:0 20px 60px rgba(0,0,0,.28)}
    #ownerPayOverlay h3{margin:0 0 6px;color:#123458}#ownerPayOverlay p{margin:0 0 12px;color:#687386;font-weight:800;line-height:1.4}
    #ownerPayOverlay .owner-pay-actions{display:grid;grid-template-columns:1fr 1.25fr;gap:8px;margin-top:11px}
    #ownerPayOverlay button{border:0;border-radius:12px;padding:12px;font-weight:1000}#ownerPayOverlay .cancel{background:#e8edf4;color:#123458}#ownerPayOverlay .save{background:#218b39;color:#fff}
    @media(min-width:760px){#money .capital-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
  `;
  doc.head.appendChild(style);

  let button=doc.querySelector('.nav button[data-tab="money"]');
  if(!button){
    button=doc.createElement('button');
    button.type='button';
    button.dataset.tab='money';
    button.textContent='Mi dinero';
    nav.appendChild(button);
  }

  let panel=doc.getElementById('money');
  if(!panel){
    panel=doc.createElement('section');
    panel.className='panel';
    panel.id='money';
    panel.innerHTML=`
      <div class="card">
        <h2>Mi dinero y el negocio</h2>
        <div class="capital-hero">
          <b id="capitalPlanTitle">7 lb listas × $17 = $119 si se venden todas</b>
          <small>El costo de lo vendido se queda para resurtir. Solo te pagas de la ganancia que ya quedó libre.</small>
        </div>
        <div class="capital-grid">
          <div class="capital-stat gold"><small>Dinero mío trabajando</small><b id="ownerCapitalValue">$94.00</b></div>
          <div class="capital-stat"><small>Ventas entregadas</small><b id="capitalSalesValue">$0.00</b></div>
          <div class="capital-stat gold"><small>Para reponer lo vendido</small><b id="capitalRestockValue">$0.00</b></div>
          <div class="capital-stat green"><small>Ganancia real acumulada</small><b id="capitalProfitValue">$0.00</b></div>
          <div class="capital-stat green"><small>Puedo pagarme ahorita</small><b id="capitalAvailableValue">$0.00</b></div>
          <div class="capital-stat red"><small>Todavía me falta recuperar</small><b id="capitalOwedValue">$94.00</b></div>
        </div>
        <div class="capital-progress"><span id="capitalProgressBar"></span></div>
        <div class="capital-progress-label" id="capitalProgressLabel">$0 de $94 recuperados</div>
        <div class="capital-rule" id="capitalInstruction">Todavía no te pagues. Primero entrega ventas; el panel separará costo y ganancia.</div>
        <div class="capital-actions">
          <button type="button" id="ownerPayBtn">💵 PAGARME DE LA GANANCIA</button>
          <button type="button" id="capitalAdjustBtn">⚙️ AJUSTAR</button>
        </div>
        <div class="capital-adjust" id="capitalAdjustBox">
          <div class="capital-adjust-grid">
            <label>Dinero que puse<input id="capitalInput" type="number" min="0" step="0.01"></label>
            <label>Libras listas para vender<input id="sellableLbInput" type="number" min="0" step="0.5"></label>
            <label>Precio por libra<input id="priceLbInput" type="number" min="0" step="0.01"></label>
            <label>Total que ya me he pagado<input id="withdrawnInput" type="number" min="0" step="0.01"></label>
          </div>
          <button type="button" id="capitalSaveBtn">GUARDAR AJUSTES</button>
        </div>
      </div>`;
    main.appendChild(panel);
  }

  function activateMoney(){
    doc.querySelectorAll('.nav button').forEach(x=>x.classList.remove('active'));
    doc.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));
    button.classList.add('active');
    panel.classList.add('active');
  }
  button.addEventListener('click',activateMoney);

  function calc(){
    const revenue=sales.reduce((a,m)=>a+num(m.total),0);
    const restock=sales.reduce((a,m)=>a+num(m.cost),0);
    const profit=sales.reduce((a,m)=>{
      if(m.profit!==null&&m.profit!==undefined&&Number.isFinite(Number(m.profit)))return a+Number(m.profit);
      if(Number.isFinite(Number(m.total))&&Number.isFinite(Number(m.cost)))return a+(Number(m.total)-Number(m.cost));
      return a;
    },0);
    const capital=num(state.ownerCapital);
    const withdrawn=num(state.ownerWithdrawn);
    const capitalRecovered=Math.min(capital,withdrawn);
    const owed=Math.max(0,capital-capitalRecovered);
    const available=Math.max(0,profit-withdrawn);
    return {revenue,restock,profit,capital,withdrawn,capitalRecovered,owed,available};
  }

  function render(){
    const c=calc();
    const lb=num(state.sellableLb),price=num(state.pricePerLb),potential=lb*price;
    doc.getElementById('capitalPlanTitle').textContent=`${lb:g} lb listas × ${money(price)} = ${money(potential)} si se venden todas`.replace(':g','');
    doc.getElementById('ownerCapitalValue').textContent=money(c.capital);
    doc.getElementById('capitalSalesValue').textContent=money(c.revenue);
    doc.getElementById('capitalRestockValue').textContent=money(c.restock);
    doc.getElementById('capitalProfitValue').textContent=money(c.profit);
    doc.getElementById('capitalAvailableValue').textContent=money(c.available);
    doc.getElementById('capitalOwedValue').textContent=money(c.owed);
    const pct=c.capital>0?Math.min(100,(c.capitalRecovered/c.capital)*100):100;
    doc.getElementById('capitalProgressBar').style.width=`${pct}%`;
    doc.getElementById('capitalProgressLabel').textContent=`${money(c.capitalRecovered)} de ${money(c.capital)} recuperados`;

    let text='Todavía no te pagues. Primero entrega ventas; el panel separará costo y ganancia.';
    if(c.available>0&&c.owed>0)text=`Puedes pagarte hasta ${money(c.available)} sin tocar el costo de resurtido. Si quieres recuperar tus ${money(c.capital)}, usa el botón verde y el panel llevará la cuenta.`;
    if(c.available>0&&c.owed===0)text=`Ya recuperaste tus ${money(c.capital)}. Tienes ${money(c.available)} adicionales de ganancia disponible sin contar el dinero necesario para reponer lo vendido.`;
    if(c.available===0&&c.profit>0)text='La ganancia generada ya fue retirada o todavía no hay ganancia libre. No saques dinero del costo de resurtido.';
    doc.getElementById('capitalInstruction').textContent=text;
    doc.getElementById('ownerPayBtn').disabled=c.available<=0;

    doc.getElementById('capitalInput').value=c.capital.toFixed(2);
    doc.getElementById('sellableLbInput').value=lb;
    doc.getElementById('priceLbInput').value=price.toFixed(2);
    doc.getElementById('withdrawnInput').value=c.withdrawn.toFixed(2);
  }

  async function saveState(next){
    state={...state,...next};
    await controlRef.set({capitalControl:{...state,updatedAt:firebase.firestore.FieldValue.serverTimestamp()}},{merge:true});
  }

  function openPay(){
    const c=calc();
    if(c.available<=0)return;
    doc.getElementById('ownerPayOverlay')?.remove();
    const overlay=doc.createElement('div');
    overlay.id='ownerPayOverlay';
    overlay.innerHTML=`<div class="owner-pay-card" role="dialog" aria-modal="true"><h3>Pagarme de la ganancia</h3><p>Puedes sacar hasta <b>${money(c.available)}</b> sin tocar el costo de lo vendido.</p><label>Cantidad<input id="ownerPayAmount" type="number" min="0.01" max="${c.available.toFixed(2)}" step="0.01" value="${Math.min(c.available,c.owed||c.available).toFixed(2)}"></label><div class="owner-pay-actions"><button type="button" class="cancel">Cancelar</button><button type="button" class="save">Registrar pago</button></div></div>`;
    const close=()=>overlay.remove();
    overlay.querySelector('.cancel').onclick=close;
    overlay.onclick=e=>{if(e.target===overlay)close();};
    overlay.querySelector('.save').onclick=async()=>{
      const amount=num(overlay.querySelector('#ownerPayAmount').value);
      if(amount<=0||amount>c.available+0.001){alert(`Solo puedes pagarte hasta ${money(c.available)} en este momento.`);return;}
      const saveBtn=overlay.querySelector('.save');saveBtn.disabled=true;
      try{await saveState({ownerWithdrawn:num(state.ownerWithdrawn)+amount});close();if(typeof toast==='function')toast(`Pago para ti registrado: ${money(amount)}`);}catch(e){console.error(e);saveBtn.disabled=false;alert('No se pudo registrar el pago.');}
    };
    doc.body.appendChild(overlay);
    overlay.querySelector('#ownerPayAmount').focus();
  }

  doc.getElementById('ownerPayBtn').addEventListener('click',openPay);
  doc.getElementById('capitalAdjustBtn').addEventListener('click',()=>doc.getElementById('capitalAdjustBox').classList.toggle('show'));
  doc.getElementById('capitalSaveBtn').addEventListener('click',async()=>{
    const btn=doc.getElementById('capitalSaveBtn');btn.disabled=true;
    try{
      await saveState({
        ownerCapital:num(doc.getElementById('capitalInput').value),
        sellableLb:num(doc.getElementById('sellableLbInput').value),
        pricePerLb:num(doc.getElementById('priceLbInput').value),
        ownerWithdrawn:num(doc.getElementById('withdrawnInput').value)
      });
      doc.getElementById('capitalAdjustBox').classList.remove('show');
      if(typeof toast==='function')toast('Control de dinero actualizado');
    }catch(e){console.error(e);alert('No se pudieron guardar los ajustes.');}
    finally{btn.disabled=false;}
  });

  controlRef.get().then(snap=>{
    const existing=snap.exists?snap.data().capitalControl:null;
    if(existing){state={...DEFAULTS,...existing};render();return;}
    return controlRef.set({capitalControl:{...DEFAULTS,startedAt:firebase.firestore.FieldValue.serverTimestamp()}},{merge:true});
  }).catch(console.error);

  controlRef.onSnapshot(snap=>{
    const data=snap.exists?snap.data().capitalControl:null;
    if(data){state={...DEFAULTS,...data};render();}
  },e=>console.error('No se pudo leer control de capital:',e));

  db.collection('movimientos').orderBy('date','desc').limit(500).onSnapshot(snap=>{
    sales=snap.docs.map(d=>({id:d.id,...d.data()})).filter(m=>m.type==='sale');
    render();
  },e=>console.error('No se pudieron leer ventas para capital:',e));

  render();
})();
