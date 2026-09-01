(()=>{
  if(window.__EL_CUBANO_PURCHASE_SHOPPING_LIST_V2__)return;
  window.__EL_CUBANO_PURCHASE_SHOPPING_LIST_V2__=true;

  const r3=n=>Math.round((Number(n)+Number.EPSILON)*1000)/1000;
  const n2=n=>Number(Number(n||0).toFixed(2));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const plan={fish:null,shrimp:null,mixed:null,octopusFish:null,octopusShrimp:null};
  const menuTypes=[
    {key:'fish',label:'Ceviche de pescado'},
    {key:'shrimp',label:'Ceviche de camarón'},
    {key:'mixed',label:'Ceviche mixto'},
    {key:'octopusFish',label:'Pulpo y pescado'},
    {key:'octopusShrimp',label:'Pulpo y camarón'}
  ];

  const style=document.createElement('style');
  style.textContent=`
    .shopping-list-box{margin:0 0 14px;border:2px solid #f0cf68;border-radius:18px;padding:14px;background:linear-gradient(135deg,#fffdf3,#f5fff6);box-shadow:0 7px 18px rgba(20,55,40,.07)}
    .shopping-list-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:10px}
    .shopping-list-head h3{margin:0;color:#174f2b;font-size:22px}
    .shopping-list-head small{display:block;color:#687386;font-weight:850;line-height:1.4;margin-top:4px}
    .shopping-count{min-width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:#c92f35;color:#fff;font-size:20px;font-weight:1000}
    .production-plan{border:1px solid #d8cfbf;border-radius:14px;background:#fff;padding:11px;margin-bottom:11px}
    .production-plan-title{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;color:#123458;font-weight:1000}
    .production-total{border-radius:10px;background:#eef8ef;color:#174f2b;padding:7px 9px;white-space:nowrap}
    .production-rows{display:grid;gap:7px}
    .production-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:9px;align-items:center;border-top:1px dashed #e4ded3;padding-top:7px}
    .production-row:first-child{border-top:0;padding-top:0}
    .production-row strong{display:block;color:#174f2b;font-size:15px}
    .production-row small{display:block;color:#687386;margin-top:2px;font-weight:800}
    .production-input{display:flex;align-items:center;gap:6px}
    .production-input input{width:78px;padding:9px 8px;text-align:center;font-weight:1000;color:#123458}
    .production-input span{font-weight:1000;color:#687386}
    .production-note{margin-top:8px;color:#687386;font-size:12px;font-weight:800;line-height:1.35}
    .shopping-list-rows{display:grid;gap:7px}
    .shopping-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid #e1dacd;border-left:5px solid #c92f35;border-radius:13px;padding:11px;background:#fff;cursor:pointer;transition:transform .12s,box-shadow .12s}
    .shopping-row:active{transform:scale(.99)}
    .shopping-row strong{display:block;color:#174f2b;font-size:16px}
    .shopping-row small{display:block;color:#687386;margin-top:3px;font-weight:800;line-height:1.35}
    .shopping-qty{padding:9px 10px;border-radius:10px;background:#fff0ed;color:#b72c25;font-weight:1000;text-align:center;white-space:nowrap}
    .shopping-clear{border:1px solid #b9d9bf;border-radius:13px;padding:13px;background:#eef8ef;color:#174f2b;font-weight:1000;text-align:center}
    @media(max-width:560px){
      .shopping-list-head h3{font-size:20px}
      .production-row{grid-template-columns:1fr auto}
      .shopping-row{grid-template-columns:1fr auto;padding:10px}
      .shopping-qty{font-size:13px;padding:8px}
    }
  `;
  document.head.appendChild(style);

  function ready(){
    return typeof ITEMS!=='undefined'&&typeof inventory!=='undefined'&&typeof pendingNeeds==='function'&&typeof pendingProductionOrders==='function'&&typeof displayQty==='function'&&typeof buildRecipe==='function';
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

  function addPounds(out,type,value){
    if(!out[type])out[type]=0;
    out[type]=r3(Number(out[type]||0)+Math.max(0,Number(value||0)));
  }

  function orderedPoundsByType(){
    const out={fish:0,shrimp:0,mixed:0,octopusFish:0,octopusShrimp:0};
    const list=pendingProductionOrders();
    list.forEach(o=>{
      let recognized=false;
      (o.items||[]).forEach(item=>{
        const id=String(item?.productId||'');
        const qty=Math.max(0,Number(item?.qty||0));
        const name=String(item?.name||'').toLowerCase();
        const detail=String(item?.detail||'').toLowerCase();
        const map={fp5:['fish',.5],fp1:['fish',1],fc5:['shrimp',.5],fc1:['shrimp',1],fm5:['mixed',.5],fm1:['mixed',1],op5:['octopusFish',.5],op1:['octopusFish',1],oc5:['octopusShrimp',.5],oc1:['octopusShrimp',1]};
        if(map[id]){addPounds(out,map[id][0],map[id][1]*qty);recognized=true;return;}
        if(id==='promo_constructor'){addPounds(out,'fish',1*qty);recognized=true;return;}
        if(id==='promo_hambre'){addPounds(out,'shrimp',1*qty);recognized=true;return;}
        if(id==='promo_camaradas'){addPounds(out,'fish',1*qty);addPounds(out,'shrimp',1*qty);recognized=true;return;}
        if(id==='mixed_lb_manual'||id==='mixed_lb_direct'){addPounds(out,'mixed',qty);recognized=true;return;}
        let pounds=0;
        if(/½\s*libra|1\/2\s*libra/.test(detail))pounds=.5*qty;
        else{
          const m=detail.match(/(\d+(?:\.\d+)?)\s*libras?/);
          if(m)pounds=Number(m[1])*qty;
        }
        if(!(pounds>0))return;
        if(name.includes('pulpo')&&name.includes('pescado'))addPounds(out,'octopusFish',pounds);
        else if(name.includes('pulpo')&&name.includes('camar'))addPounds(out,'octopusShrimp',pounds);
        else if(name.includes('mixto'))addPounds(out,'mixed',pounds);
        else if(name.includes('pescado'))addPounds(out,'fish',pounds);
        else if(name.includes('camar'))addPounds(out,'shrimp',pounds);
        else return;
        recognized=true;
      });
      if(!recognized&&o.manualOrder&&Number(o.pounds)>0)addPounds(out,'mixed',Number(o.pounds));
    });
    return out;
  }

  function syncPlanMinimums(ordered){
    menuTypes.forEach(t=>{
      const min=r3(Number(ordered[t.key]||0));
      if(plan[t.key]===null||!Number.isFinite(Number(plan[t.key])))plan[t.key]=min;
      if(Number(plan[t.key])<min)plan[t.key]=min;
    });
  }

  function plannedNeeds(ordered){
    const need={};
    Object.entries(pendingNeeds()).forEach(([k,v])=>need[k]=r3(Number(v||0)));
    menuTypes.forEach(t=>{
      const extra=Math.max(0,r3(Number(plan[t.key]||0)-Number(ordered[t.key]||0)));
      if(!(extra>0))return;
      const recipe=typeof consumableRecipe==='function'?consumableRecipe(buildRecipe(extra,0,true,t.key)):buildRecipe(extra,0,false,t.key);
      Object.entries(recipe||{}).forEach(([k,v])=>{
        if(!ITEMS[k])return;
        need[k]=r3(Number(need[k]||0)+Number(v||0));
      });
    });
    return need;
  }

  function renderList(){
    if(!ready())return;
    const box=ensureBox();
    if(!box)return;

    const ordered=orderedPoundsByType();
    syncPlanMinimums(ordered);
    const need=plannedNeeds(ordered);
    const pending=pendingProductionOrders();
    const plannedTotal=r3(menuTypes.reduce((s,t)=>s+Number(plan[t.key]||0),0));
    const orderedTotal=r3(menuTypes.reduce((s,t)=>s+Number(ordered[t.key]||0),0));
    const shortages=Object.entries(need)
      .map(([k,v])=>({k,need:r3(Number(v||0)),have:r3(Number(inventory[k]||0)),lack:r3(Math.max(0,Number(v||0)-Number(inventory[k]||0))) }))
      .filter(x=>x.lack>0&&ITEMS[x.k]);

    const planner=`
      <div class="production-plan">
        <div class="production-plan-title"><span>¿Cuánto vas a preparar?</span><span class="production-total">TOTAL ${n2(plannedTotal)} lb</span></div>
        <div class="production-rows">
          ${menuTypes.map(t=>`<label class="production-row"><span><strong>${esc(t.label)}</strong><small>Ya pedido: ${n2(ordered[t.key])} lb</small></span><span class="production-input"><input type="number" min="${n2(ordered[t.key])}" step="0.5" value="${n2(plan[t.key])}" data-production-type="${esc(t.key)}" aria-label="Libras a preparar de ${esc(t.label)}"><span>lb</span></span></label>`).join('')}
        </div>
        <div class="production-note">Los pedidos ya están incluidos. Si vas a hacer de más, aumenta aquí la cantidad. Los combos se suman automáticamente en su ceviche correspondiente.</div>
      </div>`;

    const head=`<div class="shopping-list-head"><div><h3>🛒 Lista por comprar</h3><small>${pending.length?`${pending.length} pedido${pending.length===1?'':'s'} pendiente${pending.length===1?'':'s'} · ${n2(orderedTotal)} lb pedidas.`:'Sin pedidos pendientes.'} La lista usa lo que decidiste preparar y descuenta el inventario.</small></div><div class="shopping-count">${shortages.length}</div></div>`;

    if(!shortages.length){
      box.innerHTML=planner+head+`<div class="shopping-clear">✅ Con el inventario actual tienes todo para preparar ${n2(plannedTotal)} lb.</div>`;
      return;
    }

    box.innerHTML=planner+head+`
      <div class="shopping-list-rows">
        ${shortages.map(x=>{
          const item=ITEMS[x.k];
          return `<div class="shopping-row" role="button" tabindex="0" data-shopping-buy="${esc(x.k)}"><div><strong>${esc(item.name)}</strong><small>Necesitas ${esc(displayQty(x.k,x.need))} · Tienes ${esc(displayQty(x.k,x.have))}<br>Toca la tarjeta para registrar lo que compres.</small></div><div class="shopping-qty">Comprar ${esc(displayQty(x.k,x.lack))}</div></div>`;
        }).join('')}
      </div>`;
  }

  document.addEventListener('change',e=>{
    const input=e.target.closest('[data-production-type]');
    if(!input)return;
    const type=input.dataset.productionType;
    const ordered=orderedPoundsByType();
    const min=Number(ordered[type]||0);
    let value=Math.max(0,Number(input.value||0));
    if(value<min){value=min;if(typeof toast==='function')toast(`Ya tienes ${n2(min)} lb pedidas; no puede bajar de ahí.`);}
    plan[type]=r3(value);
    renderList();
  });

  function openPurchaseFromTarget(target){
    const row=target?.closest?.('[data-shopping-buy]');
    if(!row)return false;
    const key=row.dataset.shoppingBuy;
    if(typeof window.openStock==='function')window.openStock(key);
    return true;
  }

  document.addEventListener('click',e=>openPurchaseFromTarget(e.target));
  document.addEventListener('keydown',e=>{
    if((e.key==='Enter'||e.key===' ')&&e.target.matches?.('[data-shopping-buy]')){
      e.preventDefault();
      openPurchaseFromTarget(e.target);
    }
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
