(()=>{
  if(typeof db!=='undefined'){
    const sample=db.collection('pedidos').doc();
    const proto=Object.getPrototypeOf(sample);
    if(proto&&!proto.__elCubanoManualSavePatched){
      const originalSet=proto.set;
      if(typeof originalSet==='function'){
        proto.__elCubanoManualSavePatched=true;
        proto.set=function(data,...args){
          if(data&&data.manualOrder&&String(data.source||'').startsWith('manual-')){
            data={...data,manualSource:String(data.source).replace(/^manual-/,''),source:'app-clientes'};
          }
          return originalSet.call(this,data,...args);
        };
      }
    }
  }

  const loadPriceFix=()=>{
    if(document.getElementById('purchasePriceFixEnhancement'))return;
    const priceFix=document.createElement('script');
    priceFix.id='purchasePriceFixEnhancement';
    priceFix.src='/admin/purchase-price-fix.js?v=20260814-2';
    document.body.appendChild(priceFix);
  };

  if(!document.getElementById('sodaOptionsEnhancement')){
    const script=document.createElement('script');
    script.id='sodaOptionsEnhancement';
    script.src='/admin/soda-options.js?v=20260814-3';
    script.onload=loadPriceFix;
    script.onerror=loadPriceFix;
    document.body.appendChild(script);
  }else{
    loadPriceFix();
  }

  if(!document.getElementById('avocadoFixEnhancement')){
    const avocado=document.createElement('script');
    avocado.id='avocadoFixEnhancement';
    avocado.src='/admin/avocado-fix.js?v=20260814-2';
    document.body.appendChild(avocado);
  }

  if(!document.getElementById('historyBatchTotalEnhancement')){
    const history=document.createElement('script');
    history.id='historyBatchTotalEnhancement';
    history.src='/admin/history-batch-total.js?v=20260814-2';
    document.body.appendChild(history);
  }
})();