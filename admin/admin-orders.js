(()=>{
  if(window.__EL_CUBANO_MANUAL_ORDERS_V1__) return;
  window.__EL_CUBANO_MANUAL_ORDERS_V1__=true;

  const doc=document;
  const nav=doc.querySelector('.nav');
  const main=doc.querySelector('main.wrap');
  const ordersPanel=doc.getElementById('orders');
  if(!nav||!main||!ordersPanel||typeof db==='undefined') return;

  const PROTEIN_LB=125/453.59237;
  const COMMON_PER_LB={tomato:1.6,cucumber:1.6,onion:.8,cilantro:.2,lemonJuice:2.4,clamato:1.4,avocado:.25};
  const DEFAULT_COST_PER_LB=5.93;

  if(typeof ITEMS!=='undefined'&&!ITEMS.avocado){
    ITEMS.avocado={name:'Aguacate',group:'verduras',unit:'pzas',purchaseUnit:'pzas',factor:1,low:2};
    if(typeof EMPTY!=='undefined') EMPTY.avocado=0;
    if(typeof inventory!=='undefined'&&inventory.avocado===undefined) inventory.avocado=0;
    try{renderGroupButtons();fillProducts();renderAll();}catch(_){ }
  }

  const style=doc.createElement('style');
  style.id='manual-orders-v1-style';
  style.textContent=`
    .nav.delivery-nav{grid-template-columns:repeat(5,1fr)}
    .manual-top{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 10px}
    .manual-top button{border:0;border-radius:12px;padding:12px;font-weight:1000}
    .manual-add{background:var(--green);color:#fff}.manual-route{background:#e8edf4;color:var(--navy)}
    .manual-modal{position:fixed;inset:0;z-index:10060;background:rgba(9,21,36,.48);display:grid;place-items:end center;padding:14px}
    .manual-modal[hidden]{display:none}
    .manual-sheet{width:min(100%,650px);max-height:92vh;overflow:auto;background:#fffdf8;border-radius:24px 24px 16px 16px;padding:16px;box-shadow:0 18px 50px rgba(0,0,0,.28)}
    .manual-sheet h2{margin:0 0 4px;color:var(--navy)}.manual-sheet p{margin:0 0 12px;color:var(--muted);font-weight:800}
    .manual-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.manual-grid .full{grid-column:1/-1}
    .manual-check{display:flex;flex-direction:row;align-items:center;gap:9px;border:1px solid var(--line);border-radius:11px;padding:11px;background:#fff;color:var(--navy)}
    .manual-check input{width:20px;height:20px;margin:0;flex:0 0 auto}
    .manual-summary{margin:12px 0;padding:12px;border-radius:13px;background:#eef5ff;border:1px solid #b9cce8;color:var(--navy);font-weight:900;line-height:1.5}
    .manual-actions{display:grid;grid-template-columns:1fr 1.4fr;gap:8px}.manual-actions button{border:0;border-radius:12px;padding:13px;font-weight:1000}.manual-cancel{background:#e9edf3;color:var(--navy)}.manual-save{background:var(--green);color:#fff}
    .route-head{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;margin-bottom:10px}.route-head button{border:0;border-radius:11px;padding:12px;background:var(--navy);color:#fff;font-weight:1000}
    .route-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:12px}.route-stat{border:1px solid var(--line);border-radius:12px;background:#fff;padding:10px;text-align:center}.route-stat small{display:block;color:var(--muted);font-weight:800}.route-stat b{display:block;color:var(--navy);font-size:20px;margin-top:3px}
    .route-block{margin:12px 0}.route-block-title{margin:0 0 7px;background:#e9eef5;color:var(--navy);border-radius:10px;padding:9px 11px;font-size:16px}
    .route-card{border:1px solid var(--line);border-radius:14px;background:#fff;padding:11px;margin-bottom:8px}.route-card.ready{border-color:#e7c96b;background:#fffdf0}.route-card.onroute{border-color:#8bc8a0;background:#f3fff6}.route-card.done{opacity:.72}
    .route-card-head{display:flex;justify-content:space-between;gap:8px}.route-card strong{color:var(--navy)}.route-card small{display:block;color:var(--muted);line-height:1.45;margin-top:4px}.route-meta{margin-top:8px;padding-top:8px;border-top:1px dashed #ddd;font-weight:800;line-height:1.5}
    .route-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-top:9px}.route-actions button,.route-actions a{border:0;border-radius:10px;padding:10px;text-decoration:none;text-align:center;font-weight:1000}.route-map{background:#e8edf4;color:var(--navy)}.route-next{background:var(--green);color:#fff}.route-warn{background:#fff0bf;color:#7d5300}.route-done{background:#dff4e3;color:#176b2c}
    .route-stage{display:inline-flex;border-radius:999px;padding:5px 8px;font-size:11px;font-weight:1000;white-space:nowrap;background:#eef2f7;color:var(--navy)}
    @media(max-width:560px){.nav.delivery-nav{grid-template-columns:repeat(3,minmax(0,1fr))}.manual-grid{grid-template-columns:1fr}.manual-grid .full{grid-column:1}.manual-modal{padding:0}.manual-sheet{border-radius:24px 24px 0 0}.route-summary{grid-template-columns:repeat(3,1fr)}.route-head{grid-template-columns:1fr}.manual-top{grid-template-columns:1fr}}
  `;
  doc.head.appendChild(style);

  nav.classList.add('delivery-nav');
  const deliveryBtn=doc.createElement('button');
  deliveryBtn.type='button';
  deliveryBtn.dataset.tab='deliveries';
  deliveryBtn.textContent='Entregas';
  nav.appendChild(deliveryBtn);

  const deliveryPanel=doc.createElement('section');
  deliveryPanel.className='panel';
  deliveryPanel.id='deliveries';
  deliveryPanel.innerHTML=`
    <div class="card">
      <h2>Ruta de entregas</h2>
      <div class="notice">Pedidos ordenados por bloque de entrega. Usa <b>Listo → En ruta → Entregado</b> para llevar control del sábado y domingo.</div>
      <div class="route-head">
        <label>Día de entrega<input type="date" id="routeDate"></label>
        <button type="button" id="routeToday">Próximo día con pedidos</button>
      </div>
      <div class="route-summary" id="routeSummary"></div>
      <div id="routeList"><div class="empty">Cargando entregas...</div></div>
    </div>`;
  main.insertBefore(deliveryPanel,doc.getElementById('inventory'));

  const ordersCard=ordersPanel.querySelector('.card');
  const top=doc.createElement('div');
  top.className='manual-top';
  top.innerHTML='<button type="button" class="manual-add" id="openManualOrder">➕ Nuevo pedido manual</button><button type="button" class="manual-route" id="openRoute">🛵 Ver ruta de entregas</button>';
  ordersCard.insertBefore(top,ordersCard.children[1]||null);

  const modal=doc.createElement('div');
  modal.className='manual-modal';
  modal.id='manualOrderModal';
  modal.hidden=true;
  modal.innerHTML=`
    <section class="manual-sheet" role="dialog" aria-modal="true" aria-labelledby="manualTitle">
      <h2 id="manualTitle">Nuevo pedido manual</h2>
      <p>Para pedidos que lleguen por Facebook, Messenger, WhatsApp o teléfono.</p>
      <div class="manual-grid">
        <label>Nombre<input id="moCustomer" placeholder="Nombre del cliente"></label>
        <label>Teléfono<input id="moPhone" type="tel" placeholder="210..."></label>
        <label class="full">Dirección<input id="moAddress" placeholder="Dirección completa"></label>
        <label>ZIP Code<input id="moZip" inputmode="numeric" maxlength="5" placeholder="782xx"></label>
        <label>Fuente<select id="moSource"><option>Facebook</option><option>Messenger</option><option>WhatsApp</option><option>Teléfono</option><option>Otro</option></select></label>
        <label>Día<input id="moDate" type="date"></label>
        <label>Bloque de entrega<select id="moTime"></select></label>
        <label>Libras de ceviche mixto<input id="moPounds" type="number" min="0.5" step="0.5" value="1"></label>
        <label>Precio por libra<input id="moUnitPrice" type="number" min="0" step="0.01" value="17"></label>
        <label>Costo estimado por libra<input id="moCostPerLb" type="number" min="0" step="0.01" value="${DEFAULT_COST_PER_LB.toFixed(2)}"></label>
        <label>Refrescos gratis<input id="moSodas" type="number" min="0" step="1" value="1"></label>
        <label class="manual-check full"><input id="moPack12" type="checkbox" checked>Empacar en 2 contenedores de 12 oz por libra</label>
        <label class="full">Notas<input id="moNotes" placeholder="Ej. pidió 12:30 o 1:00 p. m."></label>
      </div>
      <div class="manual-summary" id="moSummary"></div>
      <div class="manual-actions"><button type="button" class="manual-cancel" id="closeManualOrder">Cancelar</button><button type="button" class="manual-save" id="saveManualOrder">Guardar pedido</button></div>
    </section>`;
  doc.body.appendChild(modal);

  const $=id=>doc.getElementById(id);
  const routeDate=$('routeDate');

  function localDateString(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  function nextSaturday(){const d=new Date();const add=(6-d.getDay()+7)%7;d.setDate(d.getDate()+add);return localDateString(d);}
  function routeDateDefault(){
    const todayStr=localDateString(new Date());
    const future=(typeof orders!=='undefined'?orders:[]).filter(o=>o.status!=='cancelado'&&o.deliveryDate&&o.deliveryDate>=todayStr).sort((a,b)=>String(a.deliveryDate).localeCompare(String(b.deliveryDate)));
    return future[0]?.deliveryDate||nextSaturday();
  }

  function fillTimes(){
    const sel=$('moTime');sel.innerHTML='';
    for(let minutes=12*60;minutes<19*60;minutes+=30){
      const end=minutes+30;
      const fmt=m=>{let h=Math.floor(m/60),min=m%60,period=h>=12?'p. m.':'a. m.';h=h%12||12;return `${h}:${String(min).padStart(2,'0')} ${period}`;};
      const o=doc.createElement('option');o.value=`${fmt(minutes)}–${fmt(end)}`;o.textContent=o.value;sel.appendChild(o);
    }
  }
  fillTimes();
  $('moTime').value='12:30 p. m.–1:00 p. m.';
  $('moDate').value=nextSaturday();
  routeDate.value=nextSaturday();

  function qty(){return Math.max(.5,Number($('moPounds').value)||1);}
  function updateManualSummary(){
    const pounds=qty(),unit=Number($('moUnitPrice').value)||0,costLb=Number($('moCostPerLb').value)||0,sodas=Math.max(0,Math.floor(Number($('moSodas').value)||0));
    const total=pounds*unit,cost=pounds*costLb,profit=total-cost;
    $('moSummary').innerHTML=`<b>${pounds} lb × $${unit.toFixed(2)} = $${total.toFixed(2)}</b><br>Costo estimado: $${cost.toFixed(2)} · Utilidad bruta estimada: $${profit.toFixed(2)}<br>Refrescos promo: ${sodas}`;
  }
  ['moPounds','moUnitPrice','moCostPerLb','moSodas'].forEach(id=>$(id).addEventListener('input',()=>{if(id==='moPounds')$('moSodas').value=Math.max(0,Math.ceil(qty()));updateManualSummary();}));
  updateManualSummary();

  function openManual(){modal.hidden=false;doc.body.style.overflow='hidden';$('moCustomer').focus();}
  function closeManual(){modal.hidden=true;doc.body.style.overflow='';}
  $('openManualOrder').onclick=openManual;
  $('closeManualOrder').onclick=closeManual;
  modal.addEventListener('click',e=>{if(e.target===modal)closeManual();});
  $('openRoute').onclick=()=>activateTab('deliveries');

  function activateTab(id){
    doc.querySelectorAll('.nav button').forEach(x=>x.classList.toggle('active',x.dataset.tab===id));
    doc.querySelectorAll('.panel').forEach(x=>x.classList.toggle('active',x.id===id));
    if(id==='deliveries') renderRoute();
  }
  deliveryBtn.addEventListener('click',()=>activateTab('deliveries'));

  function buildRecipe(pounds,sodas,pack12){
    const r={fish:PROTEIN_LB*pounds,shrimp:PROTEIN_LB*pounds};
    Object.entries(COMMON_PER_LB).forEach(([k,v])=>r[k]=v*pounds);
    if(pack12){r.container12=2*pounds;r.lid12=2*pounds;r.spoon=1*pounds;r.napkins=2*pounds;}
    if(sodas>0)r.coca=sodas;
    return Object.fromEntries(Object.entries(r).map(([k,v])=>[k,Math.round((Number(v)+Number.EPSILON)*1000)/1000]));
  }

  $('saveManualOrder').onclick=async()=>{
    const customer=$('moCustomer').value.trim(),phone=$('moPhone').value.trim(),address=$('moAddress').value.trim(),zip=$('moZip').value.trim(),deliveryDate=$('moDate').value,time=$('moTime').value;
    if(!customer||!phone||!address||!zip||!deliveryDate||!time){alert('Completa nombre, teléfono, dirección, ZIP, día y bloque de entrega.');return;}
    const pounds=qty(),unitPrice=Number($('moUnitPrice').value)||0,costPerLb=Number($('moCostPerLb').value)||0,sodas=Math.max(0,Math.floor(Number($('moSodas').value)||0)),pack12=$('moPack12').checked;
    const total=Number((pounds*unitPrice).toFixed(2)),cost=Number((pounds*costPerLb).toFixed(2)),profit=Number((total-cost).toFixed(2));
    const ref=db.collection('pedidos').doc();
    const order={
      status:'nuevo',deliveryStatus:'por_preparar',customer,phone,address,zip,deliveryDate,time,payment:'Al recibir',notes:$('moNotes').value.trim()||'Sin notas',source:`manual-${$('moSource').value.toLowerCase()}`,
      items:[{productId:'mixed_lb_manual',name:'Ceviche mixto',detail:`Pescado y camarón · ${pounds} libra${pounds===1?'':'s'} · Pedido manual`,qty:pounds,unitPrice,lineTotal:total}],
      recipe:buildRecipe(pounds,sodas,pack12),total,cost,profit,costComplete:true,
      manualOrder:true,pounds,unitPrice,costPerLb,promoSodas:sodas,packaging12:pack12,
      createdAt:firebase.firestore.FieldValue.serverTimestamp(),createdAtClient:new Date().toISOString()
    };
    $('saveManualOrder').disabled=true;$('saveManualOrder').textContent='Guardando...';
    try{
      await ref.set({...order,id:ref.id});
      closeManual();
      if(typeof toast==='function')toast('Pedido manual guardado');
      routeDate.value=deliveryDate;
      activateTab('deliveries');
      ['moCustomer','moPhone','moAddress','moZip','moNotes'].forEach(id=>$(id).value='');
      $('moPounds').value='1';$('moSodas').value='1';updateManualSummary();
    }catch(err){console.error(err);alert('No se pudo guardar el pedido manual.');}
    finally{$('saveManualOrder').disabled=false;$('saveManualOrder').textContent='Guardar pedido';}
  };

  function firstTimeMinutes(value){
    const s=String(value||'').toLowerCase();
    const m=s.match(/(\d{1,2}):(\d{2})\s*(a\.?\s*m\.?|p\.?\s*m\.?)?/);
    if(!m)return 9999;
    let h=Number(m[1]),min=Number(m[2]);const period=(m[3]||'').replace(/\s|\./g,'');
    if(period==='pm'&&h<12)h+=12;if(period==='am'&&h===12)h=0;
    return h*60+min;
  }
  function displayStage(o){
    const s=o.status==='entregado'?'entregado':(o.deliveryStatus||'por_preparar');
    return ({por_preparar:'POR PREPARAR',listo:'LISTO',en_ruta:'EN RUTA',entregado:'ENTREGADO'})[s]||String(s).toUpperCase();
  }
  function poundsFromOrder(o){
    if(Number(o.pounds)>0)return Number(o.pounds);
    return (o.items||[]).reduce((sum,i)=>{const txt=`${i.name||''} ${i.detail||''}`.toLowerCase();if(txt.includes('½')||txt.includes('1/2'))return sum+.5*Number(i.qty||1);if(txt.includes('libra'))return sum+Number(i.qty||1);return sum;},0);
  }
  function safeAddressLink(address){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(address||'');}
  function routeClass(stage){return stage==='listo'?'ready':stage==='en_ruta'?'onroute':stage==='entregado'?'done':'';}

  async function updateDelivery(id,next){
    const o=(typeof orders!=='undefined'?orders:[]).find(x=>x.id===id);if(!o)return;
    if(next==='entregado'){
      try{
        if(typeof setStatus==='function'&&o.status!=='entregado'){
          await setStatus(id,'entregado');
          const latest=(typeof orders!=='undefined'?orders:[]).find(x=>x.id===id);
          if(latest&&latest.status!=='entregado')return;
        }
        await db.collection('pedidos').doc(id).update({deliveryStatus:'entregado',routeDeliveredAt:firebase.firestore.FieldValue.serverTimestamp()});
      }catch(e){console.error(e);alert('No se pudo finalizar la entrega.');}
      return;
    }
    try{await db.collection('pedidos').doc(id).update({deliveryStatus:next,routeUpdatedAt:firebase.firestore.FieldValue.serverTimestamp()});if(typeof toast==='function')toast(next==='listo'?'Pedido listo':next==='en_ruta'?'Pedido en ruta':'Estado actualizado');}
    catch(e){console.error(e);alert('No se pudo actualizar la entrega.');}
  }
  async function confirmRouteOrder(id){
    try{if(typeof setStatus==='function')await setStatus(id,'confirmado');}
    catch(e){console.error(e);alert('No se pudo confirmar el pedido.');}
  }
  window.confirmRouteOrder=confirmRouteOrder;
  window.updateDelivery=updateDelivery;

  function renderRoute(){
    const date=routeDate.value||routeDateDefault();if(!routeDate.value)routeDate.value=date;
    const list=(typeof orders!=='undefined'?orders:[]).filter(o=>o.deliveryDate===date&&o.status!=='cancelado').sort((a,b)=>firstTimeMinutes(a.time)-firstTimeMinutes(b.time)||String(a.zip||'').localeCompare(String(b.zip||'')));
    const totalLb=list.reduce((s,o)=>s+poundsFromOrder(o),0),sales=list.reduce((s,o)=>s+Number(o.total||0),0);
    $('routeSummary').innerHTML=`<div class="route-stat"><small>Pedidos</small><b>${list.length}</b></div><div class="route-stat"><small>Libras</small><b>${Number(totalLb.toFixed(1))}</b></div><div class="route-stat"><small>Venta</small><b>$${sales.toFixed(2)}</b></div>`;
    if(!list.length){$('routeList').innerHTML='<div class="empty">No hay entregas registradas para este día.</div>';return;}
    const groups={};list.forEach(o=>{const k=o.time||'Sin horario';(groups[k]??=[]).push(o);});
    $('routeList').innerHTML=Object.entries(groups).map(([time,group])=>`<section class="route-block"><h3 class="route-block-title">🕒 ${time}</h3>${group.map(o=>{const stage=o.status==='entregado'?'entregado':(o.deliveryStatus||'por_preparar');const lb=poundsFromOrder(o),items=(o.items||[]).map(i=>`${i.qty} × ${i.name}`).join(' · ');let next='';if(o.status==='nuevo')next=`<button class="route-warn" onclick="confirmRouteOrder('${o.id}')">📦 Confirmar y apartar</button>`;else if(stage==='por_preparar')next=`<button class="route-next" onclick="updateDelivery('${o.id}','listo')">✅ Marcar listo</button>`;else if(stage==='listo')next=`<button class="route-next" onclick="updateDelivery('${o.id}','en_ruta')">🛵 Salir a ruta</button>`;else if(stage==='en_ruta')next=`<button class="route-next" onclick="updateDelivery('${o.id}','entregado')">✅ Entregado</button>`;else next='<span class="route-done" style="padding:10px;border-radius:10px;text-align:center;font-weight:1000">Venta finalizada</span>';const confirmNote=o.status==='nuevo'?'<br>⚠️ Falta confirmar y apartar inventario':'';return `<article class="route-card ${routeClass(stage)}"><div class="route-card-head"><div><strong>${o.customer||'Cliente'} · ${lb?lb+' lb':''}</strong><small>${o.phone||''}<br>${o.address||''}${o.zip?' · '+o.zip:''}<br>${o.source?String(o.source).replace('manual-','Fuente: '):''}${confirmNote}</small></div><span class="route-stage">${displayStage(o)}</span></div><div class="route-meta">${items||'Pedido'}<br>Venta: ${typeof money==='function'?money(o.total):'$'+Number(o.total||0).toFixed(2)}${o.notes&&o.notes!=='Sin notas'?`<br>📝 ${o.notes}`:''}</div><div class="route-actions"><a class="route-map" target="_blank" rel="noopener" href="${safeAddressLink(o.address)}">📍 Abrir mapa</a>${next}</div></article>`}).join('')}</section>`).join('');
  }

  routeDate.addEventListener('change',renderRoute);
  $('routeToday').onclick=()=>{routeDate.value=routeDateDefault();renderRoute();};

  try{
    db.collection('pedidos').orderBy('createdAt','desc').onSnapshot(()=>{if(deliveryPanel.classList.contains('active'))setTimeout(renderRoute,50);});
  }catch(_){ }

  deliveryBtn.addEventListener('click',renderRoute);
  setTimeout(()=>{if(!routeDate.value)routeDate.value=routeDateDefault();renderRoute();},300);
})();