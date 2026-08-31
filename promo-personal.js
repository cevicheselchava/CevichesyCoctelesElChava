(() => {
  const COCKTAIL_12_COST = 2.65;
  const cocktail12Recipe = {
    shrimp: 0.1875,
    onion: 0.5,
    cilantro: 0.1,
    avocado: 0.25,
    tomatoSauce: 2.173,
    tomatoPuree: 1.087,
    clamato: 0.652,
    lemonJuice: 0.065,
    english: 0.011,
    maggi: 0.011,
    container12: 1,
    lid12: 1,
    spoon: 1,
    napkins: 1
  };

  function copyRecipe(recipe) {
    return Object.fromEntries(Object.entries(recipe || {}).map(([key, value]) => [key, Number(value)]));
  }

  function setProduct(id, changes) {
    if (typeof products === 'undefined' || !Array.isArray(products)) return null;
    const product = products.find(item => item.id === id);
    if (product) Object.assign(product, changes);
    return product;
  }

  if (typeof products !== 'undefined' && Array.isArray(products)) {
    setProduct('fc5', { price: 12 });

    for (let i = products.length - 1; i >= 0; i -= 1) {
      if (products[i].id === 'cc16' || products[i].id === 'cm16') {
        if (typeof state === 'object' && state) delete state[products[i].id];
        products.splice(i, 1);
      }
    }

    setProduct('cc12', {
      name: 'Cóctel de camarón',
      detail: '12 oz · único tamaño',
      price: 10,
      cost: COCKTAIL_12_COST,
      recipe: copyRecipe(cocktail12Recipe),
      pre: false
    });

    setProduct('cm12', {
      name: 'Cóctel mixto',
      detail: 'Camarón y pulpo · 12 oz · único tamaño',
      price: null,
      pre: true
    });

    const constructor = setProduct('promo_constructor', {
      detail: '1 libra de ceviche de pescado + 1 cóctel de camarón 12 oz',
      price: 22,
      cost: 6.46,
      promo: 'Ahorras $3',
      inventoryNote: ''
    });
    if (constructor && typeof addRecipes === 'function' && typeof fish1 !== 'undefined') {
      constructor.recipe = addRecipes(fish1, cocktail12Recipe);
    }

    const hambre = setProduct('promo_hambre', {
      detail: '1 libra de ceviche de camarón + 1 cóctel de camarón 12 oz',
      price: 27,
      cost: 8.66,
      promo: 'Ahorras $3',
      inventoryNote: ''
    });
    if (hambre && typeof addRecipes === 'function' && typeof shrimp1 !== 'undefined') {
      hambre.recipe = addRecipes(shrimp1, cocktail12Recipe);
    }

    const camaradas = setProduct('promo_camaradas', {
      detail: '1 libra de pescado + 1 libra de camarón + 2 cócteles de camarón 12 oz',
      price: 49,
      cost: 15.12,
      promo: 'Ahorras $6',
      inventoryNote: ''
    });
    if (camaradas && typeof addRecipes === 'function' && typeof fish1 !== 'undefined' && typeof shrimp1 !== 'undefined') {
      camaradas.recipe = addRecipes(fish1, shrimp1, cocktail12Recipe, cocktail12Recipe);
    }

    const promoId = 'promo_personal_16';
    let personal = products.find(product => product.id === promoId);
    if (!personal) {
      personal = { id: promoId, group: 'promotions' };
      products.unshift(personal);
      if (typeof state === 'object' && state) state[promoId] = 0;
    }

    const halfFish = typeof halfRecipe === 'function' && typeof fish1 !== 'undefined' ? halfRecipe(fish1) : {};
    const personalRecipe = typeof addRecipes === 'function'
      ? addRecipes(halfFish, cocktail12Recipe)
      : { ...halfFish, ...cocktail12Recipe };

    Object.assign(personal, {
      name: '🔥 Promo Personal',
      detail: '½ libra de ceviche de pescado + 1 cóctel de camarón 12 oz + 1 refresco · Elige tu refresco en notas',
      price: 16,
      cost: null,
      recipe: personalRecipe,
      promo: 'Ahorras $4.50',
      inventoryNote: 'El refresco queda pendiente de selección'
    });

    if (typeof render === 'function') render();
  }

  const wrap = document.querySelector('.wrap');
  const hero = document.querySelector('.hero');
  const nav = document.getElementById('customer-category-nav');
  const sections = [...document.querySelectorAll('.section[data-group]')];

  if (wrap && hero && nav && sections.length) {
    hero.insertAdjacentElement('afterend', nav);

    let info = document.getElementById('customer-info-after-menu');
    if (!info) {
      info = document.createElement('div');
      info.id = 'customer-info-after-menu';
    }

    [...wrap.children].forEach(element => {
      if (element.classList?.contains('notice') || element.classList?.contains('availability-note')) {
        info.appendChild(element);
      }
    });

    sections[sections.length - 1].insertAdjacentElement('afterend', info);
  }

  const cocktailSection = document.querySelector('.section[data-group="cocktails"]');
  const cocktailSubtitle = cocktailSection?.querySelector('.section-right small');
  if (cocktailSubtitle) cocktailSubtitle.textContent = '12 oz · único tamaño';
})();

/* Evita que pwa-init cargue otra interfaz visual después de esta. */
(() => {
  if (!document.getElementById('approved-ui-script')) {
    const marker = document.createElement('meta');
    marker.id = 'approved-ui-script';
    document.head.appendChild(marker);
  }
})();

/* Navegación principal: grande y legible. */
(() => {
  const id = 'customer-category-size-20260831';
  document.getElementById(id)?.remove();
  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    .hero .benefit{min-height:72px!important;padding:8px 5px 10px!important;font-size:13px!important;line-height:1.1!important}
    .hero .benefit b{font-size:15px!important;line-height:1.08!important;margin-bottom:2px!important}
    #customer-category-nav{display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:9px!important;padding:9px!important;margin:14px 0 18px!important}
    #customer-category-nav button[data-group]{grid-column:span 2!important;min-height:104px!important;padding:10px 7px 12px!important;border-radius:18px!important;gap:7px!important;font-size:16px!important;line-height:1.08!important;overflow:visible!important}
    #customer-category-nav button[data-group]:nth-child(4),#customer-category-nav button[data-group]:nth-child(5){grid-column:span 3!important}
    #customer-category-nav .cat-icon{font-size:32px!important;line-height:1!important}
    #customer-category-nav .cat-label{display:block!important;max-width:100%!important;font-size:16px!important;line-height:1.08!important;font-weight:1000!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important;text-align:center!important}
    @media(min-width:701px){#customer-category-nav{grid-template-columns:repeat(5,minmax(0,1fr))!important}#customer-category-nav button[data-group],#customer-category-nav button[data-group]:nth-child(4),#customer-category-nav button[data-group]:nth-child(5){grid-column:auto!important;min-height:96px!important}}
    @media(max-width:430px){#customer-category-nav{gap:8px!important;padding:8px!important}#customer-category-nav button[data-group]{min-height:100px!important;padding:9px 6px 11px!important}#customer-category-nav .cat-icon{font-size:30px!important}#customer-category-nav .cat-label{font-size:15px!important}}
  `;
  document.head.appendChild(style);

  document.querySelectorAll('.section[data-group]').forEach(section => {
    section.classList.remove('open');
    section.querySelector('.section-title')?.setAttribute('aria-expanded', 'false');
  });
  document.querySelectorAll('#customer-category-nav button[data-group]').forEach(button => {
    button.classList.remove('active');
    button.setAttribute('aria-pressed', 'false');
  });
})();

/* El carrito se posiciona DIRECTAMENTE sobre el elemento para que ninguna hoja lo vuelva a mover. */
(() => {
  const sticky = document.querySelector('.sticky');
  const summary = sticky?.querySelector('.summary');
  const label = summary?.querySelector('b');
  const total = label?.querySelector('span');
  const send = sticky?.querySelector('.send');
  if (!sticky || !summary || !label || !total || !send) return;

  const set = (el, prop, value) => el.style.setProperty(prop, value, 'important');
  set(sticky, 'position', 'fixed');
  set(sticky, 'left', 'auto');
  set(sticky, 'right', '30px');
  set(sticky, 'bottom', 'calc(20px + env(safe-area-inset-bottom))');
  set(sticky, 'width', '205px');
  set(sticky, 'max-width', 'calc(100vw - 60px)');
  set(sticky, 'min-height', '52px');
  set(sticky, 'padding', '5px 6px');
  set(sticky, 'border-radius', '999px');
  set(sticky, 'display', 'flex');
  set(sticky, 'align-items', 'center');
  set(sticky, 'justify-content', 'center');
  set(sticky, 'gap', '0');
  set(sticky, 'background', 'linear-gradient(95deg,#0aa84b,#22cf67)');
  set(sticky, 'box-shadow', '0 6px 14px rgba(5,92,42,.18)');
  set(sticky, 'border', '0');
  set(sticky, 'overflow', 'hidden');
  set(sticky, 'transform', 'none');
  set(sticky, 'box-sizing', 'border-box');

  set(summary, 'width', '100%');
  set(summary, 'flex', '1 1 auto');
  set(summary, 'min-width', '0');
  set(summary, 'padding', '0');
  summary.querySelector('small')?.style.setProperty('display', 'none', 'important');

  set(label, 'display', 'flex');
  set(label, 'align-items', 'center');
  set(label, 'justify-content', 'space-between');
  set(label, 'gap', '5px');
  set(label, 'width', '100%');
  set(label, 'white-space', 'nowrap');
  set(label, 'font-size', '0');

  if (!label.querySelector('.fixed-cart-label')) {
    const text = document.createElement('span');
    text.className = 'fixed-cart-label';
    text.textContent = '🛒 Ver pedido';
    label.insertBefore(text, total);
  }
  const text = label.querySelector('.fixed-cart-label');
  set(text, 'display', 'inline-flex');
  set(text, 'align-items', 'center');
  set(text, 'justify-content', 'center');
  set(text, 'flex', '1 1 auto');
  set(text, 'font-size', '15px');
  set(text, 'font-weight', '1000');
  set(text, 'line-height', '1');

  set(total, 'display', 'inline-flex');
  set(total, 'align-items', 'center');
  set(total, 'justify-content', 'center');
  set(total, 'flex', '0 0 auto');
  set(total, 'min-width', '56px');
  set(total, 'margin', '0');
  set(total, 'padding', '8px 7px');
  set(total, 'border-radius', '999px');
  set(total, 'background', 'rgba(255,255,255,.20)');
  set(total, 'color', '#fff');
  set(total, 'font-size', '14px');
  set(total, 'line-height', '1');

  set(send, 'position', 'absolute');
  set(send, 'inset', '0');
  set(send, 'width', '100%');
  set(send, 'height', '100%');
  set(send, 'padding', '0');
  set(send, 'opacity', '0');
  set(send, 'z-index', '3');
})();

/* Ventana de pedido: usa el modal que ya existe y abre incluso con carrito vacío. */
(() => {
  const modal = document.getElementById('cartModal');
  const dialog = modal?.querySelector('.cart-dialog');
  const title = document.getElementById('cartTitle');
  const items = document.getElementById('cartItems');
  const originalTotal = document.getElementById('cartTotal');
  const checkout = document.getElementById('checkout');
  const actions = dialog?.querySelector('.cart-actions');
  const send = document.getElementById('send');
  const cartTop = document.getElementById('cartTop');
  if (!modal || !dialog || !title || !items || !originalTotal || !checkout || !actions || !send) return;

  const style = document.createElement('style');
  style.id = 'customer-cart-window-20260831';
  style.textContent = `
    .cart-modal{z-index:1200!important;place-items:end center!important}
    .cart-backdrop{background:rgba(0,0,0,.58)!important}
    .cart-dialog{width:min(720px,100%)!important;max-height:94vh!important;overflow:auto!important;margin:0!important;padding:28px 24px calc(26px + env(safe-area-inset-bottom))!important;border-radius:34px 34px 0 0!important;background:#fff!important;box-shadow:0 -12px 36px rgba(0,0,0,.25)!important}
    .cart-dialog h2{margin:4px 58px 26px 0!important;color:#171717!important;font-size:clamp(42px,10vw,58px)!important;line-height:1!important;font-weight:1000!important}
    .cart-close{top:18px!important;right:18px!important;width:46px!important;height:46px!important;font-size:31px!important}
    .cart-items{gap:10px!important}
    .cart-row{padding:12px!important;border-radius:14px!important}
    .cart-total{display:none!important}
    #customer-cart-totals{margin:6px 0 22px!important;color:#171717!important}
    .customer-total-row{display:flex!important;justify-content:space-between!important;align-items:center!important;gap:16px!important;font-size:clamp(30px,7vw,42px)!important;font-weight:1000!important;line-height:1.08!important;margin:12px 0!important}
    .customer-total-row.grand{margin-top:44px!important;font-size:clamp(34px,8vw,48px)!important}
    .cart-dialog .checkout{display:block!important;margin:10px 0 12px!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important}
    .cart-dialog .checkout h2{display:none!important}
    .cart-dialog .fields{display:grid!important;grid-template-columns:1fr!important;gap:12px!important}
    .cart-dialog input,.cart-dialog select,.cart-dialog textarea{width:100%!important;min-height:68px!important;padding:16px 18px!important;border:1px solid #d9d9d9!important;border-radius:20px!important;background:#fff!important;color:#222!important;font-size:20px!important;font-weight:700!important;box-shadow:none!important}
    .cart-dialog textarea{min-height:112px!important;resize:vertical!important}
    .cart-dialog .field-label{gap:7px!important;font-size:18px!important;color:#222!important}
    #customer-cart-privacy{margin:14px 0 10px!important;padding:14px 16px!important;border-radius:18px!important;background:#eaf9e7!important;color:#257a35!important;text-align:center!important;font-size:17px!important;line-height:1.3!important;font-weight:900!important}
    .cart-actions{grid-template-columns:1fr!important;gap:9px!important;margin-top:14px!important}
    .cart-actions button{min-height:58px!important;border-radius:18px!important;font-size:18px!important}
    .cart-primary{background:#25b85a!important;color:#fff!important}
    .cart-secondary{order:2!important}
    body.cart-window-ready>.wrap>.checkout{display:none!important}
    @media(max-width:430px){.cart-dialog{padding:24px 18px calc(22px + env(safe-area-inset-bottom))!important}.cart-dialog h2{font-size:43px!important}.customer-total-row{font-size:31px!important}.customer-total-row.grand{font-size:36px!important}.cart-dialog input,.cart-dialog select,.cart-dialog textarea{font-size:18px!important;min-height:64px!important}}
  `;
  document.head.appendChild(style);

  title.textContent = '🛒 Tu pedido';

  let totals = document.getElementById('customer-cart-totals');
  if (!totals) {
    totals = document.createElement('div');
    totals.id = 'customer-cart-totals';
    totals.innerHTML = '<div class="customer-total-row"><strong>Subtotal:</strong><span id="customer-subtotal">$0.00</span></div><div class="customer-total-row"><strong>Envío:</strong><span>$0.00</span></div><div class="customer-total-row grand"><strong>Total:</strong><span id="customer-grand-total">$0.00</span></div>';
    items.insertAdjacentElement('afterend', totals);
  }

  if (checkout.parentElement !== dialog) {
    actions.insertAdjacentElement('beforebegin', checkout);
    document.body.classList.add('cart-window-ready');
  }

  document.getElementById('name')?.setAttribute('placeholder', 'Tu nombre completo');
  document.getElementById('phone')?.setAttribute('placeholder', 'Tu WhatsApp');
  document.getElementById('address')?.setAttribute('placeholder', 'Dirección completa de entrega');
  document.getElementById('notes')?.setAttribute('placeholder', 'Referencia de la casa o negocio');

  let privacy = document.getElementById('customer-cart-privacy');
  if (!privacy) {
    privacy = document.createElement('div');
    privacy.id = 'customer-cart-privacy';
    privacy.textContent = '🔒 Tus datos solo se usan para confirmar y entregar tu pedido.';
    checkout.insertAdjacentElement('afterend', privacy);
  }

  document.getElementById('keepShopping')?.replaceChildren(document.createTextNode('Seguir comprando'));
  document.getElementById('continueOrder')?.replaceChildren(document.createTextNode('💬 Continuar por WhatsApp'));

  function syncTotals() {
    const amount = originalTotal.textContent?.trim() || document.getElementById('total')?.textContent?.trim() || '$0.00';
    const subtotal = document.getElementById('customer-subtotal');
    const grand = document.getElementById('customer-grand-total');
    if (subtotal) subtotal.textContent = amount;
    if (grand) grand.textContent = amount;
  }

  function openCart(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
    if (typeof window.renderCart === 'function') window.renderCart();
    if (!items.children.length) items.innerHTML = '<div style="padding:4px 0 8px;font-size:18px;font-weight:800;color:#666">Todavía no agregas productos.</div>';
    syncTotals();
    modal.hidden = false;
    document.body.classList.add('modal-open');
    dialog.scrollTop = 0;
    requestAnimationFrame(syncTotals);
  }

  send.addEventListener('click', openCart, true);
  cartTop?.addEventListener('click', openCart, true);
})();