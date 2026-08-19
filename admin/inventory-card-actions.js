(()=>{
  if(window.__EL_CUBANO_INVENTORY_CARD_ACTIONS__)return;
  window.__EL_CUBANO_INVENTORY_CARD_ACTIONS__=true;

  const style=document.createElement('style');
  style.textContent=`
    #inventoryList .inv{cursor:pointer;transition:transform .12s ease,box-shadow .12s ease}
    #inventoryList .inv:active{transform:scale(.99)}
  `;
  document.head.appendChild(style);

  function nameToKey(){
    return new Map(Object.entries(ITEMS||{}).map(([key,item])=>[String(item?.name||'').trim(),key]));
  }

  function decorateInventory(){
    const map=nameToKey();
    document.querySelectorAll('#inventoryList .inv').forEach(card=>{
      card.querySelectorAll('.inventory-card-buy').forEach(btn=>btn.remove());
      const name=card.querySelector('strong')?.textContent?.trim();
      const key=map.get(name);
      if(!key)return;
      card.dataset.inventoryKey=key;
      card.setAttribute('role','button');
      card.setAttribute('tabindex','0');
      card.setAttribute('aria-label',`Registrar compra de ${name}`);
    });
  }

  const root=document.getElementById('inventoryList');
  if(root){
    root.addEventListener('click',e=>{
      const card=e.target.closest('.inv[data-inventory-key]');
      if(!card)return;
      if(typeof openStock==='function')openStock(card.dataset.inventoryKey,null);
    });
    root.addEventListener('keydown',e=>{
      if(e.key!=='Enter'&&e.key!==' ')return;
      const card=e.target.closest('.inv[data-inventory-key]');
      if(!card)return;
      e.preventDefault();
      if(typeof openStock==='function')openStock(card.dataset.inventoryKey,null);
    });
    new MutationObserver(decorateInventory).observe(root,{childList:true,subtree:true});
  }

  if(typeof renderInventory==='function'){
    const baseRenderInventory=renderInventory;
    renderInventory=function(...args){
      const out=baseRenderInventory.apply(this,args);
      queueMicrotask(decorateInventory);
      return out;
    };
  }

  decorateInventory();
})();