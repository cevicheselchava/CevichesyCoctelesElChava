(()=>{
  const PROJECT_ID='ceviches-y-cocteles-el-chava';
  const API_KEY='AIzaSyBbOIXTr2Tvz1FvoTk5GZgP2jx24jpjlL4';
  const status=document.getElementById('syncStatus');
  const footer=document.querySelector('.footer');
  let timer=null;
  let loading=false;

  if(footer)footer.textContent='Control administrativo · Inventario agrupado v5';

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

  function addRecipePlanner(){
    const nav=document.querySelector('.nav');
    const main=document.querySelector('main.wrap');
    if(!nav||!main||document.getElementById('recipes'))return;

    const style=document.createElement('style');
    style.textContent=`
      .nav.recipe-nav{grid-template-columns:repeat(5,1fr)}
      .recipe-presets{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:10px}
      .recipe-preset{border:0;border-radius:11px;padding:12px 8px;background:#e9eef5;color:var(--navy);font-weight:1000}
      .recipe-preset.active{background:var(--navy);color:#fff}
      .recipe-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .recipe-check{display:flex;flex-direction:row;align-items:center;gap:9px;border:1px solid var(--line);border-radius:11px;padding:11px;background:#fff;color:var(--navy)}
      .recipe-check input{width:20px;height:20px;margin:0}
      .recipe-summary{margin:12px 0 9px;padding:12px;border-radius:12px;background:#eef5ff;border:1px solid #b9cce8;color:var(--navy);font-weight:900}
      .recipe-groups{display:grid;gap:12px}
      .recipe-group{display:grid;gap:7px}
      .recipe-group h3{margin:0;padding:9px 11px;border-radius:10px;background:#e9eef5;color:var(--navy);font-size:16px}
      .recipe-row{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;border:1px solid var(--line);border-radius:12px;padding:10px;background:#fff}
      .recipe-row strong{display:block;color:var(--navy)}
      .recipe-row small{display:block;color:var(--muted);margin-top:4px;line-height:1.35}
      .recipe-buy{text-align:right;font-weight:1000;color:var(--red)}
      .recipe-buy.enough{color:var(--green)}
      @media(max-width:560px){.nav.recipe-nav{grid-template-columns:repeat(2,1fr)}.recipe-options{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);

    nav.classList.add('recipe-nav');
    const button=document.createElement('button');
    button.type='button';
    button.dataset.tab='recipes';
    button.textContent='Recetas';
    nav.appendChild(button);

    const panel=document.createElement('section');
    panel.className='panel';
    panel.id='recipes';
    panel.innerHTML=`
      <div class="card">
        <h2>Receta y lista de compra</h2>
        <div class="notice">Selecciona cuántas libras de <b>ceviche mixto</b> vas a preparar. Te muestra la receta completa y lo que falta comprar según el inventario.</div>
        <div class="recipe-presets">
          <button type="button" class="recipe-preset active" data-pounds="5">5 libras</button>
          <button type="button" class="recipe-preset" data-pounds="10">10 libras</button>
          <button type="button" class="recipe-preset" data-pounds="12">12 libras</button>
        </div>
        <div class="recipe-options">
          <label>Libras a preparar<input id="recipePounds" type="number" min="1" step="1" value="5"></label>
          <label>Refrescos gratis<input id="recipeSodas" type="number" min="0" step="1" value="5"></label>
          <label class="recipe-check"><input id="recipePackaging" type="checkbox" checked>Incluir envases, tapas, tenedores y servilletas</label>
        </div>
        <div id="recipeResult"></div>
      </div>`;
    main.insertBefore(panel,document.getElementById('history'));

    button.addEventListener('click',()=>{
      document.querySelectorAll('.nav button').forEach(x=>x.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));
      button.classList.add('active');
      panel.classList.add('active');
      renderRecipe();
    });

    document.querySelectorAll('.recipe-preset').forEach(preset=>preset.addEventListener('click',()=>{
      const pounds=Number(preset.dataset.pounds);
      recipePounds.value=pounds;
      recipeSodas.value=Math.min(pounds,10);
      document.querySelectorAll('.recipe-preset').forEach(x=>x.classList.toggle('active',x===preset));
      renderRecipe();
    }));

    recipePounds.addEventListener('input',()=>{
      const pounds=Math.max(1,Math.floor(Number(recipePounds.value)||1));
      recipeSodas.value=Math.min(pounds,10);
      document.querySelectorAll('.recipe-preset').forEach(x=>x.classList.toggle('active',Number(x.dataset.pounds)===pounds));
      renderRecipe();
    });
    recipeSodas.addEventListener('input',renderRecipe);
    recipePackaging.addEventListener('change',renderRecipe);
    renderRecipe();
  }

  const RECIPE_PER_LB={
    fish:.25,
    shrimp:.25,
    tomato:1.6,
    cucumber:1.6,
    onion:.8,
    cilantro:.2,
    lemonJuice:2.4,
    clamato:1.4
  };

  const RECIPE_GROUPS={
    ingredients:['fish','shrimp','tomato','cucumber','onion','cilantro','lemonJuice','clamato'],
    packaging:['container16','lid16','spoon','napkins'],
    drinks:['coca']
  };

  const RECIPE_LABELS={
    ingredients:'Ingredientes',
    packaging:'Desechables para entregar',
    drinks:'Refrescos de promoción',
    spoon:'Tenedores'
  };

  function formatAmount(key,internalAmount){
    if(typeof displayQty==='function')return displayQty(key,internalAmount);
    const item=ITEMS?.[key];
    return `${Math.round(internalAmount*100)/100} ${item?.unit||''}`;
  }

  function currentAvailable(key){
    try{return Math.max(0,Number(typeof available==='function'?available(key):inventory?.[key]||0));}
    catch{return Math.max(0,Number(inventory?.[key]||0));}
  }

  function recipeRow(key,required){
    const item=ITEMS?.[key]||{name:key,unit:''};
    const have=currentAvailable(key);
    const shortage=Math.max(0,Math.round((required-have+Number.EPSILON)*1000)/1000);
    const name=RECIPE_LABELS[key]||item.name;
    return `<div class="recipe-row"><div><strong>${name}</strong><small>Necesitas: ${formatAmount(key,required)}<br>Disponible: ${formatAmount(key,have)}</small></div><div class="recipe-buy ${shortage<=0?'enough':''}">${shortage>0?`Comprar<br>${formatAmount(key,shortage)}`:'Ya tienes'}</div></div>`;
  }

  function renderRecipe(){
    const result=document.getElementById('recipeResult');
    if(!result)return;
    const pounds=Math.max(1,Math.floor(Number(document.getElementById('recipePounds')?.value)||1));
    const sodas=Math.max(0,Math.min(pounds,Math.floor(Number(document.getElementById('recipeSodas')?.value)||0)));
    const includePackaging=Boolean(document.getElementById('recipePackaging')?.checked);
    const required={};
    Object.entries(RECIPE_PER_LB).forEach(([key,value])=>required[key]=Math.round((value*pounds+Number.EPSILON)*1000)/1000);
    if(includePackaging){
      required.container16=pounds;
      required.lid16=pounds;
      required.spoon=pounds;
      required.napkins=pounds*2;
    }
    if(sodas>0)required.coca=sodas;

    const groups=[];
    Object.entries(RECIPE_GROUPS).forEach(([group,keys])=>{
      const rows=keys.filter(key=>required[key]>0).map(key=>recipeRow(key,required[key])).join('');
      if(rows)groups.push(`<section class="recipe-group"><h3>${RECIPE_LABELS[group]}</h3>${rows}</section>`);
    });

    result.innerHTML=`<div class="recipe-summary">Para ${pounds} libras terminadas: ${pounds} órdenes de 1 libra${sodas?` · ${sodas} refrescos gratis`:''}.</div><div class="recipe-groups">${groups.join('')}</div>`;
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
      renderRecipe();
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
    timer=setInterval(()=>{loadOrders();renderRecipe();},5000);
  }

  addRecipePlanner();
  window.addEventListener('online',loadOrders);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){loadOrders();renderRecipe();}});
  start();
})();
