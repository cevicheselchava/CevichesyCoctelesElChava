(()=>{
  if(window.__EL_CUBANO_PACKAGING_CONTAINERS_V1__)return;
  window.__EL_CUBANO_PACKAGING_CONTAINERS_V1__=true;

  const r3=n=>Math.round((Number(n)+Number.EPSILON)*1000)/1000;
  const PACKAGE_KEYS=['containerHalf','containerLb','lidCeviche','container12','lid12'];

  function addItem(key,data){
    ITEMS[key]={...(ITEMS[key]||{}),...data};
    if(typeof EMPTY==='object'&&EMPTY&&!Object.prototype.hasOwnProperty.call(EMPTY,key))EMPTY[key]=0;
    if(typeof inventory==='object'&&inventory&&!Object.prototype.hasOwnProperty.call(inventory,key))inventory[key]=0;
  }

  addItem('containerHalf',{name:'Contenedor ceviche ½ lb',group:'desechables',unit:'pzas',purchaseUnit:'pzas',factor:1,low:6});
  addItem('containerLb',{name:'Contenedor ceviche 1 lb',group:'desechables',unit:'pzas',purchaseUnit:'pzas',factor:1,low:6});
  addItem('lidCeviche',{name:'Tapa ceviche · ½ lb / 1 lb',group:'desechables',unit:'pzas',purchaseUnit:'pzas',factor:1,low:10});
  addItem('container12',{name:'Contenedor cóctel 12 oz',group:'desechables',unit:'pzas',purchaseUnit:'pzas',factor:1,low:6});
  addItem('lid12',{name:'Tapa cóctel 12 oz',group:'desechables',unit:'pzas',purchaseUnit:'pzas',factor:1,low:6});

  if(typeof PREP_NAMES==='object'&&PREP_NAMES){
    PREP_NAMES.containerHalf='Contenedor ceviche ½ lb';
    PREP_NAMES.containerLb='Contenedor ceviche 1 lb';
    PREP_NAMES.lidCeviche='Tapa ceviche';
    PREP_NAMES.container12='Contenedor cóctel 12 oz';
    PREP_NAMES.lid12='Tapa cóctel 12 oz';
  }

  function add(out,key,value){
    if(!(Number(value)>0))return;
    out[key]=r3(Number(out[key]||0)+Number(value));
  }

  function addCevichePackaging(out,pounds,multiplier=1){
    const p=Math.max(0,Number(pounds||0));
    const m=Math.max(0,Number(multiplier||0));
    if(!(p>0&&m>0))return;
    const whole=Math.floor(p+1e-9);
    const remainder=r3(p-whole);
    const half=remainder>0?1:0;
    add(out,'containerLb',whole*m);
    add(out,'containerHalf',half*m);
    add(out,'lidCeviche',(whole+half)*m);
  }

  const baseBuildRecipe=typeof buildRecipe==='function'?buildRecipe:null;
  if(baseBuildRecipe){
    buildRecipe=function(pounds,sodas=0,pack=true,type='mixed'){
      const recipe={...(baseBuildRecipe(pounds,sodas,pack,type)||{})};
      delete recipe.container12;
      delete recipe.lid12;
      delete recipe.containerHalf;
      delete recipe.containerLb;
      delete recipe.lidCeviche;
      if(pack)addCevichePackaging(recipe,pounds,1);
      return recipe;
    };
  }

  const HALF_IDS=new Set(['fp5','fc5','fm5','op5','oc5']);
  const LB_IDS=new Set(['fp1','fc1','fm1','op1','oc1']);
  const COCKTAIL_IDS=new Set(['cc12','cc16','cm12','cm16','cocktail_small','cocktail_medium','cocktail_mix_small','cocktail_mix_medium','manual_cocktail_shrimp','manual_cocktail_fish_shrimp']);

  function packagingForOrder(o){
    const out={containerHalf:0,containerLb:0,lidCeviche:0,container12:0,lid12:0};
    if(!o)return out;

    if(o.manualOrder){
      const cocktailQty=Math.max(0,Number(o.cocktailQty||0));
      if(cocktailQty>0){
        add(out,'container12',cocktailQty);add(out,'lid12',cocktailQty);
        return out;
      }
      const pounds=Math.max(0,Number(o.pounds||0));
      if(pounds>0){addCevichePackaging(out,pounds,1);return out;}
    }

    (o.items||[]).forEach(item=>{
      const id=String(item?.productId||'').toLowerCase();
      const name=String(item?.name||'').toLowerCase();
      const detail=String(item?.detail||'').toLowerCase();
      const qty=Math.max(0,Number(item?.qty||0));
      if(!(qty>0))return;

      if(HALF_IDS.has(id)){add(out,'containerHalf',qty);add(out,'lidCeviche',qty);return;}
      if(LB_IDS.has(id)){add(out,'containerLb',qty);add(out,'lidCeviche',qty);return;}
      if(COCKTAIL_IDS.has(id)||name.includes('cóctel')||name.includes('coctel')){add(out,'container12',qty);add(out,'lid12',qty);return;}

      if(id==='promo_constructor'||id==='promo_hambre'){
        add(out,'containerLb',qty);add(out,'lidCeviche',qty);add(out,'container12',qty);add(out,'lid12',qty);return;
      }
      if(id==='promo_camaradas'){
        add(out,'containerLb',2*qty);add(out,'lidCeviche',2*qty);add(out,'container12',2*qty);add(out,'lid12',2*qty);return;
      }

      if(name.includes('ceviche')){
        if(/½\s*libra|1\/2\s*libra/.test(detail)){add(out,'containerHalf',qty);add(out,'lidCeviche',qty);return;}
        const match=detail.match(/(\d+(?:\.\d+)?)\s*libras?/);
        if(match){addCevichePackaging(out,Number(match[1]),qty);}
      }
    });
    return out;
  }

  function shrimpCocktailCount(o){
    if(!o)return 0;
    if(o.manualProductType==='cocktailShrimp'||o.productType==='cocktailShrimp')return Math.max(0,Number(o.cocktailQty||o.quantity||0));
    let total=0;
    (o.items||[]).forEach(item=>{
      const id=String(item?.productId||'').toLowerCase();
      const name=String(item?.name||'').toLowerCase();
      const qty=Math.max(0,Number(item?.qty||0));
      if(!(qty>0))return;
      const isCocktail=id.includes('cocktail')||id==='cc12'||id==='cc16'||name.includes('cóctel')||name.includes('coctel');
      const hasFish=name.includes('pescado')||id.includes('fish_shrimp')||id.startsWith('cm');
      const hasShrimp=name.includes('camar')||id==='cc12'||id==='cc16'||id.includes('shrimp');
      if(isCocktail&&hasShrimp&&!hasFish)total+=qty;
    });
    return total;
  }

  const SHRIMP_COCKTAIL_PER_12OZ={
    shrimp:0.1875,onion:0.5,cilantro:0.1,avocado:0.25,
    tomatoSauce:2.173,tomatoPuree:1.087,clamato:0.652,lemonJuice:0.065,
    english:0.011,maggi:0.011
  };

  window.elCubanoPackagingForOrder=packagingForOrder;
  window.elCubanoShrimpCocktailRecipe=count=>{
    const n=Math.max(0,Number(count||0)),out={};
    Object.entries(SHRIMP_COCKTAIL_PER_12OZ).forEach(([k,v])=>add(out,k,v*n));
    add(out,'container12',n);add(out,'lid12',n);
    return out;
  };

  const baseRecipeRemaining=typeof recipeRemaining==='function'?recipeRemaining:null;
  if(baseRecipeRemaining){
    recipeRemaining=function(o){
      const out={...(baseRecipeRemaining(o)||{})};
      PACKAGE_KEYS.forEach(k=>delete out[k]);
      const used=o?.prepConsumed||{};
      const packaging=packagingForOrder(o);
      Object.entries(packaging).forEach(([k,v])=>{
        const left=Math.max(0,r3(Number(v||0)-Number(used[k]||0)));
        if(left>0)out[k]=left;
      });

      const recipe=o?.recipe||{};
      const alreadyHasCocktail=Number(recipe.tomatoSauce||0)>0||Number(recipe.tomatoPuree||0)>0;
      const cocktailCount=shrimpCocktailCount(o);
      if(cocktailCount>0&&!alreadyHasCocktail){
        Object.entries(SHRIMP_COCKTAIL_PER_12OZ).forEach(([k,v])=>{
          if(!ITEMS[k])return;
          const left=Math.max(0,r3(Number(v)*cocktailCount-Number(used[k]||0)));
          if(left>0)add(out,k,left);
        });
      }
      return out;
    };
  }

  if(typeof renderAll==='function')renderAll();
})();