(()=>{
  if(window.__EL_CUBANO_AUTO_CONFIRM_ORDERS_V1__) return;
  window.__EL_CUBANO_AUTO_CONFIRM_ORDERS_V1__=true;

  const style=document.createElement('style');
  style.id='auto-confirm-orders-v1-style';
  style.textContent=`
    button[data-action="confirm"],
    button[onclick*="confirmRouteOrder"]{display:none!important}
  `;
  document.head.appendChild(style);

  if(typeof db==='undefined'||typeof firebase==='undefined') return;

  let committing=false;
  let rerun=false;

  async function normalizeNewOrders(snapshot){
    const docs=snapshot.docs.filter(d=>{
      const o=d.data()||{};
      return !o.deleted&&!o.directSale&&String(o.status||'nuevo')==='nuevo';
    });
    if(!docs.length) return;
    if(committing){rerun=true;return;}

    committing=true;
    try{
      const batch=db.batch();
      const stamp=firebase.firestore.FieldValue.serverTimestamp();
      docs.forEach(d=>{
        const o=d.data()||{};
        batch.update(d.ref,{
          status:'confirmado',
          deliveryStatus:o.deliveryStatus||'por_preparar',
          confirmedAt:o.confirmedAt||stamp,
          autoConfirmed:true,
          autoConfirmedAt:stamp
        });
      });
      await batch.commit();
      if(typeof renderAll==='function') renderAll();
    }catch(e){
      console.error('No se pudieron acomodar automáticamente los pedidos nuevos:',e);
    }finally{
      committing=false;
      if(rerun){rerun=false;setTimeout(()=>{},0);}
    }
  }

  db.collection('pedidos').where('status','==','nuevo').onSnapshot(normalizeNewOrders,e=>{
    console.error('No se pudo vigilar pedidos nuevos para confirmación automática:',e);
  });
})();
