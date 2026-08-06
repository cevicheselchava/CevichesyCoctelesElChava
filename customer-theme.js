(()=>{
  const LOGO='/pwa-icon.svg?v=20260806';
  document.title='Ceviches y Cócteles El Cubano';
  const theme=document.querySelector('meta[name="theme-color"]');
  if(theme)theme.setAttribute('content','#267642');

  const style=document.createElement('style');
  style.id='el-cubano-customer-theme';
  style.textContent=`
    :root{--navy:#123458;--green:#267642;--green2:#319552;--yellow:#f2b632;--red:#dc4638;--orange:#f28b28;--cream:#fffdf7;--ink:#17304f;--muted:#687589}
    body{position:relative;background:#fffdf8!important;color:var(--ink)}
    body:after{content:"";position:fixed;inset:0;z-index:-2;background:radial-gradient(circle at 4% 4%,rgba(48,150,82,.17),transparent 28%),radial-gradient(circle at 96% 20%,rgba(242,182,50,.19),transparent 30%),radial-gradient(circle at 94% 88%,rgba(220,70,56,.12),transparent 33%),linear-gradient(160deg,#fff 0%,#fffdf8 52%,#f7fff8 100%);pointer-events:none}
    body:before{background-image:url('/pwa-icon.svg?v=20260806')!important;background-position:center 57%!important;background-size:min(520px,80vw) auto!important;opacity:.035!important}
    .wrap{max-width:980px;padding:12px}
    .hero{overflow:hidden;background:rgba(255,255,255,.94)!important;border:1px solid rgba(229,221,209,.95)!important;border-radius:26px!important;box-shadow:0 14px 34px rgba(30,58,76,.12)!important;padding:12px 16px 17px!important}
    .hero:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 7% 0%,rgba(48,150,82,.15),transparent 27%),radial-gradient(circle at 97% 12%,rgba(242,182,50,.18),transparent 29%),linear-gradient(145deg,transparent 68%,rgba(220,70,56,.08));pointer-events:none}
    .main-logo{position:relative;width:min(430px,92%)!important;max-height:240px!important;filter:drop-shadow(0 8px 14px rgba(25,65,45,.12))}
    .hero h1{position:relative;color:var(--navy)!important}.hero p{position:relative;color:var(--green)!important}
    .cart-top{background:#fff!important;color:var(--green)!important;border:1px solid #dfe8df!important}.cart-badge{background:var(--red)!important}
    .benefit{background:rgba(255,255,255,.88)!important;border-color:#e5e2d9!important}.benefit b{color:var(--green)!important}
    .notice{background:rgba(255,249,231,.9)!important;border-color:#f0d99b!important}.availability-note{background:rgba(238,248,239,.92)!important;border-color:#bddbc4!important;color:var(--navy)!important}
    .section-title{background:linear-gradient(135deg,var(--green),var(--green2))!important;box-shadow:0 5px 14px rgba(38,118,66,.16)}
    .promo-title{background:linear-gradient(135deg,var(--red),#ef6355)!important}.cocktail-title{background:linear-gradient(135deg,#d98c12,var(--yellow))!important;color:var(--navy)!important}.pre-title{background:linear-gradient(135deg,#173b2a,var(--green))!important}
    .section-title small{color:#f7f4df!important}.cocktail-title small{color:#5f490c!important}
    .product{background:rgba(255,255,255,.93)!important;border-color:#e5dfd4!important;border-radius:18px!important;box-shadow:0 7px 18px rgba(25,48,80,.07)!important}.product h3{color:var(--navy)!important}.promo-section .product h3{color:#b52e23!important}.price{color:var(--red)!important}
    .qty button{background:var(--navy)!important}.qty .plus{background:var(--green)!important}
    .checkout{background:rgba(255,255,255,.94)!important;border-color:#e5dfd4!important;border-radius:20px!important;box-shadow:0 8px 22px rgba(25,48,80,.07)}.checkout h2,.field-label{color:var(--navy)!important}input,select,textarea{border:1.5px solid #d9d2c5!important;border-radius:13px!important;background:#fff!important}input:focus,select:focus,textarea:focus{outline:3px solid rgba(242,182,50,.2);border-color:var(--yellow)!important}
    .sticky{background:linear-gradient(90deg,#173b2a,var(--green))!important;border-top:4px solid var(--yellow)!important}.summary b span{color:#ffe373!important}.send,.cart-primary{background:#25b95a!important}.cart-dialog{background:#fffdf9!important}.cart-close{color:var(--green)!important}.credit{color:var(--navy)!important}
    @media(max-width:560px){.main-logo{max-height:205px!important}.hero h1{font-size:26px!important}}
  `;
  document.head.appendChild(style);

  function applyBrand(){
    const logo=document.querySelector('.main-logo');
    if(logo){logo.src=LOGO;logo.alt='Ceviches y Cócteles El Cubano';}
    const credit=document.querySelector('.credit');
    if(credit&&credit.textContent.includes('El Chava'))credit.textContent=credit.textContent.replace(/El Chava/g,'El Cubano');
  }
  applyBrand();
  new MutationObserver(applyBrand).observe(document.body,{childList:true,subtree:true});
})();
