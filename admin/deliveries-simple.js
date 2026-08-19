(()=>{
  if(window.__EL_CUBANO_DELIVERIES_SIMPLE__)return;
  window.__EL_CUBANO_DELIVERIES_SIMPLE__=true;

  const panel=document.getElementById('deliveries');
  if(!panel)return;

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const phoneHref=v=>String(v||'').replace(/[^+\d]/g,'');

  const heading=panel.querySelector('.card > h2');
  if(heading)heading.textContent='Entregas';

  if(!document.getElementById('deliveriesSimpleNotice')){
    const notice=document.createElement('div');
    notice.id='deliveriesSimpleNotice';
    notice.className='notice';
    notice.textContent='Aquí solo aparecen pedidos que ya están preparados para entregar.';
    heading?.insertAdjacentElement('afterend',notice);
  }

  const routeLabel=document.querySelector('label:has(#routeDate)');
  if(routeLabel){
    const text=[...routeLabel.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&String(n.textContent||'').trim());
    if(text)text.textContent='Elegir otro día';
  }

  const style=document.createElement('style');
  style.textContent=`
    #deliveries .route-summary{grid-template-columns:repeat(3,minmax(0,1fr))}
    #deliveries .route-card strong{font-size:17px}
    #deliveries .delivery-address{margin-top:8px;padding:10px;border-radius:11px;background:#f7f3e8;font-weight:900;color:#123458;line-height:1.4}
    #deliveries .delivery-phone{display:inline-block;margin-top:7px;color:#174f2b;font-weight:1000;text-decoration:none}
    #deliveries .route-stage{font-size:11px}
    #deliveries .actions a,#deliveries .actions button{min-height:44px;display:flex;align-items:center;justify-content:center}
    @media(max-width:560px){#deliveries .route-summary{grid-template-columns:1fr 1fr}.route-summary .route-stat:last-child{grid-column:1/-1}}
  `;
  document.head.appendChild(style);

  renderRoute=function(){
    const date=$('routeDate').value||routeDateDefault();
    $('routeDate').value=date;

    const list=(orders||[])
      .filter(o=>!o.deleted&&o.deliveryDate===date&&!o.directSale&&(o.status==='entregado'||['listo','en_ruta'].includes(String(o.deliveryStatus||''))))
      .sort((a,b)=>firstTimeMinutes(a.time)-firstTimeMinutes(b.time));

    const pending=list.filter(o=>o.status!=='entregado');
    const delivered=list.filter(o=>o.status==='entregado');

    $('routeSummary').innerHTML=`
      <div class="route-stat"><small>Por entregar</small><b>${pending.length}</b></div>
      <div class="route-stat"><small>Entregadas</small><b>${delivered.length}</b></div>
      <div class="route-stat"><small>Venta del día</small><b>${money(list.reduce((s,o)=>s+Number(o.total||0),0))}</b></div>`;

    if(!list.length){
      $('routeList').innerHTML='<div class="empty">No hay pedidos preparados para entregar este día.</div>';
      return;
    }

    const active=list.filter(o=>o.status!=='entregado');
    const done=list.filter(o=>o.status==='entregado');

    const card=o=>{
      const stage=o.status==='entregado'?'entregado':String(o.deliveryStatus||'listo');
      const cls=stage==='listo'?'ready':stage==='en_ruta'?'onroute':'done';
      const stageText=stage==='listo'?'LISTO PARA SALIR':stage==='en_ruta'?'EN CAMINO':'ENTREGADO';
      const title=typeof orderTitle==='function'?orderTitle(o):'Pedido';
      const address=String(o.address||'').trim();
      const zip=String(o.zip||'').trim();
      const fullAddress=[address,zip].filter(Boolean).join(' · ');
      const mapQuery=encodeURIComponent(address||zip||'');
      const phone=String(o.phone||'').trim();
      const action=stage==='listo'
        ? `<button class="success" data-route="en_ruta" data-id="${esc(o.id)}">🛵 SALIR A ENTREGAR</button>`
        : stage==='en_ruta'
          ? `<button class="success" data-route="entregado" data-id="${esc(o.id)}">✅ MARCAR ENTREGADO</button>`
          : '';
      const actions=stage==='entregado'
        ? '<div class="route-meta"><b>✅ Entrega terminada</b></div>'
        : `<div class="actions"><a class="secondary" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${mapQuery}">📍 ABRIR MAPA</a>${action}</div>`;

      return `<article class="route-card ${cls}">
        <div class="route-head-row"><div><strong>${esc(o.customer||'Cliente')}</strong><small>${esc(title)}</small></div><span class="route-stage">${stageText}</span></div>
        <div class="delivery-address">📍 ${esc(fullAddress||'Dirección no registrada')}</div>
        ${phone?`<a class="delivery-phone" href="tel:${esc(phoneHref(phone))}">📞 ${esc(phone)}</a>`:''}
        <div class="route-meta">💵 Venta: ${money(o.total)}${o.notes&&o.notes!=='Sin notas'?`<br>📝 ${esc(o.notes)}`:''}</div>
        ${actions}
      </article>`;
    };

    const grouped={};
    active.forEach(o=>(grouped[o.time||'Sin horario']??=[]).push(o));
    let html='';
    if(active.length){
      html+='<h3 class="route-block-title">🛵 POR ENTREGAR</h3>';
      html+=Object.entries(grouped).map(([time,g])=>`<section><h3 class="route-block-title">🕒 ${esc(time)}</h3>${g.map(card).join('')}</section>`).join('');
    }
    if(done.length){
      html+='<h3 class="route-block-title">✅ YA ENTREGADAS</h3>'+done.map(card).join('');
    }
    $('routeList').innerHTML=html;
  };

  const baseSync=typeof syncRouteQuickButtons==='function'?syncRouteQuickButtons:null;
  syncRouteQuickButtons=function(){
    if(baseSync)baseSync();
    const today=localDay();
    if($('routeToday'))$('routeToday').textContent=`📅 HOY · ${formatOrderDate(today)}`;
    if($('nextRouteDate'))$('nextRouteDate').textContent='➡️ PRÓXIMAS ENTREGAS';
  };

  syncRouteQuickButtons();
  renderRoute();
})();
