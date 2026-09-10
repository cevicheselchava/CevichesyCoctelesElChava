import { InventoryStore } from './data.js';

const normalize = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'')
  .trim()
  .toLowerCase();

const desired = {
  name:'Tostadas El Gallo de Oro',
  brand:'El Gallo de Oro',
  category:'Desechables',
  unit:'paquete',
  purchaseUnit:'caja',
  contentQty:6,
  contentUnit:'paquete',
  purchasePrice:2.59,
  packagesPerBox:6,
  tostadasPerPackage:4,
  piecesPerBox:24,
  netWeightOz:8.46,
  netWeightG:240,
  taxIncluded:false
};

const existing = InventoryStore.list().find(item => normalize(item.name).includes('tostada'));

if (existing) {
  InventoryStore.update(existing.id,{ ...desired, qty:Number(existing.qty || 0), minimum:Number(existing.minimum || 0) });
} else {
  InventoryStore.create({ ...desired, qty:0, minimum:0 });
}
