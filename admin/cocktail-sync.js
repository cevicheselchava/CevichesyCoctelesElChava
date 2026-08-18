(()=>{
  if(window.__EL_CUBANO_COCKTAIL_ADMIN_SYNC__)return;
  window.__EL_CUBANO_COCKTAIL_ADMIN_SYNC__=true;

  // Ingredientes del jugo del cóctel que ya llegan en la receta de los pedidos.
  // Se manejan en fl oz para no amarrar el panel a un tamaño específico de lata/envase.
  ITEMS.tomatoSauce={
    name:'Salsa de tomate para aderezar',
    group:'salsas',
    unit:'fl oz',
    purchaseUnit:'fl oz',
    factor:1,
    low:0
  };
  ITEMS.tomatoPuree={
    name:'Puré de tomate',
    group:'salsas',
    unit:'fl oz',
    purchaseUnit:'fl oz',
    factor:1,
    low:0
  };

  // Asegura que el inventario local pueda mostrar los nuevos ingredientes aun antes
  // de que exista una compra registrada para ellos en Firebase.
  if(typeof inventory==='object'&&inventory){
    if(!Object.prototype.hasOwnProperty.call(inventory,'tomatoSauce'))inventory.tomatoSauce=0;
    if(!Object.prototype.hasOwnProperty.call(inventory,'tomatoPuree'))inventory.tomatoPuree=0;
  }

  // Nombres claros dentro del flujo de preparación de pedidos.
  if(typeof PREP_NAMES==='object'&&PREP_NAMES){
    PREP_NAMES.tomatoSauce='Salsa de tomate para aderezar';
    PREP_NAMES.tomatoPuree='Puré de tomate';
    PREP_NAMES.english='Salsa inglesa';
    PREP_NAMES.maggi='Maggi';
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
