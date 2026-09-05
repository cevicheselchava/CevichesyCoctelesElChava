window.PANEL_PROFILE={
  id:'demo-comercial',
  name:'Mi Negocio Demo',
  inventoryDoc:'demo-comercial',
  defaultLogo:'',
  groups:{principal:'Producto principal',acompanamientos:'Acompañamientos',empaque:'Empaque',bebidas:'Bebidas'},
  items:{
    chicken:{name:'Pollo',group:'principal',unit:'pza',purchaseUnit:'pza',factor:1},
    tortillas:{name:'Tortillas',group:'acompanamientos',unit:'pzas',purchaseUnit:'paquete',factor:30},
    salsa:{name:'Salsa',group:'acompanamientos',unit:'oz',purchaseUnit:'oz',factor:1},
    charcoal:{name:'Carbón / combustible',group:'acompanamientos',unit:'lb',purchaseUnit:'lb',factor:1},
    bag:{name:'Bolsa / empaque',group:'empaque',unit:'pzas',purchaseUnit:'pzas',factor:1},
    coca:{name:'Coca-Cola',group:'bebidas',unit:'pzas',purchaseUnit:'pzas',factor:1},
    sprite:{name:'Sprite',group:'bebidas',unit:'pzas',purchaseUnit:'pzas',factor:1}
  },
  products:{
    whole:{id:'demo_whole',name:'Pollo entero',short:'Pollo entero',unit:'pza',step:1,price:0,recipe:{chicken:1,bag:1}},
    half:{id:'demo_half',name:'Medio pollo',short:'Medio pollo',unit:'pza',step:1,price:0,recipe:{chicken:.5,bag:1}},
    family:{id:'demo_family',name:'Paquete familiar',short:'Paquete',unit:'pza',step:1,price:0,recipe:{chicken:2,bag:2}}
  },
  extraTypes:['whole','half','family'],
  sodas:['coca','sprite']
};