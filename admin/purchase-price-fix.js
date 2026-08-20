(()=>{
  if(window.__EL_CUBANO_PURCHASE_PRICE_FIX_V2__)return;
  window.__EL_CUBANO_PURCHASE_PRICE_FIX_V2__=true;

  const wrap=document.getElementById('entryCostWrap');
  const totalInput=document.getElementById('entryCost');
  if(!wrap||!totalInput)return;

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
  row.innerHTML=`<input id="entryUnitPrice" type="number" min="0" step="0.01" placeholder="$0.00"><strong id="entryPriceUnit">precio</strong>`;
  totalInput.type='hidden';
  totalInput.insertAdjacentElement('beforebegin',row);

  const priceInput=document.getElementById('entryUnitPrice');
  const priceUnit=document.getElementById('entryPriceUnit');
  const qtyInput=document.getElementById('entryQty');
  const qtyUnit=document.getElementById('entryQtyUnit');
  const itemSelect=document.getElementById('entryItem');
  const presentations=document.getElementById('entryPresentations');
  const addLine=document.getElementById('entryAddLine');

  function unitText(){
    const u=String(qtyUnit?.textContent||'').trim();
    return u&&u!=='—'?u:'unidad';
  }

  function syncLabel(){
    const u=unitText();
    if(label)label.textContent=u==='unidad'?'¿Cuál es el precio?':`¿Cuál es el precio por ${u}?`;
    if(priceUnit)priceUnit.textContent=u==='unidad'?'precio':`por ${u}`;
  }

  function syncTotal(){
    syncLabel();
    const raw=String(priceInput?.value||'').trim();
    if(raw===''){
      totalInput.value='';
      totalInput.dispatchEvent(new Event('input',{bubbles:true}));
      return;
    }
    const price=Number(raw),qty=Number(qtyInput?.value||0);
    if(!Number.isFinite(price)||price<0||!(qty>0)){
      totalInput.value='';
      totalInput.dispatchEvent(new Event('input',{bubbles:true}));
      return;
    }
    totalInput.value=String(price*qty);
    totalInput.dispatchEvent(new Event('input',{bubbles:true}));
  }

  function clearPrice(){
    if(priceInput)priceInput.value='';
    totalInput.value='';
    syncLabel();
    totalInput.dispatchEvent(new Event('input',{bubbles:true}));
  }

  priceInput?.addEventListener('input',syncTotal);
  qtyInput?.addEventListener('input',syncTotal);
  itemSelect?.addEventListener('change',()=>queueMicrotask(clearPrice));
  presentations?.addEventListener('click',e=>{
    if(!e.target.closest('[data-presentation]'))return;
    queueMicrotask(()=>{
      clearPrice();
      syncLabel();
    });
  });
  addLine?.addEventListener('click',()=>queueMicrotask(clearPrice));

  document.addEventListener('click',e=>{
    if(!e.target.closest('#purchaseRegister,#purchaseReceive'))return;
    queueMicrotask(()=>{
      clearPrice();
      syncLabel();
    });
  });

  syncLabel();
})();
