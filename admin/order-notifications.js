(()=>{
  if(window.__EL_CUBANO_ORDER_NOTIFICATIONS_V1__) return;
  window.__EL_CUBANO_ORDER_NOTIFICATIONS_V1__=true;

  const SEEN_KEY='el-cubano-order-notifications-seen-v1';
  const SEEDED_KEY='el-cubano-order-notifications-seeded-v1';
  const doc=document;

  function readSeen(){
    try{return new Set(JSON.parse(localStorage.getItem(SEEN_KEY)||'[]'));}catch(_){return new Set();}
  }
  function writeSeen(set){
    try{localStorage.setItem(SEEN_KEY,JSON.stringify([...set].slice(-500)));}catch(_){ }
  }
  function money(v){return '$'+Number(v||0).toFixed(2);}
  function pounds(o){
    if(Number(o.pounds)>0)return Number(o.pounds);
    return (o.items||[]).reduce((s,i)=>s+Number(i.qty||0),0);
  }
  function source(o){
    if(o.manualOrder)return `Capturado por ti${o.manualSource?' · '+o.manualSource:''}`;
    return 'Pedido desde la app';
  }

  function addButton(){
    if(doc.getElementById('orderNotifyBtn'))return;
    const host=doc.getElementById('syncStatus')||doc.querySelector('.sync')||doc.querySelector('.hero');
    if(!host)return;
    const btn=doc.createElement('button');
    btn.type='button';
    btn.id='orderNotifyBtn';
    btn.style.cssText='width:100%;margin-top:9px;border:0;border-radius:12px;padding:11px 12px;background:#06254d;color:#fff;font-weight:1000;box-shadow:inset 0 -4px 0 #f2b632';
    btn.onclick=enableNotifications;
    host.insertAdjacentElement('afterend',btn);
    refreshButton();
  }

  function refreshButton(){
    const btn=doc.getElementById('orderNotifyBtn');if(!btn)return;
    if(!('Notification' in window)){btn.textContent='🔕 Este navegador no admite avisos';btn.disabled=true;return;}
    if(Notification.permission==='granted'){btn.textContent='🔔 Avisos de pedidos activados';btn.disabled=true;return;}
    if(Notification.permission==='denied'){btn.textContent='🔕 Avisos bloqueados en el navegador';btn.disabled=true;return;}
    btn.textContent='🔔 Activar avisos de pedidos';
  }

  async function ensureServiceWorker(){
    if(!('serviceWorker' in navigator))return null;
    try{
      await navigator.serviceWorker.register('/admin/service-worker.js',{scope:'/admin/'});
      return await navigator.serviceWorker.ready;
    }catch(e){console.warn('No se pudo preparar el service worker para avisos',e);return null;}
  }

  async function enableNotifications(){
    if(!('Notification' in window))return;
    try{
      const permission=await Notification.requestPermission();
      if(permission==='granted'){
        await ensureServiceWorker();
        if(typeof toast==='function')toast('Avisos de pedidos activados');
      }
    }catch(e){console.error(e);}
    refreshButton();
  }

  async function notifyOrder(id,o){
    if(!('Notification' in window)||Notification.permission!=='granted')return;
    const title='🦐 Nuevo pedido · El Cubano';
    const lb=pounds(o);
    const body=`${o.customer||'Cliente'} · ${lb?lb+' lb · ':''}${o.deliveryDate||''}${o.time?' · '+o.time:''}\n${money(o.total)} · ${source(o)}`;
    const options={
      body,
      tag:'pedido-'+id,
      renotify:true,
      requireInteraction:true,
      icon:'/pwa-icon.svg',
      badge:'/pwa-icon.svg',
      data:{url:'/admin/'}
    };
    try{
      const reg=await ensureServiceWorker();
      if(reg&&reg.showNotification)await reg.showNotification(title,options);
      else new Notification(title,options);
      if(navigator.vibrate)navigator.vibrate([250,100,250]);
    }catch(e){console.warn('No se pudo mostrar el aviso del pedido',e);}
  }

  function startWatch(){
    if(typeof db==='undefined'){setTimeout(startWatch,500);return;}
    let seen=readSeen();
    const seeded=localStorage.getItem(SEEDED_KEY)==='1';
    let first=true;
    db.collection('pedidos').onSnapshot(async snap=>{
      const live=snap.docs.filter(d=>{
        const o=d.data()||{};
        return !o.deleted&&!o.directSale&&!['cancelado','entregado'].includes(String(o.status||''));
      });
      if(first&&!seeded){
        live.forEach(d=>seen.add(d.id));
        writeSeen(seen);
        localStorage.setItem(SEEDED_KEY,'1');
        first=false;
        return;
      }
      first=false;
      for(const d of live){
        if(seen.has(d.id))continue;
        seen.add(d.id);
        writeSeen(seen);
        const o=d.data()||{};
        if(typeof toast==='function')toast(`Nuevo pedido: ${o.customer||'Cliente'}`);
        await notifyOrder(d.id,o);
      }
    },e=>console.error('No se pudieron vigilar pedidos para avisos:',e));
  }

  addButton();
  setTimeout(addButton,1000);
  startWatch();
})();
