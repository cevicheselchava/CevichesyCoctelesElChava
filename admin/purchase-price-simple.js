(()=>{
  if(window.__EL_CUBANO_PURCHASE_PRICE_SIMPLE__)return;
  window.__EL_CUBANO_PURCHASE_PRICE_SIMPLE__=true;

  const E=id=>document.getElementById(id);
  const costWrap=E('entryCostWrap');
  const hiddenTotal=E('entryCost');
  const qty=E('entryQty');
  const qtyUnit=E('entryQtyUnit');
  const presentations=E('entryPresentations');
  const item=E('entryItem');
  if(!costWrap||!hiddenTotal||!qty||!qtyUnit||!presentations||!item)return;

  const labelSpan=costWrap.querySelector('span');
  hiddenTotal.type='hidden';
  hiddenTotal.removeAttribute('placeholder');

  const price=document.createElement('input');
  price.id='entryUnitPrice';
  price.type='number';
  price.min='0';
  price.step='0.01';
  price.inputMode='decimal';
  price.placeholder='$0.00';
  hiddenTotal.insertAdjacentElement('beforebegin',price);

  function unitText(){
    return String(qtyUnit.textContent||'unidad').trim()||'unidad';
  }

  function setPriceLabel(){
    const unit=unitText();
    if(labelSpan)labelSpan.textContent=unit==='—'?'Precio':'Precio por '+unit;
  }

  function syncTotal(){
    setPriceLabel();
    if(costWrap.hidden){
      hiddenTotal.value='';
      return;
    }
    const q=Number(qty.value||0),p=Number(price.value||0);
    if(String(price.value||'').trim()===''||!(q>0)||!Number.isFinite(p)||p<0){
      hiddenTotal.value='';
    }else{
      hiddenTotal.value=(q*p).toFixed(2);
    }
    hiddenTotal.dispatchEvent(new Event('input',{bubbles:true}));
  }

  function clearPrice(){
    price.value='';
    hiddenTotal.value='';
    setPriceLabel();
    hiddenTotal.dispatchEvent(new Event('input',{bubbles:true}));
  }

  price.addEventListener('input',syncTotal);
  qty.addEventListener('input',syncTotal);

  item.addEventListener('change',()=>queueMicrotask(clearPrice));
  presentations.addEventListener('click',e=>{
    if(!e.target.closest('[data-presentation]'))return;
    queueMicrotask(()=>{
      clearPrice();
      setPriceLabel();
    });
  });

  // Siempre calcula el total antes de que el flujo original guarde la compra.
  document.addEventListener('click',e=>{
    const button=e.target.closest('#entryAddLine,#entrySave');
    if(!button||costWrap.hidden)return;
    if(String(price.value||'').trim()===''){
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

  // Si cambia la presentación por código, actualiza la pregunta sin pedir cuentas al empleado.
  new MutationObserver(()=>setPriceLabel()).observe(presentations,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});

  // También deja sencilla la edición de una compra guardada: cantidad × precio.
  const editRoot=E('pmEdit');
  if(editRoot){
    const setupEditPrice=()=>{
      const totalInput=E('pmCost');
      const qInput=E('pmQty');
      if(!totalInput||!qInput||E('pmUnitPrice'))return;
      const total=Number(totalInput.value||0),q=Number(qInput.value||0);
      const labels=[...editRoot.querySelectorAll('label')];
      const presentationLabel=labels.find(l=>String(l.textContent||'').trim().startsWith('Presentación'));
      const presentation=presentationLabel?.querySelector('input')?.value||'unidad';
      const totalLabel=totalInput.closest('label');
      const directText=[...totalLabel.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&String(n.textContent||'').trim());
      if(directText)directText.textContent='Precio por '+presentation;
      totalInput.type='hidden';
      const pInput=document.createElement('input');
      pInput.id='pmUnitPrice';
      pInput.type='number';
      pInput.min='0';
      pInput.step='0.01';
      pInput.inputMode='decimal';
      pInput.value=q>0?(total/q).toFixed(2):'';
      totalInput.insertAdjacentElement('beforebegin',pInput);
      const syncEdit=()=>{
        const nq=Number(qInput.value||0),np=Number(pInput.value||0);
        totalInput.value=(nq>0&&Number.isFinite(np)&&np>=0)?(nq*np).toFixed(2):'';
      };
      pInput.addEventListener('input',syncEdit);
      qInput.addEventListener('input',syncEdit);
      syncEdit();
    };
    new MutationObserver(setupEditPrice).observe(editRoot,{childList:true,subtree:true});
  }

  document.addEventListener('click',e=>{
    const save=e.target.closest('#pmEditSave');
    if(!save)return;
    const p=E('pmUnitPrice'),q=E('pmQty'),total=E('pmCost');
    if(!p||!q||!total)return;
    if(String(p.value||'').trim()===''){
      e.preventDefault();e.stopImmediatePropagation();alert('Escribe el precio por presentación.');return;
    }
    total.value=(Number(q.value||0)*Number(p.value||0)).toFixed(2);
  },true);

  setPriceLabel();
})();