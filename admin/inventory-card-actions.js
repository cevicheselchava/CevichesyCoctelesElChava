(()=>{
  if(window.__EL_CUBANO_INVENTORY_CARD_ACTIONS_V2__)return;
  window.__EL_CUBANO_INVENTORY_CARD_ACTIONS_V2__=true;

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
      card.setAttribute('aria-label',`Ajustar inventario real de ${name}`);
    });
  }

  function openCard(key){
    if(typeof window.openAdjustInventoryForKey==='function')return window.openAdjustInventoryForKey(key);
    if(typeof openAdjustInventory==='function')return openAdjustInventory();
  }

  const root=document.getElementById('inventoryList');
  if(root){
    root.addEventListener('click',e=>{
      const card=e.target.closest('.inv[data-inventory-key]');
      if(!card)return;
      openCard(card.dataset.inventoryKey);
    });
    root.addEventListener('keydown',e=>{
      if(e.key!=='Enter'&&e.key!==' ')return;
      const card=e.target.closest('.inv[data-inventory-key]');
      if(!card)return;
      e.preventDefault();
      openCard(card.dataset.inventoryKey);
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