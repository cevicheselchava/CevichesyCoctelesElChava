(()=>{
  const LOGO='/pwa-icon.svg?v=20260807-reggae3';
  document.title='Ceviches y Cócteles El Cubano';
  const theme=document.querySelector('meta[name="theme-color"]');
  if(theme)theme.setAttribute('content','#1f6f3b');

  const style=document.createElement('style');
  style.id='el-cubano-customer-theme';
  style.textContent=`
    :root{--navy:#14365b;--green:#257344;--green2:#3d9960;--yellow:#f4bf32;--gold:#dfa91e;--red:#dc4638;--red2:#ef6757;--cream:#fffaf0;--ink:#18304f;--muted:#6b778a;--line:#e8dfcf}
    html{background:var(--cream)}
    body{position:relative;background:#fffaf2!important;color:var(--ink)!important;min-height:100vh}
    body:after{content:"";position:fixed;inset:0;z-index:-3;background:
      radial-gradient(circle at 2% 9%,rgba(220,70,56,.16),transparent 29%),
      radial-gradient(circle at 94% 8%,rgba(244,191,50,.25),transparent 31%),
      radial-gradient(circle at 12% 88%,rgba(37,115,68,.13),transparent 31%),
      radial-gradient(circle at 92% 84%,rgba(220,70,56,.09),transparent 29%),
      linear-gradient(155deg,#fffdf8 0%,#fff9ec 48%,#fffdf8 100%);pointer-events:none}
    body:before{content:""!important;position:fixed!important;left:-12%!important;right:-12%!important;bottom:8%!important;height:155px!important;top:auto!important;z-index:-2!important;opacity:.55!important;background:
      linear-gradient(7deg,transparent 0 17%,rgba(220,70,56,.16) 18% 31%,transparent 32% 41%,rgba(244,191,50,.22) 42% 56%,transparent 57% 67%,rgba(37,115,68,.15) 68% 81%,transparent 82%)!important;transform:rotate(-3deg)!important;pointer-events:none!important}
    .wrap{max-width:980px!important;padding:14px!important}
    .hero{position:relative!important;overflow:hidden!important;background:rgba(255,255,255,.78)!important;border:1px solid rgba(225,217,202,.94)!important;border-radius:28px!important;padding:16px 18px 19px!important;box-shadow:0 14px 34px rgba(34,60,82,.11)!important;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
    .hero:before{content:"";position:absolute;inset:0;background:
      radial-gradient(circle at 3% 20%,rgba(220,70,56,.14),transparent 29%),
      radial-gradient(circle at 89% 12%,rgba(244,191,50,.25),transparent 34%),
      radial-gradient(circle at 92% 94%,rgba(37,115,68,.12),transparent 31%);pointer-events:none}
    .hero:after{content:"";position:absolute;left:0;right:0;bottom:0;height:5px;background:linear-gradient(90deg,var(--red) 0 33%,var(--yellow) 33% 66%,var(--green) 66%);opacity:.92}
    .hero>*{position:relative;z-index:1}
    .customer-brand-row{display:grid;grid-template-columns:165px 1fr;align-items:center;gap:20px;text-align:left;padding-right:54px;margin-bottom:8px;min-height:165px}
    .main-logo{display:block!important;width:165px!important;height:165px!important;max-height:none!important;object-fit:contain!important;margin:0!important;padding:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;mix-blend-mode:multiply!important;filter:drop-shadow(0 8px 12px rgba(20,54,68,.16))!important;flex:0 0 auto}
    .customer-brand-copy strong{display:block;color:var(--navy);font-size:25px;line-height:1.03}
    .customer-brand-copy span{display:block;margin-top:4px;color:var(--green);font-family:Georgia,serif;font-size:39px;font-style:italic;line-height:1}
    .customer-brand-copy small{display:block;margin-top:8px;color:#6a5c48;font-size:14px;font-weight:800}
    .hero h1{text-align:center!important;color:var(--navy)!important;font-size:30px!important;margin:8px 0 4px!important}
    .hero p{text-align:center!important;color:#8e302b!important;font-weight:900!important;margin:0!important}
    .cart-top{z-index:3!important;background:rgba(255,255,255,.92)!important;color:var(--green)!important;border:1px solid var(--line)!important;box-shadow:0 6px 16px rgba(24,55,70,.12)!important}
    .cart-badge{background:var(--red)!important}
    .benefits{gap:8px!important;margin-top:14px!important}
    .benefit{position:relative;overflow:hidden;background:rgba(255,255,255,.78)!important;border:1px solid rgba(225,219,207,.92)!important;border-radius:17px!important;box-shadow:0 7px 18px rgba(24,49,73,.06)!important;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);padding-bottom:12px!important}
    .benefit:after{content:"";position:absolute;left:22%;right:22%;bottom:0;height:3px;border-radius:99px;background:var(--green)}
    .benefit:nth-child(1):after{background:var(--red)}.benefit:nth-child(2):after{background:var(--yellow)}.benefit:nth-child(3):after{background:var(--green)}
    .benefit:nth-child(1) b{color:var(--red)!important}.benefit:nth-child(2) b{color:#9b7000!important}.benefit:nth-child(3) b{color:var(--green)!important}
    .notice,.availability-note{border-radius:16px!important;box-shadow:0 5px 15px rgba(24,49,73,.05)!important;background:rgba(255,255,255,.72)!important;border:1px solid var(--line)!important}
    .notice b{color:#a23b31!important}.availability-note{color:var(--navy)!important;border-left:5px solid var(--green)!important}
    .product{background:rgba(255,255,255,.80)!important;border:1px solid rgba(226,218,204,.94)!important;border-radius:18px!important;box-shadow:0 6px 17px rgba(24,49,73,.06)!important}
    .promo-section .product{border-top:3px solid rgba(220,70,56,.68)!important}.promo-save{background:rgba(244,191,50,.22)!important;color:#7a5600!important}
    .checkout{background:rgba(255,255,255,.90)!important;border:1px solid var(--line)!important;border-radius:21px!important;box-shadow:0 8px 24px rgba(25,48,80,.07)!important;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
    .checkout h2,.field-label{color:var(--navy)!important}
    input,select,textarea{border:1.5px solid #d9d2c5!important;border-radius:14px!important;background:rgba(255,255,255,.94)!important}input:focus,select:focus,textarea:focus{outline:3px solid rgba(244,191,50,.22)!important;border-color:var(--yellow)!important}
    .sticky{background:linear-gradient(90deg,#153c2a,#246f42)!important;border-top:0!important;box-shadow:0 -5px 18px rgba(0,0,0,.16)!important}
    .sticky:before{content:"";position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,var(--red) 0 33%,var(--yellow) 33% 66%,var(--green) 66% 100%)}
    .summary b span{color:#ffe16a!important}.send,.cart-primary{background:linear-gradient(135deg,#279d50,#32bd63)!important}.credit{color:var(--navy)!important}
    @media(max-width:560px){
      .wrap{padding:10px!important}.hero{padding:13px 13px 17px!important}
      .customer-brand-row{grid-template-columns:126px 1fr;gap:12px;padding-right:42px;min-height:128px}
      .main-logo{width:126px!important;height:126px!important}
      .customer-brand-copy strong{font-size:19px}.customer-brand-copy span{font-size:31px}.customer-brand-copy small{font-size:11px;margin-top:6px}
      .hero h1{font-size:27px!important}.hero p{font-size:15px!important}
    }
  `;
  document.head.appendChild(style);

  function apply(){
    const hero=document.querySelector('.hero');
    const logo=hero?.querySelector('.main-logo');
    if(logo){logo.src=LOGO;logo.alt='Ceviches y Cócteles El Cubano';}
    if(hero&&logo&&!hero.querySelector('.customer-brand-row')){
      const row=document.createElement('div');
      row.className='customer-brand-row';
      const copy=document.createElement('div');
      copy.className='customer-brand-copy';
      copy.innerHTML='<strong>Ceviches & Cócteles</strong><span>El Cubano</span><small>Fresco · preparado al momento</small>';
      logo.parentNode.insertBefore(row,logo);
      row.appendChild(logo);
      row.appendChild(copy);
    }
    document.querySelectorAll('.customer-food-hero,.real-food-hero,.food-hero,.food-spotlight,[data-customer-food-hero]').forEach(el=>el.remove());
  }
  apply();
  new MutationObserver(apply).observe(document.body,{childList:true,subtree:true});
})();