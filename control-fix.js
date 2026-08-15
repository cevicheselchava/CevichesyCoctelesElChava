(()=>{
  const PROJECT_ID='ceviches-y-cocteles-el-chava';
  const API_KEY='AIzaSyBbOIXTr2Tvz1FvoTk5GZgP2jx24jpjlL4';
  const RECIPES_VERSION=10;
  const PURCHASE_DRAFT_KEY='elCubanoPurchaseDraftV1';
  const PACK_PREFS_KEY='elCubanoPackPrefsV1';
  const STORE_KEY='elCubanoLastPurchaseStore';
  const status=document.getElementById('syncStatus');
  const footer=document.querySelector('.footer');
  let timer=null;
  let loading=false;
  let purchaseDraft=[];
  let currentPurchaseKey='';
  let currentRequired=0;
  let currentEditIndex=-1;

  try{purchaseDraft=JSON.parse(localStorage.getItem(PURCHASE_DRAFT_KEY)||'[]');if(!Array.isArray(purchaseDraft))purchaseDraft=[];}catch{purchaseDraft=[];}

  const existingManifest=document.querySelector('link[rel="manifest"]');
  const adminManifest=existingManifest||document.createElement('link');
  adminManifest.rel='manifest';
  adminManifest.href='/admin-manifest.webmanifest?v=20260807';
  if(!existingManifest)document.head.appendChild(adminManifest);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content','#267642');
  const appleTitle=document.querySelector('meta[name="apple-mobile-web-app-title"]')||document.createElement('meta');
  appleTitle.name='apple-mobile-web-app-title';
  appleTitle.content='Panel El Cubano';
  if(!appleTitle.parentNode)document.head.appendChild(appleTitle);

  const installLabelObserver=new MutationObserver(()=>{
    document.querySelectorAll('button').forEach(button=>{
      if(button.textContent.includes('INSTALAR APP')||button.textContent.includes('INSTALL APP')){
        button.textContent='📲 INSTALAR PANEL';
        button.setAttribute('aria-label','Instalar Panel Operativo El Cubano');
      }
    });
  });
  installLabelObserver.observe(document.documentElement,{childList:true,subtree:true});

  window.__EL_CHAVA_RECIPES_VERSION__=RECIPES_VERSION;
  if(footer)footer.textContent=`Control administrativo · Inventario agrupado v${RECIPES_VERSION}`;

  if('caches' in window&&localStorage.getItem('elChavaAdminCacheV10')!=='1'){
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('el-chava-pwa-')).map(key=>caches.delete(key))))
      .finally(()=>localStorage.setItem('elChavaAdminCacheV10','1'));
  }

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

  function round3(value){return Math.round((Number(value)+Number.EPSILON)*1000)/1000;}
  function money2(value){return '$'+Number(value||0).toFixed(2);}
  function saveDraft(){localStorage.setItem(PURCHASE_DRAFT_KEY,JSON.stringify(purchaseDraft));}
  function getPackPrefs(){try{return JSON.parse(localStorage.getItem(PACK_PREFS_KEY)||'{}')||{};}catch{return {};}}
  function savePackPref(key,pref){const prefs=getPackPrefs();prefs[key]=pref;localStorage.setItem(PACK_PREFS_KEY,JSON.stringify(prefs));}
  function plannedInternal(key){return purchaseDraft.filter(line=>line.itemKey===key).reduce((sum,line)=>sum+Number(line.internalQty||0),0);}

  function addRecipePlanner(){
    const nav=document.querySelector('.nav');
    const main=document.querySelector('main.wrap');
    if(!nav||!main)return;

    document.getElementById('recipes')?.remove();
    nav.querySelectorAll('button[data-tab="recipes"]').forEach(button=>button.remove());
    document.getElementById('recipe-planner-v8-style')?.remove();
    document.getElementById('recipe-planner-v9-style')?.remove();

    const style=document.createElement('style');
    style.id='recipe-planner-v9-style';
    style.textContent=`
      .nav.recipe-nav{grid-template-columns:repeat(5,1fr)}
      .recipe-presets{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:10px}
      .recipe-preset{border:0;border-radius:11px;padding:12px 8px;background:#e9eef5;color:var(--navy);font-weight:1000}
      .recipe-preset.active{background:var(--navy);color:#fff}
      .recipe-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .recipe-options .full{grid-column:1/-1}
      .recipe-check{display:flex;flex-direction:row;align-items:center;gap:9px;border:1px solid var(--line);border-radius:11px;padding:11px;background:#fff;color:var(--navy)}
      .recipe-check input{width:20px;height:20px;margin:0;flex:0 0 auto}
      .recipe-summary{margin:12px 0 9px;padding:12px;border-radius:12px;background:#eef5ff;border:1px solid #b9cce8;color:var(--navy);font-weight:900}
      .recipe-purchase-bar{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;margin:10px 0 12px;padding:11px 12px;border:1px solid #b8ddc2;border-radius:14px;background:#effaf1;color:var(--navy)}
      .recipe-purchase-bar b{font-size:16px}.recipe-purchase-bar small{display:block;margin-top:3px;color:var(--muted);font-weight:800}
      .recipe-purchase-bar button{border:0;border-radius:11px;padding:10px 12px;background:#267642;color:#fff;font-weight:1000}
      .recipe-groups{display:grid;gap:12px}
      .recipe-group{display:grid;gap:7px}
      .recipe-group h3{margin:0;padding:9px 11px;border-radius:10px;background:#e9eef5;color:var(--navy);font-size:16px}
      .recipe-row{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;border:1px solid var(--line);border-radius:12px;padding:10px;background:#fff}
      .recipe-row strong{display:block;color:var(--navy)}
      .recipe-row small{display:block;color:var(--muted);margin-top:4px;line-height:1.35}
      .recipe-buy{text-align:right;font-weight:1000;color:var(--red)}
      .recipe-buy.enough{color:var(--green)}
      .recipe-buy-button{border:0;border-radius:12px;padding:10px 12px;background:#fff0ed;color:#d13d31;font-weight:1000;line-height:1.1;min-width:105px}
      .recipe-buy-button:active{transform:scale(.98)}
      .recipe-planned{display:inline-block;margin-top:4px;color:#267642;font-weight:900}
      .purchase-modal{position:fixed;inset:0;z-index:10050;display:grid;place-items:end center;background:rgba(10,24,38,.45);padding:14px}
      .purchase-modal[hidden]{display:none}
      .purchase-sheet{width:min(100%,620px);max-height:88vh;overflow:auto;background:#fffdf8;border-radius:24px 24px 18px 18px;padding:17px;box-shadow:0 18px 50px rgba(0,0,0,.25)}
      .purchase-sheet h3{margin:0 0 4px;color:var(--navy);font-size:23px}.purchase-sheet .need{margin:0 0 12px;color:#d13d31;font-weight:900}
      .purchase-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.purchase-grid .full{grid-column:1/-1}
      .purchase-grid label{font-size:14px}.purchase-grid input,.purchase-grid select{padding:12px}
      .purchase-calc{margin:12px 0;padding:12px;border-radius:14px;background:#eff8ef;border:1px solid #bfddc5;color:var(--navy);font-weight:900;line-height:1.45}
      .purchase-sheet-actions{display:grid;grid-template-columns:1fr 1.4fr;gap:8px;margin-top:10px}.purchase-sheet-actions button{border:0;border-radius:13px;padding:13px;font-weight:1000}.purchase-cancel{background:#eef0ef;color:var(--navy)}.purchase-add{background:#267642;color:#fff}
      .purchase-cart-list{display:grid;gap:9px;margin-top:12px}.purchase-cart-line{border:1px solid #e4ddd0;border-radius:14px;padding:11px;background:#fff}.purchase-cart-line strong{color:var(--navy)}.purchase-cart-line small{display:block;color:var(--muted);line-height:1.4;margin-top:3px}.purchase-cart-line .line-money{font-size:20px;font-weight:1000;color:#267642;margin-top:6px}
      .purchase-line-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px}.purchase-line-actions button{border:0;border-radius:10px;padding:9px;font-weight:900}.purchase-line-edit{background:#fff2ce;color:#7b5800}.purchase-line-remove{background:#ffe8e5;color:#a52d25}
      .purchase-cart-total{margin:12px 0;padding:13px;border-radius:14px;background:#173b2a;color:#fff;font-size:21px;font-weight:1000;text-align:center}.purchase-finalize{width:100%;border:0;border-radius:14px;padding:14px;background:#267642;color:#fff;font-size:17px;font-weight:1000}.purchase-finalize:disabled{opacity:.55}
      @media(max-width:560px){.nav.recipe-nav{grid-template-columns:repeat(5,minmax(0,1fr))}.recipe-options{grid-template-columns:1fr}.recipe-options .full{grid-column:1}.recipe-purchase-bar{grid-template-columns:1fr}.recipe-purchase-bar button{width:100%}.purchase-grid{grid-template-columns:1fr}.purchase-grid .full{grid-column:1}.purchase-modal{padding:0}.purchase-sheet{border-radius:24px 24px 0 0;max-height:91vh}}
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
        <div class="notice">Selecciona el tipo de ceviche y cuántas libras vas a preparar. Te muestra la receta completa y lo que falta comprar según el inventario.</div>
        <div class="recipe-presets">
          <button type="button" class="recipe-preset active" data-pounds="5">5 libras</button>
          <button type="button" class="recipe-preset" data-pounds="10">10 libras</button>
          <button type="button" class="recipe-preset" data-pounds="12">12 libras</button>
        </div>
        <div class="recipe-options">
          <label class="full">Tipo de receta
            <select id="recipeType">
              <option value="mixed">Mixto · pescado y camarón</option>
              <option value="fish">Ceviche de pescado</option>
              <option value="shrimp">Ceviche de camarón</option>
              <option value="octopusShrimp">Pulpo y camarón</option>
              <option value="octopusFish">Pulpo y pescado</option>
            </select>
          </label>
          <label>Libras a preparar<input id="recipePounds" type="number" min="1" step="1" value="5"></label>
          <label>Refrescos gratis<input id="recipeSodas" type="number" min="0" step="1" value="5"></label>
          <label class="recipe-check full"><input id="recipePackaging" type="checkbox" checked>Incluir envases, tapas, tenedores y servilletas</label>
        </div>
        <div id="recipeResult"></div>
      </div>`;
    main.insertBefore(panel,document.getElementById('history'));
    ensurePurchaseModals();

    const recipeType=panel.querySelector('#recipeType');
    const recipePounds=panel.querySelector('#recipePounds');
    const recipeSodas=panel.querySelector('#recipeSodas');
    const recipePackaging=panel.querySelector('#recipePackaging');

    button.addEventListener('click',()=>{
      document.querySelectorAll('.nav button').forEach(x=>x.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));
      button.classList.add('active');
      panel.classList.add('active');
      renderRecipe();
    });

    panel.querySelectorAll('.recipe-preset').forEach(preset=>preset.addEventListener('click',()=>{
      const pounds=Number(preset.dataset.pounds);
      recipePounds.value=pounds;
      recipeSodas.value=Math.min(pounds,10);
      panel.querySelectorAll('.recipe-preset').forEach(x=>x.classList.toggle('active',x===preset));
      renderRecipe();
    }));

    recipeType.addEventListener('change',renderRecipe);
    recipePounds.addEventListener('input',()=>{
      const pounds=Math.max(1,Math.floor(Number(recipePounds.value)||1));
      recipeSodas.value=Math.min(pounds,10);
      panel.querySelectorAll('.recipe-preset').forEach(x=>x.classList.toggle('active',Number(x.dataset.pounds)===pounds));
      renderRecipe();
    });
    recipeSodas.addEventListener('input',renderRecipe);
    recipePackaging.addEventListener('change',renderRecipe);

    panel.addEventListener('click',event=>{
      const buy=event.target.closest('.recipe-buy-button');
      if(buy){openPurchaseModal(buy.dataset.key,Number(buy.dataset.required||0),Number(buy.dataset.shortage||0));return;}
      if(event.target.closest('#openPurchaseCart'))openPurchaseCart();
    });
    renderRecipe();
  }

  const COMMON_RECIPE_PER_LB={tomato:1.6,cucumber:1/6,onion:.8,cilantro:.2,lemonJuice:2.4,clamato:1.4};

  const RECIPE_TYPES={
    mixed:{name:'Ceviche mixto · pescado y camarón',proteins:{fish:.25,shrimp:.25}},
    fish:{name:'Ceviche de pescado',proteins:{fish:.5}},
    shrimp:{name:'Ceviche de camarón',proteins:{shrimp:.5}},
    octopusShrimp:{name:'Ceviche de pulpo y camarón',proteins:{octopus:.25,shrimp:.25}},
    octopusFish:{name:'Ceviche de pulpo y pescado',proteins:{octopus:.25,fish:.25}}
  };

  const RECIPE_GROUPS={
    ingredients:['fish','shrimp','octopus','tomato','cucumber','onion','cilantro','lemonJuice','clamato'],
    packaging:['container16','lid16','spoon','napkins'],
    drinks:['coca']
  };

  const RECIPE_LABELS={ingredients:'Ingredientes',packaging:'Desechables para entregar',drinks:'Refrescos de promoción',spoon:'Tenedores'};

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
    const planned=plannedInternal(key);
    const shortage=Math.max(0,round3(required-have-planned));
    const name=RECIPE_LABELS[key]||item.name;
    const buyAmount=key==='cucumber'?Math.ceil(shortage):shortage;
    const requiredText=key==='cucumber'?`${formatAmount(key,required)} (≈ ${Math.max(1,Math.ceil(required))} pepino${Math.ceil(required)===1?'':'s'})`:formatAmount(key,required);
    let action='';
    if(shortage>0){
      action=`<button type="button" class="recipe-buy-button" data-key="${key}" data-required="${required}" data-shortage="${shortage}">Comprar<br>${formatAmount(key,buyAmount)}</button>`;
    }else if(have>=required){
      action='<div class="recipe-buy enough">Ya tienes</div>';
    }else{
      action='<div class="recipe-buy enough">En compra ✓</div>';
    }
    return `<div class="recipe-row"><div><strong>${name}</strong><small>Necesitas: ${requiredText}<br>Disponible: ${formatAmount(key,have)}${planned>0?`<br><span class="recipe-planned">En compra: ${formatAmount(key,planned)}</span>`:''}</small></div>${action}</div>`;
  }

  function renderRecipe(){
    const result=document.getElementById('recipeResult');
    if(!result)return;
    const selectedType=document.getElementById('recipeType')?.value||'mixed';
    const recipe=RECIPE_TYPES[selectedType]||RECIPE_TYPES.mixed;
    const pounds=Math.max(1,Math.floor(Number(document.getElementById('recipePounds')?.value)||1));
    const sodas=Math.max(0,Math.min(pounds,Math.floor(Number(document.getElementById('recipeSodas')?.value)||0)));
    const includePackaging=Boolean(document.getElementById('recipePackaging')?.checked);
    const required={};

    Object.entries(recipe.proteins).forEach(([key,value])=>required[key]=round3(value*pounds));
    Object.entries(COMMON_RECIPE_PER_LB).forEach(([key,value])=>required[key]=round3(value*pounds));

    if(includePackaging){required.container16=pounds;required.lid16=pounds;required.spoon=pounds;required.napkins=pounds*2;}
    if(sodas>0)required.coca=sodas;

    const groups=[];
    Object.entries(RECIPE_GROUPS).forEach(([group,keys])=>{
      const rows=keys.filter(key=>required[key]>0).map(key=>recipeRow(key,required[key])).join('');
      if(rows)groups.push(`<section class="recipe-group"><h3>${RECIPE_LABELS[group]}</h3>${rows}</section>`);
    });

    const cartTotal=purchaseDraft.reduce((sum,line)=>sum+Number(line.cost||0),0);
    const cartBar=`<div class="recipe-purchase-bar"><div><b>🛒 Compra actual: ${money2(cartTotal)}</b><small>${purchaseDraft.length?`${purchaseDraft.length} producto${purchaseDraft.length===1?'':'s'} agregado${purchaseDraft.length===1?'':'s'}`:'Todavía no has agregado productos'}</small></div><button type="button" id="openPurchaseCart">Ver / finalizar compra</button></div>`;
    result.innerHTML=`<div class="recipe-summary"><b>${recipe.name}</b><br>Para ${pounds} libras terminadas: ${pounds} órdenes de 1 libra${sodas?` · ${sodas} refrescos gratis`:''}.</div>${cartBar}<div class="recipe-groups">${groups.join('')}</div>`;
  }

  function unitOptions(item,selected){
    const units=item?.purchaseUnit==='lb'?['lb','oz']:[item?.purchaseUnit||item?.unit||'unidad'];
    return units.map(unit=>`<option value="${unit}" ${unit===selected?'selected':''}>${unit}</option>`).join('');
  }

  function packageAmountInPurchaseUnit(item,content,unit){
    if(item?.purchaseUnit==='lb'&&unit==='oz')return Number(content||0)/16;
    return Number(content||0);
  }

  function packageInternalAmount(key,content,unit,count){
    const item=ITEMS[key];
    const purchaseAmount=packageAmountInPurchaseUnit(item,content,unit)*Number(count||0);
    return round3(purchaseAmount*Number(item?.factor||1));
  }

  function ensurePurchaseModals(){
    if(document.getElementById('recipePurchaseModal'))return;
    const modal=document.createElement('div');
    modal.id='recipePurchaseModal';
    modal.className='purchase-modal';
    modal.hidden=true;
    modal.innerHTML=`<div class="purchase-sheet"><h3 id="purchaseModalTitle">Registrar compra</h3><p class="need" id="purchaseModalNeed"></p><div class="purchase-grid">
      <label class="full">Tienda<input id="purchaseModalStore" placeholder="Walmart, H-E-B, Sam's..."></label>
      <label>Contenido por paquete<input id="purchasePackContent" type="number" min="0.01" step="0.01"></label>
      <label>Unidad<select id="purchasePackUnit"></select></label>
      <label>Precio por paquete<input id="purchasePackPrice" type="number" min="0" step="0.01" placeholder="$0.00"></label>
      <label>Paquetes / unidades<input id="purchasePackCount" type="number" min="1" step="1"></label>
    </div><div class="purchase-calc" id="purchaseCalc"></div><div class="purchase-sheet-actions"><button type="button" class="purchase-cancel" id="purchaseCancel">Cancelar</button><button type="button" class="purchase-add" id="purchaseAdd">Agregar a compra</button></div></div>`;
    document.body.appendChild(modal);

    const cart=document.createElement('div');
    cart.id='recipePurchaseCartModal';
    cart.className='purchase-modal';
    cart.hidden=true;
    cart.innerHTML='<div class="purchase-sheet"><h3>🛒 Compra actual</h3><div id="purchaseCartBody"></div><div class="purchase-sheet-actions"><button type="button" class="purchase-cancel" id="purchaseCartClose">Seguir comprando</button><button type="button" class="purchase-add" id="purchaseCartFinish">Finalizar compra</button></div></div>';
    document.body.appendChild(cart);

    ['purchasePackContent','purchasePackUnit','purchasePackPrice','purchasePackCount'].forEach(id=>document.getElementById(id)?.addEventListener('input',recalculatePurchase));
    document.getElementById('purchasePackUnit')?.addEventListener('change',()=>{suggestPackageCount();recalculatePurchase();});
    document.getElementById('purchasePackContent')?.addEventListener('change',()=>{suggestPackageCount();recalculatePurchase();});
    document.getElementById('purchaseCancel').onclick=()=>modal.hidden=true;
    modal.addEventListener('click',event=>{if(event.target===modal)modal.hidden=true;});
    document.getElementById('purchaseAdd').onclick=addCurrentPurchaseToDraft;
    document.getElementById('purchaseCartClose').onclick=()=>cart.hidden=true;
    cart.addEventListener('click',event=>{if(event.target===cart)cart.hidden=true;});
    document.getElementById('purchaseCartFinish').onclick=finalizePurchaseDraft;
    document.getElementById('purchaseCartBody').addEventListener('click',event=>{
      const edit=event.target.closest('[data-edit-line]');
      const remove=event.target.closest('[data-remove-line]');
      if(edit){editDraftLine(Number(edit.dataset.editLine));return;}
      if(remove){purchaseDraft.splice(Number(remove.dataset.removeLine),1);saveDraft();renderPurchaseCart();renderRecipe();}
    });
  }

  function openPurchaseModal(key,required,shortage){
    const item=ITEMS?.[key];
    if(!item)return;
    currentPurchaseKey=key;
    currentRequired=required;
    currentEditIndex=-1;
    const pref=getPackPrefs()[key]||{};
    const defaultUnit=pref.unit||(item.purchaseUnit==='lb'?'lb':item.purchaseUnit||item.unit);
    document.getElementById('purchaseModalTitle').textContent=item.name;
    document.getElementById('purchaseModalNeed').textContent=`Te faltan ${key==='cucumber'?formatAmount(key,Math.ceil(shortage)):formatAmount(key,shortage)} para esta receta`;
    document.getElementById('purchaseModalStore').value=localStorage.getItem(STORE_KEY)||'';
    document.getElementById('purchasePackContent').value=pref.content||1;
    document.getElementById('purchasePackUnit').innerHTML=unitOptions(item,defaultUnit);
    document.getElementById('purchasePackPrice').value=pref.price??'';
    suggestPackageCount(shortage);
    recalculatePurchase();
    document.getElementById('purchaseAdd').textContent='Agregar a compra';
    document.getElementById('recipePurchaseModal').hidden=false;
  }

  function suggestPackageCount(shortageOverride){
    const item=ITEMS?.[currentPurchaseKey];
    if(!item)return;
    const content=Number(document.getElementById('purchasePackContent').value||0);
    const unit=document.getElementById('purchasePackUnit').value;
    const perPackInternal=packageInternalAmount(currentPurchaseKey,content,unit,1);
    const remaining=Number.isFinite(Number(shortageOverride))?Number(shortageOverride):Math.max(0,round3(currentRequired-currentAvailable(currentPurchaseKey)-plannedInternal(currentPurchaseKey)));
    if(perPackInternal>0)document.getElementById('purchasePackCount').value=Math.max(1,Math.ceil(remaining/perPackInternal));
  }

  function recalculatePurchase(){
    const key=currentPurchaseKey,item=ITEMS?.[key];
    if(!item)return;
    const content=Number(document.getElementById('purchasePackContent').value||0);
    const unit=document.getElementById('purchasePackUnit').value;
    const price=Number(document.getElementById('purchasePackPrice').value||0);
    const count=Math.max(1,Math.floor(Number(document.getElementById('purchasePackCount').value)||1));
    const internalQty=packageInternalAmount(key,content,unit,count);
    const purchaseQty=round3(internalQty/Number(item.factor||1));
    const total=price*count;
    const leftover=round3(currentAvailable(key)+plannedInternal(key)+internalQty-currentRequired);
    document.getElementById('purchaseCalc').innerHTML=`Comprarás <b>${count}</b> paquete${count===1?'':'s'} = <b>${purchaseQty} ${item.purchaseUnit||item.unit}</b><br>Total: <b>${money2(total)}</b><br>Después de preparar la receta quedarían aprox. <b>${formatAmount(key,Math.max(0,leftover))}</b> en inventario.`;
  }

  function addCurrentPurchaseToDraft(){
    const key=currentPurchaseKey,item=ITEMS?.[key];
    if(!item)return;
    const store=document.getElementById('purchaseModalStore').value.trim()||'Sin tienda';
    const content=Number(document.getElementById('purchasePackContent').value||0);
    const unit=document.getElementById('purchasePackUnit').value;
    const price=Number(document.getElementById('purchasePackPrice').value||0);
    const count=Math.max(1,Math.floor(Number(document.getElementById('purchasePackCount').value)||1));
    if(!content||content<=0)return alert('Escribe cuánto trae cada paquete.');
    if(!Number.isFinite(price)||price<0)return alert('Escribe un precio válido.');
    const internalQty=packageInternalAmount(key,content,unit,count);
    const purchaseQty=round3(internalQty/Number(item.factor||1));
    const line={itemKey:key,name:item.name,packageContent:content,packageUnit:unit,packageCount:count,pricePerPackage:price,cost:round3(price*count),qty:purchaseQty,unit:item.purchaseUnit||item.unit,internalQty,store};
    if(currentEditIndex>=0)purchaseDraft[currentEditIndex]=line;else purchaseDraft.push(line);
    localStorage.setItem(STORE_KEY,store);
    savePackPref(key,{content,unit,price});
    saveDraft();
    document.getElementById('recipePurchaseModal').hidden=true;
    renderRecipe();
  }

  function openPurchaseCart(){renderPurchaseCart();document.getElementById('recipePurchaseCartModal').hidden=false;}

  function renderPurchaseCart(){
    const body=document.getElementById('purchaseCartBody');
    if(!body)return;
    if(!purchaseDraft.length){body.innerHTML='<div class="empty">Todavía no has agregado compras.</div>';document.getElementById('purchaseCartFinish').disabled=true;return;}
    document.getElementById('purchaseCartFinish').disabled=false;
    const total=purchaseDraft.reduce((sum,line)=>sum+Number(line.cost||0),0);
    body.innerHTML=`<div class="purchase-cart-list">${purchaseDraft.map((line,index)=>`<div class="purchase-cart-line"><strong>${line.name}</strong><small>${line.packageCount} paquete${line.packageCount===1?'':'s'} × ${line.packageContent} ${line.packageUnit} · ${line.store}<br>Entra al inventario: ${line.qty} ${line.unit}${line.qty?` · ${money2(line.cost/line.qty)}/${line.unit}`:''}</small><div class="line-money">${money2(line.cost)}</div><div class="purchase-line-actions"><button type="button" class="purchase-line-edit" data-edit-line="${index}">Editar</button><button type="button" class="purchase-line-remove" data-remove-line="${index}">Quitar</button></div></div>`).join('')}</div><div class="purchase-cart-total">Total de la compra: ${money2(total)}</div>`;
  }

  function editDraftLine(index){
    const line=purchaseDraft[index];
    if(!line)return;
    currentEditIndex=index;
    currentPurchaseKey=line.itemKey;
    currentRequired=Math.max(currentAvailable(line.itemKey)+plannedInternal(line.itemKey),Number(line.internalQty||0));
    const item=ITEMS[line.itemKey];
    document.getElementById('purchaseModalTitle').textContent=`Editar · ${line.name}`;
    document.getElementById('purchaseModalNeed').textContent='Corrige la presentación, cantidad o precio.';
    document.getElementById('purchaseModalStore').value=line.store||'';
    document.getElementById('purchasePackContent').value=line.packageContent;
    document.getElementById('purchasePackUnit').innerHTML=unitOptions(item,line.packageUnit);
    document.getElementById('purchasePackPrice').value=line.pricePerPackage;
    document.getElementById('purchasePackCount').value=line.packageCount;
    document.getElementById('purchaseAdd').textContent='Guardar cambio';
    recalculatePurchase();
    document.getElementById('recipePurchaseCartModal').hidden=true;
    document.getElementById('recipePurchaseModal').hidden=false;
  }

  async function finalizePurchaseDraft(){
    if(!purchaseDraft.length)return;
    const button=document.getElementById('purchaseCartFinish');
    button.disabled=true;button.textContent='Guardando...';
    const batchId='COMPRA-'+Date.now().toString(36).toUpperCase();
    try{
      await db.runTransaction(async tx=>{
        const snap=await tx.get(inventoryRef);
        const current={...EMPTY,...(snap.exists?(snap.data().items||{}):{})};
        const keys=[];
        purchaseDraft.forEach(line=>{
          current[line.itemKey]=round3(Number(current[line.itemKey]||0)+Number(line.internalQty||0));
          keys.push(line.itemKey);
          const moveRef=db.collection('movimientos').doc();
          tx.set(moveRef,{type:'purchase',batchId,date:firebase.firestore.FieldValue.serverTimestamp(),day:today(),name:line.name,itemKey:line.itemKey,qty:Number(line.qty||0),unit:line.unit,internalQty:Number(line.internalQty||0),cost:Number(line.cost||0),costPerUnit:line.qty?Number(line.cost||0)/Number(line.qty):null,store:line.store,packageContent:Number(line.packageContent||0),packageUnit:line.packageUnit,packageCount:Number(line.packageCount||0),pricePerPackage:Number(line.pricePerPackage||0)});
        });
        tx.set(inventoryRef,{items:current,tracked:firebase.firestore.FieldValue.arrayUnion(...[...new Set(keys)]),updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
      });
      purchaseDraft=[];saveDraft();
      document.getElementById('recipePurchaseCartModal').hidden=true;
      renderRecipe();
      if(typeof toast==='function')toast('Compra completa guardada e inventario actualizado');
    }catch(error){
      console.error(error);alert(error.message||'No se pudo guardar la compra.');
    }finally{button.disabled=false;button.textContent='Finalizar compra';}
  }

  async function loadOrders(){
    if(loading)return;
    loading=true;
    try{
      const url=`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/pedidos?pageSize=100&orderBy=createdAt%20desc&key=${encodeURIComponent(API_KEY)}&_=${Date.now()}`;
      const response=await fetch(url,{cache:'no-store'});
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data?.error?.message||`Firebase respondió ${response.status}`);
      orders=(data.documents||[]).map(document=>({id:document.name.split('/').pop(),...decodeFields(document.fields||{})}));
      if(status){status.classList.remove('error');status.innerHTML='<b>Firebase conectado:</b> los pedidos llegan automáticamente.';}
      renderAll();renderRecipe();
    }catch(error){
      console.error('No se pudieron leer pedidos:',error);
      if(status){status.classList.add('error');status.innerHTML='<b>Error de Firebase:</b> '+(error.message||'No se pudieron cargar los pedidos.');}
    }finally{loading=false;}
  }

  function start(){clearInterval(timer);loadOrders();timer=setInterval(()=>{loadOrders();renderRecipe();},5000);}

  addRecipePlanner();
  window.addEventListener('online',loadOrders);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){loadOrders();renderRecipe();}});
  start();
})();
