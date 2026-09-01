(()=>{
  if(window.__EL_CUBANO_PURCHASE_SHOPPING_LIST_V3__)return;
  window.__EL_CUBANO_PURCHASE_SHOPPING_LIST_V3__=true;

  const r3=n=>Math.round((Number(n)+Number.EPSILON)*1000)/1000;
  const nice=n=>Number(Number(n||0).toFixed(2));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  const types=[
    {key:'mixed',label:'Mixto',unit:'lb',recipeType:'mixed'},
    {key:'fish',label:'Pescado',unit:'lb',recipeType:'fish'},
    {key:'shrimp',label:'Camarón',unit:'lb',recipeType:'shrimp'},
    {key:'cocktail',label:'Cócteles',unit:'pzas'},
    {key:'octopusFish',label:'Pulpo + pescado',unit:'lb',recipeType:'octopusFish'},
    {key:'octopusShrimp',label:'Pulpo + camarón',unit:'lb',recipeType:'octopusShrimp'}
  ];

  const extra=Object.fromEntries(types.map(t=>[t.key,0]));

  const style=document.createElement('style');
  style.textContent=`
    .shopping-list-box{margin:0 0 14px;border:2px solid #f0cf68;border-radius:18px;padding:14px;background:linear-gradient(135deg,#fffdf3,#f5fff6);box-shadow:0 7px 18px rgba(20,55,40,.07)}
    .purchase-block{border:1px solid #d8cfbf;border-radius:15px;background:#fff;padding:12px;margin-bottom:10px}
    .purchase-block h3{margin:0 0 9px;color:#174f2b;font-size:19px}
    .purchase-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
    .purchase-chip{border:1px solid #e2dacd;border-radius:12px;padding:10px;background:#fffaf0;display:flex;justify-content:space-between;gap:8px;align-items:center}
    .purchase-chip span{font-weight:900;color:#123458}
    .purchase-chip b{color:#174f2b;font-size:18px;white-space:nowrap}
    .extra-grid{display:grid;gap:7px}
    .extra-row{display:grid;grid-template-columns:minmax(0,1fr) 92px;gap:9px;align-items:center}
    .extra-row span{font-weight:900;color:#123458}
    .extra-row input{width:100%;padding:10px;text-align:center;font-weight:1000;color:#174f2b}
    .total-block{background:#eef8ef;border-color:#b9d9bf}
    .shopping-list-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin:2px 0 10px}
    .shopping-list-head h3{margin:0;color:#174f2b;font-size:21px}
    .shopping-list-head small{display:block;color:#687386;font-weight:850;line-height:1.4;margin-top:4px}
    .shopping-count{min-width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:#c92f35;color:#fff;font-size:20px;font-weight:1000}
    .shopping-list-rows{display:grid;gap:7px}
    .shopping-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid #e1dacd;border-left:5px solid #c92f35;border-radius:13px;padding:11px;background:#fff;cursor:pointer}
    .shopping-row:active{transform:scale(.99)}
    .shopping-row strong{display:block;color:#174f2b;font-size:16px}
    .shopping-row small{display:block;color:#687386;margin-top:3px;font-weight:800;line-height:1.35}
    .shopping-qty{padding:9px 10px;border-radius:10px;background:#fff0ed;color:#b72c25;font-weight:1000;text-align:center;white-space:nowrap}
    .shopping-clear{border:1px solid #b9d9bf;border-radius:13px;padding:13px;background:#eef8ef;color:#174f2b;font-weight:1000;text-align:center}
    .cocktail-note{margin:9px 0 0;padding:9px 10px;border-radius:11px;background:#fff7cf;color:#7d5300;font-size:12px;font-weight:900;line-height:1.35}
    @media(max-width:560px){.purchase-grid{grid-template-columns:1fr 1fr}.shopping-row{grid-template-columns:1fr}.shopping-qty{text-align:left}.purchase-block h3{font-size:18px}}
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

  function add(out,key,value){out[key]=r3(Number(out[key]||0)+Math.max(0,Number(value||0)));}

  function orderedSummary(){
    const out=Object.fromEntries(types.map(t=>[t.key,0]));
    pendingProductionOrders().forEach(o=>{
      let recognized=false;
      (o.items||[]).forEach(item=>{
        const id=String(item?.productId||'');
        const qty=Math.max(0,Number(item?.qty||0));
        const name=String(item?.name||'').toLowerCase();
        const detail=String(item?.detail||'').toLowerCase();
        const map={fp5:['fish',.5],fp1:['fish',1],fc5:['shrimp',.5],fc1:['shrimp',1],fm5:['mixed',.5],fm1:['mixed',1],op5:['octopusFish',.5],op1:['octopusFish',1],oc5:['octopusShrimp',.5],oc1:['octopusShrimp',1]};
        if(map[id]){add(out,map[id][0],map[id][1]*qty);recognized=true;return;}
        if(['cc12','cc16','cocktail_small','cocktail_medium'].includes(id)){add(out,'cocktail',qty);recognized=true;return;}
        if(['cm12','cm16','cocktail_mix_small','cocktail_mix_medium'].includes(id)){add(out,'cocktail',qty);recognized=true;return;}
        if(id==='promo_constructor'){add(out,'fish',qty);add(out,'cocktail',qty);recognized=true;return;}
        if(id==='promo_hambre'){add(out,'shrimp',qty);add(out,'cocktail',qty);recognized=true;return;}
        if(id==='promo_camaradas'){add(out,'fish',qty);add(out,'shrimp',qty);add(out,'cocktail',2*qty);recognized=true;return;}
        if(id==='mixed_lb_manual'||id==='mixed_lb_direct'){add(out,'mixed',qty);recognized=true;return;}
        if(name.includes('cóctel')||name.includes('coctel')){add(out,'cocktail',qty);recognized=true;return;}
        let pounds=0;
        if(/½\s*libra|1\/2\s*libra/.test(detail))pounds=.5*qty;
        else{const m=detail.match(/(\d+(?:\.\d+)?)\s*libras?/);if(m)pounds=Number(m[1])*qty;}
        if(!(pounds>0))return;
        if(name.includes('pulpo')&&name.includes('pescado'))add(out,'octopusFish',pounds);
        else if(name.includes('pulpo')&&name.includes('camar'))add(out,'octopusShrimp',pounds);
        else if(name.includes('mixto'))add(out,'mixed',pounds);
        else if(name.includes('pescado'))add(out,'fish',pounds);
        else if(name.includes('camar'))add(out,'shrimp',pounds);
        else return;
        recognized=true;
      });
      if(!recognized&&o.manualOrder&&Number(o.pounds)>0)add(out,'mixed',Number(o.pounds));
    });
    return out;
  }

  function addNeed(need,key,value){
    if(!ITEMS[key])return;
    need[key]=r3(Number(need[key]||0)+Number(value||0));
  }

  function needsWithExtras(){
    const need={};
    Object.entries(pendingNeeds()).forEach(([k,v])=>need[k]=r3(Number(v||0)));
    types.filter(t=>t.recipeType).forEach(t=>{
      const qty=Math.max(0,Number(extra[t.key]||0));
      if(!(qty>0))return;
      const recipe=typeof consumableRecipe==='function'?consumableRecipe(buildRecipe(qty,0,true,t.recipeType)):buildRecipe(qty,0,false,t.recipeType);
      Object.entries(recipe||{}).forEach(([k,v])=>addNeed(need,k,v));
    });
    return need;
  }

  function qtyLabel(t,value){return `${nice(value)} ${t.unit}`;}

  function visibleTypes(values){
    const active=types.filter(t=>Number(values[t.key]||0)>0||Number(extra[t.key]||0)>0);
    return active.length?active:types.slice(0,4);
  }

  function renderList(){
    if(!ready())return;
    const box=ensureBox();
    if(!box)return;

    const ordered=orderedSummary();
    const totals=Object.fromEntries(types.map(t=>[t.key,r3(Number(ordered[t.key]||0)+Number(extra[t.key]||0))]));
    const need=needsWithExtras();
    const shortages=Object.entries(need)
      .map(([k,v])=>({k,need:r3(Number(v||0)),have:r3(Number(inventory[k]||0)),lack:r3(Math.max(0,Number(v||0)-Number(inventory[k]||0))) }))
      .filter(x=>x.lack>0&&ITEMS[x.k]);

    const orderTypes=visibleTypes(ordered);
    const totalTypes=visibleTypes(totals);
    const cocktailTotal=Number(totals.cocktail||0);

    box.innerHTML=`
      <div class="purchase-block">
        <h3>PEDIDOS ENCARGADOS</h3>
        <div class="purchase-grid">
          ${orderTypes.map(t=>`<div class="purchase-chip"><span>${esc(t.label)}</span><b>${esc(qtyLabel(t,ordered[t.key]))}</b></div>`).join('')}
        </div>
      </div>

      <div class="purchase-block">
        <h3>PREPARACIÓN EXTRA</h3>
        <div class="extra-grid">
          ${types.map(t=>`<label class="extra-row"><span>${esc(t.label)}</span><input type="number" min="0" step="${t.unit==='pzas'?'1':'0.5'}" value="${nice(extra[t.key])}" data-extra-type="${esc(t.key)}" aria-label="Extra de ${esc(t.label)}"></label>`).join('')}
        </div>
      </div>

      <div class="purchase-block total-block">
        <h3>TOTAL A PREPARAR</h3>
        <div class="purchase-grid">
          ${totalTypes.map(t=>`<div class="purchase-chip"><span>${esc(t.label)}</span><b>${esc(qtyLabel(t,totals[t.key]))}</b></div>`).join('')}
        </div>
        ${cocktailTotal>0?'<div class="cocktail-note">Los cócteles ya se cuentan aquí. La compra de sus ingredientes se sumará completa cuando la receta por vaso quede conectada al inventario.</div>':''}
      </div>

      <div class="shopping-list-head">
        <div><h3>FALTA COMPRAR</h3><small>Pedidos encargados + preparación extra − inventario actual.</small></div>
        <div class="shopping-count">${shortages.length}</div>
      </div>

      ${shortages.length?`<div class="shopping-list-rows">${shortages.map(x=>{
        const item=ITEMS[x.k];
        return `<div class="shopping-row" role="button" tabindex="0" data-shopping-buy="${esc(x.k)}"><div><strong>${esc(item.name)}</strong><small>Necesitas ${esc(displayQty(x.k,x.need))} · Tienes ${esc(displayQty(x.k,x.have))}</small></div><div class="shopping-qty">Comprar ${esc(displayQty(x.k,x.lack))}</div></div>`;
      }).join('')}</div>`:'<div class="shopping-clear">✅ Con el inventario actual no te falta comprar nada para lo calculado.</div>'}
    `;
  }

  document.addEventListener('input',e=>{
    const input=e.target.closest('[data-extra-type]');
    if(!input)return;
    const key=input.dataset.extraType;
    let value=Math.max(0,Number(input.value||0));
    if(key==='cocktail')value=Math.floor(value);
    extra[key]=r3(value);
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
    }catch(e){console.warn('No se pudo actualizar Compras en vivo',e);}
  }

  setTimeout(renderList,250);
  setTimeout(renderList,1000);
  hookLive();
})();
