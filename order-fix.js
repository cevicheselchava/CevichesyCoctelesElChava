(()=>{
  'use strict';

  // Una sola capa visual ligera: sin blur ni filtros pesados al hacer scroll.
  const style=document.createElement('style');
  style.id='customer-light-ui-v9';
  style.textContent=`
    .wrap{isolation:isolate!important}
    .wrap::before{
      content:""!important;
      position:fixed!important;
      inset:12% 0 8%!important;
      z-index:0!important;
      pointer-events:none!important;
      background:url('/el-cubano-logo-transparent.png') center 56%/min(72vw,460px) auto no-repeat!important;
      opacity:.22!important;
    }
    .wrap>*{position:relative!important;z-index:1!important}

    .hero{background:rgba(255,255,255,.58)!important;border-color:rgba(226,216,199,.72)!important}
    .main-logo{background:transparent!important;box-shadow:none!important}
    .cart-top{background:rgba(255,255,255,.56)!important}
    .benefit{background:rgba(255,255,255,.46)!important;border-color:rgba(225,219,207,.68)!important;box-shadow:0 3px 8px rgba(24,49,73,.035)!important}
    .notice,.availability-note{background:rgba(255,255,255,.46)!important;border-color:rgba(230,220,203,.68)!important}
    #customer-category-nav{background:rgba(255,255,255,.44)!important;border-color:rgba(230,220,203,.68)!important;box-shadow:0 3px 8px rgba(24,49,73,.035)!important}
    #customer-category-nav button{background:rgba(255,255,255,.48)!important;border-color:rgba(231,223,210,.62)!important;box-shadow:0 2px 6px rgba(24,55,70,.03)!important}
    #customer-category-nav button:nth-child(1).active{background:linear-gradient(135deg,rgba(200,58,48,.82),rgba(231,94,78,.78))!important}
    #customer-category-nav button:nth-child(2).active{background:linear-gradient(135deg,rgba(237,176,32,.84),rgba(246,201,68,.78))!important}
    #customer-category-nav button:nth-child(3).active{background:linear-gradient(135deg,rgba(37,115,68,.82),rgba(61,153,96,.78))!important}
    #customer-category-nav button:nth-child(4).active{background:linear-gradient(135deg,rgba(200,58,48,.82),rgba(231,94,78,.78))!important}
    #customer-category-nav button:nth-child(5).active{background:linear-gradient(135deg,rgba(237,176,32,.84),rgba(246,201,68,.78))!important}
    .product{background:rgba(255,255,255,.40)!important;border-color:rgba(226,218,204,.68)!important;box-shadow:0 3px 8px rgba(24,49,73,.035)!important}
    .checkout{background:rgba(255,255,255,.43)!important;border-color:rgba(230,220,203,.70)!important;box-shadow:0 3px 8px rgba(25,48,80,.035)!important}
    input,select,textarea{background:rgba(255,255,255,.62)!important}
    .instant-order-button{background:linear-gradient(100deg,rgba(217,70,56,.86),rgba(243,189,47,.82))!important;border:1px solid rgba(255,255,255,.42)!important;box-shadow:0 4px 10px rgba(120,75,20,.08)!important}
    .qty button{background:rgba(20,54,91,.84)!important}
    .qty .plus{background:rgba(35,116,67,.84)!important}

    .cart-modal{z-index:1000!important}
    .cart-actions{position:relative!important;z-index:3!important;margin-top:12px!important}
    body.modal-open .sticky{display:none!important}

    @media(max-width:560px){
      body::before,body::after{position:absolute!important}
      .product{min-width:0;padding:9px;overflow:hidden}
      .bottom{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:7px!important;align-items:end!important}
      .price{font-size:22px!important;min-width:0}
      .qty{display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;width:100%!important;max-width:100%!important;min-height:38px!important;font-size:17px!important}
      .qty button{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:36px!important;height:36px!important;min-width:36px!important;min-height:36px!important;padding:0!important;margin:0!important;border:0!important;box-sizing:border-box!important;line-height:1!important;text-align:center!important;font-size:24px!important}
      .qty span{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:26px!important;min-width:26px!important;height:36px!important;margin:0!important;padding:0!important;line-height:1!important;text-align:center!important}
      .cart-dialog{max-height:92vh!important;padding-bottom:calc(24px + env(safe-area-inset-bottom))!important}
      .cart-actions button{min-height:54px!important;font-size:16px!important}
    }
  `;
  document.head.appendChild(style);

  document.querySelectorAll('.qty button').forEach(button=>{
    if(button.textContent.trim()==='-')button.textContent='−';
  });

  const sendButton=document.getElementById('continueOrder');
  const modal=document.getElementById('cartModal');
  const closeButton=document.getElementById('closeCart');
  const backdrop=document.getElementById('cartBackdrop');
  const keepShoppingButton=document.getElementById('keepShopping');

  function hideCart(event){
    if(event){event.preventDefault();event.stopPropagation()}
    if(modal)modal.hidden=true;
    document.body.classList.remove('modal-open');
  }

  window.closeCart=hideCart;
  [closeButton,backdrop,keepShoppingButton].forEach(element=>{
    if(!element)return;
    element.style.pointerEvents='auto';
    element.addEventListener('click',hideCart,true);
  });

  if(!sendButton||typeof validateOrder!=='function'||typeof buildOrder!=='function'||typeof buildWhatsApp!=='function')return;

  const PROJECT_ID='ceviches-y-cocteles-el-chava';
  const API_KEY='AIzaSyBbOIXTr2Tvz1FvoTk5GZgP2jx24jpjlL4';
  let pendingOrderId=sessionStorage.getItem('pendingOrderId')||'';

  function newOrderId(){
    if(pendingOrderId)return pendingOrderId;
    pendingOrderId='PED-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,7).toUpperCase();
    sessionStorage.setItem('pendingOrderId',pendingOrderId);
    return pendingOrderId;
  }

  function toFirestoreValue(value){
    if(value===null)return {nullValue:null};
    if(value instanceof Date)return {timestampValue:value.toISOString()};
    if(Array.isArray(value))return {arrayValue:{values:value.map(toFirestoreValue)}};
    if(typeof value==='boolean')return {booleanValue:value};
    if(typeof value==='number')return Number.isInteger(value)?{integerValue:String(value)}:{doubleValue:value};
    if(typeof value==='string')return {stringValue:value};
    if(typeof value==='object')return {mapValue:{fields:toFirestoreFields(value)}};
    return {stringValue:String(value)};
  }

  function toFirestoreFields(object){
    const fields={};
    Object.entries(object||{}).forEach(([key,value])=>{if(value!==undefined)fields[key]=toFirestoreValue(value)});
    return fields;
  }

  async function saveWithRest(order,id){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),12000);
    const url=`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/pedidos/${encodeURIComponent(id)}?key=${encodeURIComponent(API_KEY)}`;
    try{
      const response=await fetch(url,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({fields:toFirestoreFields(order)}),signal:controller.signal,cache:'no-store'});
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result?.error?.message||`Firebase respondió ${response.status}`);
      return result;
    }finally{clearTimeout(timer)}
  }

  function openWhatsApp(order,id){
    hideCart();
    window.location.href='https://wa.me/12109432119?text='+encodeURIComponent(buildWhatsApp(order,id));
  }

  sendButton.onclick=async()=>{
    if(!validateOrder())return;
    sendButton.disabled=true;
    sendButton.textContent='Enviando pedido...';
    const id=newOrderId();
    const order={...buildOrder(),id,createdAt:new Date(),createdAtClient:new Date().toISOString()};
    try{
      await saveWithRest(order,id);
      sessionStorage.removeItem('pendingOrderId');
      pendingOrderId='';
      openWhatsApp(order,id);
    }catch(error){
      console.error('No se pudo sincronizar el pedido con Firestore:',error);
      sessionStorage.removeItem('pendingOrderId');
      pendingOrderId='';
      openWhatsApp(order,id);
    }finally{
      sendButton.disabled=false;
      sendButton.textContent='Enviar pedido';
    }
  };
})();
