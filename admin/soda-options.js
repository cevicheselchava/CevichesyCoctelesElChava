(()=>{
  if(window.__EL_CUBANO_SODA_OPTIONS_V1__)return;
  window.__EL_CUBANO_SODA_OPTIONS_V1__=true;

  const GENERIC_KEY='coca';
  const PRICE_KEY='elCubanoSodaPackPricesV1';
  const BRANDS=[
    {id:'coca',name:'Coca-Cola',price:8.47},
    {id:'manzanita',name:'Manzanita Sol',price:4.97},
    {id:'sprite',name:'Sprite'},
    {id:'cokezero',name:'Coke Zero'},
    {id:'drpepper',name:'Dr Pepper'},
    {id:'bigred',name:'Big Red'},
    {id:'fanta',name:'Fanta'}
  ];

  function prices(){
    try{return {...Object.fromEntries(BRANDS.filter(x=>Number.isFinite(x.price)).map(x=>[x.id,x.price])),...(JSON.parse(localStorage.getItem(PRICE_KEY)||'{}')||{})};}
    catch{return Object.fromEntries(BRANDS.filter(x=>Number.isFinite(x.price)).map(x=>[x.id,x.price]));}
  }
  function savePrice(id,value){
    if(!Number.isFinite(value)||value<0)return;
    const map=prices();map[id]=value;localStorage.setItem(PRICE_KEY,JSON.stringify(map));
  }
  function brandById(id){return BRANDS.find(x=>x.id===id)||BRANDS[0];}
  function brandByName(name){return BRANDS.find(x=>x.name===name)||null;}

  function initInventoryModel(){
    if(typeof ITEMS==='undefined')return false;
    if(ITEMS[GENERIC_KEY]){
      ITEMS[GENERIC_KEY]={...ITEMS[GENERIC_KEY],name:'Refrescos promo',group:'refrescos',unit:'latas',purchaseUnit:'latas',factor:1,low:4};
    }
    // Alias invisibles: sirven para que el editor reconozca el nombre de cada refresco
    // sin separar el stock operativo. Las órdenes reservan cualquier lata de la promo.
    BRANDS.forEach(brand=>{
      const key=`soda_${brand.id}`;
      if(!ITEMS[key])ITEMS[key]={name:brand.name,group:'refrescos',unit:'latas',purchaseUnit:'latas',factor:1,low:0,legacy:true};
      if(typeof EMPTY!=='undefined'&&!(key in EMPTY))EMPTY[key]=0;
      if(typeof inventory!=='undefined'&&!(key in inventory))inventory[key]=0;
    });
    ['cokezero','sprite','drpepper','bigred','fanta'].forEach(key=>{if(ITEMS[key])ITEMS[key].legacy=true;});
    try{renderAll();}catch(_){ }
    return true;
  }

  const style=document.createElement('style');
  style.id='el-cubano-soda-options-style';
  style.textContent=`
    #simpleSodaBrandWrap,#simpleSodaPriceWrap{grid-column:1/-1}
    #simpleSodaBrandWrap[hidden],#simpleSodaPriceWrap[hidden]{display:none!important}
    #simpleSodaBrandWrap{padding:11px 12px;border-radius:15px;background:linear-gradient(135deg,#eef8ef,#fff);border:1px solid #b9d9bf;border-left:5px solid #267642}
    #simpleSodaPriceWrap{padding:11px 12px;border-radius:15px;background:linear-gradient(135deg,#fff9e7,#fff);border:1px solid #ead79a;border-left:5px solid #f2b632}
    #simpleSodaBrandWrap select,#simpleSodaPriceWrap input{margin-top:7px!important}
    #simpleSodaHint{display:block;margin-top:6px;color:#667184;font-size:12px;font-weight:800;line-height:1.3}
  `;
  document.head.appendChild(style);

  function ensureFields(){
    const form=document.getElementById('simplePurchaseForm');
    if(!form)return null;
    let brandWrap=document.getElementById('simpleSodaBrandWrap');
    if(!brandWrap){
      brandWrap=document.createElement('label');
      brandWrap.id='simpleSodaBrandWrap';
      brandWrap.hidden=true;
      brandWrap.innerHTML=`Refresco<select id="simpleSodaBrand">${BRANDS.map(x=>`<option value="${x.id}">${x.name}</option>`).join('')}</select><small id="simpleSodaHint">Cada refresco conserva su propio precio por paquete.</small>`;
      const qty=form.querySelector('#simpleQty')?.closest('label');
      form.insertBefore(brandWrap,qty||form.firstChild);
    }
    let priceWrap=document.getElementById('simpleSodaPriceWrap');
    if(!priceWrap){
      priceWrap=document.createElement('label');
      priceWrap.id='simpleSodaPriceWrap';
      priceWrap.hidden=true;
      priceWrap.innerHTML='Precio por paquete<input id="simpleSodaPackPrice" type="number" min="0" step="0.01" placeholder="$0.00">';
      const total=form.querySelector('#simpleTotal')?.closest('label');
      form.insertBefore(priceWrap,total||null);
    }
    const brand=form.querySelector('#simpleSodaBrand');
    const packPrice=form.querySelector('#simpleSodaPackPrice');
    if(brand&&!brand.dataset.bound){
      brand.dataset.bound='1';
      brand.addEventListener('change',()=>{
        const value=prices()[brand.value];
        packPrice.value=Number.isFinite(Number(value))?Number(value).toFixed(2):'';
        autoTotal(true);
      });
    }
    if(packPrice&&!packPrice.dataset.bound){
      packPrice.dataset.bound='1';
      packPrice.addEventListener('input',()=>autoTotal(true));
    }
    const qty=form.querySelector('#simpleQty');
    if(qty&&!qty.dataset.sodaBound){
      qty.dataset.sodaBound='1';
      qty.addEventListener('input',()=>{if(isSodaModal())autoTotal(false);});
    }
    return form;
  }

  function modalTitle(){return (document.getElementById('purchaseModalTitle')?.textContent||'').replace(/^Editar\s*·\s*/,'').trim();}
  function isSodaModal(){
    const title=modalTitle();
    return title==='Refrescos promo'||title==='Coca-Cola'||Boolean(brandByName(title));
  }

  function autoTotal(force){
    const form=document.getElementById('simplePurchaseForm');
    if(!form||!isSodaModal())return;
    const qty=form.querySelector('#simpleQty');
    const unit=form.querySelector('#simpleUnit');
    const total=form.querySelector('#simpleTotal');
    const price=form.querySelector('#simpleSodaPackPrice');
    if(!qty||!unit||!total||!price)return;
    if(unit.value!=='package')return;
    const count=Math.max(1,Math.round(Number(qty.value)||1));
    const each=Number(price.value);
    if(Number.isFinite(each)&&each>=0){
      const next=(count*each).toFixed(2);
      if(force||!total.value||Math.abs(Number(total.value)-Number(next))>.001){
        total.value=next;
        total.dispatchEvent(new Event('input',{bubbles:true}));
      }
    }
  }

  function decorateSodaModal(){
    const modal=document.getElementById('recipePurchaseModal');
    const form=ensureFields();
    if(!modal||!form)return;
    const brandWrap=document.getElementById('simpleSodaBrandWrap');
    const priceWrap=document.getElementById('simpleSodaPriceWrap');
    const soda=isSodaModal()&&!modal.hidden;
    brandWrap.hidden=!soda;priceWrap.hidden=!soda;
    if(!soda)return;

    const brand=form.querySelector('#simpleSodaBrand');
    const titleBrand=brandByName(modalTitle());
    if(titleBrand)brand.value=titleBrand.id;
    else if(!brand.value)brand.value='coca';

    const unit=form.querySelector('#simpleUnit');
    const qty=form.querySelector('#simpleQty');
    const content=form.querySelector('#simplePackageContent');
    const packUnit=form.querySelector('#simplePackageUnit');
    const price=form.querySelector('#simpleSodaPackPrice');
    if(unit&&[...unit.options].some(x=>x.value==='package')&&unit.value!=='package'){
      unit.value='package';unit.dispatchEvent(new Event('change',{bubbles:true}));
    }
    if(qty&&(!qty.value||Number(qty.value)<1))qty.value='1';
    if(content&&!content.value){content.value='12';content.dispatchEvent(new Event('input',{bubbles:true}));}
    if(packUnit&&[...packUnit.options].some(x=>x.value==='latas')&&packUnit.value!=='latas'){
      packUnit.value='latas';packUnit.dispatchEvent(new Event('change',{bubbles:true}));
    }
    if(price&&!price.value){
      const value=prices()[brand.value];
      if(Number.isFinite(Number(value)))price.value=Number(value).toFixed(2);
    }
    autoTotal(false);
  }

  function bindSave(){
    const button=document.getElementById('purchaseAdd');
    if(!button||button.dataset.sodaBound)return;
    button.dataset.sodaBound='1';
    button.addEventListener('click',()=>{
      if(!isSodaModal()||typeof ITEMS==='undefined'||!ITEMS[GENERIC_KEY])return;
      const brand=document.getElementById('simpleSodaBrand');
      const packPrice=document.getElementById('simpleSodaPackPrice');
      const selected=brandById(brand?.value||'coca');
      savePrice(selected.id,Number(packPrice?.value));
      // El inventario usa una sola bolsa de "refrescos promo", pero el movimiento
      // y el carrito guardan el nombre real comprado y su costo real.
      ITEMS[GENERIC_KEY].name=selected.name;
      setTimeout(()=>{
        if(ITEMS?.[GENERIC_KEY])ITEMS[GENERIC_KEY].name='Refrescos promo';
        try{renderAll();}catch(_){ }
      },0);
    },true);
  }

  function decorateRecipe(){
    const result=document.getElementById('recipeResult');
    if(!result)return;
    result.querySelectorAll('.recipe-row').forEach(row=>{
      const strong=row.querySelector('strong');
      if(strong&&BRANDS.some(x=>x.name===strong.textContent.trim()))strong.textContent='Refrescos promo';
    });
  }

  let scheduled=false;
  function schedule(){
    if(scheduled)return;scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      if(initInventoryModel()){
        decorateSodaModal();bindSave();decorateRecipe();
      }
    });
  }

  schedule();
  const observer=new MutationObserver(schedule);
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});
})();