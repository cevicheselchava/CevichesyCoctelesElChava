(()=>{
  if(window.__EL_CUBANO_ORDER_INVENTORY_TOOLS_V17__)return;
  window.__EL_CUBANO_ORDER_INVENTORY_TOOLS_V17__=true;

  const doc=document;
  const r3=n=>Math.round((Number(n)+Number.EPSILON)*1000)/1000;
  const cash=n=>'$'+Number(n||0).toFixed(2);
  const PROTEIN_PER_LB=125/453.59237;
  const COMMON={tomato:1.6,cucumber:1/6,onion:.8,cilantro:.2,lemonJuice:2.4,clamato:1.4,avocado:.25};

  function ready(){
    return typeof db!=='undefined'&&typeof inventoryRef!=='undefined'&&typeof ITEMS!=='undefined'&&typeof orders!=='undefined';
  }

  function addStyle(){
    if(doc.getElementById('orderInventoryToolsV17Style'))return;
    const s=doc.createElement('style');
    s.id='orderInventoryToolsV17Style';
    s.textContent=`
      .stock-topup-v17{display:block;margin-top:8px;border:0;border-radius:10px;padding:9px 11px;background:#e8f5eb;color:#176b2c;font-weight:1000;font-size:13px}
      .manual-tools-v17{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px}
      .manual-tools-v17 button{border:0;border-radius:10px;padding:10px;font-weight:1000}
      .manual-edit-v17{background:#fff0bf;color:#775200}.manual-delete-v17{background:#ffe5e6;color:#a30f16}
      .tools-modal-v17{position:fixed;inset:0;z-index:100090;background:rgba(9,21,36,.52);display:grid;place-items:end center;padding:14px}
      .tools-modal-v17[hidden]{display:none}
      .tools-sheet-v17{width:min(100%,650px);max-height:92vh;overflow:auto;background:#fffdf8;border-radius:24px 24px 16px 16px;padding:17px;box-shadow:0 18px 55px rgba(0,0,0,.3)}
      .tools-sheet-v17 h2{margin:0 0 5px;color:#06254d}.tools-sheet-v17 p{margin:0 0 12px;color:#687386;font-weight:800}
      .tools-grid-v17{display:grid;grid-template-columns:1fr 1fr;gap:9px}.tools-grid-v17 .full{grid-column:1/-1}
      .tools-check-v17{display:flex!important;flex-direction:row!important;align-items:center;gap:9px;border:1px solid #d6cfbf;border-radius:11px;padding:11px;background:#fff}
      .tools-check-v17 input{width:20px;height:20px;margin:0;flex:0 0 auto}
      .tools-summary-v17{margin:11px 0;padding:11px;border-radius:12px;background:#eef5ff;border:1px solid #b9cce8;color:#06254d;font-weight:900;line-height:1.45}
      .tools-actions-v17{display:grid;grid-template-columns:1fr 1.4fr;gap:8px;margin-top:12px}.tools-actions-v17 button{border:0;border-radius:12px;padding:13px;font-weight:1000}
      .tools-cancel-v17{background:#e9edf3;color:#06254d}.tools-save-v17{background:#218b39;color:#fff}
      @media(max-width:560px){.tools-modal-v17{padding:0}.tools-sheet-v17{border-radius:24px 24px 0 0}.tools-grid-v17{grid-template-columns:1fr}.tools-grid-v17 .full{grid-column:1}}
    `;
    doc.head.appendChild(s);
  }

  function ensureStockModal(){
    if(doc.getElementById('stockTopupModalV17'))return;
    const modal=doc.createElement('div');
    modal.id='stockTopupModalV17';
    modal.className='tools-modal-v17';
    modal.hidden=true;
    modal.dataset.key='';
    modal.innerHTML=`<section class="tools-sheet-v17"><h2 id="stockTopupTitleV17">Sumar compra</h2><p id="stockTopupCurrentV17"></p><div class="tools-grid-v17"><label>Cantidad comprada<input id="stockTopupQtyV17" type="number" min="0.01" step="0.01" value="1"></label><label>Unidad<input id="stockTopupUnitV17" readonly></label><label class="full">Costo total<input id="stockTopupCostV17" type="number" min="0" step="0.01" placeholder="$0.00"></label><label class="full">Tienda<input id="stockTopupStoreV17" placeholder="H-E-B, Walmart, Sam's..."></label></div><div class="tools-actions-v17"><button type="button" class="tools-cancel-v17" id="stockTopupCancelV17">Cancelar</button><button type="button" class="tools-save-v17" id="stockTopupSaveV17">Sumar al inventario</button></div></section>`;
    doc.body.appendChild(modal);
    doc.getElementById('stockTopupCancelV17').onclick=()=>modal.hidden=true;
    modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true;});
    doc.getElementById('stockTopupSaveV17').onclick=saveStock;
  }

  function openStock(key){
    const item=ITEMS[key];
    if(!item)return;
    const modal=doc.getElementById('stockTopupModalV17');
    modal.dataset.key=key;
    let current='';
    try{current=typeof displayQty==='function'?displayQty(key,Number(inventory?.[key]||0)):`${Number(inventory?.[key]||0)} ${item.unit||''}`;}catch(_){current='';}
    doc.getElementById('stockTopupTitleV17').textContent=`➕ ${item.name}`;
    doc.getElementById('stockTopupCurrentV17').textContent=`Actualmente tienes ${current}. Lo nuevo se SUMA; no reemplaza lo que ya hay.`;
    doc.getElementById('stockTopupQtyV17').value='1';
    doc.getElementById('stockTopupUnitV17').value=item.purchaseUnit||item.unit||'unidad';
    doc.getElementById('stockTopupCostV17').value='';
    modal.hidden=false;
  }

  async function saveStock(){
    const modal=doc.getElementById('stockTopupModalV17');
    const key=modal.dataset.key,item=ITEMS[key];
    if(!item)return;
    const qty=Number(doc.getElementById('stockTopupQtyV17').value||0);
    const cost=Number(doc.getElementById('stockTopupCostV17').value||0);
    const store=doc.getElementById('stockTopupStoreV17').value.trim()||'Sin tienda';
    if(!(qty>0))return alert('Escribe cuánto compraste.');
    if(!Number.isFinite(cost)||cost<0)return alert('Escribe un costo válido.');
    const internalQty=r3(qty*Number(item.factor||1));
    const btn=doc.getElementById('stockTopupSaveV17');
    btn.disabled=true;
    try{
      await db.runTransaction(async tx=>{
        const snap=await tx.get(inventoryRef);
        const current={...EMPTY,...(snap.exists?(snap.data().items||{}):{})};
        current[key]=r3(Number(current[key]||0)+internalQty);
        const moveRef=db.collection('movimientos').doc();
        tx.set(inventoryRef,{items:current,tracked:firebase.firestore.FieldValue.arrayUnion(key),updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
        tx.set(moveRef,{type:'purchase',date:firebase.firestore.FieldValue.serverTimestamp(),day:typeof today==='function'?today():new Date().toISOString().slice(0,10),name:item.name,qty,unit:item.purchaseUnit||item.unit,cost,store});
      });
      modal.hidden=true;
      if(typeof toast==='function')toast(`${item.name}: compra sumada`);
    }catch(e){console.error(e);alert('No se pudo sumar la compra.');if(typeof showError==='function')showError(e);}finally{btn.disabled=false;}
  }

  function ensureEditModal(){
    if(doc.getElementById('manualEditModalV17'))return;
    const modal=doc.createElement('div');
    modal.id='manualEditModalV17';
    modal.className='tools-modal-v17';
    modal.hidden=true;
    modal.dataset.id='';
    modal.innerHTML=`<section class="tools-sheet-v17"><h2>✏️ Editar pedido manual</h2><p>Puedes corregir el día, horario y los datos del pedido antes de entregarlo.</p><div class="tools-grid-v17"><label>Nombre<input id="editCustomerV17"></label><label>Teléfono<input id="editPhoneV17" type="tel"></label><label class="full">Dirección<input id="editAddressV17"></label><label>ZIP<input id="editZipV17" maxlength="5"></label><label>Fuente<select id="editSourceV17"><option value="facebook">Facebook</option><option value="messenger">Messenger</option><option value="whatsapp">WhatsApp</option><option value="teléfono">Teléfono</option><option value="otro">Otro</option></select></label><label>Día<input id="editDateV17" type="date"></label><label>Horario<select id="editTimeV17"></select></label><label>Libras<input id="editPoundsV17" type="number" min="0.5" step="0.5"></label><label>Precio por libra<input id="editPriceV17" type="number" min="0" step="0.01"></label><label>Costo por libra<input id="editCostV17" type="number" min="0" step="0.01"></label><label>Refrescos gratis<input id="editSodasV17" type="number" min="0" step="1"></label><label class="tools-check-v17 full"><input id="editPackV17" type="checkbox">Empacar en 2 contenedores de 12 oz por libra</label><label class="full">Notas<input id="editNotesV17"></label></div><div class="tools-summary-v17" id="editSummaryV17"></div><div class="tools-actions-v17"><button type="button" class="tools-cancel-v17" id="editCancelV17">Cancelar</button><button type="button" class="tools-save-v17" id="editSaveV17">Guardar cambios</button></div></section>`;
    doc.body.appendChild(modal);
    fillTimes();
    doc.getElementById('editCancelV17').onclick=()=>modal.hidden=true;
    modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true;});
    ['editPoundsV17','editPriceV17','editCostV17','editSodasV17'].forEach(id=>doc.getElementById(id).addEventListener('input',updateSummary));
    doc.getElementById('editSaveV17').onclick=saveEdit;
  }

  function fillTimes(){
    const sel=doc.getElementById('editTimeV17');if(!sel)return;
    sel.innerHTML='';
    const fmt=m=>{let h=Math.floor(m/60),min=m%60,p=h>=12?'p. m.':'a. m.';h=h%12||12;return `${h}:${String(min).padStart(2,'0')} ${p}`;};
    for(let m=12*60;m<19*60;m+=30){const v=`${fmt(m)}–${fmt(m+30)}`;const o=doc.createElement('option');o.value=v;o.textContent=v;sel.appendChild(o);}
  }

  function sourceValue(order){
    const raw=String(order.manualSource||order.source||'otro').replace(/^manual-/,'').toLowerCase();
    if(raw.includes('facebook'))return 'facebook';if(raw.includes('messenger'))return 'messenger';if(raw.includes('whatsapp'))return 'whatsapp';if(raw.includes('tel'))return 'teléfono';return 'otro';
  }

  function recipeFor(pounds,sodas,pack){
    const r={fish:r3(PROTEIN_PER_LB*pounds),shrimp:r3(PROTEIN_PER_LB*pounds)};
    Object.entries(COMMON).forEach(([k,v])=>r[k]=r3(v*pounds));
    if(pack){r.container12=r3(2*pounds);r.lid12=r3(2*pounds);r.spoon=r3(pounds);r.napkins=r3(2*pounds);}
    if(sodas>0)r.coca=sodas;
    return r;
  }

  function openEdit(id){
    const order=orders.find(o=>o.id===id);
    if(!order||!order.manualOrder||order.status==='entregado')return;
    const modal=doc.getElementById('manualEditModalV17');modal.dataset.id=id;
    doc.getElementById('editCustomerV17').value=order.customer||'';
    doc.getElementById('editPhoneV17').value=order.phone||'';
    doc.getElementById('editAddressV17').value=order.address||'';
    doc.getElementById('editZipV17').value=order.zip||'';
    doc.getElementById('editSourceV17').value=sourceValue(order);
    doc.getElementById('editDateV17').value=order.deliveryDate||'';
    fillTimes();
    const sel=doc.getElementById('editTimeV17');
    if(order.time&&!Array.from(sel.options).some(x=>x.value===order.time)){const o=doc.createElement('option');o.value=order.time;o.textContent=order.time;sel.appendChild(o);}sel.value=order.time||sel.options[0]?.value||'';
    const lbs=Number(order.pounds||order.items?.[0]?.qty||1);
    doc.getElementById('editPoundsV17').value=lbs;
    doc.getElementById('editPriceV17').value=Number(order.unitPrice||order.items?.[0]?.unitPrice||17);
    doc.getElementById('editCostV17').value=Number(order.costPerLb||((lbs>0&&order.cost!=null)?Number(order.cost)/lbs:5.93));
    doc.getElementById('editSodasV17').value=Number(order.promoSodas||0);
    doc.getElementById('editPackV17').checked=order.packaging12!==false;
    doc.getElementById('editNotesV17').value=order.notes&&order.notes!=='Sin notas'?order.notes:'';
    updateSummary();modal.hidden=false;
  }

  function updateSummary(){
    const lbs=Math.max(.5,Number(doc.getElementById('editPoundsV17')?.value)||1),price=Number(doc.getElementById('editPriceV17')?.value)||0,costLb=Number(doc.getElementById('editCostV17')?.value)||0;
    const box=doc.getElementById('editSummaryV17');if(box)box.innerHTML=`${lbs} lb × ${cash(price)} = <b>${cash(lbs*price)}</b><br>Costo estimado: ${cash(lbs*costLb)} · Utilidad: ${cash(lbs*price-lbs*costLb)}`;
  }

  async function saveEdit(){
    const modal=doc.getElementById('manualEditModalV17'),id=modal.dataset.id,order=orders.find(o=>o.id===id);if(!order)return;
    const customer=doc.getElementById('editCustomerV17').value.trim(),phone=doc.getElementById('editPhoneV17').value.trim(),address=doc.getElementById('editAddressV17').value.trim(),zip=doc.getElementById('editZipV17').value.trim(),deliveryDate=doc.getElementById('editDateV17').value,time=doc.getElementById('editTimeV17').value;
    if(!customer||!phone||!address||!zip||!deliveryDate||!time)return alert('Completa nombre, teléfono, dirección, ZIP, día y horario.');
    const conflict=orders.find(o=>o.id!==id&&o.status!=='cancelado'&&o.deliveryDate===deliveryDate&&o.time===time);if(conflict)return alert('Ese horario ya tiene otra entrega. Elige otro bloque.');
    const pounds=Math.max(.5,Number(doc.getElementById('editPoundsV17').value)||1),unitPrice=Number(doc.getElementById('editPriceV17').value)||0,costPerLb=Number(doc.getElementById('editCostV17').value)||0,sodas=Math.max(0,Math.floor(Number(doc.getElementById('editSodasV17').value)||0)),packaging12=doc.getElementById('editPackV17').checked;
    const total=Number((pounds*unitPrice).toFixed(2)),cost=Number((pounds*costPerLb).toFixed(2)),profit=Number((total-cost).toFixed(2)),manualSource=doc.getElementById('editSourceV17').value,notes=doc.getElementById('editNotesV17').value.trim()||'Sin notas';
    const btn=doc.getElementById('editSaveV17');btn.disabled=true;
    try{
      await db.collection('pedidos').doc(id).update({customer,phone,address,zip,deliveryDate,time,notes,source:'app-clientes',manualSource,items:[{productId:'mixed_lb_manual',name:'Ceviche mixto',detail:`Pescado y camarón · ${pounds} libra${pounds===1?'':'s'} · Pedido manual`,qty:pounds,unitPrice,lineTotal:total}],recipe:recipeFor(pounds,sodas,packaging12),total,cost,profit,costComplete:true,pounds,unitPrice,costPerLb,promoSodas:sodas,packaging12,cucumberUnitVersion:'piece-v15',editedAt:firebase.firestore.FieldValue.serverTimestamp()});
      modal.hidden=true;if(typeof toast==='function')toast('Pedido manual actualizado');
    }catch(e){console.error(e);alert('No se pudo editar el pedido.');if(typeof showError==='function')showError(e);}finally{btn.disabled=false;}
  }

  async function removeOrder(id){
    const order=orders.find(o=>o.id===id);if(!order||!order.manualOrder)return;
    if(order.status==='entregado')return alert('Ese pedido ya fue entregado y ya afectó ventas e inventario.');
    if(!confirm(`¿Borrar el pedido manual de ${order.customer||'este cliente'}?`))return;
    try{await db.collection('pedidos').doc(id).delete();if(typeof toast==='function')toast('Pedido manual borrado');}catch(e){console.error(e);alert('No se pudo borrar el pedido.');if(typeof showError==='function')showError(e);}
  }

  function decorateInventory(){
    if(!ready())return;
    const nameToKey=new Map(Object.entries(ITEMS).map(([k,v])=>[String(v.name||'').trim(),k]));
    doc.querySelectorAll('#inventoryList .inv').forEach(row=>{
      if(row.querySelector('.stock-topup-v17'))return;
      const key=nameToKey.get(row.querySelector('strong')?.textContent?.trim()||'');if(!key||ITEMS[key]?.legacy)return;
      const left=row.firstElementChild;if(!left)return;
      const b=doc.createElement('button');b.type='button';b.className='stock-topup-v17';b.textContent='➕ Comprar más / sumar';b.onclick=()=>openStock(key);left.appendChild(b);
    });
  }

  function decorateOrders(){
    if(!ready())return;
    doc.querySelectorAll('#orderList .order').forEach(card=>{
      if(card.querySelector('.manual-tools-v17'))return;
      const text=card.textContent||'';const order=orders.find(o=>o.manualOrder&&text.includes(o.id));if(!order||order.status==='entregado')return;
      const tools=doc.createElement('div');tools.className='manual-tools-v17';tools.innerHTML='<button type="button" class="manual-edit-v17">✏️ Editar</button><button type="button" class="manual-delete-v17">🗑️ Borrar</button>';
      tools.querySelector('.manual-edit-v17').onclick=()=>openEdit(order.id);tools.querySelector('.manual-delete-v17').onclick=()=>removeOrder(order.id);card.appendChild(tools);
    });
  }

  function boot(){
    addStyle();ensureStockModal();ensureEditModal();decorateInventory();decorateOrders();
  }

  let tries=0;
  const starter=setInterval(()=>{if(ready()){boot();clearInterval(starter);}else if(++tries>100)clearInterval(starter);},100);
  setInterval(()=>{if(ready()){decorateInventory();decorateOrders();}},700);
})();
