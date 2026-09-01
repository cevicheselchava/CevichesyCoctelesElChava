(()=>{
  if(window.__EL_CUBANO_PURCHASE_SHOPPING_LIST_V1__)return;
  window.__EL_CUBANO_PURCHASE_SHOPPING_LIST_V1__=true;

  const r3=n=>Math.round((Number(n)+Number.EPSILON)*1000)/1000;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  const style=document.createElement('style');
  style.textContent=`
    .shopping-list-box{margin:0 0 14px;border:2px solid #f0cf68;border-radius:18px;padding:14px;background:linear-gradient(135deg,#fffdf3,#f5fff6);box-shadow:0 7px 18px rgba(20,55,40,.07)}
    .shopping-list-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:10px}
    .shopping-list-head h3{margin:0;color:#174f2b;font-size:22px}
    .shopping-list-head small{display:block;color:#687386;font-weight:850;line-height:1.4;margin-top:4px}
    .shopping-count{min-width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:#c92f35;color:#fff;font-size:20px;font-weight:1000}
    .shopping-list-rows{display:grid;gap:8px}
    .shopping-row{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;border:1px solid #e1dacd;border-left:5px solid #c92f35;border-radius:13px;padding:11px;background:#fff}
    .shopping-row strong{display:block;color:#174f2b;font-size:17px}
    .shopping-row small{display:block;color:#687386;margin-top:4px;font-weight:800;line-height:1.35}
    .shopping-buy{display:flex;flex-direction:column;gap:7px;align-items:stretch;min-width:132px}
    .shopping-qty{padding:8px 10px;border-radius:10px;background:#fff0ed;color:#b72c25;font-weight:1000;text-align:center;white-space:nowrap}
    .shopping-register{border:0;border-radius:10px;padding:9px 10px;background:linear-gradient(135deg,#267642,#319552);color:#fff;font-weight:1000;box-shadow:inset 0 -3px 0 #f2b632}
    .shopping-clear{border:1px solid #b9d9bf;border-radius:13px;padding:13px;background:#eef8ef;color:#174f2b;font-weight:1000;text-align:center}
    @media(max-width:560px){.shopping-row{grid-template-columns:1fr}.shopping-buy{min-width:0;display:grid;grid-template-columns:1fr 1fr}.shopping-list-head h3{font-size:20px}}
  `;
  document.head.appendChild(style);

  function ready(){
    return typeof ITEMS!=='undefined'&&typeof inventory!=='undefined'&&typeof pendingNeeds==='function'&&typeof pendingProductionOrders==='function'&&typeof displayQty==='function';
  }

  function ensureBox(){
    const panel=document.getElementById('purchases');
    if(!panel)return null;
    let box=document.getElementById('purchaseShoppingList');
    if(box)return box;
    const card=panel.querySelector('.card');
    if(!card)return null;
    box=document.createElement('div');
    box.id='purchaseShoppingList';
    box.className='shopping-list-box';
    const h2=card.querySelector('h2');
    if(h2)h2.insertAdjacentElement('afterend',box);else card.prepend(box);
    return box;
  }

  function renderList(){
    if(!ready())return;
    const box=ensureBox();
    if(!box)return;
    const need=pendingNeeds();
    const pending=pendingProductionOrders();
    const shortages=Object.entries(need)
      .map(([k,v])=>({k,need:r3(Number(v||0)),have:r3(Number(inventory[k]||0)),lack:r3(Math.max(0,Number(v||0)-Number(inventory[k]||0))) }))
      .filter(x=>x.lack>0&&ITEMS[x.k]);

    if(!pending.length){
      box.innerHTML='<div class="shopping-list-head"><div><h3>🛒 Lista por comprar</h3><small>Se llena sola con los pedidos pendientes.</small></div><div class="shopping-count">0</div></div><div class="shopping-clear">No hay pedidos pendientes por preparar.</div>';
      return;
    }

    if(!shortages.length){
      box.innerHTML=`<div class="shopping-list-head"><div><h3>🛒 Lista por comprar</h3><small>${pending.length} pedido${pending.length===1?'':'s'} pendiente${pending.length===1?'':'s'} · ya tienes todo lo necesario.</small></div><div class="shopping-count">0</div></div><div class="shopping-clear">✅ Con el inventario actual alcanzas para todos los pedidos pendientes.</div>`;
      return;
    }

    box.innerHTML=`
      <div class="shopping-list-head">
        <div><h3>🛒 Lista por comprar</h3><small>Acumulado automático para ${pending.length} pedido${pending.length===1?'':'s'} pendiente${pending.length===1?'':'s'}. Se descuenta conforme registras mercancía.</small></div>
        <div class="shopping-count">${shortages.length}</div>
      </div>
      <div class="shopping-list-rows">
        ${shortages.map(x=>{
          const item=ITEMS[x.k];
          return `<div class="shopping-row"><div><strong>${esc(item.name)}</strong><small>Pedidos necesitan: ${esc(displayQty(x.k,x.need))}<br>Tienes: ${esc(displayQty(x.k,x.have))}</small></div><div class="shopping-buy"><div class="shopping-qty">Comprar ${esc(displayQty(x.k,x.lack))}</div><button type="button" class="shopping-register" data-shopping-buy="${esc(x.k)}">Registrar compra</button></div></div>`;
        }).join('')}
      </div>`;
  }

  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-shopping-buy]');
    if(!b)return;
    const key=b.dataset.shoppingBuy;
    if(typeof window.openStock==='function')window.openStock(key);
  });

  function hookLive(){
    if(typeof db==='undefined'){setTimeout(hookLive,500);return;}
    try{
      db.collection('pedidos').onSnapshot(()=>setTimeout(renderList,120));
      db.collection('inventario').doc('principal').onSnapshot(()=>setTimeout(renderList,120));
    }catch(e){console.warn('No se pudo actualizar la lista de compras en vivo',e);}
  }

  setTimeout(renderList,250);
  setTimeout(renderList,1000);
  hookLive();
})();
