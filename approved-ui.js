(() => {
  'use strict';

  const APPROVED_STYLE_ID = 'el-cubano-approved-ui';

  function injectStyles() {
    document.getElementById(APPROVED_STYLE_ID)?.remove();
    const style = document.createElement('style');
    style.id = APPROVED_STYLE_ID;
    style.textContent = `
      :root{
        --approved-green:#0d7a32;
        --approved-green-dark:#075c27;
        --approved-red:#ef4e3d;
        --approved-yellow:#f5c82f;
        --approved-cream:#fff8e8;
        --approved-ink:#17314f;
        --approved-line:#e8decb;
      }

      body{
        background:
          linear-gradient(rgba(255,248,232,.88),rgba(255,248,232,.92)),
          url('/el-cubano-logo-transparent.png') center 54%/520px auto fixed no-repeat!important;
        color:var(--approved-ink)!important;
        padding-bottom:108px!important;
      }

      body::before{
        background:
          linear-gradient(90deg,rgba(14,111,48,.06),transparent 30%,rgba(245,200,47,.08) 55%,rgba(239,78,61,.06)),
          url('/ceviche-real.svg') center 30%/760px auto fixed no-repeat!important;
        opacity:.15!important;
      }

      .wrap{max-width:980px!important;padding:12px!important}

      #language-switch{margin:2px 3px 10px!important}
      #language-switch button{font-size:18px!important;padding:9px 12px!important}

      .hero{
        overflow:hidden!important;
        border-radius:28px!important;
        background:rgba(255,252,244,.87)!important;
        border:1px solid rgba(231,220,201,.98)!important;
        box-shadow:0 12px 28px rgba(35,56,71,.10)!important;
        padding:16px 18px 19px!important;
      }
      .hero::after{height:7px!important}

      .customer-brand-row{
        display:block!important;
        min-height:0!important;
        padding:0!important;
        margin:0 auto 8px!important;
        text-align:center!important;
      }
      .main-logo{
        width:min(255px,68vw)!important;
        height:auto!important;
        max-height:235px!important;
        margin:0 auto!important;
        filter:drop-shadow(0 8px 12px rgba(22,53,58,.16))!important;
      }
      .customer-brand-copy{
        display:block!important;
        text-align:center!important;
        margin:0 auto 7px!important;
      }
      .customer-brand-copy strong{
        display:block!important;
        color:#075d2b!important;
        font-size:clamp(34px,8vw,62px)!important;
        line-height:1.02!important;
        letter-spacing:-1px!important;
        font-weight:1000!important;
      }
      .customer-brand-copy span{
        display:block!important;
        margin-top:2px!important;
        color:#cf3024!important;
        font-family:Georgia,'Times New Roman',serif!important;
        font-size:clamp(43px,10vw,70px)!important;
        line-height:1!important;
        font-style:italic!important;
      }
      .customer-brand-copy small{
        display:block!important;
        margin-top:7px!important;
        color:#6f5139!important;
        font-size:clamp(18px,4.5vw,25px)!important;
        line-height:1.18!important;
        font-weight:900!important;
      }

      .customer-food-hero{
        margin:12px 0 12px!important;
        border-radius:24px!important;
        box-shadow:0 10px 24px rgba(23,49,68,.12)!important;
      }
      .customer-food-hero img{
        aspect-ratio:16/9!important;
        min-height:250px!important;
        object-fit:cover!important;
      }
      .customer-food-copy{
        left:14px!important;
        right:auto!important;
        bottom:13px!important;
        width:min(510px,calc(100% - 28px))!important;
        padding:14px 16px!important;
        border-radius:20px!important;
        background:linear-gradient(135deg,#087a35,#075b2b)!important;
        text-shadow:none!important;
      }
      .customer-food-copy strong{font-size:22px!important;line-height:1.15!important}
      .customer-food-copy span{font-size:17px!important;color:#ffe267!important;line-height:1.2!important}

      .hero>h1,.hero>p{display:none!important}

      #approved-order-cta{
        width:min(560px,92%)!important;
        margin:12px auto 11px!important;
        min-height:64px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        border:0!important;
        border-radius:999px!important;
        background:linear-gradient(100deg,#ff5539,#f56c40)!important;
        color:#fff!important;
        font-size:clamp(22px,5.4vw,32px)!important;
        font-weight:1000!important;
        box-shadow:0 9px 20px rgba(221,69,46,.23)!important;
      }

      .benefits{
        display:grid!important;
        grid-template-columns:repeat(4,minmax(0,1fr))!important;
        gap:8px!important;
        margin:10px 0 2px!important;
      }
      .benefit{
        min-height:88px!important;
        display:flex!important;
        flex-direction:column!important;
        justify-content:center!important;
        padding:10px 8px 13px!important;
        border-radius:18px!important;
        background:rgba(255,255,255,.92)!important;
        font-size:15px!important;
        line-height:1.12!important;
        color:#26384f!important;
        box-shadow:0 7px 17px rgba(28,52,67,.07)!important;
      }
      .benefit b{font-size:17px!important;line-height:1.12!important;margin-bottom:3px!important}

      #customer-category-nav{
        grid-template-columns:repeat(5,minmax(0,1fr))!important;
        gap:7px!important;
        margin:14px 0 16px!important;
        padding:8px!important;
        border-radius:22px!important;
      }
      #customer-category-nav button{
        min-height:82px!important;
        border-radius:17px!important;
        font-size:13px!important;
        padding:9px 4px 12px!important;
      }
      #customer-category-nav .cat-icon{font-size:27px!important}
      #customer-category-nav .cat-label{font-size:13px!important;font-weight:1000!important}

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
        background:rgba(255,255,255,.91)!important;
        border:1px solid var(--approved-line)!important;
        box-shadow:0 7px 17px rgba(23,49,68,.065)!important;
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
      .product h3{
        color:#132f4f!important;
        font-size:22px!important;
        line-height:1.08!important;
        margin:0!important;
      }
      .promo-section .product h3{color:#b52f26!important}
      .meta{
        color:#4e5e70!important;
        font-size:18px!important;
        line-height:1.22!important;
        min-height:0!important;
        margin-top:5px!important;
      }
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
      .qty button{
        width:44px!important;
        height:44px!important;
        font-size:27px!important;
      }
      .qty .plus{
        width:auto!important;
        min-width:118px!important;
        border-radius:999px!important;
        padding:0 19px!important;
        background:linear-gradient(100deg,#ff5539,#f04b32)!important;
        font-size:0!important;
      }
      .qty .plus::after{
        content:'Agregar';
        font-size:19px!important;
        font-weight:1000!important;
      }

      .notice,.availability-note{
        font-size:17px!important;
        line-height:1.35!important;
        padding:14px 16px!important;
      }

      .sticky{
        min-height:78px!important;
        background:linear-gradient(95deg,#087b35,#12b752)!important;
        padding:9px max(12px,calc((100% - 980px)/2 + 12px)) calc(9px + env(safe-area-inset-bottom))!important;
      }
      .summary b{font-size:0!important}
      .summary b::before{content:'🛒  Ver pedido';font-size:24px!important;font-weight:1000!important}
      .summary b span{
        display:inline-flex!important;
        margin-left:14px!important;
        min-width:105px!important;
        justify-content:center!important;
        padding:9px 13px!important;
        border-radius:999px!important;
        background:rgba(255,255,255,.20)!important;
        color:#fff!important;
        font-size:22px!important;
      }
      .summary small{display:none!important}
      .send{
        position:absolute!important;
        inset:0!important;
        width:100%!important;
        opacity:0!important;
        z-index:3!important;
      }

      .cart-modal{z-index:200!important;place-items:stretch center!important}
      .cart-backdrop{background:rgba(5,24,30,.58)!important;backdrop-filter:blur(3px)}
      .cart-dialog{
        width:min(760px,100%)!important;
        max-height:96vh!important;
        margin-top:4vh!important;
        padding:20px 18px calc(22px + env(safe-area-inset-bottom))!important;
        border-radius:30px 30px 0 0!important;
        background:
          linear-gradient(rgba(255,252,244,.94),rgba(255,252,244,.97)),
          url('/el-cubano-logo-transparent.png') center 48%/420px auto no-repeat!important;
      }
      .approved-cart-brand{text-align:center;margin:-4px 0 2px}
      .approved-cart-brand img{width:170px;max-height:125px;object-fit:contain}
      .cart-dialog h2{
        margin:0 48px 10px 0!important;
        color:#075d2b!important;
        font-size:clamp(36px,8vw,52px)!important;
        line-height:1!important;
      }
      .cart-close{width:46px!important;height:46px!important;font-size:31px!important}
      .cart-items{gap:8px!important}
      .cart-row{
        background:rgba(255,255,255,.93)!important;
        padding:12px!important;
        border-radius:15px!important;
      }
      .cart-row strong{font-size:18px!important}
      .cart-row small{font-size:15px!important}
      .cart-row-price{font-size:18px!important}
      .approved-empty-cart{
        padding:14px 12px!important;
        text-align:center!important;
        font-size:18px!important;
        font-weight:800!important;
        color:#69778b!important;
      }
      .cart-total{display:none!important}
      #approved-cart-totals{
        margin:14px 0 12px!important;
        padding:13px 4px 10px!important;
        border-top:2px solid #e9ddc8!important;
        border-bottom:2px solid #e9ddc8!important;
      }
      .approved-total-row{
        display:flex!important;
        justify-content:space-between!important;
        align-items:center!important;
        gap:12px!important;
        font-size:22px!important;
        font-weight:900!important;
        margin:7px 0!important;
      }
      .approved-total-row.grand{
        margin-top:13px!important;
        padding-top:12px!important;
        border-top:1px solid #eadfcd!important;
        color:#075d2b!important;
        font-size:34px!important;
      }
      .approved-total-row.grand span{font-size:40px!important}

      .cart-dialog .checkout{
        display:block!important;
        margin:12px 0 10px!important;
        padding:0!important;
        background:transparent!important;
        border:0!important;
        box-shadow:none!important;
      }
      .cart-dialog .checkout h2{
        margin:10px 0 12px!important;
        font-size:26px!important;
        color:#17314f!important;
      }
      .cart-dialog .fields{grid-template-columns:1fr 1fr!important;gap:10px!important}
      .cart-dialog input,.cart-dialog select,.cart-dialog textarea{
        min-height:62px!important;
        border-radius:18px!important;
        font-size:19px!important;
        padding:14px 17px!important;
        background:rgba(255,255,255,.93)!important;
      }
      .cart-dialog textarea{min-height:92px!important}
      .cart-dialog .field-label{font-size:18px!important;gap:6px!important}
      .cart-dialog .full,.cart-dialog textarea{grid-column:1/-1!important}
      #approved-privacy-note{
        margin:12px 0!important;
        padding:13px 15px!important;
        border-radius:17px!important;
        background:#edf9e8!important;
        color:#197333!important;
        text-align:center!important;
        font-size:17px!important;
        line-height:1.3!important;
        font-weight:900!important;
      }
      .cart-actions{
        grid-template-columns:.72fr 1.4fr!important;
        gap:9px!important;
        position:sticky!important;
        bottom:0!important;
        padding-top:7px!important;
        background:linear-gradient(180deg,rgba(255,252,244,0),rgba(255,252,244,.96) 28%)!important;
      }
      .cart-actions button{min-height:58px!important;font-size:18px!important;border-radius:17px!important}
      .cart-primary{
        background:linear-gradient(95deg,#087a35,#0da544)!important;
        font-size:20px!important;
      }

      body.approved-checkout-moved>.wrap>.checkout{display:none!important}

      @media(max-width:700px){
        .hero{padding:13px 12px 17px!important}
        .main-logo{width:min(205px,59vw)!important}
        .customer-brand-copy strong{font-size:34px!important}
        .customer-brand-copy span{font-size:46px!important}
        .customer-brand-copy small{font-size:19px!important}
        .customer-food-hero img{min-height:255px!important;aspect-ratio:1.32/1!important}
        .customer-food-copy{left:10px!important;bottom:10px!important;width:calc(100% - 20px)!important}
        .customer-food-copy strong{font-size:19px!important}
        .customer-food-copy span{font-size:16px!important}
        #approved-order-cta{min-height:60px!important;font-size:25px!important}
        .benefits{grid-template-columns:1fr 1fr!important}
        .benefit{min-height:83px!important;font-size:15px!important}
        .benefit b{font-size:17px!important}
        #customer-category-nav{gap:5px!important;padding:6px!important}
        #customer-category-nav button{min-height:76px!important;font-size:11px!important}
        #customer-category-nav .cat-label{font-size:11px!important}
        #customer-category-nav .cat-icon{font-size:24px!important}

        .product{
          grid-template-columns:122px minmax(0,1fr)!important;
          grid-template-rows:auto auto!important;
          gap:9px 11px!important;
          padding:11px!important;
        }
        .approved-product-image{width:122px!important;height:112px!important;grid-row:1/3!important}
        .product>.approved-copy{grid-column:2!important;grid-row:1!important}
        .product>.bottom{grid-column:2!important;grid-row:2!important;display:grid!important;grid-template-columns:1fr auto!important;align-items:center!important;gap:8px!important}
        .product h3{font-size:20px!important}
        .meta{font-size:17px!important}
        .price{font-size:25px!important;padding:7px 8px!important}
        .qty{gap:6px!important}
        .qty button{width:40px!important;height:40px!important}
        .qty .plus{min-width:105px!important;padding:0 14px!important}
        .qty .plus::after{font-size:17px!important}

        .cart-dialog{padding:16px 14px calc(19px + env(safe-area-inset-bottom))!important}
        .approved-cart-brand img{width:140px!important}
        .cart-dialog h2{font-size:39px!important}
        .approved-total-row{font-size:20px!important}
        .approved-total-row.grand{font-size:30px!important}
        .approved-total-row.grand span{font-size:34px!important}
        .cart-dialog .fields{grid-template-columns:1fr!important}
        .cart-dialog .full,.cart-dialog textarea{grid-column:1!important}
        .cart-dialog input,.cart-dialog select,.cart-dialog textarea{font-size:19px!important;min-height:64px!important}
        .cart-actions{grid-template-columns:1fr!important}
        .cart-secondary{order:2!important}
      }

      @media(max-width:430px){
        .customer-brand-copy strong{font-size:31px!important}
        .customer-brand-copy span{font-size:43px!important}
        #customer-category-nav button{min-height:72px!important;padding-left:2px!important;padding-right:2px!important}
        #customer-category-nav .cat-label{font-size:10px!important}
        .product{grid-template-columns:105px minmax(0,1fr)!important}
        .approved-product-image{width:105px!important;height:105px!important}
        .product h3{font-size:19px!important}
        .meta{font-size:16px!important}
        .price{font-size:23px!important}
        .qty .plus{min-width:96px!important}
        .qty .plus::after{font-size:16px!important}
        .summary b::before{font-size:22px!important}
        .summary b span{font-size:20px!important;min-width:92px!important;margin-left:8px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function buildApprovedHero() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const brandCopy = hero.querySelector('.customer-brand-copy');
    if (brandCopy) {
      const strong = brandCopy.querySelector('strong');
      const span = brandCopy.querySelector('span');
      const small = brandCopy.querySelector('small');
      if (strong) strong.textContent = 'Ceviches & Cócteles';
      if (span) span.textContent = 'El Cubano';
      if (small) small.textContent = 'Fresco · preparado al momento';
    }

    let cta = document.getElementById('approved-order-cta');
    if (!cta) {
      cta = document.createElement('button');
      cta.id = 'approved-order-cta';
      cta.type = 'button';
      cta.textContent = '📲 Haz tu pedido';
      const food = hero.querySelector('.customer-food-hero');
      if (food) food.insertAdjacentElement('afterend', cta);
      else hero.appendChild(cta);
      cta.addEventListener('click', () => {
        document.getElementById('customer-category-nav')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    let benefits = document.querySelector('.benefits');
    if (!benefits) {
      benefits = document.createElement('div');
      benefits.className = 'benefits';
    }
    benefits.innerHTML = `
      <div class="benefit"><b>📍 San Antonio</b>Área de servicio</div>
      <div class="benefit"><b>🚚 Delivery gratis</b>En área delimitada</div>
      <div class="benefit"><b>💵 Cash App / Efectivo</b>Paga al recibir</div>
      <div class="benefit"><b>🔥 Salsas caseras</b>Preparadas al momento</div>
    `;
    cta.insertAdjacentElement('afterend', benefits);

    const secondLabel = document.querySelector('#customer-category-nav button[data-group="immediate"] .cat-label');
    if (secondLabel) secondLabel.textContent = 'Ceviches';
  }

  function decorateProducts() {
    document.querySelectorAll('.product').forEach(card => {
      if (card.dataset.approvedDecorated === '1') return;
      const first = card.firstElementChild;
      const bottom = card.querySelector(':scope > .bottom');
      if (first && !first.classList.contains('approved-copy')) first.classList.add('approved-copy');
      if (!card.querySelector('.approved-product-image')) {
        const image = document.createElement('img');
        image.className = 'approved-product-image';
        image.src = '/ceviche-real.svg';
        image.alt = 'Ceviche fresco';
        card.insertBefore(image, first || card.firstChild);
      }
      if (bottom) bottom.classList.add('approved-bottom');
      card.dataset.approvedDecorated = '1';
    });
  }

  function observeProducts() {
    decorateProducts();
    document.querySelectorAll('.products').forEach(container => {
      if (container.dataset.approvedObserved === '1') return;
      container.dataset.approvedObserved = '1';
      new MutationObserver(() => decorateProducts()).observe(container, { childList: true });
    });
  }

  function cartTotalText() {
    const current = document.getElementById('cartTotal')?.textContent?.trim();
    if (current) return current;
    return document.getElementById('total')?.textContent?.trim() || '$0.00';
  }

  function updateApprovedTotals() {
    const total = cartTotalText();
    const subtotal = document.getElementById('approved-subtotal');
    const grand = document.getElementById('approved-grand-total');
    if (subtotal) subtotal.textContent = total;
    if (grand) grand.textContent = total;
  }

  function buildApprovedCart() {
    const modal = document.getElementById('cartModal');
    const dialog = modal?.querySelector('.cart-dialog');
    const cartTitle = document.getElementById('cartTitle');
    const checkout = document.getElementById('checkout');
    const actions = dialog?.querySelector('.cart-actions');
    if (!modal || !dialog || !cartTitle || !checkout || !actions) return;

    if (!dialog.querySelector('.approved-cart-brand')) {
      const brand = document.createElement('div');
      brand.className = 'approved-cart-brand';
      brand.innerHTML = '<img src="/el-cubano-logo-transparent.png" alt="El Cubano">';
      dialog.insertBefore(brand, cartTitle);
    }

    cartTitle.textContent = '🛒 Tu pedido';

    let totals = document.getElementById('approved-cart-totals');
    if (!totals) {
      totals = document.createElement('div');
      totals.id = 'approved-cart-totals';
      totals.innerHTML = `
        <div class="approved-total-row"><strong>Subtotal:</strong><span id="approved-subtotal">$0.00</span></div>
        <div class="approved-total-row"><strong>Envío:</strong><span>$0.00</span></div>
        <div class="approved-total-row grand"><strong>Total:</strong><span id="approved-grand-total">$0.00</span></div>
      `;
      const hiddenTotal = dialog.querySelector('.cart-total');
      if (hiddenTotal) hiddenTotal.insertAdjacentElement('afterend', totals);
      else dialog.querySelector('.cart-items')?.insertAdjacentElement('afterend', totals);
    }

    if (checkout.parentElement !== dialog) {
      actions.insertAdjacentElement('beforebegin', checkout);
      document.body.classList.add('approved-checkout-moved');
    }

    const heading = checkout.querySelector('h2');
    if (heading) heading.textContent = 'Datos de entrega';
    const name = document.getElementById('name');
    const phone = document.getElementById('phone');
    const address = document.getElementById('address');
    const notes = document.getElementById('notes');
    if (name) name.placeholder = 'Tu nombre completo';
    if (phone) phone.placeholder = 'Tu WhatsApp';
    if (address) address.placeholder = 'Dirección completa de entrega';
    if (notes) notes.placeholder = 'Referencia de la casa o negocio';

    let privacy = document.getElementById('approved-privacy-note');
    if (!privacy) {
      privacy = document.createElement('div');
      privacy.id = 'approved-privacy-note';
      privacy.textContent = '🔒 Tus datos solo se usan para confirmar y entregar tu pedido.';
      checkout.insertAdjacentElement('afterend', privacy);
    }

    const keep = document.getElementById('keepShopping');
    const continueButton = document.getElementById('continueOrder');
    if (keep) keep.textContent = 'Seguir comprando';
    if (continueButton) continueButton.textContent = '💬 Continuar por WhatsApp';

    const approvedOpenCart = () => {
      if (typeof window.renderCart === 'function') window.renderCart();
      const items = document.getElementById('cartItems');
      if (items && !items.children.length) {
        items.innerHTML = '<div class="approved-empty-cart">Todavía no agregas productos.</div>';
      }
      updateApprovedTotals();
      modal.hidden = false;
      document.body.classList.add('modal-open');
      dialog.scrollTop = 0;
    };

    const send = document.getElementById('send');
    const cartTop = document.getElementById('cartTop');
    if (send) send.onclick = approvedOpenCart;
    if (cartTop) cartTop.onclick = approvedOpenCart;

    document.addEventListener('click', event => {
      if (event.target.closest('#send,#cartTop')) setTimeout(updateApprovedTotals, 0);
    }, true);

    document.addEventListener('click', event => {
      const button = event.target.closest('#continueOrder');
      if (!button) return;

      const required = ['name','phone','date','time','address','zip'];
      const missing = required.map(id => document.getElementById(id)).find(field => !field || !String(field.value || '').trim());
      const hasProducts = typeof window.chosenProducts === 'function' ? window.chosenProducts().length > 0 : true;

      if (!hasProducts || missing) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        if (!hasProducts) {
          alert('Agrega al menos un producto al pedido.');
          return;
        }
        missing?.focus();
        missing?.scrollIntoView({ behavior:'smooth', block:'center' });
        alert('Completa tus datos de entrega antes de continuar.');
      }
    }, true);

    const originalRenderCart = window.renderCart;
    if (typeof originalRenderCart === 'function' && !window.__approvedRenderCartWrapped) {
      window.__approvedRenderCartWrapped = true;
      window.renderCart = function (...args) {
        const result = originalRenderCart.apply(this, args);
        const items = document.getElementById('cartItems');
        if (items && !items.children.length) items.innerHTML = '<div class="approved-empty-cart">Todavía no agregas productos.</div>';
        updateApprovedTotals();
        return result;
      };
    }
  }

  function polishTextSizes() {
    const notices = document.querySelectorAll('.notice,.availability-note');
    notices.forEach(node => node.style.fontSize = '17px');
  }

  function applyApprovedUI() {
    injectStyles();
    buildApprovedHero();
    observeProducts();
    buildApprovedCart();
    polishTextSizes();
  }

  if (document.readyState === 'complete') {
    applyApprovedUI();
  } else {
    window.addEventListener('load', applyApprovedUI, { once:true });
    setTimeout(applyApprovedUI, 650);
  }
})();
