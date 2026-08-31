(()=>{
  'use strict';

  const STYLE_ID='el-cubano-approved-ui';

  function injectStyles(){
    document.getElementById(STYLE_ID)?.remove();
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      /* Esta capa ya no toca portada, fondos, beneficios ni categorías. */
      .products{grid-template-columns:1fr!important;gap:11px!important}
      .product{
        position:relative!important;
        min-height:0!important;
        display:grid!important;
        grid-template-columns:150px 1fr 165px!important;
        grid-template-rows:auto!important;
        align-items:center!important;
        gap:12px!important;
        padding:13px!important;
        border-radius:22px!important;
        background:rgba(255,255,255,.94)!important;
        border:1px solid #e8decb!important;
        box-shadow:0 3px 8px rgba(23,49,68,.045)!important;
        transition:none!important;
        animation:none!important;
      }
      .approved-product-image{
        grid-column:1!important;
        width:150px!important;
        height:122px!important;
        border-radius:17px!important;
        object-fit:cover!important;
        display:block!important;
      }
      .product>.approved-copy{grid-column:2!important;min-width:0!important}
      .product h3{color:#132f4f!important;font-size:22px!important;line-height:1.08!important;margin:0!important}
      .promo-section .product h3{color:#b52f26!important}
      .meta{color:#4e5e70!important;font-size:18px!important;line-height:1.22!important;min-height:0!important;margin-top:5px!important}
      .tag,.promo-save{font-size:14px!important;padding:5px 9px!important;margin-top:6px!important}
      .product>.bottom{
        grid-column:3!important;
        margin:0!important;
        display:flex!important;
        flex-direction:column!important;
        align-items:stretch!important;
        justify-content:center!important;
        gap:9px!important;
      }
      .price{
        width:100%!important;
        padding:7px 10px!important;
        border-radius:999px!important;
        background:#d9f36d!important;
        color:#075d2b!important;
        text-align:center!important;
        font-size:29px!important;
        line-height:1!important;
      }
      .price small{font-size:11px!important;margin-top:3px!important;color:#4c604a!important}
      .qty{justify-content:center!important;gap:9px!important;font-size:20px!important}
      .qty button{width:44px!important;height:44px!important;font-size:27px!important}
      .qty .plus{
        width:auto!important;
        min-width:118px!important;
        border-radius:999px!important;
        padding:0 19px!important;
        background:linear-gradient(100deg,#ff5539,#f04b32)!important;
        font-size:0!important;
      }
      .qty .plus::after{content:'Agregar';font-size:19px!important;font-weight:1000!important}

      .cart-modal{z-index:200!important;place-items:stretch center!important}
      .cart-backdrop{background:rgba(5,24,30,.58)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
      .cart-dialog{
        width:min(760px,100%)!important;
        max-height:96vh!important;
        margin-top:4vh!important;
        padding:20px 18px calc(22px + env(safe-area-inset-bottom))!important;
        border-radius:30px 30px 0 0!important;
        background:rgba(255,252,244,.98)!important;
      }
      .approved-cart-brand{text-align:center;margin:-4px 0 2px}
      .approved-cart-brand img{width:150px;max-height:115px;object-fit:contain}
      .cart-dialog h2{margin:0 48px 10px 0!important;color:#075d2b!important;font-size:clamp(34px,8vw,48px)!important;line-height:1!important}
      .cart-close{width:46px!important;height:46px!important;font-size:31px!important}
      .cart-items{gap:8px!important}
      .cart-row{background:#fff!important;padding:12px!important;border-radius:15px!important}
      .cart-row strong{font-size:18px!important}
      .cart-row small{font-size:15px!important}
      .cart-row-price{font-size:18px!important}
      .approved-empty-cart{padding:14px 12px!important;text-align:center!important;font-size:18px!important;font-weight:800!important;color:#69778b!important}
      .cart-total{display:none!important}
      #approved-cart-totals{margin:14px 0 12px!important;padding:13px 4px 10px!important;border-top:2px solid #e9ddc8!important;border-bottom:2px solid #e9ddc8!important}
      .approved-total-row{display:flex!important;justify-content:space-between!important;align-items:center!important;gap:12px!important;font-size:22px!important;font-weight:900!important;margin:7px 0!important}
      .approved-total-row.grand{margin-top:13px!important;padding-top:12px!important;border-top:1px solid #eadfcd!important;color:#075d2b!important;font-size:32px!important}
      .approved-total-row.grand span{font-size:38px!important}
      .cart-dialog .checkout{display:block!important;margin:12px 0 10px!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important}
      .cart-dialog .checkout h2{margin:10px 0 12px!important;font-size:26px!important;color:#17314f!important}
      .cart-dialog .fields{grid-template-columns:1fr 1fr!important;gap:10px!important}
      .cart-dialog input,.cart-dialog select,.cart-dialog textarea{min-height:62px!important;border-radius:18px!important;font-size:19px!important;padding:14px 17px!important;background:#fff!important}
      .cart-dialog textarea{min-height:92px!important}
      .cart-dialog .field-label{font-size:18px!important;gap:6px!important}
      .cart-dialog .full,.cart-dialog textarea{grid-column:1/-1!important}
      #approved-privacy-note{margin:12px 0!important;padding:13px 15px!important;border-radius:17px!important;background:#edf9e8!important;color:#197333!important;text-align:center!important;font-size:17px!important;line-height:1.3!important;font-weight:900!important}
      .cart-actions{grid-template-columns:.72fr 1.4fr!important;gap:9px!important;position:sticky!important;bottom:0!important;padding-top:7px!important;background:linear-gradient(180deg,rgba(255,252,244,0),rgba(255,252,244,.98) 28%)!important}
      .cart-actions button{min-height:58px!important;font-size:18px!important;border-radius:17px!important}
      .cart-primary{background:linear-gradient(95deg,#087a35,#0da544)!important;font-size:20px!important}
      body.approved-checkout-moved>.wrap>.checkout{display:none!important}

      @media(max-width:700px){
        .product{grid-template-columns:108px minmax(0,1fr)!important;grid-template-rows:auto auto!important;column-gap:12px!important;row-gap:10px!important;align-items:start!important;padding:12px!important}
        .approved-product-image{grid-column:1!important;grid-row:1/3!important;width:108px!important;height:108px!important;align-self:center!important}
        .product>.approved-copy{grid-column:2!important;grid-row:1!important}
        .product h3{font-size:21px!important}
        .meta{font-size:17px!important}
        .product>.bottom{grid-column:2!important;grid-row:2!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:8px!important;width:100%!important}
        .price{width:100%!important;font-size:27px!important;padding:9px 12px!important}
        .price small{display:none!important}
        .qty{width:100%!important;display:grid!important;grid-template-columns:44px 38px minmax(0,1fr)!important;align-items:center!important;gap:7px!important;font-size:20px!important}
        .qty button{width:44px!important;height:44px!important}
        .qty span{text-align:center!important}
        .qty .plus{width:100%!important;min-width:0!important;height:44px!important;padding:0 12px!important}
        .qty .plus::after{font-size:18px!important}
        .cart-dialog{padding:16px 14px calc(19px + env(safe-area-inset-bottom))!important}
        .cart-dialog .fields{grid-template-columns:1fr!important}
        .cart-dialog .full,.cart-dialog textarea{grid-column:1!important}
        .cart-actions{grid-template-columns:1fr!important}
        .cart-secondary{order:2!important}
      }
      @media(max-width:430px){
        .product{grid-template-columns:98px minmax(0,1fr)!important;column-gap:10px!important}
        .approved-product-image{width:98px!important;height:98px!important}
        .product h3{font-size:19px!important}
        .meta{font-size:16px!important}
        .price{font-size:25px!important}
        .qty{grid-template-columns:42px 34px minmax(0,1fr)!important;gap:6px!important}
        .qty button{width:42px!important;height:42px!important}
        .qty .plus{height:42px!important}
        .qty .plus::after{font-size:17px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function decorateCard(card){
    if(!card||card.dataset.approvedDecorated==='1') return;
    const first=card.firstElementChild;
    const bottom=card.querySelector(':scope > .bottom');
    if(first&&!first.classList.contains('approved-copy')) first.classList.add('approved-copy');
    if(!card.querySelector('.approved-product-image')){
      const image=document.createElement('img');
      image.className='approved-product-image';
      image.src='/ceviche-real.svg';
      image.alt='Ceviche fresco';
      card.insertBefore(image,first||card.firstChild);
    }
    if(bottom) bottom.classList.add('approved-bottom');
    card.dataset.approvedDecorated='1';
  }

  function decorateExisting(){
    document.querySelectorAll('.product').forEach(decorateCard);
  }

  function observeProducts(){
    decorateExisting();
    document.querySelectorAll('.products').forEach(container=>{
      if(container.dataset.approvedObserved==='1') return;
      container.dataset.approvedObserved='1';
      new MutationObserver(mutations=>{
        for(const mutation of mutations){
          for(const node of mutation.addedNodes){
            if(node.nodeType!==1) continue;
            if(node.matches?.('.product')) decorateCard(node);
            node.querySelectorAll?.('.product').forEach(decorateCard);
          }
        }
      }).observe(container,{childList:true});
    });
  }

  function cartTotalText(){
    return document.getElementById('cartTotal')?.textContent?.trim()||document.getElementById('total')?.textContent?.trim()||'$0.00';
  }

  function updateTotals(){
    const total=cartTotalText();
    const subtotal=document.getElementById('approved-subtotal');
    const grand=document.getElementById('approved-grand-total');
    if(subtotal) subtotal.textContent=total;
    if(grand) grand.textContent=total;
  }

  function buildCart(){
    if(window.__approvedCartBuilt) return;
    const modal=document.getElementById('cartModal');
    const dialog=modal?.querySelector('.cart-dialog');
    const cartTitle=document.getElementById('cartTitle');
    const checkout=document.getElementById('checkout');
    const actions=dialog?.querySelector('.cart-actions');
    if(!modal||!dialog||!cartTitle||!checkout||!actions) return;
    window.__approvedCartBuilt=true;

    if(!dialog.querySelector('.approved-cart-brand')){
      const brand=document.createElement('div');
      brand.className='approved-cart-brand';
      brand.innerHTML='<img src="/el-cubano-logo-transparent.png" alt="El Cubano">';
      dialog.insertBefore(brand,cartTitle);
    }
    cartTitle.textContent='🛒 Tu pedido';

    let totals=document.getElementById('approved-cart-totals');
    if(!totals){
      totals=document.createElement('div');
      totals.id='approved-cart-totals';
      totals.innerHTML='<div class="approved-total-row"><strong>Subtotal:</strong><span id="approved-subtotal">$0.00</span></div><div class="approved-total-row"><strong>Envío:</strong><span>$0.00</span></div><div class="approved-total-row grand"><strong>Total:</strong><span id="approved-grand-total">$0.00</span></div>';
      const hiddenTotal=dialog.querySelector('.cart-total');
      if(hiddenTotal) hiddenTotal.insertAdjacentElement('afterend',totals);
      else dialog.querySelector('.cart-items')?.insertAdjacentElement('afterend',totals);
    }

    if(checkout.parentElement!==dialog){
      actions.insertAdjacentElement('beforebegin',checkout);
      document.body.classList.add('approved-checkout-moved');
    }

    const heading=checkout.querySelector('h2');
    if(heading) heading.textContent='Datos de entrega';
    const name=document.getElementById('name');
    const phone=document.getElementById('phone');
    const address=document.getElementById('address');
    const notes=document.getElementById('notes');
    if(name) name.placeholder='Tu nombre completo';
    if(phone) phone.placeholder='Tu WhatsApp';
    if(address) address.placeholder='Dirección completa de entrega';
    if(notes) notes.placeholder='Referencia de la casa o negocio';

    let privacy=document.getElementById('approved-privacy-note');
    if(!privacy){
      privacy=document.createElement('div');
      privacy.id='approved-privacy-note';
      privacy.textContent='🔒 Tus datos solo se usan para confirmar y entregar tu pedido.';
      checkout.insertAdjacentElement('afterend',privacy);
    }

    const keep=document.getElementById('keepShopping');
    const continueButton=document.getElementById('continueOrder');
    if(keep) keep.textContent='Seguir comprando';
    if(continueButton) continueButton.textContent='💬 Continuar por WhatsApp';

    const openCart=()=>{
      if(typeof window.renderCart==='function') window.renderCart();
      const items=document.getElementById('cartItems');
      if(items&&!items.children.length) items.innerHTML='<div class="approved-empty-cart">Todavía no agregas productos.</div>';
      updateTotals();
      modal.hidden=false;
      document.body.classList.add('modal-open');
      dialog.scrollTop=0;
    };

    const send=document.getElementById('send');
    const cartTop=document.getElementById('cartTop');
    if(send) send.onclick=openCart;
    if(cartTop) cartTop.onclick=openCart;

    document.addEventListener('click',event=>{
      const button=event.target.closest('#continueOrder');
      if(!button) return;
      const required=['name','phone','date','time','address','zip'];
      const missing=required.map(id=>document.getElementById(id)).find(field=>!field||!String(field.value||'').trim());
      const hasProducts=typeof window.chosenProducts==='function'?window.chosenProducts().length>0:true;
      if(!hasProducts||missing){
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        if(!hasProducts){alert('Agrega al menos un producto al pedido.');return;}
        missing?.focus();
        missing?.scrollIntoView({behavior:'auto',block:'center'});
        alert('Completa tus datos de entrega antes de continuar.');
      }
    },true);

    const originalRenderCart=window.renderCart;
    if(typeof originalRenderCart==='function'&&!window.__approvedRenderCartWrapped){
      window.__approvedRenderCartWrapped=true;
      window.renderCart=function(...args){
        const result=originalRenderCart.apply(this,args);
        const items=document.getElementById('cartItems');
        if(items&&!items.children.length) items.innerHTML='<div class="approved-empty-cart">Todavía no agregas productos.</div>';
        updateTotals();
        return result;
      };
    }
  }

  function closeCategories(){
    document.querySelectorAll('.section[data-group]').forEach(section=>{
      section.classList.remove('open');
      section.querySelector('.section-title')?.setAttribute('aria-expanded','false');
    });
    document.querySelectorAll('#customer-category-nav button[data-group]').forEach(button=>{
      button.classList.remove('active');
      button.setAttribute('aria-pressed','false');
    });
  }

  function apply(){
    injectStyles();
    closeCategories();
    observeProducts();
    buildCart();
  }

  /* Sin espera de 650 ms ni segunda pasada: se aplica una sola vez. */
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply,{once:true});
  else apply();
})();