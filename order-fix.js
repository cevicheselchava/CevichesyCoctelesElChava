(()=>{
  const sendButton=document.getElementById('continueOrder');
  const modal=document.getElementById('cartModal');
  const closeButton=document.getElementById('closeCart');
  const backdrop=document.getElementById('cartBackdrop');
  const keepShoppingButton=document.getElementById('keepShopping');

  function hideCart(){
    if(modal)modal.hidden=true;
    document.body.classList.remove('modal-open');
  }

  window.closeCart=hideCart;

  function attachClose(element){
    if(!element)return;
    element.style.pointerEvents='auto';
    element.style.zIndex='5';
    element.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      hideCart();
    },true);
  }

  attachClose(closeButton);
  attachClose(backdrop);
  attachClose(keepShoppingButton);

  document.addEventListener('click',event=>{
    if(event.target.closest('#closeCart')){
      event.preventDefault();
      event.stopPropagation();
      hideCart();
    }
  },true);

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
    Object.entries(object||{}).forEach(([key,value])=>{
      if(value!==undefined)fields[key]=toFirestoreValue(value);
    });
    return fields;
  }

  async function saveWithRest(order,id){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),15000);
    const url=`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/pedidos/${encodeURIComponent(id)}?key=${encodeURIComponent(API_KEY)}`;
    try{
      const response=await fetch(url,{
        method:'PATCH',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({fields:toFirestoreFields(order)}),
        signal:controller.signal,
        cache:'no-store'
      });
      const result=await response.json().catch(()=>({}));
      if(!response.ok){
        const error=new Error(result?.error?.message||`Firebase respondió ${response.status}`);
        error.status=response.status;
        throw error;
      }
      return result;
    }finally{
      clearTimeout(timer);
    }
  }

  function openWhatsApp(order,id){
    hideCart();
    location.href='https://wa.me/12109432119?text='+encodeURIComponent(buildWhatsApp(order,id));
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
      alert('Firebase no pudo guardar el pedido, pero se abrirá WhatsApp para enviarlo y no perder la venta.');
      openWhatsApp(order,id);
    }finally{
      sendButton.disabled=false;
      sendButton.textContent='Enviar pedido';
    }
  };
})();
