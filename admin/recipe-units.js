(()=>{
  if(window.__EL_CUBANO_RECIPE_UNITS_OZ_V2__)return;
  window.__EL_CUBANO_RECIPE_UNITS_OZ_V2__=true;

  const r3=n=>Math.round((Number(n)+Number.EPSILON)*1000)/1000;
  const pretty=n=>Number(r3(n).toFixed(3));
  const COCKTAIL_TYPE='cocktailShrimp12';
  const COCKTAIL_NAME='Cóctel de camarón · 12 oz';
  const COCKTAIL_RECIPE={
    shrimp:0.1875,
    onion:0.5,
    cilantro:0.1,
    avocado:0.25,
    tomatoSauce:2.173,
    tomatoPuree:1.087,
    clamato:0.652,
    lemonJuice:0.065,
    english:0.011,
    maggi:0.011,
    container12:1,
    lid12:1,
    spoon:1,
    napkins:1
  };

  function recipeQty(key,value){
    const item=ITEMS?.[key];
    const amount=Number(value||0);
    if(!item)return `${pretty(amount)}`;
    if(item.unit==='lb')return `${pretty(amount*16)} oz`;
    if(item.unit==='oz')return `${pretty(amount)} oz`;
    if(item.unit==='fl oz')return `${pretty(amount)} fl oz`;
    if(item.unit==='pzas')return `${pretty(amount)} pzas`;
    return typeof displayQty==='function'?displayQty(key,amount):`${pretty(amount)} ${item.unit||''}`;
  }

  function cocktailRecipe(count){
    return Object.fromEntries(Object.entries(COCKTAIL_RECIPE).map(([key,value])=>[key,r3(Number(value)*count)]));
  }

  function setLabel(input,text){
    const label=input?.closest('label');
    if(!label)return;
    const directText=[...label.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&String(n.textContent||'').trim());
    if(directText)directText.textContent=text;
    else{
      const span=label.querySelector(':scope > span');
      if(span)span.textContent=text;
    }
  }

  function syncRecipeControls(){
    const type=$('recipeType')?.value;
    const isCocktail=type===COCKTAIL_TYPE;
    const qty=$('recipePounds');
    if(qty){
      setLabel(qty,isCocktail?'Cantidad de cócteles':'Libras');
      qty.min=isCocktail?'1':'0.25';
      qty.step=isCocktail?'1':'0.25';
      if(isCocktail){
        const n=Math.max(1,Math.round(Number(qty.value)||1));
        qty.value=String(n);
      }
    }
    const sodaLabel=$('recipeSodas')?.closest('label');
    const packLabel=$('recipePackaging')?.closest('label');
    if(sodaLabel)sodaLabel.style.display=isCocktail?'none':'';
    if(packLabel)packLabel.style.display=isCocktail?'none':'';
  }

  function ensureCocktailOption(){
    const select=$('recipeType');
    if(!select||select.querySelector(`option[value="${COCKTAIL_TYPE}"]`))return;
    const option=document.createElement('option');
    option.value=COCKTAIL_TYPE;
    option.textContent=COCKTAIL_NAME;
    select.appendChild(option);
  }

  recipeRow=function(key,need){
    const have=available(key),lack=Math.max(0,r3(Number(need||0)-Number(have||0))),item=ITEMS[key];
    if(!item)return '';
    return `<div class="recipe-row"><div><strong>${item.name}</strong><small>Necesitas ${recipeQty(key,need)} · Disponible ${recipeQty(key,have)}</small></div>${lack>0?`<button class="recipe-buy" data-buy="${key}" data-need="${lack}">Comprar ${recipeQty(key,lack)}</button>`:'<span class="recipe-enough">✓ Hay</span>'}</div>`;
  };

  renderRecipe=function(){
    ensureCocktailOption();
    syncRecipeControls();
    const type=$('recipeType').value;

    if(type===COCKTAIL_TYPE){
      const count=Math.max(1,Math.round(Number($('recipePounds').value)||1));
      const recipe=cocktailRecipe(count);
      const lacks=Object.entries(recipe).filter(([key,value])=>ITEMS[key]&&available(key)<value);
      $('recipeResult').innerHTML=`<div class="recipe-summary"><b>${COCKTAIL_NAME}</b><br>${count} cóctel${count===1?'':'es'} a preparar · ${lacks.length?`Faltan ${lacks.length} ingredientes/insumos.`:'Tienes todo lo necesario.'}</div><div class="recipe-list">${Object.entries(recipe).map(([key,value])=>recipeRow(key,value)).join('')}</div>`;
      return;
    }

    const pounds=Math.max(.25,Number($('recipePounds').value)||.25),
      sodas=Math.max(0,Math.floor(Number($('recipeSodas').value)||0)),
      pack=$('recipePackaging').checked,
      recipe=recipeNeeds(type,pounds,sodas,pack),
      lacks=Object.entries(recipe).filter(([key,value])=>available(key)<value);

    $('recipeResult').innerHTML=`<div class="recipe-summary"><b>${TYPES[type].name}</b><br>${pounds} lb a preparar · ${lacks.length?`Faltan ${lacks.length} ingredientes/insumos.`:'Tienes todo lo necesario.'}</div><div class="recipe-list">${Object.entries(recipe).map(([key,value])=>recipeRow(key,value)).join('')}</div>`;
  };

  ensureCocktailOption();

  // Los listeners originales del panel conservan la función vieja. Este segundo
  // listener vuelve a pintar al final para mantener onzas y el cóctel siempre activos.
  ['recipeType','recipePounds','recipeSodas','recipePackaging'].forEach(id=>{
    const el=$(id);
    if(!el)return;
    el.addEventListener('input',()=>queueMicrotask(renderRecipe));
    el.addEventListener('change',()=>queueMicrotask(renderRecipe));
  });

  if(document.getElementById('recipeResult'))renderRecipe();
})();