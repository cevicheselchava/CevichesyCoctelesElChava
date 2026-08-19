(()=>{
  if(window.__EL_CUBANO_PURCHASE_MEMORY__)return;
  window.__EL_CUBANO_PURCHASE_MEMORY__=true;

  const TARGETS=new Set(['fish','octopus']);
  const base={};

  function saveBase(key){
    if(base[key]||!ITEMS?.[key])return;
    const x=ITEMS[key];
    base[key]={
      purchaseEntryUnit:x.purchaseEntryUnit,
      purchaseQuestion:x.purchaseQuestion,
      fixedContentPerUnit:x.fixedContentPerUnit,
      fixedContentUnit:x.fixedContentUnit,
      fixedContentToInternalFactor:x.fixedContentToInternalFactor,
      factor:x.factor,
      purchaseUnit:x.purchaseUnit
    };
  }

  function restoreBase(key){
    const x=ITEMS?.[key],b=base[key];
    if(!x||!b)return;
    ['purchaseEntryUnit','purchaseQuestion','fixedContentPerUnit','fixedContentUnit','fixedContentToInternalFactor'].forEach(p=>{
      if(b[p]===undefined)delete x[p]; else x[p]=b[p];
    });
    x.factor=b.factor;
    x.purchaseUnit=b.purchaseUnit;
  }

  function pluralQuestion(unit){
    const u=String(unit||'').toLowerCase();
    if(u==='bolsa')return '¿Cuántas bolsas vas a comprar?';
    if(u==='paquete')return '¿Cuántos paquetes vas a comprar?';
    if(u==='caja')return '¿Cuántas cajas vas a comprar?';
    if(u==='pieza')return '¿Cuántas piezas vas a comprar?';
    return '¿Cuánto vas a comprar?';
  }

  function lastPurchase(key){
    return (movements||[]).find(m=>m?.type==='purchase'&&m?.itemKey===key&&Number(m?.qty)>0&&String(m?.unit||'').trim());
  }

  function applyRemembered(key){
    if(!TARGETS.has(key)||!ITEMS?.[key])return;
    saveBase(key);
    restoreBase(key);

    const m=lastPurchase(key);
    if(!m)return;

    const x=ITEMS[key],qty=Number(m.qty||0),internal=Number(m.internalQty),unit=String(m.unit||'').trim();
    const internalPerUnit=qty>0&&Number.isFinite(internal)&&internal>0?internal/qty:null;
    const content=Number(m.contentPerUnit),contentUnit=String(m.contentUnit||'').trim();

    x.purchaseEntryUnit=unit;
    x.purchaseQuestion=pluralQuestion(unit);

    // Si la compra anterior fue por bolsa/paquete/caja, recuerda automáticamente
    // cuánto trae cada unidad y deja de volver a preguntarlo.
    if(/^(bolsa|paquete|caja|pieza)$/i.test(unit)&&internalPerUnit&&internalPerUnit>0){
      const shownContent=Number.isFinite(content)&&content>0?content:internalPerUnit;
      const shownUnit=contentUnit||(x.unit||'');
      x.fixedContentPerUnit=shownContent;
      x.fixedContentUnit=shownUnit;
      x.fixedContentToInternalFactor=shownContent>0?internalPerUnit/shownContent:1;
      return;
    }

    // Si se compró por peso (por ejemplo lb), conserva ese flujo simple.
    if(internalPerUnit&&internalPerUnit>0)x.factor=internalPerUnit;
  }

  function applyCurrent(){
    const key=document.getElementById('stockItem')?.value;
    if(key)applyRemembered(key);
  }

  const start=()=>{
    TARGETS.forEach(saveBase);

    if(typeof openStock==='function'){
      const original=openStock;
      openStock=function(key='',need=null){
        if(key)applyRemembered(key);
        return original(key,need);
      };
    }

    const select=document.getElementById('stockItem');
    if(select){
      select.addEventListener('change',()=>applyRemembered(select.value),true);
    }

    // Cuando Firebase actualiza el historial, la próxima apertura usa la última
    // presentación registrada de pescado o pulpo sin pedir configuración extra.
    document.addEventListener('click',e=>{
      if(e.target.closest('#inventoryPurchaseBtn,#inventoryList .inv'))applyCurrent();
    },true);
  };

  start();
})();