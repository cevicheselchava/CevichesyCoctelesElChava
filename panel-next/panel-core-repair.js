(()=>{
  const KEY='chava-panel-v3';
  const q=s=>document.querySelector(s);
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}};
  const write=db=>{db.updatedAt=Date.now();localStorage.setItem(KEY,JSON.stringify(db));window.location.reload()};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const id=()=>crypto.randomUUID();
  const today=()=>new Date().toLocaleDateString('en-CA');
  const time=()=>new Date().toTimeString().slice(0,5);
  const units=['oz','lb','fl oz','ml','g','kg','pza','bolsa','paquete','botella','manojo','charola','caja','otro'];

  function close(){q('#repairModal')?.remove()}
  function modal(title,body,onSave){
    close();
    const m=document.createElement('div');m.id='repairModal';m.className='modal';
    m.innerHTML=`<form id="repairForm" class="sheet"><div class="bar modal-bar"><h2>${esc(title)}</h2><button class="icon" type="button" data-repair-close>×</button></div><div class="fields">${body}</div><button class="save" type="submit">Guardar</button></form>`;
    document.body.appendChild(m);
    m.addEventListener('click',e=>{if(e.target===m||e.target.closest('[data-repair-close]'))close()});
    q('#repairForm').addEventListener('submit',e=>{e.preventDefault();onSave(new FormData(e.currentTarget))});
  }
  const inp=(n,l,v='',type='text',x='')=>`<label>${l}<input name="${n}" type="${type}" value="${esc(v)}" ${x}></label>`;
  const sel=(n,l,opts,v='')=>`<label>${l}<select name="${n}">${opts.map(([a,b])=>`<option value="${esc(a)}" ${String(a)===String(v)?'selected':''}>${esc(b)}</option>`).join('')}</select></label>`;

  function order(){
    const db=read(),recipes=Array.isArray(db.recipes)?db.recipes:[];
    if(!recipes.length){alert('Primero registra una receta/producto.');return}
    modal('Nuevo pedido',
      inp('customer','Cliente','','text','required')+
      sel('recipeId','Producto',recipes.map(r=>[r.id,r.name]),recipes[0]?.id||'')+
      inp('pounds','Libras','1','number','min="0.25" step="0.25" required')+
      inp('total','Total $','','number','min="0" step="0.01"')+
      inp('date','Fecha de entrega',today(),'date','required')+
      inp('time','Hora',time(),'time','required')+
      inp('address','Dirección'),fd=>{
        const db=read();db.orders=Array.isArray(db.orders)?db.orders:[];
        const p=Number(fd.get('pounds')||0);if(p<=0)return;
        db.orders.push({id:id(),customer:String(fd.get('customer')||'').trim(),recipeId:String(fd.get('recipeId')||''),product:'',pounds:p,qty:p,total:Number(fd.get('total')||0),date:String(fd.get('date')||''),time:String(fd.get('time')||''),address:String(fd.get('address')||'').trim(),status:'pending',inventoryApplied:false});
        close();write(db);
      });
  }

  function inventory(){
    modal('Nuevo ingrediente',
      inp('name','Ingrediente','','text','required')+
      sel('unit','Unidad',units.map(u=>[u,u]),'oz')+
      inp('stock','Existencia actual','0','number','min="0" step="0.001" required')+
      inp('minimum','Mínimo','0','number','min="0" step="0.001"'),fd=>{
        const db=read();db.inventory=Array.isArray(db.inventory)?db.inventory:[];
        db.inventory.push({id:id(),name:String(fd.get('name')||'').trim(),unit:String(fd.get('unit')||'otro'),stock:Number(fd.get('stock')||0),minimum:Number(fd.get('minimum')||0),costPerUnit:0,appKey:'',category:''});
        close();write(db);
      });
  }

  function convert(qty,from,to){
    from=String(from).toLowerCase();to=String(to).toLowerCase();qty=Number(qty||0);
    if(from===to)return qty;
    if(from==='lb'&&to==='oz')return qty*16;
    if(from==='oz'&&to==='lb')return qty/16;
    if(from==='kg'&&to==='g')return qty*1000;
    if(from==='g'&&to==='kg')return qty/1000;
    return qty;
  }
  function purchase(){
    const db=read(),inv=Array.isArray(db.inventory)?db.inventory:[];
    if(!inv.length){alert('Primero registra inventario.');return}
    modal('Registrar compra',
      sel('inventoryId','Producto',inv.map(x=>[x.id,`${x.name} (${x.unit})`]),inv[0]?.id||'')+
      inp('packCount','Cantidad de paquetes','1','number','min="0.001" step="0.001" required')+
      inp('packContent','Contenido por paquete','1','number','min="0.001" step="0.001" required')+
      sel('purchasedUnit','Unidad comprada',units.map(u=>[u,u]),inv[0]?.unit||'oz')+
      inp('total','Costo total $','','number','min="0" step="0.01" required')+
      inp('date','Fecha',today(),'date','required'),fd=>{
        const db=read();db.inventory=Array.isArray(db.inventory)?db.inventory:[];db.purchases=Array.isArray(db.purchases)?db.purchases:[];
        const row=db.inventory.find(x=>x.id===fd.get('inventoryId'));if(!row)return;
        const packs=Number(fd.get('packCount')||0),content=Number(fd.get('packContent')||0),u=String(fd.get('purchasedUnit')||row.unit),total=Number(fd.get('total')||0);
        const bought=packs*content,base=convert(bought,u,row.unit);if(base<=0)return;
        row.stock=Number(row.stock||0)+base;if(total>0)row.costPerUnit=total/base;
        db.purchases.push({id:id(),inventoryId:row.id,qty:base,total,date:String(fd.get('date')||''),unit:row.unit,packCount:packs,packContent:content,purchasedQty:bought,purchasedUnit:u});
        close();write(db);
      });
  }

  document.addEventListener('click',e=>{
    const b=e.target.closest('#primaryBtn');if(!b)return;
    const title=q('#screenTitle')?.textContent.trim();
    if(title==='Pedidos'){e.preventDefault();e.stopImmediatePropagation();order()}
    else if(title==='Inventario'){e.preventDefault();e.stopImmediatePropagation();inventory()}
    else if(title==='Compras'){e.preventDefault();e.stopImmediatePropagation();purchase()}
  },true);
})();