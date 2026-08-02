(()=>{
const GROUPS={
  mariscos:'Mariscos',
  verduras:'Verduras y frescos',
  salsas:'Salsas y líquidos',
  desechables:'Desechables y complementos',
  refrescos:'Refrescos'
};

Object.assign(ITEMS,{
  fish:{...ITEMS.fish,group:'mariscos',purchaseUnit:'lb',purchaseFactor:1},
  shrimp:{...ITEMS.shrimp,group:'mariscos',purchaseUnit:'lb',purchaseFactor:1},
  octopus:{...ITEMS.octopus,group:'mariscos',purchaseUnit:'lb',purchaseFactor:1},
  tomato:{...ITEMS.tomato,group:'verduras',purchaseUnit:'lb',purchaseFactor:16},
  onion:{...ITEMS.onion,group:'verduras',purchaseUnit:'lb',purchaseFactor:16},
  cucumber:{...ITEMS.cucumber,group:'verduras',purchaseUnit:'lb',purchaseFactor:16},
  cilantro:{...ITEMS.cilantro,group:'verduras',purchaseUnit:'manojo',purchaseFactor:2},
  lime:{...ITEMS.lime,group:'verduras',purchaseUnit:'pzas',purchaseFactor:1},
  lemonJuice:{...ITEMS.lemonJuice,group:'salsas',purchaseUnit:'fl oz',purchaseFactor:1},
  clamato:{...ITEMS.clamato,group:'salsas',purchaseUnit:'fl oz',purchaseFactor:1},
  tostadas:{...ITEMS.tostadas,group:'desechables',purchaseUnit:'pzas',purchaseFactor:1},
  containers:{...ITEMS.containers,name:'Envases genéricos de pedidos anteriores',group:'desechables',legacy:true,purchaseUnit:'pzas',purchaseFactor:1},
  container12:{name:'Contenedor para ceviche 12 oz (½ libra)',unit:'pzas',low:8,group:'desechables',purchaseUnit:'pzas',purchaseFactor:1},
  lid12:{name:'Tapa para contenedor de 12 oz',unit:'pzas',low:8,group:'desechables',purchaseUnit:'pzas',purchaseFactor:1},
  container16:{name:'Contenedor para ceviche 16 oz (1 libra)',unit:'pzas',low:8,group:'desechables',purchaseUnit:'pzas',purchaseFactor:1},
  lid16:{name:'Tapa para contenedor de 16 oz',unit:'pzas',low:8,group:'desechables',purchaseUnit:'pzas',purchaseFactor:1},
  spoon:{name:'Cucharas',unit:'pzas',low:12,group:'desechables',purchaseUnit:'pzas',purchaseFactor:1},
  napkins:{name:'Servilletas',unit:'pzas',low:24,group:'desechables',purchaseUnit:'pzas',purchaseFactor:1},
  saltPacket:{name:'Sobres de sal',unit:'sobres',low:12,group:'desechables',purchaseUnit:'sobres',purchaseFactor:1},
  habaneroSauce:{name:'Salsas habaneras individuales',unit:'sobres',low:24,group:'desechables',purchaseUnit:'sobres',purchaseFactor:1},
  coca:{...ITEMS.coca,group:'refrescos',purchaseUnit:'latas',purchaseFactor:1},
  cokezero:{...ITEMS.cokezero,group:'refrescos',purchaseUnit:'latas',purchaseFactor:1},
  sprite:{...ITEMS.sprite,group:'refrescos',purchaseUnit:'latas',purchaseFactor:1},
  drpepper:{...ITEMS.drpepper,group:'refrescos',purchaseUnit:'latas',purchaseFactor:1},
  bigred:{...ITEMS.bigred,group:'refrescos',purchaseUnit:'latas',purchaseFactor:1},
  fanta:{...ITEMS.fanta,group:'refrescos',purchaseUnit:'latas',purchaseFactor:1}
});

Object.keys(ITEMS).forEach(k=>{
  if(!(k in inventory))inventory[k]=0;
});

const style=document.createElement('style');
style.textContent=`
.inventory-group{display:grid;gap:8px}.inventory-group+.inventory-group{margin-top:15px}
.group-title{margin:0;padding:9px 11px;border-radius:10px;background:#e9eef5;color:var(--navy);font-size:16px;font-weight:1000}
.inv.unused .qty{color:var(--muted)}
.purchase-groups{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
.purchase-group{border:0;border-radius:11px;padding:11px 7px;background:#e9eef5;color:var(--navy);font-weight:1000;font-size:14px}
.purchase-group.active{background:var(--navy);color:#fff}
@media(min-width:760px){.purchase-groups{grid-template-columns:repeat(5,minmax(0,1fr))}}
`;
document.head.appendChild(style);

const productSelect=document.getElementById('purchaseItem');
const productLabel=productSelect.closest('label');
const groupBox=document.createElement('div');
groupBox.className='purchase-groups';
groupBox.setAttribute('aria-label','Grupos de productos');
productLabel.parentNode.insertBefore(groupBox,productLabel);
let activeGroup='mariscos';

function syncPurchaseUnit(){
  const item=ITEMS[productSelect.value];
  purchaseUnit.value=item?.purchaseUnit||item?.unit||'';
}

function fillProducts(){
  productSelect.innerHTML=Object.entries(ITEMS)
    .filter(([,x])=>x.group===activeGroup&&!x.legacy)
    .map(([k,x])=>`<option value="${k}">${x.name}</option>`).join('');
  syncPurchaseUnit();
}

function renderGroupButtons(){
  groupBox.innerHTML=Object.entries(GROUPS).map(([k,v])=>`<button type="button" class="purchase-group ${k===activeGroup?'active':''}" data-group="${k}">${v}</button>`).join('');
  groupBox.querySelectorAll('.purchase-group').forEach(btn=>btn.addEventListener('click',()=>{
    activeGroup=btn.dataset.group;
    renderGroupButtons();
    fillProducts();
  }));
}

productSelect.addEventListener('change',syncPurchaseUnit);
renderGroupButtons();
fillProducts();

const activationKey='inventarioProductosCargados';
let activated={};
try{activated=JSON.parse(localStorage.getItem(activationKey)||'{}')||{}}catch(e){activated={}}

const oldButton=document.getElementById('registerPurchase');
const purchaseButton=oldButton.cloneNode(true);
oldButton.replaceWith(purchaseButton);

purchaseButton.addEventListener('click',async()=>{
  const k=productSelect.value;
  const item=ITEMS[k];
  const qty=Number(purchaseQty.value);
  const factor=Number(item?.purchaseFactor||1);
  const internalQty=round(qty*factor);
  const cost=Number(purchaseCost.value||0);
  const store=purchaseStore.value.trim()||'Sin tienda';
  if(!k||!qty||qty<=0)return alert('Escribe una cantidad válida.');
  purchaseButton.disabled=true;
  try{
    await db.runTransaction(async tx=>{
      const snap=await tx.get(inventoryRef);
      const current={...EMPTY,...(snap.exists?(snap.data().items||{}):{})};
      const moveRef=db.collection('movimientos').doc();
      current[k]=round(Number(current[k]||0)+internalQty);
      tx.set(inventoryRef,{items:current,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
      tx.set(moveRef,{type:'purchase',date:firebase.firestore.FieldValue.serverTimestamp(),day:today(),name:item.name,qty,unit:item.purchaseUnit||item.unit,cost,store});
    });
    activated[k]=true;
    localStorage.setItem(activationKey,JSON.stringify(activated));
    purchaseCost.value='';
    purchaseStore.value='';
    toast('Compra agregada al inventario');
  }catch(e){
    showError(e);
    alert('No se pudo guardar la compra.');
  }finally{
    purchaseButton.disabled=false;
  }
});

function initialized(k,total,res){
  return Boolean(activated[k])||Number(total)>0||Number(res)>0;
}

function displayQty(k,value){
  const item=ITEMS[k];
  const factor=Number(item?.purchaseFactor||1);
  const unit=item?.purchaseUnit||item?.unit||'';
  const amount=factor>1?round(Number(value||0)/factor):round(value||0);
  return `${amount} ${unit}`;
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
        return `<div class="inv ${low?'low':''} ${!used?'unused':''}"><div><strong>${x.name}</strong><small>${status}${res?`<br><span class="reserved">Apartado: ${displayQty(k,res)}</span>`:''}</small></div><div class="qty">${displayQty(k,avail)}<small>Total: ${displayQty(k,total)}</small></div></div>`;
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