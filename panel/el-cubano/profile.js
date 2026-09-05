window.PANEL_PROFILE={
  id:'el-cubano',
  name:'Ceviches & Cócteles El Cubano',
  inventoryDoc:'principal',
  defaultLogo:'',
  groups:{mariscos:'Mariscos',verduras:'Verduras y frescos',salsas:'Salsas y líquidos',desechables:'Desechables',refrescos:'Refrescos'},
  items:{
    fish:{name:'Filete de pescado',group:'mariscos',unit:'lb',purchaseUnit:'lb',factor:1},
    shrimp:{name:'Camarón',group:'mariscos',unit:'lb',purchaseUnit:'lb',factor:1},
    octopus:{name:'Tentáculo de pulpo',group:'mariscos',unit:'lb',purchaseUnit:'lb',factor:1},
    tomato:{name:'Tomate',group:'verduras',unit:'oz',purchaseUnit:'lb',factor:16},
    onion:{name:'Cebolla morada',group:'verduras',unit:'oz',purchaseUnit:'lb',factor:16},
    cucumber:{name:'Pepino',group:'verduras',unit:'pzas',purchaseUnit:'pzas',factor:1},
    cilantro:{name:'Cilantro',group:'verduras',unit:'oz',purchaseUnit:'manojo',factor:2},
    lime:{name:'Limón natural',group:'verduras',unit:'pzas',purchaseUnit:'pzas',factor:1},
    avocado:{name:'Aguacate',group:'verduras',unit:'pzas',purchaseUnit:'pzas',factor:1},
    lemonJuice:{name:'Jugo de limón',group:'salsas',unit:'fl oz',purchaseUnit:'botella 32 fl oz',factor:32},
    clamato:{name:'Clamato',group:'salsas',unit:'fl oz',purchaseUnit:'botella 32 fl oz',factor:32},
    ketchup:{name:'Ketchup',group:'salsas',unit:'fl oz',purchaseUnit:'botella',factor:20},
    valentina:{name:'Salsa Valentina',group:'salsas',unit:'fl oz',purchaseUnit:'botella',factor:12.5},
    english:{name:'Salsa inglesa',group:'salsas',unit:'fl oz',purchaseUnit:'botella',factor:5},
    maggi:{name:'Maggi',group:'salsas',unit:'fl oz',purchaseUnit:'botella',factor:3.38},
    tomatoSauce:{name:'Salsa de tomate para aderezar',group:'salsas',unit:'fl oz',purchaseUnit:'fl oz',factor:1},
    tomatoPuree:{name:'Puré de tomate',group:'salsas',unit:'fl oz',purchaseUnit:'fl oz',factor:1},
    containerHalf:{name:'Contenedor ceviche ½ lb',group:'desechables',unit:'pzas',purchaseUnit:'pzas',factor:1},
    containerLb:{name:'Contenedor ceviche 1 lb',group:'desechables',unit:'pzas',purchaseUnit:'pzas',factor:1},
    lidCeviche:{name:'Tapa ceviche',group:'desechables',unit:'pzas',purchaseUnit:'pzas',factor:1},
    container12:{name:'Contenedor cóctel 12 oz',group:'desechables',unit:'pzas',purchaseUnit:'pzas',factor:1},
    lid12:{name:'Tapa cóctel 12 oz',group:'desechables',unit:'pzas',purchaseUnit:'pzas',factor:1},
    spoon:{name:'Cuchara',group:'desechables',unit:'pzas',purchaseUnit:'paquete 100',factor:100},
    napkins:{name:'Servilletas',group:'desechables',unit:'pzas',purchaseUnit:'paquete',factor:120},
    tostada:{name:'Tostadas',group:'desechables',unit:'pzas',purchaseUnit:'paquete',factor:22},
    coca:{name:'Coca-Cola',group:'refrescos',unit:'pzas',purchaseUnit:'pzas',factor:1},cokezero:{name:'Coke Zero',group:'refrescos',unit:'pzas',purchaseUnit:'pzas',factor:1},sprite:{name:'Sprite',group:'refrescos',unit:'pzas',purchaseUnit:'pzas',factor:1},drpepper:{name:'Dr Pepper',group:'refrescos',unit:'pzas',purchaseUnit:'pzas',factor:1},bigred:{name:'Big Red',group:'refrescos',unit:'pzas',purchaseUnit:'pzas',factor:1},fanta:{name:'Fanta',group:'refrescos',unit:'pzas',purchaseUnit:'pzas',factor:1},manzanita:{name:'Manzanita',group:'refrescos',unit:'pzas',purchaseUnit:'pzas',factor:1}
  },
  products:{
    fish:{id:'manual_fish',name:'Ceviche de pescado',short:'Pescado',unit:'lb',step:.5,price:15},
    shrimp:{id:'manual_shrimp',name:'Ceviche de camarón',short:'Camarón',unit:'lb',step:.5,price:20},
    mixed:{id:'manual_mixed',name:'Ceviche mixto',short:'Mixto',unit:'lb',step:.5,price:25},
    cocktailShrimp:{id:'manual_cocktail_shrimp',name:'Cóctel de camarón',short:'Cóctel camarón',unit:'pza',step:1,price:10},
    cocktailFishShrimp:{id:'manual_cocktail_fish_shrimp',name:'Cóctel pescado + camarón',short:'Cóctel mixto',unit:'pza',step:1,price:0}
  },
  extraTypes:['fish','shrimp','mixed','cocktailShrimp'],
  sodas:['coca','cokezero','sprite','drpepper','bigred','fanta','manzanita'],
  buildRecipe(pkey,qty,soda,add){
    const out={},common={tomato:1.6,cucumber:1/6,onion:.8,cilantro:.2,lemonJuice:2.4,clamato:1.4,avocado:.25},proteins={mixed:{fish:.25,shrimp:.1875},fish:{fish:.5},shrimp:{shrimp:.5}};
    if(['fish','shrimp','mixed'].includes(pkey)){
      Object.entries(proteins[pkey]).forEach(([k,v])=>add(out,k,v*qty));Object.entries(common).forEach(([k,v])=>add(out,k,v*qty));
      const whole=Math.floor(qty+1e-9),rem=qty-whole,half=rem>0?1:0;add(out,'containerLb',whole);add(out,'containerHalf',half);add(out,'lidCeviche',whole+half);add(out,'spoon',qty);add(out,'napkins',2*qty);if(soda)add(out,soda,1);return out;
    }
    if(pkey==='cocktailShrimp'){const r={shrimp:.1875,onion:.5,cilantro:.1,avocado:.25,tomatoSauce:2.173,tomatoPuree:1.087,clamato:.652,lemonJuice:.065,english:.011,maggi:.011,container12:1,lid12:1,spoon:1,napkins:2};Object.entries(r).forEach(([k,v])=>add(out,k,v*qty));return out;}
    add(out,'container12',qty);add(out,'lid12',qty);add(out,'spoon',qty);add(out,'napkins',2*qty);return out;
  },
  resolveProduct(o){const item=o?.items?.[0]||{},id=String(item.productId||'').toLowerCase(),name=String(item.name||'').toLowerCase();if(id.includes('cocktail_fish_shrimp')||((name.includes('cóctel')||name.includes('coctel'))&&name.includes('pescado')&&name.includes('camar')))return 'cocktailFishShrimp';if(id.includes('cocktail_shrimp')||id==='cc12'||id==='cc16'||((name.includes('cóctel')||name.includes('coctel'))&&name.includes('camar')))return 'cocktailShrimp';if(id.includes('manual_fish')||id==='fp5'||id==='fp1'||(name.includes('ceviche')&&name.includes('pescado')&&!name.includes('mixto')))return 'fish';if(id.includes('manual_shrimp')||id==='fc5'||id==='fc1'||(name.includes('ceviche')&&name.includes('camar')&&!name.includes('mixto')))return 'shrimp';return 'mixed';},
  resolveQty(o){if(Number(o?.pounds)>0)return Number(o.pounds);const item=o?.items?.[0]||{};if(Number(item.qty)>0){if(['fp5','fc5','fm5'].includes(String(item.productId)))return .5*Number(item.qty);return Number(item.qty);}return 0;}
};