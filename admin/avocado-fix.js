(()=>{
  if(window.__EL_CUBANO_AVOCADO_FIX_V1__)return;
  window.__EL_CUBANO_AVOCADO_FIX_V1__=true;

  const DRAFT_KEY='elCubanoPurchaseDraftV1';
  const PER_LB=.25;

  function round3(value){return Math.round((Number(value)+Number.EPSILON)*1000)/1000;}
  function pieces(value){
    const n=round3(value);
    return `${Number(n.toFixed(3))} ${n===1?'pieza':'piezas'}`;
  }

  function ensureItem(){
    if(typeof ITEMS==='undefined')return false;
    ITEMS.avocado={
      ...(ITEMS.avocado||{}),
      name:'Aguacate',group:'verduras',unit:'pzas',purchaseUnit:'pzas',factor:1,low:2
    };
    try{if(typeof EMPTY!=='undefined'&&!('avocado' in EMPTY))EMPTY.avocado=0;}catch(_){ }
    try{if(typeof inventory!=='undefined'&&!('avocado' in inventory))inventory.avocado=0;}catch(_){ }
    return true;
  }

  function planned(){
    try{
      const draft=JSON.parse(localStorage.getItem(DRAFT_KEY)||'[]');
      if(!Array.isArray(draft))return 0;
      return round3(draft.filter(line=>line?.itemKey==='avocado').reduce((sum,line)=>sum+Number(line.internalQty||0),0));
    }catch{return 0;}
  }

  function availableNow(){
    try{if(typeof available==='function')return Math.max(0,Number(available('avocado')||0));}catch(_){ }
    try{if(typeof inventory!=='undefined')return Math.max(0,Number(inventory.avocado||0));}catch(_){ }
    return 0;
  }

  function decorateRecipe(){
    if(!ensureItem())return;
    const result=document.getElementById('recipeResult');
    const poundsInput=document.getElementById('recipePounds');
    if(!result||!poundsInput)return;

    const pounds=Math.max(1,Math.floor(Number(poundsInput.value)||1));
    const required=round3(pounds*PER_LB);
    const have=round3(availableNow());
    const inPurchase=planned();
    const shortage=Math.max(0,round3(required-have-inPurchase));

    const groups=[...result.querySelectorAll('.recipe-group')];
    const ingredients=groups.find(group=>(group.querySelector('h3')?.textContent||'').trim().toLowerCase().includes('ingrediente'));
    if(!ingredients)return;

    let row=ingredients.querySelector('.avocado-recipe-row');
    if(!row){
      row=document.createElement('div');
      row.className='recipe-row avocado-recipe-row';
      const rows=[...ingredients.querySelectorAll('.recipe-row')];
      const cilantro=rows.find(x=>(x.querySelector('strong')?.textContent||'').trim()==='Cilantro');
      if(cilantro)cilantro.after(row);else ingredients.appendChild(row);
    }

    let action='';
    if(shortage>0){
      action=`<button type="button" class="recipe-buy-button" data-key="avocado" data-required="${required}" data-shortage="${shortage}">Comprar<br>${pieces(shortage)}</button>`;
    }else if(have>=required){
      action='<div class="recipe-buy enough">Ya tienes</div>';
    }else{
      action='<div class="recipe-buy enough">En compra ✓</div>';
    }

    row.innerHTML=`<span class="ingredient-icon">🥑</span><div><strong>Aguacate</strong><small>Necesitas: ${pieces(required)}<br>Disponible: ${pieces(have)}${inPurchase>0?`<br><span class="recipe-planned">En compra: ${pieces(inPurchase)}</span>`:''}</small></div>${action}`;
  }

  function refreshInventory(){
    if(!ensureItem())return;
    try{if(typeof renderGroupButtons==='function')renderGroupButtons();}catch(_){ }
    try{if(typeof fillProducts==='function')fillProducts();}catch(_){ }
    try{if(typeof renderAll==='function')renderAll();}catch(_){ }
  }

  let scheduled=false;
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      ensureItem();
      decorateRecipe();
    });
  }

  refreshInventory();
  schedule();
  setTimeout(refreshInventory,500);
  setTimeout(schedule,900);

  const observer=new MutationObserver(schedule);
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  document.addEventListener('input',event=>{if(event.target?.id==='recipePounds')schedule();},true);
  document.addEventListener('change',event=>{if(event.target?.id==='recipePounds')schedule();},true);
})();