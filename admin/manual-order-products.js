(()=>{
  if(window.__EL_CUBANO_MANUAL_ORDER_PRODUCTS_V1__)return;
  window.__EL_CUBANO_MANUAL_ORDER_PRODUCTS_V1__=true;

  const PRODUCT_OPTIONS={
    fish:{id:'manual_fish',name:'Ceviche de pescado',short:'Pescado',kind:'ceviche',recipeType:'fish',price:15,cost:3.81},
    shrimp:{id:'manual_shrimp',name:'Ceviche de camarón',short:'Camarón',kind:'ceviche',recipeType:'shrimp',price:20,cost:6.01},
    mixed:{id:'manual_mixed',name:'Ceviche mixto',short:'Mixto',kind:'ceviche',recipeType:'mixed',price:25,cost:4.91},
    cocktailShrimp:{id:'manual_cocktail_shrimp',name:'Cóctel de camarón',short:'Cóctel camarón',kind:'cocktail',price:10,cost:2.65},
    cocktailFishShrimp:{id:'manual_cocktail_fish_shrimp',name:'Cóctel pescado y camarón',short:'Cóctel pescado + camarón',kind:'cocktail',price:null,cost:null}
  };

  const E=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':'&quot;',"'":'&#39;'}[c]));

  function ensureProductField(){
    if(E('moProduct'))return;
    const pounds=E('moPounds')?.closest('.quick-field');
    if(!pounds)return;
    const field=document.createElement('div');
    field.className='quick-field full';
    field.id='manualProductField';
    field.innerHTML=`
      <span>Producto</span>
      <div class="quick-options" id="manualProductButtons">
        ${Object.entries(PRODUCT_OPTIONS).map(([key,p])=>`<button type="button" data-quick-target="moProduct" data-value="${esc(key)}">${esc(p.short)}</button>`).join('')}
      </div>
      <select id="moProduct" class="quick-native">
        ${Object.entries(PRODUCT_OPTIONS).map(([key,p])=>`<option value="${esc(key)}">${esc(p.name)}</option>`).join('')}
      </select>`;
    pounds.insertAdjacentElement('beforebegin',field);
  }

  function currentConfig(){return PRODUCT_OPTIONS[E('moProduct')?.value]||PRODUCT_OPTIONS.mixed;}
  function isCocktail(){return currentConfig().kind==='cocktail';}

  function syncProductButtons(){
    const value=E('moProduct')?.value||'mixed';
    document.querySelectorAll('[data-quick-target="moProduct"]').forEach(b=>b.classList.toggle('active',b.dataset.value===value));
  }

  function quantityField(){return E('moPounds')?.closest('.quick-field');}
  function priceField(){return E('moPrice')?.closest('.quick-field');}

  function renderQuantityChoices(){
    const field=quantityField(),input=E('moPounds');
    if(!field||!input)return;
    const label=field.querySelector(':scope > span');
    const box=field.querySelector('.quick-options');
    if(isCocktail()){
      if(label)label.textContent='Cantidad de cócteles';
      input.min='1';input.step='1';
      if(box)box.innerHTML=`<button type="button" data-quick-target="moPounds" data-value="1">1</button><button type="button" data-quick-target="moPounds" data-value="2">2</button><button type="button" data-quick-target="moPounds" data-value="3">3</button><button type="button" data-quick-target="moPounds" data-value="4">4</button><button type="button" data-quick-other="moPounds">Otro</button>`;
    }else{
      if(label)label.textContent='Libras';
      input.min='0.5';input.step='0.5';
      if(box)box.innerHTML=`<button type="button" data-quick-target="moPounds" data-value="0.5">½</button><button type="button" data-quick-target="moPounds" data-value="1">1</button><button type="button" data-quick-target="moPounds" data-value="1.5">1½</button><button type="button" data-quick-target="moPounds" data-value="2">2</button><button type="button" data-quick-other="moPounds">Otro</button>`;
    }
  }

  function renderPriceLabel(){
    const field=priceField();
    const label=field?.querySelector(':scope > span');
    if(label)label.textContent=isCocktail()?'Precio por cóctel':'Precio por libra';
  }

  function productFromOrder(o){
    const saved=String(o?.manualProductType||o?.productType||'');
    if(PRODUCT_OPTIONS[saved])return saved;
    const item=o?.items?.[0]||{};
    const id=String(item.productId||'').toLowerCase();
    const name=String(item.name||'').toLowerCase();
    if(id.includes('cocktail_fish_shrimp')||((name.includes('cóctel')||name.includes('coctel'))&&name.includes('pescado')&&name.includes('camar')))return 'cocktailFishShrimp';
    if(id.includes('cocktail_shrimp')||((name.includes('cóctel')||name.includes('coctel'))&&name.includes('camar')))return 'cocktailShrimp';
    if(id.includes('manual_fish')||(name.includes('ceviche')&&name.includes('pescado')&&!name.includes('mixto')))return 'fish';
    if(id.includes('manual_shrimp')||(name.includes('ceviche')&&name.includes('camar')&&!name.includes('mixto')))return 'shrimp';
    return 'mixed';
  }

  function applyProductUi({resetValues=false}={}){
    const cfg=currentConfig();
    renderQuantityChoices();
    renderPriceLabel();
    if(resetValues){
      E('moPounds').value='1';
      if(cfg.price!=null)E('moPrice').value=String(cfg.price);else E('moPrice').value='';
      E('moCost').value=cfg.cost!=null?String(cfg.cost):'0';
    }
    syncProductButtons();
    if(typeof syncOrderQuickButtons==='function')syncOrderQuickButtons();
    if(typeof updateOrderSummary==='function')updateOrderSummary();
  }

  ensureProductField();

  const baseSyncOrderQuickButtons=typeof syncOrderQuickButtons==='function'?syncOrderQuickButtons:null;
  if(baseSyncOrderQuickButtons){
    syncOrderQuickButtons=function(){baseSyncOrderQuickButtons();syncProductButtons();};
  }

  updateOrderSummary=function(){
    const cfg=currentConfig();
    let qty=Number(E('moPounds')?.value||0);
    qty=cfg.kind==='cocktail'?Math.max(1,Math.floor(qty||1)):Math.max(.5,qty||1);
    const price=Number(E('moPrice')?.value||0),costPer=Number(E('moCost')?.value||0),total=qty*price,cost=qty*costPer;
    const unit=cfg.kind==='cocktail'?(qty===1?'cóctel':'cócteles'):(qty===1?'lb':'lb');
    E('moSummary').innerHTML=`<b>${esc(cfg.name)}</b><br>${qty} ${unit} × ${money(price)} = <b>${money(total)}</b><br>Costo estimado: ${money(cost)} · Utilidad: ${money(total-cost)}`;
  };

  E('moProduct')?.addEventListener('change',()=>applyProductUi({resetValues:true}));

  const baseOpenOrderModal=typeof openOrderModal==='function'?openOrderModal:null;
  if(baseOpenOrderModal){
    openOrderModal=function(id=''){
      baseOpenOrderModal(id);
      ensureProductField();
      const o=(orders||[]).find(x=>x.id===id);
      E('moProduct').value=o?productFromOrder(o):'mixed';
      applyProductUi({resetValues:false});
      if(o){
        const cfg=currentConfig();
        const savedQty=cfg.kind==='cocktail'?Number(o.cocktailQty||o.quantity||o.items?.[0]?.qty||1):Number(o.pounds||o.quantity||o.items?.[0]?.qty||1);
        E('moPounds').value=String(savedQty||1);
        if(o.unitPrice!=null)E('moPrice').value=String(o.unitPrice);
        if(o.costPerUnit!=null)E('moCost').value=String(o.costPerUnit);
        else if(o.costPerLb!=null)E('moCost').value=String(o.costPerLb);
        applyProductUi({resetValues:false});
      }
    };
  }

  const baseSaveEditedOrder=typeof saveEditedOrder==='function'?saveEditedOrder:null;
  if(baseSaveEditedOrder){
    saveEditedOrder=async function(old,data,targetDirect){
      const id=old.id,or=db.collection('pedidos').doc(id),wasDelivered=old.status==='entregado',saleRefs=(wasDelivered||targetDirect)?await saleMovementRefs(id):[],newMove=saleRefs[0]||db.collection('movimientos').doc(),stamp=firebase.firestore.FieldValue.serverTimestamp();
      if(!targetDirect){
        const conflict=orders.find(o=>!o.deleted&&o.id!==id&&o.status!=='cancelado'&&!o.directSale&&o.deliveryDate===data.deliveryDate&&o.time===data.time);
        if(conflict)throw new Error('Ese horario ya tiene otra entrega.');
      }
      if(targetDirect&&!wasDelivered){
        const miss=missing(data.recipe,old.status==='confirmado'?id:null);
        if(miss.length&&!confirm('⚠️ Inventario insuficiente:\n\n'+miss.join('\n')+'\n\n¿REGISTRAR COMO VENTA DIRECTA DE TODOS MODOS?'))return false;
      }
      await db.runTransaction(async tx=>{
        const os=await tx.get(or);if(!os.exists)throw new Error('El pedido ya no existe.');
        const currentOrder=os.data(),needInventory=wasDelivered||targetDirect;
        if(needInventory){
          const is=await tx.get(inventoryRef),cur={...EMPTY,...(is.exists?(is.data().items||{}):{})};
          if(wasDelivered)Object.entries(currentOrder.recipe||{}).forEach(([k,v])=>cur[k]=round3(Number(cur[k]||0)+Number(v||0)));
          if(targetDirect)Object.entries(data.recipe||{}).forEach(([k,v])=>cur[k]=round3(Number(cur[k]||0)-Number(v||0)));
          tx.set(inventoryRef,{items:cur,updatedAt:stamp},{merge:true});
        }
        if(targetDirect){
          const next={...data,status:'entregado',deliveryStatus:'entregado',directSale:true,deliveryDate:localDay(),time:'Venta directa',phone:'',address:'',zip:'',deliveredAt:wasDelivered?(currentOrder.deliveredAt||stamp):stamp,routeDeliveredAt:stamp,editedAt:stamp};
          tx.update(or,next);
          tx.set(newMove,{type:'sale',date:stamp,day:localDay(),name:`Venta directa · ${data.productName}`,orderId:id,total:data.total,cost:data.cost,profit:data.profit,payment:data.payment,manualSource:data.manualSource});
          saleRefs.slice(1).forEach(r=>tx.delete(r));
        }else{
          saleRefs.forEach(r=>tx.delete(r));
          tx.update(or,{...data,status:wasDelivered?'confirmado':(currentOrder.status||'confirmado'),deliveryStatus:wasDelivered?'por_preparar':(currentOrder.deliveryStatus||'por_preparar'),directSale:false,deliveredAt:firebase.firestore.FieldValue.delete(),routeDeliveredAt:firebase.firestore.FieldValue.delete(),inventoryWarningAtDelivery:firebase.firestore.FieldValue.delete(),editedAt:stamp});
        }
      });
      return true;
    };
  }

  E('orderSave').onclick=async()=>{
    const cfg=currentConfig(),direct=E('moKind').value==='direct',customer=E('moCustomer').value.trim()||'Cliente',phone=E('moPhone').value.trim(),address=E('moAddress').value.trim(),zip=E('moZip').value.trim(),deliveryDate=E('moDate').value,time=E('moTime').value;
    if(!direct&&(!customer||!phone||!address||!zip||!deliveryDate||!time))return alert('Completa nombre, teléfono, dirección, ZIP, día y horario.');

    let qty=Number(E('moPounds').value||0);
    if(cfg.kind==='cocktail'){
      qty=Math.floor(qty);
      if(!(qty>=1))return alert('Escribe cuántos cócteles son.');
    }else if(!(qty>=.5))return alert('Escribe cuántas libras son.');

    const unitPrice=Number(E('moPrice').value||0);
    if(!(unitPrice>0))return alert(cfg.kind==='cocktail'?'Escribe el precio por cóctel.':'Escribe el precio por libra.');
    const costPerUnit=Math.max(0,Number(E('moCost').value)||0),sodas=cfg.kind==='ceviche'?Math.max(0,Math.floor(Number(E('moSodas').value)||0)):0,pack=E('moPack').checked;
    const total=Number((qty*unitPrice).toFixed(2)),cost=Number((qty*costPerUnit).toFixed(2)),profit=Number((total-cost).toFixed(2)),manualSource=E('moSource').value,payment=E('moPayment').value;
    const recipe=cfg.kind==='ceviche'?buildRecipe(qty,sodas,pack,cfg.recipeType):{};
    const notes=E('moNotes').value.trim()||'Sin notas',detail=direct?'Venta directa':'Pedido ingresado';
    const itemDetail=cfg.kind==='cocktail'?`12 oz · ${qty} ${qty===1?'cóctel':'cócteles'} · ${detail}`:`${qty} ${qty===1?'libra':'libras'} · ${detail}`;
    const data={
      customer,phone,address,zip,deliveryDate,time,payment,notes,source:'app-clientes',manualSource,
      items:[{productId:cfg.id,name:cfg.name,detail:itemDetail,qty,unitPrice,lineTotal:total}],
      recipe,total,cost,profit,costComplete:cfg.cost!=null,manualOrder:true,manualProductType:E('moProduct').value,productType:E('moProduct').value,productName:cfg.name,
      quantity:qty,quantityUnit:cfg.kind==='cocktail'?'pza':'lb',pounds:cfg.kind==='ceviche'?qty:0,cocktailQty:cfg.kind==='cocktail'?qty:0,
      unitPrice,costPerLb:costPerUnit,costPerUnit,promoSodas:sodas,packaging12:pack,cucumberUnitVersion:'piece-v15'
    };

    E('orderSave').disabled=true;
    try{
      if(editOrderId){
        const old=orders.find(o=>o.id===editOrderId);if(!old)throw new Error('No encuentro ese pedido.');
        const ok=await saveEditedOrder(old,data,direct);
        if(ok){toast('Registro corregido');E('orderModal').hidden=true;editOrderId='';}
      }else if(direct){
        const miss=missing(recipe);
        if(miss.length&&!confirm('⚠️ Inventario insuficiente:\n\n'+miss.join('\n')+'\n\n¿REGISTRAR LA VENTA DE TODOS MODOS?'))return;
        const ref=db.collection('pedidos').doc(),mr=db.collection('movimientos').doc(),stamp=firebase.firestore.FieldValue.serverTimestamp();
        await db.runTransaction(async tx=>{
          const is=await tx.get(inventoryRef),cur={...EMPTY,...(is.exists?(is.data().items||{}):{})};
          Object.entries(recipe).forEach(([k,v])=>cur[k]=round3(Number(cur[k]||0)-Number(v||0)));
          const order={id:ref.id,...data,status:'entregado',deliveryStatus:'entregado',directSale:true,phone:'',address:'',zip:'',deliveryDate:localDay(),time:'Venta directa',createdAt:stamp,deliveredAt:stamp,routeDeliveredAt:stamp,createdAtClient:new Date().toISOString()};
          tx.set(inventoryRef,{items:cur,updatedAt:stamp},{merge:true});
          tx.set(ref,order);
          tx.set(mr,{type:'sale',date:stamp,day:localDay(),name:`Venta directa · ${cfg.name}`,orderId:ref.id,total,cost,profit,payment,manualSource});
        });
        toast('Venta directa registrada');E('orderModal').hidden=true;
      }else{
        const conflict=orders.find(o=>!o.deleted&&o.status!=='cancelado'&&!o.directSale&&o.deliveryDate===deliveryDate&&o.time===time);
        if(conflict)return alert('Ese horario ya tiene otra entrega.');
        const ref=db.collection('pedidos').doc(),stamp=firebase.firestore.FieldValue.serverTimestamp();
        await ref.set({id:ref.id,...data,status:'confirmado',deliveryStatus:'por_preparar',directSale:false,confirmedAt:stamp,createdAt:stamp,createdAtClient:new Date().toISOString()});
        toast('Pedido ingresado');E('orderModal').hidden=true;
      }
    }catch(e){console.error(e);alert(e.message||'No se pudo guardar.');}
    finally{E('orderSave').disabled=false;}
  };

  applyProductUi({resetValues:false});
})();
