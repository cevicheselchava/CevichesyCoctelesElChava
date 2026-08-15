(()=>{
  if(window.__EL_CUBANO_INVENTORY_OVERRIDE_V2__)return;
  window.__EL_CUBANO_INVENTORY_OVERRIDE_V2__=true;

  const fmtMissing=list=>list.length?`\n\n${list.join('\n')}`:'';

  async function safeSetStatus(id,next){
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
        const ok=confirm('⚠️ El inventario registrado no alcanza:'+fmtMissing(miss)+'\n\n¿MARCAR COMO ENTREGADO DE TODOS MODOS?');
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
        toast(miss.length?'Venta finalizada con alerta de inventario':'Venta finalizada e inventario descontado');
      }catch(e){
        alert(e.message||'No se pudo finalizar.');
        showError(e);
      }
    }
  }

  // El control.html original tiene onclick="setStatus(...)". En algunos WebViews ese
  // nombre queda ligado a la función original aunque window.setStatus se reemplace.
  // Interceptamos el toque ANTES del onclick original para garantizar que nunca bloquee.
  document.addEventListener('click',event=>{
    const button=event.target.closest('button[onclick*="setStatus("]');
    if(!button)return;
    const code=button.getAttribute('onclick')||'';
    const match=code.match(/setStatus\(['\"]([^'\"]+)['\"],['\"](confirmado|entregado|cancelado)['\"]\)/);
    if(!match)return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    safeSetStatus(match[1],match[2]);
  },true);

  window.safeSetStatus=safeSetStatus;
})();
