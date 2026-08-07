(()=>{
  const LOGO='/pwa-icon.svg?v=20260807-panelmatch';
  document.title='Ceviches y Cócteles El Cubano';
  const theme=document.querySelector('meta[name="theme-color"]');
  if(theme)theme.setAttribute('content','#267642');

  const style=document.createElement('style');
  style.id='el-cubano-customer-theme';
  style.textContent=`
    :root{--navy:#123458;--green:#267642;--green2:#319552;--yellow:#f2b632;--red:#dc4638;--cream:#fffdf7;--ink:#17304f;--muted:#6b778a;--line:#e8e1d4}
    html{background:var(--cream)}
    body{position:relative;background:#fffdf8!important;color:var(--ink)!important;min-height:100vh}
    body:after{content:"";position:fixed;inset:0;z-index:-2;background:radial-gradient(circle at 5% 5%,rgba(48,150,82,.17),transparent 28%),radial-gradient(circle at 95% 20%,rgba(242,182,50,.18),transparent 30%),radial-gradient(circle at 92% 88%,rgba(220,70,56,.12),transparent 32%),linear-gradient(160deg,#fff 0%,#fffdf8 52%,#f7fff8 100%);pointer-events:none}
    body:before{content:""!important;position:fixed!important;left:-16%!important;right:-16%!important;bottom:-5%!important;height:180px!important;top:auto!important;z-index:-1!important;opacity:.45!important;background:linear-gradient(8deg,transparent 0 18%,rgba(48,150,82,.18) 19% 35%,transparent 36% 47%,rgba(242,182,50,.2) 48% 63%,transparent 64% 75%,rgba(220,70,56,.13) 76% 88%,transparent 89%)!important;transform:rotate(-4deg)!important;pointer-events:none!important}
    .wrap{max-width:980px!important;padding:14px!important}
    .hero{position:relative!important;overflow:hidden!important;background:rgba(255,255,255,.93)!important;border:1px solid rgba(225,219,207,.92)!important;border-radius:28px!important;padding:18px 16px 20px!important;text-align:center!important;box-shadow:0 14px 34px rgba(34,60,82,.12)!important}
    .hero:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 86% 10%,rgba(48,150,82,.18),transparent 30%),radial-gradient(circle at 100% 80%,rgba(242,182,50,.2),transparent 34%),linear-gradient(145deg,transparent 58%,rgba(220,70,56,.08));pointer-events:none}
    .main-logo{position:relative!important;z-index:1!important;display:block!important;width:118px!important;height:118px!important;object-fit:contain!important;margin:0 auto 12px!important;padding:4px!important;border-radius:24px!important;background:#fff!important;box-shadow:0 8px 22px rgba(20,54,68,.14)!important;filter:none!important}
    .hero h1{position:relative!important;z-index:1!important;color:var(--navy)!important;font-size:30px!important;margin:8px 0 4px!important}
    .hero p{position:relative!important;z-index:1!important;color:var(--green)!important;font-weight:900!important;margin:0!important}
    .cart-top{z-index:2!important;background:rgba(255,255,255,.95)!important;color:var(--green)!important;border:1px solid var(--line)!important;box-shadow:0 6px 16px rgba(24,55,70,.12)!important}
    .cart-badge{background:var(--red)!important}
    .benefits{position:relative!important;z-index:1!important;gap:8px!important;margin-top:14px!important}
    .benefit{background:rgba(255,255,255,.78)!important;border:1px solid rgba(225,219,207,.92)!important;border-radius:16px!important;box-shadow:0 6px 16px rgba(24,49,73,.06)!important;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
    .benefit b{color:var(--green)!important}
    .notice,.availability-note{border-radius:16px!important;box-shadow:0 5px 15px rgba(24,49,73,.05)!important}
    .checkout{background:rgba(255,255,255,.94)!important;border:1px solid var(--line)!important;border-radius:21px!important;box-shadow:0 8px 24px rgba(25,48,80,.07)!important}
    .checkout h2,.field-label{color:var(--navy)!important}
    input,select,textarea{border:1.5px solid #d9d2c5!important;border-radius:14px!important;background:#fff!important}
    input:focus,select:focus,textarea:focus{outline:3px solid rgba(242,182,50,.22)!important;border-color:var(--yellow)!important}
    .sticky{background:linear-gradient(90deg,#173b2a,var(--green))!important;border-top:4px solid var(--yellow)!important}
    .summary b span{color:#ffe373!important}.send,.cart-primary{background:#25b95a!important}
    .credit{color:var(--navy)!important}
    @media(max-width:560px){.wrap{padding:10px!important}.hero{padding:15px 12px 18px!important}.main-logo{width:104px!important;height:104px!important}.hero h1{font-size:27px!important}.hero p{font-size:15px!important}}
  `;
  document.head.appendChild(style);

  function apply(){
    const logo=document.querySelector('.main-logo');
    if(logo){logo.src=LOGO;logo.alt='Ceviches y Cócteles El Cubano';}
    document.querySelectorAll('.customer-food-hero,.real-food-hero,.food-hero,[data-customer-food-hero]').forEach(el=>el.remove());
  }
  apply();
  new MutationObserver(apply).observe(document.body,{childList:true,subtree:true});
})();