(()=>{
  const VERSION='9';
  const NAV_ICONS={orders:'🧾',inventory:'📦',purchases:'🛒',history:'🕒',recipes:'👨‍🍳'};
  const INGREDIENT_ICONS={
    'Filete de pescado':'🐟','Camarón':'🍤','Tentáculo de pulpo':'🐙','Tomate':'🍅','Pepino':'🥒',
    'Cebolla morada':'🧅','Cilantro':'🌿','Jugo de limón':'🍋','Clamato':'🥤',
    'Contenedor para ceviche 16 oz (1 libra)':'🥣','Tapa para contenedor de 16 oz':'🔘',
    'Tenedores':'🍴','Cucharas':'🥄','Servilletas':'🧻','Coca-Cola':'🥤'
  };

  document.title='Panel Operativo El Chava';
  const themeMeta=document.querySelector('meta[name="theme-color"]');
  if(themeMeta)themeMeta.setAttribute('content','#062b5c');

  const style=document.createElement('style');
  style.id='el-chava-operativo-theme';
  style.textContent=`
    :root{--navy:#062b5c;--navy2:#0b467f;--red:#e21e2b;--yellow:#ffb000;--lime:#55a630;--cream:#fffaf0;--ink:#10213d;--muted:#6c788c;--line:#e7ddcb}
    html{background:#fffaf0}body{padding-top:max(0px,env(safe-area-inset-top));background:radial-gradient(circle at 92% 5%,#fff0c9 0,transparent 26%),linear-gradient(180deg,#fff,#fffaf0 55%,#f7fbff);color:var(--ink)}
    .wrap{max-width:1100px;padding:14px}
    .hero{position:relative;overflow:hidden;min-height:132px;padding:18px 20px;background:linear-gradient(135deg,var(--navy),#083c76 62%,#0a5590);border-radius:26px;border:1px solid rgba(255,255,255,.18);box-shadow:0 14px 34px rgba(6,43,92,.25)}
    .hero:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 80% 20%,rgba(255,176,0,.2),transparent 27%),repeating-radial-gradient(circle at 100% 100%,transparent 0 18px,rgba(255,255,255,.035) 19px 20px);pointer-events:none}
    .hero:after{content:'🍤  🍋';position:absolute;right:18px;top:20px;font-size:42px;filter:drop-shadow(0 4px 4px rgba(0,0,0,.18));opacity:.95}
    .hero img{position:relative;width:92px;height:92px;border-radius:22px;padding:7px;background:#fff;box-shadow:0 8px 20px rgba(0,0,0,.22)}
    .hero>div{position:relative;z-index:1;max-width:68%}.hero h1{font-size:28px;line-height:1.04;margin:0;color:#fff}.hero h1 span{display:block;margin-top:3px;color:var(--yellow);font-family:Georgia,serif;font-size:34px;font-style:italic}.hero p{font-size:15px;color:#eaf3ff;margin-top:8px}
    .sync{border:0;border-left:6px solid var(--lime);background:#effbef;border-radius:15px;padding:12px 14px;box-shadow:0 5px 16px rgba(38,92,55,.08)}
    .sync.error{border:1px solid #f5b9bd;border-left:6px solid var(--red);background:#fff2f2;color:#8e1620;font-size:14px;line-height:1.35}
    .stats{gap:10px;margin-top:12px}.stat{position:relative;min-height:118px;padding:14px 12px 12px 58px;border:1px solid transparent;box-shadow:0 7px 20px rgba(19,40,71,.08)}
    .stat:before{position:absolute;left:13px;top:15px;width:36px;height:36px;display:grid;place-items:center;border-radius:50%;font-size:20px;color:#fff;box-shadow:0 5px 12px rgba(0,0,0,.12)}
    .stat:nth-child(1){background:linear-gradient(145deg,#f0fff2,#fff);border-color:#cfe8d1}.stat:nth-child(1):before{content:'💵';background:#23913a}.stat:nth-child(1) b{color:#23913a}
    .stat:nth-child(2){background:linear-gradient(145deg,#fff8e4,#fff);border-color:#f2dfad}.stat:nth-child(2):before{content:'📈';background:var(--yellow)}.stat:nth-child(2) b{color:#dc9000}
    .stat:nth-child(3){background:linear-gradient(145deg,#eef6ff,#fff);border-color:#cbdcf0}.stat:nth-child(3):before{content:'📋';background:var(--navy2)}
    .stat:nth-child(4){background:linear-gradient(145deg,#fff0f1,#fff);border-color:#f2c7ca}.stat:nth-child(4):before{content:'⚠️';background:var(--red)}
    .stat small{font-size:13px;line-height:1.25}.stat b{font-size:25px;margin-top:7px}
    .nav,.nav.recipe-nav{grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;margin:12px 0 14px;padding:8px;background:linear-gradient(135deg,var(--navy),#073d76);border-radius:19px;box-shadow:0 9px 24px rgba(6,43,92,.2);top:max(0px,env(safe-area-inset-top))}
    .nav button{min-width:0;min-height:66px;padding:7px 2px;border-radius:13px;background:transparent;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-size:11px;line-height:1.1}
    .nav button.active{background:linear-gradient(145deg,var(--red),#f33a45);color:#fff;box-shadow:inset 0 -4px 0 var(--yellow),0 5px 12px rgba(226,30,43,.3)}
    .nav-icon{font-size:22px;line-height:1}.nav-label{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
    .card{border:1px solid rgba(231,221,203,.9);border-radius:19px;box-shadow:0 8px 24px rgba(25,48,80,.07);padding:15px;background:rgba(255,255,255,.96)}
    .card h2{display:flex;align-items:center;gap:9px;font-size:23px;margin-bottom:12px}.card h2:before{content:'✦';display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:#fff2d8;color:var(--red);font-size:21px}
    #recipes .card h2:before{content:'👨‍🍳';background:#fff0ef}
    .notice{position:relative;background:linear-gradient(135deg,#fff8e7,#fffdf6);border:1px solid #f3d791;border-radius:15px;padding:13px 48px 13px 13px;line-height:1.4}.notice:after{content:'🍋';position:absolute;right:13px;top:50%;transform:translateY(-50%);font-size:29px}
    input,select{border:1.5px solid #d9cfbd;border-radius:14px;padding:13px;background:#fff;box-shadow:inset 0 1px 2px rgba(0,0,0,.03)}input:focus,select:focus{outline:3px solid rgba(255,176,0,.22);border-color:var(--yellow)}
    label{font-size:15px}.primary{border-radius:14px;background:linear-gradient(135deg,#23913a,#2cab4a);box-shadow:0 7px 16px rgba(35,145,58,.23)}
    .recipe-presets{gap:9px}.recipe-preset{border:1.5px solid var(--navy)!important;border-radius:14px!important;background:#fff!important;color:var(--navy)!important;padding:13px 8px!important;box-shadow:0 4px 10px rgba(6,43,92,.06)}.recipe-preset.active{border-color:var(--red)!important;background:linear-gradient(135deg,var(--red),#f33a45)!important;color:#fff!important;box-shadow:0 7px 15px rgba(226,30,43,.24)}
    .recipe-options{gap:10px}.recipe-check{border-radius:14px!important;background:#fffdf7!important;border-color:#ebddc4!important}.recipe-check input{accent-color:var(--lime)}
    .recipe-summary{position:relative;padding:14px 14px 14px 53px!important;background:linear-gradient(135deg,#eaf4ff,#f7fbff)!important;border:1px solid #bed5ef!important;border-radius:16px!important}.recipe-summary:before{content:'🎁';position:absolute;left:13px;top:50%;transform:translateY(-50%);width:30px;height:30px;display:grid;place-items:center;border-radius:50%;background:#2387e8;color:#fff}
    .recipe-group h3{background:linear-gradient(90deg,#eaf0f7,#f7f9fc)!important;border-left:5px solid var(--yellow);border-radius:12px!important;color:var(--navy)!important}
    .recipe-row{position:relative;grid-template-columns:1fr auto!important;padding:12px 12px 12px 58px!important;border-radius:15px!important;border:1px solid #e5dccb!important;box-shadow:0 4px 12px rgba(25,48,80,.05)}
    .ingredient-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);width:36px;height:36px;display:grid;place-items:center;border-radius:50%;background:#fff3d6;font-size:21px}
    .recipe-row strong{font-size:17px}.recipe-row small{font-size:13px}.recipe-buy{padding:7px 10px;border-radius:12px;background:#fff0f1;color:var(--red)!important;line-height:1.15}.recipe-buy.enough{background:#effaef;color:#23843a!important}
    .inv,.order,.movement{border-radius:15px;border-color:#e5dccb;box-shadow:0 4px 12px rgba(25,48,80,.045)}.group-title{border-left:5px solid var(--yellow);background:#eef3f8}
    .footer{background:linear-gradient(90deg,var(--navy),#0a4b85);border-top:4px solid var(--yellow);font-size:13px;text-align:center;letter-spacing:.15px}
    @media(min-width:760px){.hero>div{max-width:none}.hero:after{font-size:56px}.nav button{font-size:13px}.nav-icon{font-size:25px}}
    @media(max-width:560px){.wrap{padding:10px}.hero{min-height:118px;padding:15px}.hero img{width:78px;height:78px}.hero h1{font-size:23px}.hero h1 span{font-size:29px}.hero p{font-size:13px}.hero:after{right:10px;top:17px;font-size:30px}.hero>div{max-width:65%}.stats{grid-template-columns:repeat(2,minmax(0,1fr))}.stat{min-height:111px;padding-left:52px}.nav,.nav.recipe-nav{grid-template-columns:repeat(5,minmax(0,1fr))}.nav button{font-size:10px}.nav-icon{font-size:19px}.card{padding:12px}.card h2{font-size:21px}.recipe-row{padding-left:54px!important}}
  `;
  document.head.appendChild(style);

  function brandHeader(){
    const hero=document.querySelector('.hero');
    if(!hero)return;
    const h1=hero.querySelector('h1');
    const p=hero.querySelector('p');
    if(h1)h1.innerHTML='Panel Operativo <span>El Chava</span>';
    if(p)p.textContent='Ceviches y Cócteles El Chava';
  }

  function decorateNav(){
    document.querySelectorAll('.nav button[data-tab]').forEach(button=>{
      if(button.querySelector('.nav-icon'))return;
      const tab=button.dataset.tab;
      const label=button.textContent.trim();
      button.innerHTML=`<span class="nav-icon">${NAV_ICONS[tab]||'●'}</span><span class="nav-label">${label}</span>`;
    });
  }

  function decorateIngredients(){
    document.querySelectorAll('.recipe-row').forEach(row=>{
      if(row.querySelector('.ingredient-icon'))return;
      const name=row.querySelector('strong')?.textContent.trim()||'';
      const icon=document.createElement('span');
      icon.className='ingredient-icon';
      icon.textContent=INGREDIENT_ICONS[name]||'✓';
      row.prepend(icon);
    });
  }

  function tidyStatus(){
    const status=document.getElementById('syncStatus');
    if(!status)return;
    const text=status.textContent||'';
    if(text.includes('Cloud Firestore API has not been used')||text.includes('is disabled')){
      status.classList.add('error');
      status.innerHTML='<b>Conexión pendiente:</b> falta activar Cloud Firestore para sincronizar pedidos e inventario.';
    }
  }

  function finish(){
    brandHeader();
    decorateNav();
    decorateIngredients();
    tidyStatus();
    const footer=document.querySelector('.footer');
    if(footer)footer.textContent=`Panel Operativo El Chava · v${VERSION}`;
  }

  finish();
  const observer=new MutationObserver(()=>requestAnimationFrame(finish));
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});
})();
