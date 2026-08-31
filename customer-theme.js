(()=>{
  'use strict';

  const LOGO='/pwa-icon.svg?v=20260831-unified';
  const FOOD='/ceviche-real.svg?v=20260831-unified';

  document.title='Ceviches y Cócteles El Cubano';
  const theme=document.querySelector('meta[name="theme-color"]');
  if(theme) theme.setAttribute('content','#1f6f3b');

  const oldStyle=document.getElementById('el-cubano-customer-theme');
  if(oldStyle) oldStyle.remove();

  const style=document.createElement('style');
  style.id='el-cubano-customer-theme';
  style.textContent=`
    :root{
      --navy:#17314f;
      --green:#0d7a32;
      --green-dark:#075c27;
      --yellow:#f5c82f;
      --red:#ef4e3d;
      --cream:#fff8e8;
      --ink:#17314f;
      --line:#e8decb;
    }

    html{background:var(--cream)!important;scroll-behavior:auto!important}
    body{
      position:relative!important;
      min-height:100vh!important;
      color:var(--ink)!important;
      padding-bottom:92px!important;
      background:
        linear-gradient(rgba(255,248,232,.92),rgba(255,248,232,.96)),
        url('/el-cubano-logo-transparent.png') center 690px/350px auto no-repeat!important;
      background-attachment:scroll!important;
    }
    body::before{
      content:""!important;
      position:absolute!important;
      inset:0!important;
      z-index:-1!important;
      opacity:.045!important;
      pointer-events:none!important;
      background:url('/ceviche-real.svg') center 32%/720px auto no-repeat!important;
      background-attachment:scroll!important;
      transform:none!important;
    }
    body::after{display:none!important}

    .wrap{max-width:980px!important;padding:12px!important}

    .hero{
      position:relative!important;
      overflow:hidden!important;
      text-align:center!important;
      padding:14px 13px 16px!important;
      border-radius:28px!important;
      background:rgba(255,252,244,.94)!important;
      border:1px solid rgba(231,220,201,.98)!important;
      box-shadow:0 7px 18px rgba(35,56,71,.075)!important;
      backdrop-filter:none!important;
      -webkit-backdrop-filter:none!important;
    }
    .hero::before{display:none!important}
    .hero::after{
      content:""!important;
      position:absolute!important;
      left:0!important;right:0!important;bottom:0!important;height:7px!important;
      background:linear-gradient(90deg,var(--red) 0 33%,var(--yellow) 33% 66%,var(--green) 66%)!important;
    }
    .hero>*{position:relative;z-index:1}

    .customer-brand-row{
      display:block!important;
      min-height:0!important;
      padding:0!important;
      margin:0 auto 7px!important;
      text-align:center!important;
    }
    .main-logo{
      display:block!important;
      width:min(205px,59vw)!important;
      height:auto!important;
      max-height:205px!important;
      object-fit:contain!important;
      margin:0 auto!important;
      padding:0!important;
      border-radius:0!important;
      background:transparent!important;
      box-shadow:none!important;
      mix-blend-mode:multiply!important;
      filter:none!important;
    }
    .customer-brand-copy{display:block!important;text-align:center!important;margin:0 auto 7px!important}
    .customer-brand-copy strong{
      display:block!important;
      color:#075d2b!important;
      font-size:34px!important;
      line-height:1.02!important;
      letter-spacing:-.6px!important;
      font-weight:1000!important;
    }
    .customer-brand-copy span{
      display:block!important;
      margin-top:1px!important;
      color:#cf3024!important;
      font-family:Georgia,'Times New Roman',serif!important;
      font-size:46px!important;
      line-height:1!important;
      font-style:italic!important;
    }
    .customer-brand-copy small{
      display:block!important;
      margin-top:7px!important;
      color:#6f5139!important;
      font-size:19px!important;
      line-height:1.15!important;
      font-weight:900!important;
    }

    .customer-food-hero{
      position:relative!important;
      overflow:hidden!important;
      margin:11px 0 11px!important;
      border-radius:24px!important;
      border:0!important;
      background:#ece5d9!important;
      box-shadow:0 6px 16px rgba(23,49,68,.09)!important;
    }
    .customer-food-hero img{
      display:block!important;
      width:100%!important;
      height:auto!important;
      min-height:255px!important;
      aspect-ratio:1.32/1!important;
      object-fit:cover!important;
      object-position:center 48%!important;
    }
    .customer-food-copy{
      position:absolute!important;
      left:10px!important;
      right:auto!important;
      bottom:10px!important;
      width:calc(100% - 20px)!important;
      padding:13px 14px!important;
      border-radius:20px!important;
      text-align:left!important;
      color:#fff!important;
      background:linear-gradient(135deg,#087a35,#075b2b)!important;
      text-shadow:none!important;
    }
    .customer-food-copy strong{display:block!important;font-size:19px!important;line-height:1.15!important}
    .customer-food-copy span{display:block!important;margin-top:4px!important;font-size:16px!important;font-weight:900!important;color:#ffe267!important;line-height:1.18!important}

    .hero>h1,.hero>p{display:none!important}

    #approved-order-cta{
      width:min(560px,92%)!important;
      min-height:60px!important;
      margin:11px auto 10px!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      border:0!important;
      border-radius:999px!important;
      background:linear-gradient(100deg,#ff5539,#f56c40)!important;
      color:#fff!important;
      font-size:25px!important;
      font-weight:1000!important;
      box-shadow:0 6px 14px rgba(221,69,46,.18)!important;
    }

    /* Información secundaria: deliberadamente compacta */
    .hero .benefits{
      display:grid!important;
      grid-template-columns:1fr 1fr!important;
      gap:7px!important;
      margin:9px 0 3px!important;
    }
    .hero .benefits .benefit{
      position:relative!important;
      overflow:hidden!important;
      min-height:72px!important;
      padding:9px 7px 11px!important;
      display:flex!important;
      flex-direction:column!important;
      justify-content:center!important;
      border-radius:16px!important;
      background:rgba(255,255,255,.94)!important;
      border:1px solid rgba(225,219,207,.92)!important;
      box-shadow:0 3px 8px rgba(24,49,73,.045)!important;
      backdrop-filter:none!important;
      -webkit-backdrop-filter:none!important;
      color:#26384f!important;
      font-size:13px!important;
      line-height:1.12!important;
      text-align:center!important;
    }
    .hero .benefits .benefit b{
      display:block!important;
      margin-bottom:3px!important;
      font-size:15px!important;
      line-height:1.1!important;
      font-weight:1000!important;
    }
    .hero .benefits .benefit::after{
      content:""!important;
      position:absolute!important;
      left:24%!important;right:24%!important;bottom:0!important;height:3px!important;
      border-radius:99px!important;
      background:var(--green)!important;
    }
    .hero .benefits .benefit:nth-child(1) b{color:#d94737!important}
    .hero .benefits .benefit:nth-child(1)::after{background:var(--red)!important}
    .hero .benefits .benefit:nth-child(2) b{color:#9b7000!important}
    .hero .benefits .benefit:nth-child(2)::after{background:var(--yellow)!important}
    .hero .benefits .benefit:nth-child(3) b,.hero .benefits .benefit:nth-child(4) b{color:var(--green)!important}

    /* Navegación principal: más grande y más importante que la información */
    #customer-category-nav{
      display:grid!important;
      grid-template-columns:repeat(6,minmax(0,1fr))!important;
      gap:8px!important;
      margin:14px 0 18px!important;
      padding:8px!important;
      border-radius:22px!important;
      background:rgba(255,255,255,.62)!important;
    }
    #customer-category-nav button[data-group]{
      grid-column:span 2!important;
      min-height:102px!important;
      padding:10px 7px 12px!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      justify-content:center!important;
      border-radius:18px!important;
      border:1px solid rgba(225,219,207,.96)!important;
      background:rgba(255,255,255,.94)!important;
      box-shadow:0 4px 10px rgba(24,49,73,.055)!important;
      transition:none!important;
      animation:none!important;
    }
    #customer-category-nav button[data-group]:nth-child(4),
    #customer-category-nav button[data-group]:nth-child(5){grid-column:span 3!important}
    #customer-category-nav button[data-group] .cat-icon{
      display:block!important;
      margin-bottom:6px!important;
      font-size:30px!important;
      line-height:1!important;
    }
    #customer-category-nav button[data-group] .cat-label{
      display:block!important;
      max-width:100%!important;
      color:#17314f!important;
      font-size:16px!important;
      line-height:1.08!important;
      font-weight:1000!important;
      white-space:normal!important;
      overflow:visible!important;
      text-overflow:clip!important;
      word-break:normal!important;
      text-align:center!important;
    }

    .notice,.availability-note{
      border-radius:16px!important;
      box-shadow:0 3px 8px rgba(24,49,73,.04)!important;
      background:rgba(255,255,255,.88)!important;
      border:1px solid var(--line)!important;
    }
    .notice b{color:#a23b31!important}
    .availability-note{color:var(--navy)!important;border-left:5px solid var(--green)!important}

    .product{
      background:rgba(255,255,255,.94)!important;
      border:1px solid rgba(226,218,204,.94)!important;
      border-radius:18px!important;
      box-shadow:0 3px 8px rgba(24,49,73,.04)!important;
      transition:none!important;
      animation:none!important;
    }

    .checkout{
      background:rgba(255,255,255,.94)!important;
      border:1px solid var(--line)!important;
      border-radius:21px!important;
      box-shadow:0 4px 12px rgba(25,48,80,.05)!important;
      backdrop-filter:none!important;
      -webkit-backdrop-filter:none!important;
    }

    /* Carrito compacto desde el primer pintado */
    body .sticky{
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
      transition:none!important;
      animation:none!important;
    }
    body .sticky::before{display:none!important}
    body .sticky .summary{width:auto!important;flex:0 0 auto!important;text-align:center!important;padding:0!important}
    body .sticky .summary b{display:flex!important;align-items:center!important;gap:8px!important;white-space:nowrap!important;font-size:0!important}
    body .sticky .summary b::before{content:'🛒  Ver pedido'!important;font-size:20px!important;font-weight:1000!important;line-height:1!important}
    body .sticky .summary b span{
      display:inline-flex!important;
      align-items:center!important;
      justify-content:center!important;
      min-width:76px!important;
      margin-left:0!important;
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
      opacity:0!important;
      z-index:3!important;
      border-radius:999px!important;
    }

    .cart-backdrop{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}

    @media(min-width:701px){
      .hero .benefits{grid-template-columns:repeat(4,1fr)!important}
      .hero .benefits .benefit{min-height:78px!important;font-size:14px!important}
      .hero .benefits .benefit b{font-size:16px!important}
      #customer-category-nav{grid-template-columns:repeat(5,minmax(0,1fr))!important}
      #customer-category-nav button[data-group],
      #customer-category-nav button[data-group]:nth-child(4),
      #customer-category-nav button[data-group]:nth-child(5){grid-column:auto!important;min-height:96px!important}
    }

    @media(max-width:430px){
      .wrap{padding:10px!important}
      .hero{padding:12px 11px 15px!important}
      .main-logo{width:min(190px,56vw)!important}
      .customer-brand-copy strong{font-size:31px!important}
      .customer-brand-copy span{font-size:43px!important}
      .customer-brand-copy small{font-size:18px!important}
      .customer-food-copy strong{font-size:18px!important}
      .customer-food-copy span{font-size:15px!important}
      #approved-order-cta{font-size:24px!important;min-height:58px!important}
      .hero .benefits .benefit{min-height:68px!important;padding:8px 6px 10px!important;font-size:12px!important}
      .hero .benefits .benefit b{font-size:14px!important}
      #customer-category-nav button[data-group]{min-height:98px!important;padding:9px 6px 11px!important}
      #customer-category-nav button[data-group] .cat-icon{font-size:29px!important}
      #customer-category-nav button[data-group] .cat-label{font-size:15px!important}
    }
  `;
  document.head.appendChild(style);

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
    const hero=document.querySelector('.hero');
    if(!hero) return;

    const logo=hero.querySelector('.main-logo');
    if(logo){
      logo.src=LOGO;
      logo.alt='Ceviches y Cócteles El Cubano';
    }

    if(logo&&!hero.querySelector('.customer-brand-row')){
      const row=document.createElement('div');
      row.className='customer-brand-row';
      const copy=document.createElement('div');
      copy.className='customer-brand-copy';
      copy.innerHTML='<strong>Ceviches & Cócteles</strong><span>El Cubano</span><small>Fresco · preparado al momento</small>';
      logo.parentNode.insertBefore(row,logo);
      row.appendChild(logo);
      row.appendChild(copy);
    }

    if(!hero.querySelector('.customer-food-hero')){
      const food=document.createElement('div');
      food.className='customer-food-hero';
      food.innerHTML=`<img src="${FOOD}" alt="Ceviche real preparado fresco"><div class="customer-food-copy"><strong>🥣 Ceviche real, preparado fresco</strong><span>Hecho al momento · Sabor que sí se antoja</span></div>`;
      const h1=hero.querySelector('h1');
      if(h1) hero.insertBefore(food,h1);
      else hero.appendChild(food);
    }

    let cta=document.getElementById('approved-order-cta');
    if(!cta){
      cta=document.createElement('button');
      cta.id='approved-order-cta';
      cta.type='button';
      cta.textContent='📲 Haz tu pedido';
      const food=hero.querySelector('.customer-food-hero');
      if(food) food.insertAdjacentElement('afterend',cta);
      else hero.appendChild(cta);
      cta.addEventListener('click',()=>document.getElementById('customer-category-nav')?.scrollIntoView({behavior:'auto',block:'start'}));
    }

    let benefits=hero.querySelector('.benefits')||document.querySelector('.benefits');
    if(!benefits){
      benefits=document.createElement('div');
      benefits.className='benefits';
    }
    benefits.innerHTML='<div class="benefit"><b>📍 San Antonio</b>Área de servicio</div><div class="benefit"><b>🚚 Delivery gratis</b>En área delimitada</div><div class="benefit"><b>💵 Cash App / Efectivo</b>Paga al recibir</div><div class="benefit"><b>🔥 Salsas caseras</b>Preparadas al momento</div>';
    cta.insertAdjacentElement('afterend',benefits);

    const secondLabel=document.querySelector('#customer-category-nav button[data-group="immediate"] .cat-label');
    if(secondLabel) secondLabel.textContent='Ceviches';

    closeCategories();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',apply,{once:true});
  }else{
    apply();
  }
})();