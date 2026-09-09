import { InventoryStore } from './data.js';
import { db } from './firebase-sync.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const KEY='panel-next-legacy-disposables-v3';
const INVENTORY_KEY='panel-next-inventory-v2';

const rows={
  containerHalf:{name:'Contenedor ceviche ½ lb',unit:'pieza',purchaseUnit:'paquete',contentQty:25,contentUnit:'pieza',category:'Empaques',legacyPricePerPiece:true},
  containerLb:{name:'Contenedor ceviche 1 lb',unit:'pieza',purchaseUnit:'paquete',contentQty:25,contentUnit:'pieza',category:'Empaques',legacyPricePerPiece:true},
  lidCeviche:{name:'Tapa ceviche · ½ lb / 1 lb',unit:'pieza',purchaseUnit:'paquete',contentQty:25,contentUnit:'pieza',category:'Empaques',legacyPricePerPiece:true},
  container12:{name:'Contenedor cóctel 12 oz',unit:'pieza',purchaseUnit:'paquete',contentQty:25,contentUnit:'pieza',category:'Empaques',legacyPricePerPiece:true},
  lid12:{name:'Tapa cóctel 12 oz',unit:'pieza',purchaseUnit:'paquete',contentQty:25,contentUnit:'pieza',category:'Empaques',legacyPricePerPiece:true},
  spoon:{name:'Cuchara',unit:'pieza',purchaseUnit:'paquete',contentQty:100,contentUnit:'pieza',category:'Desechables'},
  napkins:{name:'Servilletas',unit:'pieza',purchaseUnit:'paquete',contentQty:120,contentUnit:'pieza',category:'Desechables'},
  tostada:{name:'Tostadas',unit:'pieza',purchaseUnit:'paquete',contentQty:22,contentUnit:'pieza',category:'Desechables'}
};

const genericDrinks=[
  {
    name:'Refresco de cola',
    aliases:['Coca-Cola','Coke Zero','Pepsi','Cola'],
    legacyKeys:['coca','cokezero'],
    purchasePrice:4.84
  },
  {
    name:'Refresco de manzanita',
    aliases:['Manzanita'],
    legacyKeys:['manzanita'],
    purchasePrice:null
  },
  {
    name:'Refresco de lima',
    aliases:['Sprite','Twist Up','TwistUp','Lima-limón'],
    legacyKeys:['sprite'],
    purchasePrice:4.84
  }
];

const obsoleteZeroStock=['Dr Pepper','Big Red','Fanta'];

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

function packPriceFromItem(item){
  if(!item)return 0;
  const price=Number(item.purchasePrice||0);
  if(!(price>0))return 0;
  const qty=Number(item.contentQty||1);
  if((item.purchaseUnit==='paquete'||item.purchaseUnit==='caja')&&qty===12)return price;
  if((item.purchaseUnit==='pieza'||item.purchaseUnit==='unidad')&&qty===1)return price*12;
  return price;
}

function removeIds(ids){
  if(!ids.size)return;
  try{
    const raw=JSON.parse(localStorage.getItem(INVENTORY_KEY)||'[]');
    if(!Array.isArray(raw))return;
    const filtered=raw.filter(item=>!ids.has(item.id));
    if(filtered.length!==raw.length)localStorage.setItem(INVENTORY_KEY,JSON.stringify(filtered));
  }catch(_){}
}

function migrateGenericDrinks(prices={}){
  genericDrinks.forEach(config=>{
    const current=InventoryStore.list();
    let target=current.find(item=>norm(item.name)===norm(config.name))||null;
    const aliases=current.filter(item=>config.aliases.some(alias=>norm(alias)===norm(item.name)));
    const aliasQty=aliases.reduce((sum,item)=>sum+Number(item.qty||0),0);
    const targetQty=Number(target?.qty||0);

    let purchasePrice=Number(config.purchasePrice||0);
    if(!(purchasePrice>0))purchasePrice=packPriceFromItem(target);
    if(!(purchasePrice>0)){
      for(const item of aliases){
        purchasePrice=packPriceFromItem(item);
        if(purchasePrice>0)break;
      }
    }
    if(!(purchasePrice>0)){
      for(const key of config.legacyKeys){
        const legacy=Number(prices[key]||0);
        if(legacy>0){ purchasePrice=legacy*12; break; }
      }
    }

    if(!target){
      target=InventoryStore.create({
        name:config.name,
        category:'Bebidas',
        qty:0,
        minimum:0,
        unit:'pieza',
        purchaseUnit:'paquete',
        contentQty:12,
        contentUnit:'pieza',
        purchasePrice:purchasePrice||0
      });
    }

    InventoryStore.update(target.id,{
      name:config.name,
      category:'Bebidas',
      qty:targetQty+aliasQty,
      unit:'pieza',
      purchaseUnit:'paquete',
      contentQty:12,
      contentUnit:'pieza',
      purchasePrice:purchasePrice||Number(target.purchasePrice||0)
    });

    const remove=new Set(aliases.filter(item=>item.id!==target.id).map(item=>item.id));
    removeIds(remove);
  });

  const removable=new Set(
    InventoryStore.list()
      .filter(item=>obsoleteZeroStock.some(name=>norm(name)===norm(item.name))&&Number(item.qty||0)<=0)
      .map(item=>item.id)
  );
  removeIds(removable);
}

async function run(){
  if(localStorage.getItem(KEY)==='done')return;
  let prices={};
  try{
    const snap=await getDoc(doc(db,'inventario','principal'));
    prices=snap.exists()?(snap.data()?.purchasePrices||{}):{};
  }catch(error){
    console.warn('No se pudieron leer precios anteriores:',error);
  }

  Object.entries(rows).forEach(([legacyKey,meta])=>{
    const price=Number(prices[legacyKey]||0);
    if(price>0)upsert(meta,price);
  });

  migrateGenericDrinks(prices);
  localStorage.setItem(KEY,'done');
  window.dispatchEvent(new CustomEvent('panel:inventory-changed',{detail:{source:'legacy-disposables-v3'}}));
}

setTimeout(run,500);
