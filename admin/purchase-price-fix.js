(()=>{
  if(window.__EL_CUBANO_PURCHASE_PRICE_FIX_V1__)return;
  window.__EL_CUBANO_PURCHASE_PRICE_FIX_V1__=true;

  const style=document.createElement('style');
  style.id='el-cubano-purchase-price-fix-style';
  style.textContent=`
    #simpleOriginalTotalWrap{display:none!important}
    #simplePriceStep{grid-column:1/-1}
    #simplePriceStep input{margin-top:7px!important}
    #simplePricePreview{display:block;margin-top:10px;padding:10px 12px;border-radius:13px;background:#eef8ef;border:1px solid #b7d8bd;color:#267642;font-size:17px;font-weight:1000}
    #simpleSodaTotalPreview{display:block;margin-top:10px;padding:10px 12px;border-radius:13px;background:#eef8ef;border:1px solid #b7d8bd;color:#267642;font-size:17px;font-weight:1000}
    #simpleSodaPriceWrap.purchase-flow-step{grid-column:1/-1!important}
  `;
  document.head.appendChild(style);

  let lastSession='';
  let queued=false;

  function title(){return (document.getElementById('purchaseModalTitle')?.textContent||'').trim();}
  function cleanTitle(){return title().replace(/^Editar\s*·\s*/,'').trim();}
  function isEditing(){return /^Editar\s*·\s*/.test(title());}
  function isSoda(){
    const t=cleanTitle();
    return t==='Refrescos promo'||t==='Coca-Cola'||t==='Manzanita Sol'||t==='Sprite'||t==='Coke Zero'||t==='Dr Pepper'||t==='Big Red'||t==='Fanta';
  }
  function unitName(unit){
    const names={lb:'lb',oz:'oz',pzas:'pieza',latas:'lata',sobres:'sobre',manojo:'manojo','fl oz':'fl oz',package:'paquete'};
    return names[unit]||unit||'unidad';
  }

  function setHiddenTotal(value){
    const total=document.getElementById('simpleTotal');
    if(!total)return;
    const next=Number.isFinite(value)?value:0;
    const text=next>0?next.toFixed(2):'';
    if(total.value!==text){
      total.value=text;
      total.dispatchEvent(new Event('input',{bubbles:true}));
    }
  }

  function updateSummaryLabel(){
    const note=document.getElementById('simpleBuyNote');
    const label=note?.querySelector('.buy-note-card:last-child small');
    if(label&&label.textContent!=='💵 TOTAL A PAGAR')label.textContent='💵 TOTAL A PAGAR';
  }

  function calculateGeneral(){
    const form=document.getElementById('simplePurchaseForm');
    const price=document.getElementById('simpleUnitPrice');
    const qty=document.getElementById('simpleQty');
    const unit=document.getElementById('simpleUnit');
    const preview=document.getElementById('simplePricePreview');
    if(!form||!price||!qty||!unit||!preview||isSoda())return;
    const quantity=Math.max(0,Number(qty.value||0));
    const each=Number(price.value);
    const total=Number.isFinite(each)&&each>=0?quantity*each:0;
    const label=document.getElementById('simplePriceLabel');
    if(label)label.textContent=`Precio por ${unitName(unit.value)}`;
    preview.textContent=`Total a pagar: $${total.toFixed(2)}`;
    setHiddenTotal(total);
    setTimeout(updateSummaryLabel,0);
  }

  function calculateSoda(){
    if(!isSoda())return;
    const qty=document.getElementById('simpleQty');
    const unit=document.getElementById('simpleUnit');
    const sodaPrice=document.getElementById('simpleSodaPackPrice');
    const preview=document.getElementById('simpleSodaTotalPreview');
    if(!qty||!unit||!sodaPrice||!preview)return;
    const count=Math.max(0,Number(qty.value||0));
    const each=Number(sodaPrice.value);
    const total=Number.isFinite(each)&&each>=0?count*each:0;
    preview.textContent=`Total a pagar: $${total.toFixed(2)}`;
    setHiddenTotal(total);
    setTimeout(updateSummaryLabel,0);
  }

  function ensure(){
    const modal=document.getElementById('recipePurchaseModal');
    const form=document.getElementById('simplePurchaseForm');
    const total=document.getElementById('simpleTotal');
    if(!modal||!form||!total)return;

    const originalWrap=total.closest('label');
    if(originalWrap&&!originalWrap.id)originalWrap.id='simpleOriginalTotalWrap';

    let step=document.getElementById('simplePriceStep');
    if(!step){
      step=document.createElement('label');
      step.id='simplePriceStep';
      step.className='purchase-flow-step';
      step.dataset.step='4';
      step.innerHTML=`<span id="simplePriceLabel">Precio por unidad</span><input id="simpleUnitPrice" type="number" min="0" step="0.01" placeholder="$0.00"><strong id="simplePricePreview">Total a pagar: $0.00</strong>`;
      const note=document.getElementById('simpleBuyNote');
      form.insertBefore(step,note||null);
      const input=document.getElementById('simpleUnitPrice');
      input.addEventListener('input',calculateGeneral);
    }

    const sodaWrap=document.getElementById('simpleSodaPriceWrap');
    if(sodaWrap){
      let sodaPreview=document.getElementById('simpleSodaTotalPreview');
      if(!sodaPreview){
        sodaPreview=document.createElement('strong');
        sodaPreview.id='simpleSodaTotalPreview';
        sodaPreview.textContent='Total a pagar: $0.00';
        sodaWrap.appendChild(sodaPreview);
      }
      sodaWrap.classList.add('purchase-flow-step');
      sodaWrap.dataset.step='4';
      const sodaInput=document.getElementById('simpleSodaPackPrice');
      if(sodaInput&&!sodaInput.dataset.priceFixBound){
        sodaInput.dataset.priceFixBound='1';
        sodaInput.addEventListener('input',calculateSoda);
      }
    }

    const soda=isSoda()&&!modal.hidden;
    step.hidden=soda;
    if(sodaWrap)sodaWrap.classList.toggle('price-step-active',soda);

    const qty=document.getElementById('simpleQty');
    const unit=document.getElementById('simpleUnit');
    if(qty&&!qty.dataset.priceFixBound){
      qty.dataset.priceFixBound='1';
      qty.addEventListener('input',()=>isSoda()?calculateSoda():calculateGeneral());
    }
    if(unit&&!unit.dataset.priceFixBound){
      unit.dataset.priceFixBound='1';
      unit.addEventListener('change',()=>isSoda()?calculateSoda():calculateGeneral());
    }

    if(modal.hidden){lastSession='';return;}
    const session=`${title()}|${unit?.value||''}`;
    if(session!==lastSession){
      lastSession=session;
      if(!soda){
        const price=document.getElementById('simpleUnitPrice');
        const quantity=Math.max(0,Number(qty?.value||0));
        if(isEditing()){
          const existingTotal=Math.max(0,Number(total.value||0));
          price.value=quantity>0&&existingTotal>0?(existingTotal/quantity).toFixed(2):'';
        }else{
          price.value='';
        }
      }
    }

    if(soda)calculateSoda();else calculateGeneral();
    updateSummaryLabel();
  }

  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;ensure();});
  }

  schedule();
  const observer=new MutationObserver(schedule);
  observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden']});
})();