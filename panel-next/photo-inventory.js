import { InventoryStore } from './data.js';

const key = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'')
  .trim()
  .toLowerCase();

function ensureItem(meta) {
  const current = InventoryStore.list().find(item => key(item.name) === key(meta.name));
  if (current) return current;
  return InventoryStore.create({
    qty:0,
    minimum:0,
    purchasePrice:0,
    ...meta
  });
}

// Productos que Chava mostró físicamente en las fotos del inventario.
// No se inventan existencias ni precios cuando la foto no permite saber cuánto queda.
[
  {
    name:'Salsa negra',
    category:'Salsas y condimentos',
    unit:'ml',
    purchaseUnit:'botella',
    contentQty:190,
    contentUnit:'ml'
  },
  {
    name:'Salsa picante',
    category:'Salsas y condimentos',
    unit:'ml',
    purchaseUnit:'botella',
    contentQty:1000,
    contentUnit:'ml'
  },
  {
    name:'Sal de mar',
    category:'Salsas y condimentos',
    unit:'bote',
    purchaseUnit:'bote',
    contentQty:1,
    contentUnit:'bote'
  },
  {
    name:'Bolsas para salsa 10x20',
    category:'Desechables',
    unit:'paquete',
    purchaseUnit:'paquete',
    contentQty:1,
    contentUnit:'paquete'
  },
  {
    name:'Contenedor 1/4 L',
    category:'Empaques',
    unit:'pieza',
    purchaseUnit:'paquete',
    contentQty:25,
    contentUnit:'pieza'
  },
  {
    name:'Contenedor 16 oz con tapa',
    category:'Empaques',
    unit:'pieza',
    purchaseUnit:'caja',
    contentQty:20,
    contentUnit:'pieza'
  }
].forEach(ensureItem);

// Estos ya existían en el catálogo y por eso no se duplican:
// Jugo de limón, Clamato, Cilantro y Tostadas.
