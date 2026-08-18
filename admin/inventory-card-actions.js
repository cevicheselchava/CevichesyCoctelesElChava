(()=>{
  if(window.__EL_CUBANO_INVENTORY_CARD_ACTIONS__)return;
  window.__EL_CUBANO_INVENTORY_CARD_ACTIONS__=true;

  const style=document.createElement('style');
  style.textContent=`
    #inventoryList .inv{cursor:pointer;transition:transform .12s ease,box-shadow .12s ease}
    #inventoryList .inv:active{transform:scale(.99)}
    #inventoryList .inv .inventory-card-buy{margin-top:8px;border:0;border-radius:10px;padding:8px 10px;background:#e8f5eb;color:#176b2c;font-weight:1000;font-size:13px}
  `;
  document.head.appendChild(style);

  function nameToKey(){
    return new Map(Object.entries(ITEMS||{}).map(([key,item])=>[String(item?.name||'').trim(),key]));
  }

  function decorateInventory(){
    const map=nameToKey();
    document.querySelectorAll('#inventoryList .inv').forEach(card=>{
      const name=card.querySelector('strong')?.textContent?.trim();
      const key=map.get(name);
      if(!key)return;
      card.dataset.inventoryKey=key;
      card.setAttribute('role','button');
      card.setAttribute('tabindex','0');
      card.setAttribute('aria-label',`Registrar compra de ${name}`);

      if(!card.querySelector('.inventory-card-buy')){
        const left=card.firstElementChild;
        if(left){
          const btn=document.createElement('button');
          btn.type='button';
          btn.className='inventory-card-buy';
          btn.textContent='➕ Comprar más / sumar';
          btn.addEventListener('click',e=>{
            e.stopPropagation();
            if(typeof openStock==='function')openStock(key,null);
          });
          left.appendChild(btn);
        }
      }
    });
  }

  const root=document.getElementById('inventoryList');
  if(root){
    root.addEventListener('click',e=>{
      if(e.target.closest('button'))return;
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