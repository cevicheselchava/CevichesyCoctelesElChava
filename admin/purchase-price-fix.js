(()=>{
  if(window.__EL_CUBANO_PURCHASE_PRICE_FIX_V3__)return;
  window.__EL_CUBANO_PURCHASE_PRICE_FIX_V3__=true;

  const E=id=>document.getElementById(id);
  const wrap=E('entryCostWrap');
  const totalInput=E('entryCost');
  const qtyInput=E('entryQty');
  const qtyUnit=E('entryQtyUnit');
  const itemSelect=E('entryItem');
  const presentations=E('entryPresentations');
  if(!wrap||!totalInput||!qtyInput||!qtyUnit||!itemSelect||!presentations)return;

  const style=document.createElement('style');
  style.textContent=`
    #entryContentWrap[hidden],#entryCostWrap[hidden]{display:none!important}
    #entryPriceRow{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}
    #entryPriceUnit{padding:12px 14px;border-radius:13px;background:#eef3f8;color:#123458;white-space:nowrap;font-weight:1000}
  `;
  document.head.appendChild(style);

  const label=wrap.querySelector('span');
  const row=document.createElement('div');
  row.id='entryPriceRow';
  row.innerHTML=`<input id="entryUnitPrice" type="number" min="0" step="0.01" inputmode="decimal" placeholder="$0.00"><strong id="entryPriceUnit">precio</strong>`;
  totalInput.type='hidden';
  totalInput.removeAttribute('placeholder');
  totalInput.insertAdjacentElement('beforebegin',row);

  const priceInput=E('entryUnitPrice');
  const priceUnit=E('entryPriceUnit');

  function unitText(){
    const u=String(qtyUnit.textContent||'').trim();
    return u&&u!=='—'?u:'unidad';
  }

  function syncLabel(){
    const u=unitText();
    if(label)label.textContent=u==='unidad'?'Precio':'Precio por '+u;
    priceUnit.textContent=u==='unidad'?'precio':'por '+u;
  }

  function syncTotal(){
    syncLabel();
    if(wrap.hidden){totalInput.value='';return;}
    const raw=String(priceInput.value||'').trim();
    const qty=Number(qtyInput.value||0),price=Number(raw);
    if(raw===''||!(qty>0)||!Number.isFinite(price)||price<0)totalInput.value='';
    else totalInput.value=(qty*price).toFixed(2);
    totalInput.dispatchEvent(new Event('input',{bubbles:true}));
  }

  function clearPrice(){
    priceInput.value='';
    totalInput.value='';
    syncLabel();
    totalInput.dispatchEvent(new Event('input',{bubbles:true}));
  }

  priceInput.addEventListener('input',syncTotal);
  qtyInput.addEventListener('input',syncTotal);
  itemSelect.addEventListener('change',()=>queueMicrotask(clearPrice));
  presentations.addEventListener('click',e=>{
    if(!e.target.closest('[data-presentation]'))return;
    queueMicrotask(()=>{clearPrice();syncLabel();});
  });

  // Antes de guardar, el empleado solo escribe cantidad y precio. El sistema calcula el total.
  document.addEventListener('click',e=>{
    const button=e.target.closest('#entryAddLine,#entrySave');
    if(!button||wrap.hidden)return;
    if(String(priceInput.value||'').trim()===''){
      e.preventDefault();
      e.stopImmediatePropagation();
      alert('Escribe el precio por '+unitText()+'.');
      return;
    }
    syncTotal();
    queueMicrotask(()=>{
      if(!document.querySelector('#entryPresentations .presentation-btn.active'))clearPrice();
    });
  },true);

  document.addEventListener('click',e=>{
    if(!e.target.closest('#purchaseRegister,#purchaseReceive'))return;
    queueMicrotask(()=>{clearPrice();syncLabel();});
  });

  new MutationObserver(syncLabel).observe(presentations,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});

  // Al editar una compra guardada se mantiene la misma lógica: cantidad × precio.
  const editRoot=E('pmEdit');
  if(editRoot){
    const setupEditPrice=()=>{
      const hiddenCost=E('pmCost'),q=E('pmQty');
      if(!hiddenCost||!q||E('pmUnitPrice'))return;
      const labels=[...editRoot.querySelectorAll('label')];
      const presentationLabel=labels.find(l=>String(l.textContent||'').trim().startsWith('Presentación'));
      const presentation=presentationLabel?.querySelector('input')?.value||'unidad';
      const total=Number(hiddenCost.value||0),qty=Number(q.value||0);
      const costLabel=hiddenCost.closest('label');
      const directText=[...costLabel.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&String(n.textContent||'').trim());
      if(directText)directText.textContent='Precio por '+presentation;
      hiddenCost.type='hidden';
      const p=document.createElement('input');
      p.id='pmUnitPrice';p.type='number';p.min='0';p.step='0.01';p.inputMode='decimal';p.value=qty>0?(total/qty).toFixed(2):'';
      hiddenCost.insertAdjacentElement('beforebegin',p);
      const sync=()=>{
        const nq=Number(q.value||0),np=Number(p.value||0);
        hiddenCost.value=(nq>0&&Number.isFinite(np)&&np>=0)?(nq*np).toFixed(2):'';
      };
      p.addEventListener('input',sync);q.addEventListener('input',sync);sync();
    };
    new MutationObserver(setupEditPrice).observe(editRoot,{childList:true,subtree:true});
  }

  document.addEventListener('click',e=>{
    const save=e.target.closest('#pmEditSave');
    if(!save)return;
    const p=E('pmUnitPrice'),q=E('pmQty'),hiddenCost=E('pmCost');
    if(!p||!q||!hiddenCost)return;
    if(String(p.value||'').trim()===''){
      e.preventDefault();e.stopImmediatePropagation();alert('Escribe el precio por presentación.');return;
    }
    hiddenCost.value=(Number(q.value||0)*Number(p.value||0)).toFixed(2);
  },true);

  syncLabel();
})();