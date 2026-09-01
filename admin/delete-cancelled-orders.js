(()=>{
  if(window.__EL_CUBANO_DELETE_CANCELLED_ORDERS_V1__)return;
  window.__EL_CUBANO_DELETE_CANCELLED_ORDERS_V1__=true;

  if(typeof renderOrders!=='function'||typeof deleteManual!=='function')return;

  const originalRenderOrders=renderOrders;
  const originalDeleteManual=deleteManual;

  function visibleOrders(){
    const q=(document.getElementById('orderSearch')?.value||'').trim().toLowerCase();
    return (orders||[])
      .filter(o=>!o.deleted&&typeof orderMatchesView==='function'&&orderMatchesView(o))
      .filter(o=>!q||`${o.customer||''} ${o.phone||''} ${o.id||''} ${o.deliveryDate||''}`.toLowerCase().includes(q));
  }

  function addCancelledDeleteButtons(){
    const list=visibleOrders();
    const cards=[...document.querySelectorAll('#orderList .order')];
    cards.forEach((card,index)=>{
      const o=list[index];
      if(!o||o.status!=='cancelado'||card.querySelector('[data-action="delete"]'))return;
      let actions=card.querySelector('.actions');
      if(!actions){
        actions=document.createElement('div');
        actions.className='actions';
        card.appendChild(actions);
      }
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='danger';
      btn.dataset.action='delete';
      btn.dataset.id=o.id;
      btn.textContent='🗑️ Borrar pedido';
      actions.appendChild(btn);
    });
  }

  renderOrders=function(){
    originalRenderOrders();
    addCancelledDeleteButtons();
  };

  deleteManual=async function(id){
    const o=(orders||[]).find(x=>x.id===id);
    if(!o||o.deleted)return;

    if(o.status==='cancelado'){
      if(!confirm(`¿Borrar el pedido cancelado de ${o.customer||'este cliente'}?\n\nSolo desaparecerá del panel. No moverá inventario ni ventas.`))return;
      try{
        await db.collection('pedidos').doc(id).update({
          deleted:true,
          deletedAt:firebase.firestore.FieldValue.serverTimestamp()
        });
        if(typeof toast==='function')toast('Pedido cancelado borrado');
      }catch(e){
        console.error(e);
        alert('No se pudo borrar el pedido. Inténtalo otra vez.');
      }
      return;
    }

    return originalDeleteManual(id);
  };

  renderOrders();
})();
