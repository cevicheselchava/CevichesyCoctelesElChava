(()=>{
  const PROJECT_ID='ceviches-y-cocteles-el-chava';
  const API_KEY='AIzaSyBbOIXTr2Tvz1FvoTk5GZgP2jx24jpjlL4';
  const status=document.getElementById('syncStatus');
  const footer=document.querySelector('.footer');
  let timer=null;
  let loading=false;

  if(footer)footer.textContent='Control administrativo · Inventario agrupado v4';

  function decodeValue(value){
    if(!value||typeof value!=='object')return null;
    if('nullValue' in value)return null;
    if('stringValue' in value)return value.stringValue;
    if('booleanValue' in value)return value.booleanValue;
    if('integerValue' in value)return Number(value.integerValue);
    if('doubleValue' in value)return Number(value.doubleValue);
    if('timestampValue' in value)return value.timestampValue;
    if('arrayValue' in value)return (value.arrayValue.values||[]).map(decodeValue);
    if('mapValue' in value)return decodeFields(value.mapValue.fields||{});
    return null;
  }

  function decodeFields(fields){
    const output={};
    Object.entries(fields||{}).forEach(([key,value])=>output[key]=decodeValue(value));
    return output;
  }

  async function loadOrders(){
    if(loading)return;
    loading=true;
    try{
      const url=`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/pedidos?pageSize=100&orderBy=createdAt%20desc&key=${encodeURIComponent(API_KEY)}&_=${Date.now()}`;
      const response=await fetch(url,{cache:'no-store'});
      const data=await response.json().catch(()=>({}));
      if(!response.ok){
        throw new Error(data?.error?.message||`Firebase respondió ${response.status}`);
      }

      orders=(data.documents||[]).map(document=>({
        id:document.name.split('/').pop(),
        ...decodeFields(document.fields||{})
      }));

      if(status){
        status.classList.remove('error');
        status.innerHTML='<b>Firebase conectado:</b> los pedidos llegan automáticamente.';
      }
      renderAll();
    }catch(error){
      console.error('No se pudieron leer pedidos:',error);
      if(status){
        status.classList.add('error');
        status.innerHTML='<b>Error de Firebase:</b> '+(error.message||'No se pudieron cargar los pedidos.');
      }
    }finally{
      loading=false;
    }
  }

  function start(){
    clearInterval(timer);
    loadOrders();
    timer=setInterval(loadOrders,5000);
  }

  window.addEventListener('online',loadOrders);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)loadOrders()});
  start();
})();
