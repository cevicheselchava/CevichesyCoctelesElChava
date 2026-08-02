(()=>{
const GROUPS={
  mariscos:'Mariscos',
  verduras:'Verduras y frescos',
  salsas:'Salsas y líquidos',
  desechables:'Desechables y complementos',
  refrescos:'Refrescos'
};

Object.assign(ITEMS,{
  fish:{...ITEMS.fish,group:'mariscos'},
  shrimp:{...ITEMS.shrimp,group:'mariscos'},
  octopus:{...ITEMS.octopus,group:'mariscos'},
  tomato:{...ITEMS.tomato,group:'verduras'},
  onion:{...ITEMS.onion,group:'verduras'},
  cucumber:{...ITEMS.cucumber,group:'verduras'},
  cilantro:{...ITEMS.cilantro,group:'verduras'},
  lime:{...ITEMS.lime,group:'verduras'},
  lemonJuice:{...ITEMS.lemonJuice,group:'salsas'},
  clamato:{...ITEMS.clamato,group:'salsas'},
  tostadas:{...ITEMS.tostadas,group:'desechables'},
  containers:{...ITEMS.containers,name:'Envases genéricos de pedidos anteriores',group:'desechables',legacy:true},
  container12:{name:'Contenedor para ceviche 12 oz (½ libra)',unit:'pzas',low:8,group:'desechables'},
  lid12:{name:'Tapa para contenedor de 12 oz',unit:'pzas',low:8,group:'desechables'},
  container16:{name:'Contenedor para ceviche 16 oz (1 libra)',unit:'pzas',low:8,group:'desechables'},
  lid16:{name:'Tapa para contenedor de 16 oz',unit:'pzas',low:8,group:'desechables'},
  spoon:{name:'Cucharas',unit:'pzas',low:12,group:'desechables'},
  napkins:{name:'Servilletas',unit:'pzas',low:24,group:'desechables'},
  saltPacket:{name:'Sobres de sal',unit:'sobres',low:12,group:'desechables'},
  habaneroSauce:{name:'Salsas habaneras individuales',unit:'sobres',low:24,group:'desechables'},
  coca:{...ITEMS.coca,group:'refrescos'},
  cokezero:{...ITEMS.cokezero,group:'refrescos'},
  sprite:{...ITEMS.sprite,group:'refrescos'},
  drpepper:{...ITEMS.drpepper,group:'refrescos'},
  bigred:{...ITEMS.bigred,group:'refrescos'},
  fanta:{...ITEMS.fanta,group:'refrescos'}
});

Object.keys(ITEMS).forEach(k=>{
  if(!(k in inventory))inventory[k]=0;
});

const style=document.createElement('style');
style.textContent='.inventory-group{display:grid;gap:8px}.inventory-group+.inventory-group{margin-top:15px}.group-title{margin:0;padding:9px 11px;border-radius:10px;background:#e9eef5;color:var(--navy);font-size:16px;font-weight:1000}.inv.unused .qty{color:var(--muted)}';
document.head.appendChild(style);

const productSelect=document.getElementById('purchaseItem');
const productLabel=productSelect.closest('label');
const groupLabel=document.createElement('label');
groupLabel.innerHTML='Grupo<select id="purchaseGroup"></select>';
productLabel.parentNode.insertBefore(groupLabel,productLabel);
const groupSelect=document.getElementById('purchaseGroup');
groupSelect.innerHTML=Object.entries(GROUPS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');

function fillProducts(){
  const group=groupSelect.value;
  productSelect.innerHTML=Object.entries(ITEMS)
    .filter(([,x])=>x.group===group&&!x.legacy)
    .map(([k,x])=>`<option value="${k}">${x.name}</option>`).join('');
  syncUnit();
}
groupSelect.addEventListener('change',fillProducts);
fillProducts();

const activationKey='inventarioProductosCargados';
let activated={};
try{activated=JSON.parse(localStorage.getItem(activationKey)||'{}')||{}}catch(e){activated={}}
registerPurchase.addEventListener('click',()=>{
  const k=productSelect.value;
  if(k&&Number(purchaseQty.value)>0){
    activated[k]=true;
    localStorage.setItem(activationKey,JSON.stringify(activated));
  }
},true);

function initialized(k,total,res){
  return Boolean(activated[k])||Number(total)>0||Number(res)>0;
}

renderInventory=function(){
  const r=reserved();
  inventoryList.innerHTML=Object.entries(GROUPS).map(([group,label])=>{
    const rows=Object.entries(ITEMS)
      .filter(([k,x])=>{
        if(x.group!==group)return false;
        if(!x.legacy)return true;
        return Number(inventory[k]||0)>0||Number(r[k]||0)>0;
      })
      .map(([k,x])=>{
        const total=round(inventory[k]||0);
        const res=round(r[k]||0);
        const avail=round(total-res);
        const used=initialized(k,total,res);
        const low=used&&avail<=x.low;
        const status=!used?'Sin carga inicial':low?'⚠️ Se está terminando':'Disponible';
        return `<div class="inv ${low?'low':''} ${!used?'unused':''}"><div><strong>${x.name}</strong><small>${status}${res?`<br><span class="reserved">Apartado: ${res} ${x.unit}</span>`:''}</small></div><div class="qty">${avail} ${x.unit}<small>Total: ${total}</small></div></div>`;
      }).join('');
    return rows?`<section class="inventory-group"><h3 class="group-title">${label}</h3>${rows}</section>`:'';
  }).join('');
};

renderStats=function(){
  const sales=movements.filter(m=>m.type==='sale'&&m.day===today());
  statSales.textContent=money(sales.reduce((a,m)=>a+Number(m.total||0),0));
  statProfit.textContent=money(sales.reduce((a,m)=>a+Number(m.profit||0),0));
  statPending.textContent=orders.filter(o=>['nuevo','confirmado'].includes(o.status)).length;
  const r=reserved();
  statLow.textContent=Object.entries(ITEMS).filter(([k,x])=>{
    if(x.legacy)return false;
    const total=round(inventory[k]||0);
    const res=round(r[k]||0);
    return initialized(k,total,res)&&round(total-res)<=x.low;
  }).length;
};

renderAll();
})();