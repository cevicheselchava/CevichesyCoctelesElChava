import { InventoryStore } from './data.js';
import { db } from './firebase-sync.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const KEY='panel-next-legacy-disposables-v2';
const rows={
  containerHalf:{name:'Contenedor ceviche ½ lb',unit:'pieza',purchaseUnit:'paquete',contentQty:25,contentUnit:'pieza',category:'Empaques',legacyPricePerPiece:true},
  containerLb:{name:'Contenedor ceviche 1 lb',unit:'pieza',purchaseUnit:'paquete',contentQty:25,contentUnit:'pieza',category:'Empaques',legacyPricePerPiece:true},
  lidCeviche:{name:'Tapa ceviche · ½ lb / 1 lb',unit:'pieza',purchaseUnit:'paquete',contentQty:25,contentUnit:'pieza',category:'Empaques',legacyPricePerPiece:true},
  container12:{name:'Contenedor cóctel 12 oz',unit:'pieza',purchaseUnit:'paquete',contentQty:25,contentUnit:'pieza',category:'Empaques',legacyPricePerPiece:true},
  lid12:{name:'Tapa cóctel 12 oz',unit:'pieza',purchaseUnit:'paquete',contentQty:25,contentUnit:'pieza',category:'Empaques',legacyPricePerPiece:true},
  spoon:{name:'Cuchara',unit:'pieza',purchaseUnit:'paquete',contentQty:100,contentUnit:'pieza',category:'Desechables'},
  napkins:{name:'Servilletas',unit:'pieza',purchaseUnit:'paquete',contentQty:120,contentUnit:'pieza',category:'Desechables'},
  tostada:{name:'Tostadas',unit:'pieza',purchaseUnit:'paquete',contentQty:22,contentUnit:'pieza',category:'Desechables'},
  coca:{name:'Coca-Cola',unit:'pieza',purchaseUnit:'pieza',contentQty:1,contentUnit:'pieza',category:'Bebidas'},
  cokezero:{name:'Coke Zero',unit:'pieza',purchaseUnit:'pieza',contentQty:1,contentUnit:'pieza',category:'Bebidas'},
  sprite:{name:'Sprite',unit:'pieza',purchaseUnit:'pieza',contentQty:1,contentUnit:'pieza',category:'Bebidas'},
  drpepper:{name:'Dr Pepper',unit:'pieza',purchaseUnit:'pieza',contentQty:1,contentUnit:'pieza',category:'Bebidas'},
  bigred:{name:'Big Red',unit:'pieza',purchaseUnit:'pieza',contentQty:1,contentUnit:'pieza',category:'Bebidas'},
  fanta:{name:'Fanta',unit:'pieza',purchaseUnit:'pieza',contentQty:1,contentUnit:'pieza',category:'Bebidas'},
  manzanita:{name:'Manzanita',unit:'pieza',purchaseUnit:'pieza',contentQty:1,contentUnit:'pieza',category:'Bebidas'}
};

const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
function find(name){const k=norm(name);return InventoryStore.list().find(x=>norm(x.name)===k)||null;}
function upsert(meta,legacyPrice){
  let item=find(meta.name);
  if(!item)item=InventoryStore.create({qty:0,minimum:0,purchasePrice:0,...meta});
  const purchasePrice=meta.legacyPricePerPiece?Number(legacyPrice||0)*Number(meta.contentQty||1):Number(legacyPrice||0);
  const cleanMeta={...meta};
  delete cleanMeta.legacyPricePerPiece;
  InventoryStore.update(item.id,{...cleanMeta,purchasePrice});
}

async function run(){
  if(localStorage.getItem(KEY)==='done')return;
  try{
    const snap=await getDoc(doc(db,'inventario','principal'));
    const prices=snap.exists()?(snap.data()?.purchasePrices||{}):{};
    Object.entries(rows).forEach(([legacyKey,meta])=>{
      const price=Number(prices[legacyKey]||0);
      if(price>0)upsert(meta,price);
    });
    localStorage.setItem(KEY,'done');
    window.dispatchEvent(new CustomEvent('panel:inventory-changed',{detail:{source:'legacy-disposables'}}));
  }catch(error){console.warn('No se pudieron migrar costos de desechables:',error);}
}

setTimeout(run,500);
