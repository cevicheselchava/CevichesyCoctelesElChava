(()=>{
  if(window.__EL_CUBANO_RECIPE_UNITS_OZ__)return;
  window.__EL_CUBANO_RECIPE_UNITS_OZ__=true;

  const r3=n=>Math.round((Number(n)+Number.EPSILON)*1000)/1000;
  const pretty=n=>Number(r3(n).toFixed(3));

  // Solo cambia cómo se muestran las cantidades en RECETAS.
  // El inventario y los cálculos internos conservan sus unidades actuales.
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

  recipeRow=function(key,need){
    const have=available(key),lack=Math.max(0,r3(Number(need||0)-Number(have||0))),item=ITEMS[key];
    return `<div class="recipe-row"><div><strong>${item.name}</strong><small>Necesitas ${recipeQty(key,need)} · Disponible ${recipeQty(key,have)}</small></div>${lack>0?`<button class="recipe-buy" data-buy="${key}" data-need="${lack}">Comprar ${recipeQty(key,lack)}</button>`:'<span class="recipe-enough">✓ Hay</span>'}</div>`;
  };

  renderRecipe=function(){
    const type=$('recipeType').value,
      pounds=Math.max(.25,Number($('recipePounds').value)||.25),
      sodas=Math.max(0,Math.floor(Number($('recipeSodas').value)||0)),
      pack=$('recipePackaging').checked,
      recipe=recipeNeeds(type,pounds,sodas,pack),
      lacks=Object.entries(recipe).filter(([key,value])=>available(key)<value);

    $('recipeResult').innerHTML=`<div class="recipe-summary"><b>${TYPES[type].name}</b><br>${pounds} lb a preparar · ${lacks.length?`Faltan ${lacks.length} ingredientes/insumos.`:'Tienes todo lo necesario.'}</div><div class="recipe-list">${Object.entries(recipe).map(([key,value])=>recipeRow(key,value)).join('')}</div>`;
  };

  if(document.getElementById('recipeResult'))renderRecipe();
})();