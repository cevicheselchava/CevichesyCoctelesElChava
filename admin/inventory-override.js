(()=>{
  if(window.__EL_CUBANO_INVENTORY_OVERRIDE_V1__)return;
  window.__EL_CUBANO_INVENTORY_OVERRIDE_V1__=true;

  const fmtMissing=list=>list.length?`\n\n${list.join('\n')}`:'';

  window.setStatus=async function(id,next){
    const local=orders.find(o=>o.id===id);
    if(!local||['entregado','cancelado'].includes(local.status))return;

    if(next==='confirmado'){
      const miss=missing(local.recipe,id);
      if(miss.length){
        const ok=confirm('⚠️ Inventario insuficiente para apartar:'+fmtMissing(miss)+'\n\n¿Confirmar el pedido de todos modos?');
        if(!ok)return;
      }
      try{
        await db.collection('pedidos').doc(id).update({
          status:'confirmado',
          confirmedAt:firebase.firestore.FieldValue.serverTimestamp(),
          inventoryWarning:miss.length?miss:firebase.firestore.FieldValue.delete()
        });
        toast(miss.length?'Pedido confirmado con alerta de inventario':'Ingredientes apartados');
      }catch(e){showError(e)}
      return;
    }

    if(next==='cancelado'){
      try{
        await db.collection('pedidos').doc(id).update({status:'cancelado',cancelledAt:firebase.firestore.FieldValue.serverTimestamp()});
        toast('Pedido cancelado y apartado liberado');
      }catch(e){showError(e)}
      return;
    }

    if(next==='entregado'){
      const miss=missing(local.recipe,local.status==='confirmado'?id:null);
      if(miss.length){
        const ok=confirm('⚠️ El inventario registrado no alcanza:'+fmtMissing(miss)+'\n\nLa entrega ya se hizo. ¿FINALIZAR DE TODOS MODOS?');
        if(!ok)return;
      }

      try{
        await db.runTransaction(async tx=>{
          const orderRef=db.collection('pedidos').doc(id);
          const moveRef=db.collection('movimientos').doc();
          const orderSnap=await tx.get(orderRef);
          const invSnap=await tx.get(inventoryRef);
          if(!orderSnap.exists)throw new Error('El pedido ya no existe.');

          const order=orderSnap.data();
          if(['entregado','cancelado'].includes(order.status))return;
          const current={...EMPTY,...(invSnap.exists?(invSnap.data().items||{}):{})};

          Object.entries(order.recipe||{}).forEach(([k,v])=>{
            current[k]=round(Number(current[k]||0)-Number(v||0));
          });

          tx.set(inventoryRef,{items:current,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
          tx.update(orderRef,{
            status:'entregado',
            deliveredAt:firebase.firestore.FieldValue.serverTimestamp(),
            inventoryWarningAtDelivery:miss.length?miss:firebase.firestore.FieldValue.delete()
          });
          tx.set(moveRef,{
            type:'sale',
            date:firebase.firestore.FieldValue.serverTimestamp(),
            day:today(),
            name:orderTitle(order),
            orderId:id,
            total:Number(order.total||0),
            cost:order.cost??null,
            profit:order.profit??null,
            inventoryWarning:miss.length?miss:[]
          });
        });
        toast(miss.length?'Venta finalizada; inventario quedó con alerta':'Venta finalizada e inventario descontado');
      }catch(e){
        alert(e.message||'No se pudo finalizar.');
        showError(e);
      }
    }
  };
})();
