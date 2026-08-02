(()=>{
  const button=document.getElementById('continueOrder');
  if(!button||typeof validateOrder!=='function'||typeof buildOrder!=='function'||typeof buildWhatsApp!=='function')return;

  let pendingOrderId='';

  function withTimeout(promise,ms){
    return new Promise((resolve,reject)=>{
      let finished=false;
      const timer=setTimeout(()=>{
        if(finished)return;
        finished=true;
        const error=new Error('Firebase no respondió a tiempo.');
        error.code='pedido/timeout';
        reject(error);
      },ms);
      promise.then(value=>{
        if(finished)return;
        finished=true;
        clearTimeout(timer);
        resolve(value);
      }).catch(error=>{
        if(finished)return;
        finished=true;
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  button.onclick=async()=>{
    if(!validateOrder())return;
    button.disabled=true;
    button.textContent='Guardando pedido...';

    try{
      await db.enableNetwork().catch(()=>{});
      const order=buildOrder();
      const ref=pendingOrderId
        ? db.collection('pedidos').doc(pendingOrderId)
        : db.collection('pedidos').doc();
      pendingOrderId=ref.id;

      await withTimeout(ref.set({...order,id:ref.id}),15000);
      pendingOrderId='';
      closeCart();
      location.href='https://wa.me/12109432119?text='+encodeURIComponent(buildWhatsApp(order,ref.id));
    }catch(error){
      console.error(error);
      if(error?.code==='pedido/timeout'){
        alert('Firebase no respondió en 15 segundos. Revisa tu internet y vuelve a tocar Enviar pedido. No se duplicará el pedido.');
      }else if(error?.code==='permission-denied'){
        alert('Firebase rechazó el pedido por permisos. Hay que corregir las reglas de Firestore.');
      }else{
        alert('No se pudo guardar el pedido. Revisa la conexión e inténtalo otra vez.');
      }
    }finally{
      button.disabled=false;
      button.textContent='Enviar pedido';
    }
  };
})();
