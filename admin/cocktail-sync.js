(()=>{
  if(window.__EL_CUBANO_COCKTAIL_ADMIN_SYNC__)return;
  window.__EL_CUBANO_COCKTAIL_ADMIN_SYNC__=true;

  function addItem(key,data){
    ITEMS[key]={...(ITEMS[key]||{}),...data};
    if(typeof EMPTY==='object'&&EMPTY&&!Object.prototype.hasOwnProperty.call(EMPTY,key))EMPTY[key]=0;
    if(typeof inventory==='object'&&inventory&&!Object.prototype.hasOwnProperty.call(inventory,key))inventory[key]=0;
  }

  // Ingredientes del jugo del cóctel. El inventario se guarda en fl oz,
  // pero al registrar una compra se captura el envase real y su contenido.
  addItem('tomatoSauce',{
    name:'Salsa de tomate para aderezar',
    group:'salsas',
    unit:'fl oz',
    purchaseUnit:'fl oz',
    factor:1,
    purchaseEntryUnit:'envase',
    variableContentUnit:'fl oz',
    low:0
  });
  addItem('tomatoPuree',{
    name:'Puré de tomate',
    group:'salsas',
    unit:'fl oz',
    purchaseUnit:'fl oz',
    factor:1,
    purchaseEntryUnit:'envase',
    variableContentUnit:'fl oz',
    low:0
  });

  // Refrescos que aparecen en la app de clientes. Internamente se cuentan por pieza;
  // al comprar se puede registrar cuántos paquetes y cuántas latas trae cada paquete.
  const sodas={
    coca:'Coca-Cola',
    cokezero:'Coke Zero',
    sprite:'Sprite',
    drpepper:'Dr Pepper',
    bigred:'Big Red',
    fanta:'Fanta'
  };
  Object.entries(sodas).forEach(([key,name])=>addItem(key,{
    name,
    group:'refrescos',
    unit:'pzas',
    purchaseUnit:'pzas',
    factor:1,
    purchaseEntryUnit:'paquete',
    variableContentUnit:'pzas',
    low:4
  }));

  // Nombres claros dentro del flujo de preparación de pedidos.
  if(typeof PREP_NAMES==='object'&&PREP_NAMES){
    PREP_NAMES.tomatoSauce='Salsa de tomate para aderezar';
    PREP_NAMES.tomatoPuree='Puré de tomate';
    PREP_NAMES.english='Salsa inglesa';
    PREP_NAMES.maggi='Maggi';
    Object.entries(sodas).forEach(([key,name])=>PREP_NAMES[key]=name);
  }

  // El pedido manual de ceviche mixto abre con los mismos valores vigentes de la app.
  // Los campos siguen siendo editables si se hace una promoción o precio especial.
  if(typeof openOrderModal==='function'){
    const baseOpenOrderModal=openOrderModal;
    openOrderModal=function(id=''){
      baseOpenOrderModal(id);
      if(!id){
        const price=$('moPrice'),cost=$('moCost');
        if(price)price.value='25';
        if(cost)cost.value='4.91';
        if(typeof updateOrderSummary==='function')updateOrderSummary();
        if(typeof syncOrderQuickButtons==='function')syncOrderQuickButtons();
      }
    };
  }

  if(typeof renderAll==='function')renderAll();
})();
