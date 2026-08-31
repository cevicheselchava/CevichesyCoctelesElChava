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
    // Precio ajustado: media libra de ceviche de camarón.
    setProduct('fc5', { price: 12 });

    // Un solo tamaño de cóctel: 12 oz.
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

  // Solo acomoda la información una vez. El idioma, horarios y PWA
  // se mantienen en pwa-init.js.
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

    const benefits = document.querySelector('.benefits');
    if (benefits) info.appendChild(benefits);

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

  // ---------- PROPUESTA REGGAE 2026 ----------
  function applyProposalTheme() {
    if (!document.getElementById('proposal-reggae-theme')) {
      const style = document.createElement('style');
      style.id = 'proposal-reggae-theme';
      style.textContent = `
        :root{
          --proposal-green:#126b38;
          --proposal-green-dark:#07512a;
          --proposal-lime:#d9f26e;
          --proposal-red:#e74732;
          --proposal-orange:#ff6246;
          --proposal-yellow:#f1c52c;
          --proposal-cream:#fff7e8;
          --proposal-ink:#17324e;
          --proposal-line:#eadfc8;
        }
        html{background:var(--proposal-cream)!important}
        body{
          background:var(--proposal-cream)!important;
          color:var(--proposal-ink)!important;
          padding-bottom:112px!important;
        }
        body::before{
          content:""!important;
          position:fixed!important;
          inset:0!important;
          z-index:0!important;
          pointer-events:none!important;
          opacity:1!important;
          background:
            linear-gradient(rgba(255,247,232,.89),rgba(255,247,232,.94)),
            url('/el-cubano-logo-transparent.png') 8% 18%/430px auto no-repeat,
            url('/ceviche-real.svg') 96% 66%/620px auto no-repeat,
            var(--proposal-cream)!important;
        }
        body::after{
          content:""!important;
          position:fixed!important;
          inset:0!important;
          z-index:0!important;
          pointer-events:none!important;
          opacity:.055!important;
          background-image:url('/el-cubano-logo-transparent.png')!important;
          background-repeat:repeat!important;
          background-size:360px auto!important;
          transform:rotate(-8deg) scale(1.15)!important;
        }
        .wrap{position:relative!important;z-index:1!important;max-width:920px!important;padding:10px 12px 28px!important}

        .hero{
          position:relative!important;
          overflow:hidden!important;
          padding:84px 16px 18px!important;
          border:1px solid var(--proposal-line)!important;
          border-radius:30px!important;
          background:rgba(255,249,236,.92)!important;
          box-shadow:0 12px 30px rgba(74,51,23,.10)!important;
          backdrop-filter:none!important;
          -webkit-backdrop-filter:none!important;
          text-align:left!important;
        }
        .hero::before{
          content:""!important;
          position:absolute!important;
          inset:0!important;
          background:
            linear-gradient(145deg,transparent 0 66%,rgba(18,107,56,.045) 66% 100%),
            url('/el-cubano-logo-transparent.png') -55px 70%/330px auto no-repeat!important;
          opacity:.14!important;
          pointer-events:none!important;
        }
        .hero::after{
          content:""!important;
          position:absolute!important;
          top:0!important;left:0!important;right:0!important;bottom:auto!important;
          height:12px!important;
          background:linear-gradient(90deg,var(--proposal-green) 0 33%,var(--proposal-yellow) 33% 66%,var(--proposal-red) 66% 100%)!important;
        }
        .hero>*{position:relative;z-index:2}
        .proposal-logo-wrap{
          position:absolute!important;
          top:16px!important;
          left:50%!important;
          transform:translateX(-50%)!important;
          width:170px!important;
          height:126px!important;
          display:grid!important;
          place-items:center!important;
          z-index:4!important;
          pointer-events:none!important;
        }
        .proposal-logo-wrap .main-logo{
          width:170px!important;
          height:126px!important;
          max-height:none!important;
          object-fit:contain!important;
          filter:drop-shadow(0 7px 10px rgba(37,58,38,.17))!important;
        }
        .proposal-menu-toggle,.cart-top{
          position:absolute!important;
          top:24px!important;
          width:48px!important;
          height:48px!important;
          border:1px solid #e8deca!important;
          border-radius:15px!important;
          background:#fffdf8!important;
          color:#2f302a!important;
          box-shadow:0 5px 14px rgba(65,48,25,.12)!important;
          font-size:25px!important;
          display:grid!important;
          place-items:center!important;
          padding:0!important;
          z-index:6!important;
        }
        .proposal-menu-toggle{left:14px!important}
        .cart-top{right:14px!important}
        .cart-badge{background:var(--proposal-red)!important;color:#fff!important}
        .proposal-main{
          display:grid!important;
          grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr)!important;
          gap:14px!important;
          align-items:center!important;
          margin-top:34px!important;
        }
        .customer-brand-copy{
          display:flex!important;
          flex-direction:column!important;
          align-items:flex-start!important;
          justify-content:center!important;
          min-width:0!important;
          padding:6px 0 6px 4px!important;
        }
        .customer-brand-copy strong{
          color:var(--proposal-green-dark)!important;
          font-family:Arial,Helvetica,sans-serif!important;
          font-size:clamp(29px,7vw,48px)!important;
          line-height:.95!important;
          letter-spacing:-1.2px!important;
          font-weight:1000!important;
        }
        .customer-brand-copy span{
          margin-top:8px!important;
          color:#c92f20!important;
          font-family:Georgia,'Times New Roman',serif!important;
          font-size:clamp(34px,8vw,58px)!important;
          line-height:.9!important;
          font-style:italic!important;
          white-space:nowrap!important;
        }
        .customer-brand-copy small{
          margin-top:14px!important;
          color:#5f4b34!important;
          font-size:16px!important;
          line-height:1.25!important;
          font-weight:900!important;
        }
        .customer-brand-copy small::after{
          content:"";
          display:block;
          width:88px;
          height:4px;
          margin-top:10px;
          border-radius:99px;
          background:linear-gradient(90deg,var(--proposal-green) 0 33%,var(--proposal-yellow) 33% 66%,var(--proposal-red) 66% 100%);
        }
        .customer-food-hero{
          margin:0!important;
          border-radius:34px 34px 34px 12px!important;
          border:0!important;
          background:#eee3cd!important;
          box-shadow:0 9px 22px rgba(55,38,16,.15)!important;
          min-height:260px!important;
        }
        .customer-food-hero img{
          width:100%!important;
          height:100%!important;
          min-height:260px!important;
          aspect-ratio:1/1.04!important;
          object-fit:cover!important;
        }
        .customer-food-copy{
          left:10px!important;
          right:auto!important;
          bottom:10px!important;
          width:min(82%,260px)!important;
          padding:10px 13px!important;
          border-radius:18px!important;
          color:#fff!important;
          background:linear-gradient(135deg,#087739,#07512a)!important;
          text-shadow:none!important;
          box-shadow:0 5px 12px rgba(0,0,0,.17)!important;
        }
        .customer-food-copy strong{font-size:15px!important}
        .customer-food-copy span{font-size:12px!important;color:#ffe73b!important}
        .hero>h1,.hero>p{display:none!important}

        #customer-category-nav{
          display:grid!important;
          grid-template-columns:repeat(5,minmax(0,1fr))!important;
          gap:8px!important;
          margin:12px 0 14px!important;
          padding:8px!important;
          border:0!important;
          border-radius:22px!important;
          background:rgba(255,255,255,.76)!important;
          box-shadow:0 8px 20px rgba(68,49,22,.07)!important;
        }
        #customer-category-nav button{
          min-height:70px!important;
          padding:8px 4px 11px!important;
          border:1px solid #eadfca!important;
          border-radius:17px!important;
          background:#fffdf9!important;
          color:var(--proposal-ink)!important;
          font-size:11px!important;
          font-weight:1000!important;
          box-shadow:0 4px 10px rgba(60,44,24,.06)!important;
          transform:none!important;
        }
        #customer-category-nav button::after{height:4px!important;left:12%!important;right:12%!important}
        #customer-category-nav button.active{
          color:var(--proposal-ink)!important;
          background:#fffdf9!important;
          outline:2px solid rgba(18,107,56,.16)!important;
          box-shadow:0 6px 14px rgba(18,107,56,.11)!important;
        }
        #customer-category-nav .cat-icon{font-size:24px!important}
        #customer-category-nav .cat-label{font-size:11px!important;white-space:normal!important;text-align:center!important}

        .section[data-group]{margin-top:0!important}
        .section[data-group]>.products{margin-top:8px!important}
        .products{grid-template-columns:1fr!important;gap:10px!important}
        .product{
          position:relative!important;
          display:grid!important;
          grid-template-columns:106px minmax(0,1fr)!important;
          grid-template-rows:auto auto!important;
          column-gap:13px!important;
          row-gap:8px!important;
          min-height:136px!important;
          padding:11px 13px!important;
          overflow:hidden!important;
          border:1px solid #eadfc9!important;
          border-radius:20px!important;
          background:rgba(255,255,255,.93)!important;
          box-shadow:0 6px 15px rgba(71,48,20,.075)!important;
        }
        .product::before{
          content:"";
          grid-column:1!important;
          grid-row:1/3!important;
          align-self:center!important;
          width:106px!important;
          height:106px!important;
          border-radius:16px!important;
          background:url('/ceviche-real.svg') center/cover no-repeat!important;
          box-shadow:inset 0 0 0 1px rgba(0,0,0,.05)!important;
        }
        .section[data-group="cocktails"] .product::before,
        .section[data-group="drinks"] .product::before{
          display:grid!important;
          place-items:center!important;
          background:linear-gradient(145deg,#fff8e7,#f4ead4)!important;
          font-size:45px!important;
        }
        .section[data-group="cocktails"] .product::before{content:"🍹"!important}
        .section[data-group="drinks"] .product::before{content:"🥤"!important}
        .product>div:first-child{grid-column:2!important;grid-row:1!important;min-width:0!important}
        .product h3{
          margin:1px 0 0!important;
          color:var(--proposal-ink)!important;
          font-size:19px!important;
          line-height:1.08!important;
          font-weight:1000!important;
        }
        .promo-section .product h3{color:#b62820!important}
        .meta{
          margin-top:5px!important;
          min-height:0!important;
          color:#5d6167!important;
          font-size:15px!important;
          line-height:1.2!important;
          font-weight:700!important;
        }
        .tag,.promo-save{font-size:11px!important;padding:4px 7px!important}
        .bottom{
          grid-column:2!important;
          grid-row:2!important;
          align-self:end!important;
          display:flex!important;
          align-items:center!important;
          justify-content:space-between!important;
          gap:8px!important;
          margin-top:0!important;
        }
        .price{
          display:inline-flex!important;
          flex-direction:column!important;
          align-items:center!important;
          justify-content:center!important;
          min-width:82px!important;
          padding:7px 12px!important;
          border-radius:999px!important;
          background:var(--proposal-lime)!important;
          color:#07512a!important;
          font-size:22px!important;
          line-height:1!important;
          font-weight:1000!important;
        }
        .price small{margin-top:2px!important;color:#426441!important;font-size:9px!important}
        .pending{font-size:14px!important;color:#786c5d!important}
        .qty{gap:7px!important;font-size:17px!important}
        .qty button{
          width:37px!important;height:37px!important;
          border-radius:50%!important;
          background:var(--proposal-green)!important;
          color:#fff!important;
          font-size:22px!important;
          font-weight:1000!important;
        }
        .qty .plus{background:var(--proposal-green)!important}
        .qty.zero .plus{
          width:auto!important;
          min-width:104px!important;
          height:39px!important;
          padding:0 16px!important;
          border-radius:999px!important;
          background:var(--proposal-orange)!important;
          color:#fff!important;
          font-size:15px!important;
          font-weight:1000!important;
        }
        #customer-info-after-menu{margin-top:12px!important}
        #customer-info-after-menu .benefits{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:8px!important;margin:12px 0!important}
        .benefit{
          min-height:96px!important;
          display:flex!important;
          flex-direction:column!important;
          justify-content:center!important;
          border-radius:18px!important;
          background:rgba(255,255,255,.88)!important;
          font-size:14px!important;
          line-height:1.2!important;
        }
        .benefit b{font-size:16px!important}
        .notice,.availability-note{
          padding:12px 14px!important;
          border-radius:17px!important;
          background:rgba(255,255,255,.86)!important;
          font-size:15px!important;
          line-height:1.35!important;
        }
        .checkout{
          border-radius:22px!important;
          background:rgba(255,255,255,.93)!important;
          border:1px solid var(--proposal-line)!important;
        }
        .checkout h2{font-size:25px!important}
        input,select,textarea{font-size:17px!important;padding:13px!important}
        .instant-order-button{
          min-height:58px!important;
          border-radius:999px!important;
          background:linear-gradient(90deg,var(--proposal-red),var(--proposal-orange))!important;
          color:#fff!important;
          font-size:18px!important;
        }
        .sticky{
          left:50%!important;
          right:auto!important;
          bottom:8px!important;
          transform:translateX(-50%)!important;
          width:min(610px,calc(100% - 18px))!important;
          min-height:66px!important;
          padding:7px 9px!important;
          border-radius:999px!important;
          background:linear-gradient(90deg,#19a957,#25d86e)!important;
          box-shadow:0 9px 24px rgba(10,89,43,.26)!important;
        }
        .sticky::before{display:none!important}
        .send{
          order:1!important;
          flex:1!important;
          min-height:52px!important;
          border-radius:999px!important;
          background:transparent!important;
          color:#fff!important;
          box-shadow:none!important;
          font-size:20px!important;
          text-align:center!important;
        }
        .send small{display:none!important}
        .summary{
          order:2!important;
          flex:0 0 auto!important;
          min-width:78px!important;
          text-align:center!important;
          padding:11px 14px!important;
          border-radius:999px!important;
          background:rgba(255,255,255,.22)!important;
        }
        .summary b{font-size:0!important}
        .summary b span{color:#fff!important;font-size:21px!important}
        .summary small{display:none!important}
        .credit{font-size:14px!important;padding-bottom:78px!important}

        @media(min-width:760px){
          .hero{padding-left:28px!important;padding-right:28px!important}
          .proposal-main{gap:28px!important}
          .customer-food-hero{min-height:330px!important}
          .customer-food-hero img{min-height:330px!important}
          .products{grid-template-columns:repeat(2,minmax(0,1fr))!important}
        }
        @media(max-width:560px){
          .wrap{padding:8px 9px 24px!important}
          .hero{padding:76px 11px 14px!important;border-radius:25px!important}
          .proposal-logo-wrap{top:13px!important;width:142px!important;height:106px!important}
          .proposal-logo-wrap .main-logo{width:142px!important;height:106px!important}
          .proposal-menu-toggle,.cart-top{top:20px!important;width:44px!important;height:44px!important;border-radius:14px!important}
          .proposal-main{grid-template-columns:minmax(0,.87fr) minmax(0,1.13fr)!important;gap:9px!important;margin-top:28px!important}
          .customer-brand-copy{padding-left:1px!important}
          .customer-brand-copy strong{font-size:clamp(25px,7.2vw,34px)!important;letter-spacing:-.8px!important}
          .customer-brand-copy span{font-size:clamp(31px,8.8vw,41px)!important}
          .customer-brand-copy small{font-size:13px!important;margin-top:10px!important}
          .customer-food-hero{min-height:220px!important;border-radius:27px 27px 27px 10px!important}
          .customer-food-hero img{min-height:220px!important}
          .customer-food-copy{left:6px!important;bottom:6px!important;width:88%!important;padding:8px 9px!important}
          .customer-food-copy strong{font-size:12px!important}
          .customer-food-copy span{font-size:10px!important}
          #customer-category-nav{gap:5px!important;padding:6px!important}
          #customer-category-nav button{min-height:65px!important;padding:6px 2px 9px!important}
          #customer-category-nav .cat-icon{font-size:21px!important}
          #customer-category-nav .cat-label{font-size:9px!important}
          .product{grid-template-columns:94px minmax(0,1fr)!important;column-gap:10px!important;padding:10px!important;min-height:126px!important}
          .product::before{width:94px!important;height:94px!important;border-radius:14px!important}
          .product h3{font-size:17px!important}
          .meta{font-size:14px!important}
          .bottom{gap:5px!important}
          .price{min-width:72px!important;padding:6px 9px!important;font-size:20px!important}
          .qty.zero .plus{min-width:92px!important;padding:0 12px!important;font-size:14px!important}
          #customer-info-after-menu .benefits{grid-template-columns:repeat(3,1fr)!important}
          .benefit{min-height:90px!important;padding:9px 5px!important;font-size:12px!important}
          .benefit b{font-size:14px!important}
        }
        @media(max-width:390px){
          .proposal-main{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr)!important}
          .customer-brand-copy strong{font-size:24px!important}
          .customer-brand-copy span{font-size:31px!important}
          .customer-brand-copy small{font-size:11px!important}
          .customer-food-hero,.customer-food-hero img{min-height:198px!important}
          .product{grid-template-columns:84px minmax(0,1fr)!important;column-gap:9px!important}
          .product::before{width:84px!important;height:84px!important}
          .product h3{font-size:16px!important}
          .meta{font-size:13px!important}
          .price{font-size:18px!important;min-width:66px!important}
          .qty.zero .plus{min-width:82px!important;font-size:13px!important;padding:0 10px!important}
        }
      `;
      document.head.appendChild(style);
    }

    const currentNav = document.getElementById('customer-category-nav');
    const cevicheTab = currentNav?.querySelector('button[data-group="immediate"]');
    if (cevicheTab) {
      const icon = cevicheTab.querySelector('.cat-icon');
      const label = cevicheTab.querySelector('.cat-label');
      if (icon) icon.textContent = '🐟';
      if (label) label.textContent = 'Ceviches';
    }

    const currentHero = document.querySelector('.hero');
    if (currentHero && !currentHero.classList.contains('proposal-ready')) {
      currentHero.classList.add('proposal-ready');
      const brandRow = currentHero.querySelector('.customer-brand-row');
      const logo = brandRow?.querySelector('.main-logo');
      const brandCopy = brandRow?.querySelector('.customer-brand-copy');
      const foodHero = currentHero.querySelector('.customer-food-hero');

      if (logo) {
        const logoWrap = document.createElement('div');
        logoWrap.className = 'proposal-logo-wrap';
        logoWrap.appendChild(logo);
        currentHero.prepend(logoWrap);
      }

      if (brandCopy || foodHero) {
        const proposalMain = document.createElement('div');
        proposalMain.className = 'proposal-main';
        if (brandCopy) proposalMain.appendChild(brandCopy);
        if (foodHero) proposalMain.appendChild(foodHero);
        currentHero.appendChild(proposalMain);
      }

      brandRow?.remove();

      const menuButton = document.createElement('button');
      menuButton.type = 'button';
      menuButton.className = 'proposal-menu-toggle';
      menuButton.setAttribute('aria-label', 'Ver categorías');
      menuButton.textContent = '☰';
      menuButton.addEventListener('click', () => {
        document.getElementById('customer-category-nav')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      currentHero.prepend(menuButton);
    }

    const sendButton = document.getElementById('send');
    if (sendButton) {
      const firstText = [...sendButton.childNodes].find(node => node.nodeType === Node.TEXT_NODE);
      if (firstText) firstText.nodeValue = '🛒 Ver pedido ';
    }

    function decorateProducts() {
      document.querySelectorAll('.product .qty').forEach(qty => {
        const buttons = qty.querySelectorAll('button');
        const minus = buttons[0];
        const plus = buttons[buttons.length - 1];
        const count = qty.querySelector('span');
        const value = Number(count?.textContent || 0);
        const empty = value <= 0;
        qty.classList.toggle('zero', empty);
        if (minus) minus.hidden = empty;
        if (count) count.hidden = empty;
        if (plus) plus.textContent = empty ? 'Agregar' : '+';
      });
    }

    decorateProducts();
    document.querySelectorAll('.products').forEach(container => {
      if (container.dataset.proposalObserved === '1') return;
      container.dataset.proposalObserved = '1';
      new MutationObserver(decorateProducts).observe(container, { childList: true });
    });
  }

  applyProposalTheme();
})();
