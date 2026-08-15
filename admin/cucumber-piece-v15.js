(()=>{
  if(window.__EL_CUBANO_CUCUMBER_PIECE_V15__)return;
  window.__EL_CUBANO_CUCUMBER_PIECE_V15__=true;

  const PIECES_PER_LB=1/6;
  const LEGACY_OZ_PER_PIECE=9.6;
  const VERSION='piece-v15';
  const round3=n=>Math.round((Number(n)+Number.EPSILON)*1000)/1000;

  function poundsFromOrder(o){
    if(Number(o?.pounds)>0)return Number(o.pounds);
    return (o?.items||[]).reduce((sum,i)=>{
      const qty=Math.max(0,Number(i.qty||0));
      const text=`${i.name||''} ${i.detail||''}`.toLowerCase();
      if(text.includes('½')||text.includes('1/2'))return sum+.5*qty;
      if(text.includes('libra')||text.includes(' lb'))return sum+qty;
      return sum;
    },0);
  }

  function patchItemDefinition(){
    if(typeof ITEMS==='undefined'||!ITEMS.cucumber)return false;
    ITEMS.cucumber={...ITEMS.cucumber,name:'Pepino',unit:'pzas',purchaseUnit:'pzas',factor:1,low:1};
    try{if(typeof fillProducts==='function')fillProducts();}catch(_){ }
    try{if(typeof renderAll==='function')renderAll();}catch(_){ }
    return true;
  }

  async function migrateInventoryOnce(){
    if(typeof inventoryRef==='undefined'||typeof firebase==='undefined')return;
    try{
      await db.runTransaction(async tx=>{
        const snap=await tx.get(inventoryRef);
        if(!snap.exists)return;
        const data=snap.data()||{};
        if(data?.unitVersions?.cucumber===VERSION)return;
        const oldOz=Math.max(0,Number(data?.items?.cucumber||0));
        const pieces=round3(oldOz/LEGACY_OZ_PER_PIECE);
        tx.update(inventoryRef,{
          'items.cucumber':pieces,
          'unitVersions.cucumber':VERSION,
          'unitMigrations.cucumber':{
            from:'oz',to:'pzas',oldQty:oldOz,newQty:pieces,legacyOzPerPiece:LEGACY_OZ_PER_PIECE,
            migratedAt:firebase.firestore.FieldValue.serverTimestamp()
          },
          updatedAt:firebase.firestore.FieldValue.serverTimestamp()
        });
      });
    }catch(e){console.warn('No se pudo migrar pepino a piezas:',e);}
  }

  async function normalizePendingOrders(){
    if(typeof db==='undefined'||typeof orders==='undefined'||typeof firebase==='undefined')return;
    const pending=orders.filter(o=>['nuevo','confirmado'].includes(o.status)&&o?.recipe&&Object.prototype.hasOwnProperty.call(o.recipe,'cucumber')&&o.cucumberUnitVersion!==VERSION);
    for(const o of pending){
      const pounds=poundsFromOrder(o);
      if(!(pounds>0))continue;
      const cucumber=round3(pounds*PIECES_PER_LB);
      try{
        await db.collection('pedidos').doc(o.id).update({
          'recipe.cucumber':cucumber,
          cucumberUnitVersion:VERSION,
          cucumberUnitMigratedAt:firebase.firestore.FieldValue.serverTimestamp()
        });
      }catch(e){console.warn('No se pudo normalizar pepino del pedido',o.id,e);}
    }
  }

  let attempts=0;
  const boot=setInterval(()=>{
    if(patchItemDefinition()||++attempts>80){clearInterval(boot);migrateInventoryOnce();normalizePendingOrders();}
  },100);

  setInterval(()=>{patchItemDefinition();normalizePendingOrders();},10000);
})();
