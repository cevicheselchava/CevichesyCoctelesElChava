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

    const halfFish = typeof halfRecipe === 'function' && typeof fish1 !== 'undefined'
      ? halfRecipe(fish1)
      : {};
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

/* Prioridad visual real: categorías grandes y carrito compacto. */
(() => {
  const id = 'customer-priority-ui-20260831';
  document.getElementById(id)?.remove();
  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    /* Información secundaria: más compacta que la navegación */
    .hero .benefits{
      gap:6px!important;
      margin-top:10px!important;
    }
    .hero .benefit{
      min-height:72px!important;
      padding:8px 5px 10px!important;
      font-size:13px!important;
      line-height:1.1!important;
    }
    .hero .benefit b{
      font-size:15px!important;
      line-height:1.08!important;
      margin-bottom:2px!important;
    }

    /* Categorías: 3 arriba y 2 abajo en celular, grandes y legibles. */
    #customer-category-nav{
      display:grid!important;
      grid-template-columns:repeat(6,minmax(0,1fr))!important;
      gap:9px!important;
      padding:9px!important;
      margin:14px 0 18px!important;
    }
    #customer-category-nav button[data-group]{
      grid-column:span 2!important;
      min-height:104px!important;
      padding:10px 7px 12px!important;
      border-radius:18px!important;
      gap:7px!important;
      font-size:16px!important;
      line-height:1.08!important;
      overflow:visible!important;
    }
    #customer-category-nav button[data-group]:nth-child(4),
    #customer-category-nav button[data-group]:nth-child(5){
      grid-column:span 3!important;
    }
    #customer-category-nav .cat-icon{
      font-size:32px!important;
      line-height:1!important;
    }
    #customer-category-nav .cat-label{
      display:block!important;
      max-width:100%!important;
      font-size:16px!important;
      line-height:1.08!important;
      font-weight:1000!important;
      white-space:normal!important;
      overflow:visible!important;
      text-overflow:clip!important;
      text-align:center!important;
      word-break:normal!important;
    }

    /* Regresar el carrito chico flotante que ya estaba aprobado. */
    body .sticky{
      position:fixed!important;
      left:auto!important;
      right:12px!important;
      bottom:12px!important;
      width:auto!important;
      max-width:calc(100vw - 24px)!important;
      min-height:56px!important;
      padding:6px 7px!important;
      border-radius:999px!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      gap:0!important;
      background:linear-gradient(95deg,#0aa84b,#22cf67)!important;
      box-shadow:0 6px 14px rgba(5,92,42,.18)!important;
      border:0!important;
    }
    body .sticky::before{display:none!important}
    body .sticky .summary{
      width:auto!important;
      flex:0 0 auto!important;
      min-width:0!important;
      padding:0!important;
      text-align:center!important;
    }
    body .sticky .summary b{
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      gap:8px!important;
      white-space:nowrap!important;
      font-size:0!important;
    }
    body .sticky .summary b::before{
      content:'🛒 Ver pedido'!important;
      font-size:20px!important;
      font-weight:1000!important;
      line-height:1!important;
    }
    body .sticky .summary b span{
      display:inline-flex!important;
      align-items:center!important;
      justify-content:center!important;
      min-width:76px!important;
      margin:0!important;
      padding:8px 11px!important;
      border-radius:999px!important;
      background:rgba(255,255,255,.20)!important;
      color:#fff!important;
      font-size:18px!important;
      line-height:1!important;
    }
    body .sticky .summary small{display:none!important}
    body .sticky .send{
      position:absolute!important;
      inset:0!important;
      width:100%!important;
      height:100%!important;
      padding:0!important;
      opacity:0!important;
      z-index:3!important;
      border-radius:999px!important;
    }

    @media(min-width:701px){
      #customer-category-nav{
        grid-template-columns:repeat(5,minmax(0,1fr))!important;
      }
      #customer-category-nav button[data-group],
      #customer-category-nav button[data-group]:nth-child(4),
      #customer-category-nav button[data-group]:nth-child(5){
        grid-column:auto!important;
        min-height:96px!important;
      }
    }

    @media(max-width:430px){
      #customer-category-nav{gap:8px!important;padding:8px!important}
      #customer-category-nav button[data-group]{
        min-height:100px!important;
        padding:9px 6px 11px!important;
      }
      #customer-category-nav .cat-icon{font-size:30px!important}
      #customer-category-nav .cat-label{font-size:15px!important}
      body .sticky .summary b::before{font-size:18px!important}
      body .sticky .summary b span{font-size:17px!important;min-width:70px!important;padding:8px 10px!important}
    }
  `;
  document.head.appendChild(style);
})();