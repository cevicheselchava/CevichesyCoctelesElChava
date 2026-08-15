(()=>{
  if(window.__EL_CUBANO_SODA_MULTI_V1__)return;
  window.__EL_CUBANO_SODA_MULTI_V1__=true;

  const SODA_NAMES=['Refrescos promo','Coca-Cola','Manzanita Sol','Sprite','Coke Zero','Dr Pepper','Big Red','Fanta'];
  let lastAdded='';
  let queued=false;

  const style=document.createElement('style');
  style.id='el-cubano-soda-multi-style';
  style.textContent=`
    #sodaMultiHelp,#sodaMultiDone{display:none}
    #sodaMultiHelp.active{display:block;grid-column:1/-1;margin:0;padding:11px 12px;border-radius:14px;background:#eef5ff;border:1px solid #b9cce8;color:#17304f;font-weight:900;line-height:1.4}
    #sodaMultiHelp b{color:#267642}
    #sodaMultiDone.active{display:block;width:100%;margin-top:9px;border:0;border-radius:13px;padding:13px;background:#17304f;color:#fff;font-weight:1000;font-size:15px}
    #recipePurchaseModal.soda-multi-mode #purchaseAdd{background:#267642!important}
    #recipePurchaseModal.soda-multi-mode #purchaseModalNeed{background:#effaf1;border-color:#b8ddc2;color:#267642}
    .soda-extra-buy{margin-top:7px!important;width:100%;min-width:0!important;padding:8px 10px!important;background:#eef5ff!important;color:#17304f!important}
  `;
  document.head.appendChild(style);

  function cleanTitle(){
    return (document.getElementById('purchaseModalTitle')?.textContent||'').replace(/^Editar\s*·\s*/,'').trim();
  }
  function isEditing(){return /^Editar\s*·\s*/.test(document.getElementById('purchaseModalTitle')?.textContent||'');}
  function isSoda(){return SODA_NAMES.includes(cleanTitle());}

  function ensureUi(){
    const modal=document.getElementById('recipePurchaseModal');
    const form=document.getElementById('simplePurchaseForm');
    const actions=modal?.querySelector('.purchase-sheet-actions');
    if(!modal||!form||!actions)return;

    let help=document.getElementById('sodaMultiHelp');
    if(!help){
      help=document.createElement('div');
      help.id='sodaMultiHelp';
      help.innerHTML='<b>¿Traes varios sabores?</b> Agrega uno por uno. Cada sabor conserva su propio precio y todos quedan dentro de la misma compra.';
      const brand=document.getElementById('simpleSodaBrandWrap');
      if(brand)brand.before(help);else form.prepend(help);
    }

    let done=document.getElementById('sodaMultiDone');
    if(!done){
      done=document.createElement('button');
      done.type='button';
      done.id='sodaMultiDone';
      done.textContent='✅ Ya terminé de agregar refrescos';
      actions.after(done);
      done.addEventListener('click',()=>{
        modal.hidden=true;
        modal.classList.remove('soda-multi-mode');
        const openCart=document.getElementById('openPurchaseCart');
        if(openCart)openCart.click();
      });
    }

    const active=isSoda()&&!modal.hidden;
    const editing=isEditing();
    help.classList.toggle('active',active&&!editing);
    done.classList.toggle('active',active&&!editing);
    modal.classList.toggle('soda-multi-mode',active&&!editing);

    const add=document.getElementById('purchaseAdd');
    if(add&&active&&!editing)add.textContent='➕ Agregar este refresco';

    if(add&&!add.dataset.sodaMultiBound){
      add.dataset.sodaMultiBound='1';

      // Valida antes de que el flujo original guarde la línea.
      add.addEventListener('click',event=>{
        if(!isSoda()||isEditing())return;
        const price=document.getElementById('simpleSodaPackPrice');
        if(!price||price.value.trim()===''||!Number.isFinite(Number(price.value))||Number(price.value)<0){
          event.preventDefault();
          event.stopImmediatePropagation();
          alert('Escribe el precio de este paquete de refresco.');
        }
      },true);

      // Después de guardar una línea, vuelve a abrir la misma pantalla para el siguiente sabor.
      add.addEventListener('click',()=>{
        if(!isSoda()||isEditing())return;
        const brand=document.getElementById('simpleSodaBrand');
        const selected=brand?.options?.[brand.selectedIndex]?.textContent?.trim()||'Refresco';
        const qty=Math.max(1,Math.round(Number(document.getElementById('simpleQty')?.value)||1));
        lastAdded=`${selected} · ${qty} paquete${qty===1?'':'s'}`;
        setTimeout(()=>{
          if(!modal.hidden)return;
          modal.hidden=false;
          modal.classList.add('soda-multi-mode');
          const need=document.getElementById('purchaseModalNeed');
          if(need)need.textContent=`✅ ${lastAdded} agregado. Cambia el sabor y agrega el siguiente, o termina.`;
          const simpleQty=document.getElementById('simpleQty');
          if(simpleQty){simpleQty.value='1';simpleQty.dispatchEvent(new Event('input',{bubbles:true}));}
          const content=document.getElementById('simplePackageContent');
          if(content&&!content.value){content.value='12';content.dispatchEvent(new Event('input',{bubbles:true}));}
          const addAgain=document.getElementById('purchaseAdd');
          if(addAgain)addAgain.textContent='➕ Agregar este refresco';
          schedule();
        },60);
      });
    }
  }

  function keepExtraSodaButton(){
    const result=document.getElementById('recipeResult');
    if(!result)return;
    result.querySelectorAll('.recipe-row').forEach(row=>{
      const name=row.querySelector('strong')?.textContent?.trim();
      if(name!=='Refrescos promo')return;
      if(row.querySelector('.recipe-buy-button'))return;
      const action=row.querySelector('.recipe-buy.enough');
      if(!action)return;
      const button=document.createElement('button');
      button.type='button';
      button.className='recipe-buy-button soda-extra-buy';
      button.dataset.key='coca';
      button.dataset.required='0';
      button.dataset.shortage='0';
      button.textContent='➕ Otro sabor';
      action.replaceWith(button);
    });
  }

  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      ensureUi();
      keepExtraSodaButton();
    });
  }

  schedule();
  const observer=new MutationObserver(schedule);
  observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden']});
})();