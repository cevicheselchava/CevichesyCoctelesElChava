(()=>{
  if(window.__EL_CUBANO_MANUAL_PRODUCT_POSITION_V1__)return;
  window.__EL_CUBANO_MANUAL_PRODUCT_POSITION_V1__=true;

  function moveProductField(){
    const field=document.getElementById('manualProductField');
    const kind=document.getElementById('moKind')?.closest('.quick-field');
    if(field&&kind&&kind.nextElementSibling!==field){
      kind.insertAdjacentElement('afterend',field);
    }
  }

  moveProductField();
  document.addEventListener('click',e=>{
    if(e.target.closest('#newOrderBtn,[data-action="edit"]'))setTimeout(moveProductField,0);
  });
})();
