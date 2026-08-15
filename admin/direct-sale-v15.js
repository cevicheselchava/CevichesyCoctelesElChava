(()=>{
  if(window.__EL_CUBANO_DIRECT_SALE_V15__) return;
  window.__EL_CUBANO_DIRECT_SALE_V15__=true;

  const doc=document;
  let tries=0;

  function install(){
    const modal=doc.getElementById('manualOrderModal');
    const saveBtn=doc.getElementById('saveManualOrder');
    const grid=modal?.querySelector('.manual-grid');
    if(!modal||!saveBtn||!grid){
      if(++tries<80) setTimeout(install,100);
      return;
    }
    if(doc.getElementById('moOrderKind')) return;

    const $=id=>doc.getElementById(id);
    const originalSave=saveBtn.onclick;

    const kindLabel=doc.createElement('label');
    kindLabel.className='full';
    kindLabel.innerHTML=`Tipo de registro
      <select id="moOrderKind">
        <option value="delivery">Pedido / entrega</option>
        <option value="direct">Venta directa</option>
      </select>`;
    grid.insertBefore(kindLabel,grid.firstChild);

    const paymentLabel=doc.createElement('label');
    paymentLabel.innerHTML=`Pago
      <select id="moPayment">
        <option>Efectivo</option>
        <option>Cash App</option>
        <option>Zelle</option>
        <option>Tarjeta</option>
        <option>Otro</option>
      </select>`;
    const sourceLabel=$('moSource')?.closest('label');
    if(sourceLabel) sourceLabel.after(paymentLabel); else grid.appendChild(paymentLabel);

    const source=$('moSource');
    if(source && ![...source.options].some(o=>o.value==='Uber')){
      const o=doc.createElement('option');o.value='Uber';o.textContent='Uber / cliente encontrado manejando';source.appendChild(o);
    }
    if(source && ![...source.options].some(o=>o.value==='Venta directa')){
      const o=doc.createElement('option');o.value='Venta directa';o.textContent='Venta directa';source.appendChild(o);
    }

    const note=doc.createElement('div');
    note.id='directSaleNote';
    note.className='notice full';
    note.style.display='none';
    note.innerHTML='⚡ <b>Venta directa:</b> teléfono, dirección y ZIP no son necesarios. Se registra como pagada y entregada en el momento.';
    kindLabel.after(note);

    const deliveryOnly=['moPhone','moAddress','moZip','moDate','moTime'];
    function setDirectMode(){
      const direct=$('moOrderKind').value==='direct';
      deliveryOnly.forEach(id=>{const label=$(id)?.closest('label');if(label)label.style.display=direct?'none':'';});
      note.style.display=direct?'block':'none';
      const title=$('manualTitle');if(title)title.textContent=direct?'Nueva venta directa':'Nuevo pedido manual';
      const intro=modal.querySelector('.manual-sheet > p');
      if(intro) intro.textContent=direct?'Para ventas hechas en persona, Uber, calle o cliente directo.':'Para pedidos que lleguen por Facebook, Messenger, WhatsApp o teléfono.';
      if(direct){
        if(source) source.value='Uber';
        if($('moPayment')) $('moPayment').value='Cash App';
        saveBtn.textContent='Registrar venta pagada';
      }else{
        saveBtn.textContent='Guardar pedido';
      }
    }
    $('moOrderKind').addEventListener('change',setDirectMode);
    setDirectMode();

    function round3(n){return Math.round((Number(n)+Number.EPSILON)*1000)/1000;}
    function localDay(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
    function buildRecipe(pounds,sodas,pack12){
      const protein=125/453.59237;
      const common={tomato:1.6,cucumber:1.6,onion:.8,cilantro:.2,lemonJuice:2.4,clamato:1.4,avocado:.25};
      const r={fish:protein*pounds,shrimp:protein*pounds};
      Object.entries(common).forEach(([k,v])=>r[k]=v*pounds);
      if(pack12){r.container12=2*pounds;r.lid12=2*pounds;r.spoon=1*pounds;r.napkins=2*pounds;}
      if(sodas>0) r.coca=sodas;
      return Object.fromEntries(Object.entries(r).map(([k,v])=>[k,round3(v)]));
    }

    async function saveDirectSale(){
      const pounds=Math.max(.5,Number($('moPounds')?.value)||1);
      const unitPrice=Math.max(0,Number($('moUnitPrice')?.value)||0);
      const costPerLb=Math.max(0,Number($('moCostPerLb')?.value)||0);
      const sodas=Math.max(0,Math.floor(Number($('moSodas')?.value)||0));
      const pack12=Boolean($('moPack12')?.checked);
      const total=Number((pounds*unitPrice).toFixed(2));
      const cost=Number((pounds*costPerLb).toFixed(2));
      const profit=Number((total-cost).toFixed(2));
      const customer=$('moCustomer')?.value.trim()||'Cliente directo';
      const manualSource=(source?.value||'Venta directa').toLowerCase();
      const payment=$('moPayment')?.value||'Efectivo';
      const recipe=buildRecipe(pounds,sodas,pack12);
      const ref=db.collection('pedidos').doc();
      const moveRef=db.collection('movimientos').doc();
      const stamp=firebase.firestore.FieldValue.serverTimestamp();

      saveBtn.disabled=true;saveBtn.textContent='Guardando...';
      try{
        await db.runTransaction(async tx=>{
          const invSnap=await tx.get(inventoryRef);
          const current={...(typeof EMPTY!=='undefined'?EMPTY:{}),...(invSnap.exists?(invSnap.data().items||{}):{})};
          const warnings=[];
          Object.entries(recipe).forEach(([k,v])=>{
            const before=Number(current[k]||0),needed=Number(v||0);
            if(before<needed) warnings.push(`${(typeof ITEMS!=='undefined'&&ITEMS[k]?.name)||k}: faltan ${round3(needed-before)}`);
            current[k]=round3(before-needed);
          });
          const order={
            id:ref.id,status:'entregado',deliveryStatus:'entregado',
            customer,phone:'',address:'',zip:'',deliveryDate:localDay(),time:'Venta directa',payment,
            notes:$('moNotes')?.value.trim()||'Sin notas',source:'app-clientes',manualSource,
            items:[{productId:'mixed_lb_direct',name:'Ceviche mixto',detail:`Pescado y camarón · ${pounds} libra${pounds===1?'':'s'} · Venta directa`,qty:pounds,unitPrice,lineTotal:total}],
            recipe,total,cost,profit,costComplete:true,manualOrder:true,directSale:true,pounds,unitPrice,costPerLb,promoSodas:sodas,packaging12:pack12,
            inventoryWarning:warnings,createdAt:stamp,deliveredAt:stamp,routeDeliveredAt:stamp,createdAtClient:new Date().toISOString()
          };
          tx.set(inventoryRef,{items:current,updatedAt:stamp},{merge:true});
          tx.set(ref,order);
          tx.set(moveRef,{type:'sale',date:stamp,day:localDay(),name:`Venta directa · ${pounds} lb ceviche mixto`,orderId:ref.id,total,cost,profit,inventoryWarning:warnings,payment,manualSource});
        });

        modal.hidden=true;doc.body.style.overflow='';
        ['moCustomer','moPhone','moAddress','moZip','moNotes'].forEach(id=>{if($(id))$(id).value='';});
        if($('moPounds'))$('moPounds').value='1';
        if($('moSodas'))$('moSodas').value='1';
        const ordersBtn=doc.querySelector('.nav button[data-tab="orders"]');if(ordersBtn)ordersBtn.click();
        if(typeof toast==='function')toast(`Venta directa registrada · $${total.toFixed(2)} · ${payment}`);
      }catch(err){
        console.error(err);alert('No se pudo registrar la venta directa.');
      }finally{
        saveBtn.disabled=false;setDirectMode();
      }
    }

    saveBtn.onclick=async event=>{
      if($('moOrderKind')?.value!=='direct'){
        return typeof originalSave==='function'?originalSave.call(saveBtn,event):undefined;
      }
      return saveDirectSale();
    };
  }

  install();
})();
