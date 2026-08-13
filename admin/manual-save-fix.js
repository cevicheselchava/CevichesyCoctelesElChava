(()=>{
  if(typeof db==='undefined')return;
  const sample=db.collection('pedidos').doc();
  const proto=Object.getPrototypeOf(sample);
  if(!proto||proto.__elCubanoManualSavePatched)return;
  const originalSet=proto.set;
  if(typeof originalSet!=='function')return;
  proto.__elCubanoManualSavePatched=true;
  proto.set=function(data,...args){
    if(data&&data.manualOrder&&String(data.source||'').startsWith('manual-')){
      data={...data,manualSource:String(data.source).replace(/^manual-/,''),source:'app-clientes'};
    }
    return originalSet.call(this,data,...args);
  };
})();