(()=>{
  if(window.__EL_CUBANO_MANUAL_DATA_PATCH_V18__)return;
  window.__EL_CUBANO_MANUAL_DATA_PATCH_V18__=true;

  const round3=n=>Math.round((Number(n)+Number.EPSILON)*1000)/1000;

  if(typeof db==='undefined')return;
  const sample=db.collection('pedidos').doc();
  const proto=Object.getPrototypeOf(sample);
  if(!proto||proto.__elCubanoManualSavePatchedV18)return;

  const originalSet=proto.set;
  if(typeof originalSet!=='function')return;

  proto.__elCubanoManualSavePatchedV18=true;
  proto.set=function(data,...args){
    if(data&&data.manualOrder){
      const pounds=Number(data.pounds||0);
      let next={...data};
      if(pounds>0&&next.recipe){
        next.recipe={...next.recipe,cucumber:round3(pounds/6)};
        next.cucumberUnitVersion='piece-v15';
      }
      if(String(next.source||'').startsWith('manual-')){
        next.manualSource=String(next.source).replace(/^manual-/,'');
        next.source='app-clientes';
      }
      data=next;
    }
    return originalSet.call(this,data,...args);
  };
})();
