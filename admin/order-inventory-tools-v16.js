(()=>{
  if(window.__EL_CUBANO_ORDER_INVENTORY_TOOLS_V16__)return;
  window.__EL_CUBANO_ORDER_INVENTORY_TOOLS_V16__=true;

  const doc=document;
  const round3=n=>Math.round((Number(n)+Number.EPSILON)*1000)/1000;
  const money=n=>'$'+Number(n||0).toFixed(2);
  const PROTEIN_LB=125/453.59237;
  const COMMON_PER_LB={tomato:1.6,cucumber:1/6,onion:.8,cilantro:.2,lemonJuice:2.4,clamato:1.4,avocado:.25};

  function waitReady(){
    if(typeof db==='undefined'||typeof inventoryRef==='undefined'||typeof ITEMS==='undefined'||typeof renderInventory!=='function'||typeof renderOrders!=='function'){
      setTimeout(waitReady,120);
      return;
    }
    install();
  }

  function install(){
    if(doc.getElementById('orderInventoryToolsV16Style'))return;

    const style=doc.createElement('style');
    style.id='orderInventoryToolsV16Style';
    style.textContent=`
      .stock-topup{margin-top:8px;border:0;border-radius:10px;padding:8px 10px;background:#e8f5eb;color:#176b2c;font-weight:1000;font-size:13px}
      .manual-tools-v16{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px}
      .manual-tools-v16 button{border:0;border-radius:10px;padding:10px;font-weight:1000}
      .manual-edit-v16{background:#fff0bf;color:#775200}.manual-delete-v16{background:#ffe5e6;color:#a30f16}
      .tools-modal-v16{position:fixed;inset:0;z-index:100090;background:rgba(9,21,36,.52);display:grid;place-items:end center;padding:14px}
      .tools-modal-v16[hidden]{display:none}
      .tools-sheet-v16{width:min(100%,650px);max-height:92vh;overflow:auto;background:#fffdf8;border-radius:24px 24px 16px 16px;padding:17px;box-shadow:0 18px 55px rgba(0,0,0,.3)}
      .tools-sheet-v16 h2{margin:0 0 5px;color:#06254d}.tools-sheet-v16 p{margin:0 0 12px;color:#687386;font-weight:800}
      .tools-grid-v16{display:grid;grid-template-columns:1fr 1fr;gap:9px}.tools-grid-v16 .full{grid-column:1/-1}
      .tools-check-v16{display:flex!important;flex-direction:row!important;align-items:center;gap:9px;border:1px solid #d6cfbf;border-radius:11px;padding:11px;background:#fff}
      .tools-check-v16 input{width:20px;height:20px;margin:0;flex:0 0 auto}
      .tools-summary-v16{margin:11px 0;padding:11px;border-radius:12px;background:#eef5ff;border:1px solid #b9cce8;color:#06254d;font-weight:900;line-height:1.45}
      .tools-actions-v16{display:grid;grid-template-columns:1fr 1.4fr;gap:8px;margin-top:12px}.tools-actions-v16 button{border:0;border-radius:12px;padding:13px;font-weight:1000}
      .tools-cancel-v16{background:#e9edf3;color:#06254d}.tools-save-v16{background:#218b39;color:#fff}
      @media(max-width:560px){.tools-modal-v16{padding:0}.tools-sheet-v16{border-radius:24px 24px 0 0}.tools-grid-v16{grid-template-columns:1fr}.tools-grid-v16 .full{grid-column:1}}
    `;
    doc.head.appendChild(style);

    buildStockModal();
    buildEditModal();

    const baseRenderInventory=renderInventory;
    renderInventory=function(...args){
      const out=baseRenderInventory.apply(this,args);
      setTimeout(decorateInventory,0);
      return out;
    };

    const baseRenderOrders=renderOrders;
    renderOrders=function(...args){
      const out=baseRenderOrders.apply(this,args);
      setTimeout(decorateOrders,0);
      return out;
    };

    const invRoot=doc.getElementById('inventoryList');
    if(invRoot)new MutationObserver(()=>decorateInventory()).observe(invRoot,{childList:true,subtree:true});
    const orderRoot=doc.getElementById('orderList');
    if(orderRoot)new MutationObserver(()=>decorateOrders()).observe(orderRoot,{childList:true,subtree:true});

    decorateInventory();
    decorateOrders();
  }

  function buildStockModal(){
    if(doc.getElementById('stockTopupModalV16'))return;
    const modal=doc.createElement('div');
    modal.id='stockTopupModalV16';
    modal.className='tools-modal-v16';
    modal.hidden=true;
    modal.innerHTML=`<section class="tools-sheet-v16"><h2 id="stockTopupTitleV16">Sumar compra</h2><p id="stockTopupCurrentV16"></p><div class="tools-grid-v16"><label>Cantidad comprada<input id="stockTopupQtyV16" type="number" min="0.01" step="0.01" value="1"></label><label>Unidad<input id="stockTopupUnitV16" readonly></label><label class="full">Costo total<input id="stockTopupCostV16" type="number" min="0" step="0.01" placeholder="$0.00"></label><label class="full">Tienda<input id="stockTopupStoreV16" placeholder="H-E-B, Walmart, Sam's..."></label></div><div class="tools-actions-v16"><button class="tools-cancel-v16" id="stockTopupCancelV16">Cancelar</button><button class="tools-save-v16" id="stockTopupSaveV16">Sumar al inventario</button></div></section>`;
    doc.body.appendChild(modal);
    modal.dataset.key='';
    doc.getElementById('stockTopupCancelV16').onclick=()=>modal.hidden=true;
    modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true;});
    doc.getElementById('stockTopupSaveV16').onclick=saveStockTopup;
  }

  function openStockTopup(key){
    const item=ITEMS[key];
    if(!item)return;
    const modal=doc.getElementById('stockTopupModalV16');
    modal.dataset.key=key;
    doc.getElementById('stockTopupTitleV16').textContent=`➕ ${item.name}`;
    let current='';
    try{current=typeof displayQty==='function'?displayQty(key,Number(inventory[key]||0)):`${Number(inventory[key]||0)} ${item.unit||''}`;}catch(_){current='';}
    doc.getElementById('stockTopupCurrentV16').textContent=`Actualmente tienes ${current}. Esta compra se SUMA; no reemplaza lo que ya hay.`;
    doc.getElementById('stockTopupQtyV16').value='1';
    doc.getElementById('stockTopupUnitV16').value=item.purchaseUnit||item.unit||'unidad';
    doc.getElementById('stockTopupCostV16').value='';
    modal.hidden=false;
  }

  async function saveStockTopup(){
    const modal=doc.getElementById('stockTopupModalV16');
    const key=modal.dataset.key;
    const item=ITEMS[key];
    if(!item)return;
    const qty=Number(doc.getElementById('stockTopupQtyV16').value||0);
    const cost=Number(doc.getElementById('stockTopupCostV16').value||0);
    const store=doc.getElementById('stockTopupStoreV16').value.trim()||'Sin tienda';
    if(!qty||qty<=0)return alert('Escribe cuánto compraste.');
    if(!Number.isFinite(cost)||cost<0)return alert('Escribe un costo válido.');
    const internalQty=round3(qty*Number(item.factor||1));
    const button=doc.getElementById('stockTopupSaveV16');
    button.disabled=true;
    try{
      await db.runTransaction(async tx=>{
        const snap=await tx.get(inventoryRef);
        const current={...EMPTY,...(snap.exists?(snap.data().items||{}):{})};
        const moveRef=db.collection('movimientos').doc();
        current[key]=round3(Number(current[key]||0)+internalQty);
        tx.set(inventoryRef,{items:current,tracked:firebase.firestore.FieldValue.arrayUnion(key),updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
        tx.set(moveRef,{type:'purchase',date:firebase.firestore.FieldValue.serverTimestamp(),day:typeof today==='function'?today():new Date().toISOString().slice(0,10),name:item.name,qty,unit:item.purchaseUnit||item.unit,cost,store});
      });
      modal.hidden=true;
      if(typeof toast==='function')toast(`${item.name}: compra sumada al inventario`);
    }catch(e){
      console.error(e);
      alert('No se pudo sumar la compra.');
      if(typeof showError==='function')showError(e);
    }finally{button.disabled=false;}
  }

  function decorateInventory(){
    const nameToKey=new Map(Object.entries(ITEMS).map(([k,v])=>[String(v.name||'').trim(),k]));
    doc.querySelectorAll('#inventoryList .inv').forEach(row=>{
      if(row.querySelector('.stock-topup'))return;
      const name=row.querySelector('strong')?.textContent?.trim();
      const key=nameToKey.get(name);
      if(!key||ITEMS[key]?.legacy)return;
      const left=row.firstElementChild;
      if(!left)return;
      const b=doc.createElement('button');
      b.type='button';
      b.className='stock-topup';
      b.textContent='➕ Comprar más / sumar';
      b.onclick=()=>openStockTopup(key);
      left.appendChild(b);
    });
  }

  function buildEditModal(){
    if(doc.getElementById('manualEditModalV16'))return;
    const modal=doc.createElement('div');
    modal.id='manualEditModalV16';
    modal.className='tools-modal-v16';
    modal.hidden=true;
    modal.innerHTML=`<section class="tools-sheet-v16"><h2>✏️ Editar pedido manual</h2><p>Cambia el día, horario o cualquier dato antes de entregarlo.</p><div class="tools-grid-v16"><label>Nombre<input id="editCustomerV16"></label><label>Teléfono<input id="editPhoneV16" type="tel"></label><label class="full">Dirección<input id="editAddressV16"></label><label>ZIP<input id="editZipV16" maxlength="5"></label><label>Fuente<select id="editSourceV16"><option value="facebook">Facebook</option><option value="messenger">Messenger</option><option value="whatsapp">WhatsApp</option><option value="teléfono">Teléfono</option><option value="otro">Otro</option></select></label><label>Día<input id="editDateV16" type="date"></label><label>Horario<select id="editTimeV16"></select></label><label>Libras<input id="editPoundsV16" type="number" min="0.5" step="0.5"></label><label>Precio por libra<input id="editPriceV16" type="number" min="0" step="0.01"></label><label>Costo por libra<input id="editCostV16" type="number" min="0" step="0.01"></label><label>Refrescos gratis<input id="editSodasV16" type="number" min="0" step="1"></label><label class="tools-check-v16 full"><input id="editPackV16" type="checkbox">Empacar en 2 contenedores de 12 oz por libra</label><label class="full">Notas<input id="editNotesV16"></label></div><div class="tools-summary-v16" id="editSummaryV16"></div><div class="tools-actions-v16"><button class="tools-cancel-v16" id="editCancelV16">Cancelar</button><button class="tools-save-v16" id="editSaveV16">Guardar cambios</button></div></section>`;
    doc.body.appendChild(modal);
    modal.dataset.id='';
    fillEditTimes();
    doc.getElementById('editCancelV16').onclick=()=>modal.hidden=true;
    modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true;});
    ['editPoundsV16','editPriceV16','editCostV16','editSodasV16'].forEach(id=>doc.getElementById(id).addEventListener('input',updateEditSummary));
    doc.getElementById('editSaveV16').onclick=saveManualEdit;
  }

  function fillEditTimes(){
    const sel=doc.getElementById('editTimeV16');
    if(!sel)return;
    sel.innerHTML='';
    const fmt=m=>{let h=Math.floor(m/60),min=m%60,period=h>=12?'p. m.':'a. m.';h=h%12||12;return `${h}:${String(min).padStart(2,'0')} ${period}`;};
    for(let minutes=12*60;minutes<19*60;minutes+=30){
      const value=`${fmt(minutes)}–${fmt(minutes+30)}`;
      const option=doc.createElement('option');option.value=value;option.textContent=value;sel.appendChild(option);
    }
  }

  function buildRecipe(pounds,sodas,pack12){
    const r={fish:PROTEIN_LB*pounds,shrimp:PROTEIN_LB*pounds};
    Object.entries(COMMON_PER_LB).forEach(([k,v])=>r[k]=round3(v*pounds));
    if(pack12){r.container12=round3(2*pounds);r.lid12=round3(2*pounds);r.spoon=round3(pounds);r.napkins=round3(2*pounds);}
    if(sodas>0)r.coca=sodas;
    return Object.fromEntries(Object.entries(r).map(([k,v])=>[k,round3(v)]));
  }

  function sourceValue(order){
    const raw=String(order.manualSource||order.source||'otro').replace(/^manual-/,'').toLowerCase();
    if(raw.includes('facebook'))return 'facebook';
    if(raw.includes('messenger'))return 'messenger';
    if(raw.includes('whatsapp'))return 'whatsapp';
    if(raw.includes('tel'))return 'teléfono';
    return 'otro';
  }

  function openManualEdit(id){
    const order=orders.find(o=>o.id===id);
    if(!order||!order.manualOrder)return;
    const modal=doc.getElementById('manualEditModalV16');
    modal.dataset.id=id;
    doc.getElementById('editCustomerV16').value=order.customer||'';
    doc.getElementById('editPhoneV16').value=order.phone||'';
    doc.getElementById('editAddressV16').value=order.address||'';
    doc.getElementById('editZipV16').value=order.zip||'';
    doc.getElementById('editSourceV16').value=sourceValue(order);
    doc.getElementById('editDateV16').value=order.deliveryDate||'';
    fillEditTimes();
    const timeSel=doc.getElementById('editTimeV16');
    if(order.time&&!Array.from(timeSel.options).some(o=>o.value===order.time)){
      const option=doc.createElement('option');option.value=order.time;option.textContent=order.time;timeSel.appendChild(option);
    }
    timeSel.value=order.time||timeSel.options[0]?.value||'';
    doc.getElementById('editPoundsV16').value=Number(order.pounds||order.items?.[0]?.qty||1);
    doc.getElementById('editPriceV16').value=Number(order.unitPrice||order.items?.[0]?.unitPrice||17);
    doc.getElementById('editCostV16').value=Number(order.costPerLb||((Number(order.pounds)>0&&order.cost!=null)?Number(order.cost)/Number(order.pounds):5.93));
    doc.getElementById('editSodasV16').value=Number(order.promoSodas||0);
    doc.getElementById('editPackV16').checked=order.packaging12!==false;
    doc.getElementById('editNotesV16').value=order.notes&&order.notes!=='Sin notas'?order.notes:'';
    updateEditSummary();
    modal.hidden=false;
  }

  function updateEditSummary(){
    const pounds=Math.max(.5,Number(doc.getElementById('editPoundsV16')?.value)||1);
    const price=Number(doc.getElementById('editPriceV16')?.value)||0;
    const costLb=Number(doc.getElementById('editCostV16')?.value)||0;
    const total=pounds*price,cost=pounds*costLb;
    const box=doc.getElementById('editSummaryV16');
    if(box)box.innerHTML=`${pounds} lb × ${money(price)} = <b>${money(total)}</b><br>Costo estimado: ${money(cost)} · Utilidad: ${money(total-cost)}`;
  }

  async function saveManualEdit(){
    const modal=doc.getElementById('manualEditModalV16');
    const id=modal.dataset.id;
    const order=orders.find(o=>o.id===id);
    if(!order)return;
    const customer=doc.getElementById('editCustomerV16').value.trim();
    const phone=doc.getElementById('editPhoneV16').value.trim();
    const address=doc.getElementById('editAddressV16').value.trim();
    const zip=doc.getElementById('editZipV16').value.trim();
    const deliveryDate=doc.getElementById('editDateV16').value;
    const time=doc.getElementById('editTimeV16').value;
    if(!customer||!phone||!address||!zip||!deliveryDate||!time)return alert('Completa nombre, teléfono, dirección, ZIP, día y horario.');

    const conflict=orders.find(o=>o.id!==id&&o.status!=='cancelado'&&o.deliveryDate===deliveryDate&&o.time===time);
    if(conflict)return alert('Ese horario ya tiene otra entrega. Elige otro bloque.');

    const pounds=Math.max(.5,Number(doc.getElementById('editPoundsV16').value)||1);
    const unitPrice=Number(doc.getElementById('editPriceV16').value)||0;
    const costPerLb=Number(doc.getElementById('editCostV16').value)||0;
    const sodas=Math.max(0,Math.floor(Number(doc.getElementById('editSodasV16').value)||0));
    const pack12=doc.getElementById('editPackV16').checked;
    const total=Number((pounds*unitPrice).toFixed(2));
    const cost=Number((pounds*costPerLb).toFixed(2));
    const profit=Number((total-cost).toFixed(2));
    const manualSource=doc.getElementById('editSourceV16').value;
    const notes=doc.getElementById('editNotesV16').value.trim()||'Sin notas';
    const button=doc.getElementById('editSaveV16');
    button.disabled=true;
    try{
      await db.collection('pedidos').doc(id).update({
        customer,phone,address,zip,deliveryDate,time,notes,
        source:'app-clientes',manualSource,
        items:[{productId:'mixed_lb_manual',name:'Ceviche mixto',detail:`Pescado y camarón · ${pounds} libra${pounds===1?'':'s'} · Pedido manual`,qty:pounds,unitPrice,lineTotal:total}],
        recipe:buildRecipe(pounds,sodas,pack12),total,cost,profit,costComplete:true,
        pounds,unitPrice,costPerLb,promoSodas:sodas,packaging12:pack12,cucumberUnitVersion:'piece-v15',
        editedAt:firebase.firestore.FieldValue.serverTimestamp()
      });
      modal.hidden=true;
      if(typeof toast==='function')toast('Pedido manual actualizado');
    }catch(e){
      console.error(e);
      alert('No se pudo editar el pedido.');
      if(typeof showError==='function')showError(e);
    }finally{button.disabled=false;}
  }

  async function deleteManualOrder(id){
    const order=orders.find(o=>o.id===id);
    if(!order||!order.manualOrder)return;
    if(order.status==='entregado')return alert('Ese pedido ya fue entregado y ya afectó ventas e inventario; no se puede borrar desde aquí.');
    if(!confirm(`¿Borrar el pedido manual de ${order.customer||'este cliente'}?`))return;
    try{
      await db.collection('pedidos').doc(id).delete();
      if(typeof toast==='function')toast('Pedido manual borrado');
    }catch(e){
      console.error(e);
      alert('No se pudo borrar el pedido.');
      if(typeof showError==='function')showError(e);
    }
  }

  function decorateOrders(){
    const list=doc.getElementById('orderList');
    if(!list)return;
    list.querySelectorAll('.order').forEach(card=>{
      if(card.querySelector('.manual-tools-v16'))return;
      const text=card.textContent||'';
      const order=orders.find(o=>o.manualOrder&&text.includes(o.id));
      if(!order||order.status==='entregado')return;
      const tools=doc.createElement('div');
      tools.className='manual-tools-v16';
      tools.innerHTML=`<button type="button" class="manual-edit-v16">✏️ Editar</button><button type="button" class="manual-delete-v16">🗑️ Borrar</button>`;
      tools.querySelector('.manual-edit-v16').onclick=()=>openManualEdit(order.id);
      tools.querySelector('.manual-delete-v16').onclick=()=>deleteManualOrder(order.id);
      card.appendChild(tools);
    });
  }

  waitReady();
})();
