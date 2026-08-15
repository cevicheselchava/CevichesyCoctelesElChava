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

  if(!document.getElementById('sodaOptionsEnhancement')){
    const script=document.createElement('script');
    script.id='sodaOptionsEnhancement';
    script.src='/admin/soda-options.js?v=20260814-1';
    document.body.appendChild(script);
  }
})();