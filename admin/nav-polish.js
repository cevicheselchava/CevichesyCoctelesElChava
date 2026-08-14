(()=>{
  if(window.__EL_CUBANO_NAV_POLISH_V1__)return;
  window.__EL_CUBANO_NAV_POLISH_V1__=true;

  const ICONS={
    orders:'🧾',
    inventory:'📦',
    history:'🕒',
    recipes:'👨‍🍳',
    prepare:'🥣',
    deliveries:'🛵'
  };
  const LABELS={
    orders:'Pedidos',
    inventory:'Inventario',
    history:'Historial',
    recipes:'Recetas',
    prepare:'Preparar',
    deliveries:'Entregas'
  };

  const style=document.createElement('style');
  style.id='el-cubano-nav-polish-v1-style';
  style.textContent=`
    .nav.el-cubano-premium-nav{
      display:grid!important;
      grid-template-columns:repeat(3,minmax(0,1fr))!important;
      gap:9px!important;
      padding:10px!important;
      border-radius:23px!important;
      background:rgba(255,255,255,.96)!important;
      border:1px solid #e5dece!important;
      box-shadow:0 10px 26px rgba(18,52,88,.10)!important;
    }
    .nav.el-cubano-premium-nav button[data-tab]{
      position:relative!important;
      overflow:hidden!important;
      min-width:0!important;
      min-height:82px!important;
      padding:10px 5px 12px!important;
      border:1px solid #e5e1d9!important;
      border-radius:18px!important;
      background:linear-gradient(145deg,#ffffff,#f4f7f4)!important;
      color:#123458!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      justify-content:center!important;
      gap:6px!important;
      font-weight:1000!important;
      box-shadow:0 5px 14px rgba(22,50,72,.07)!important;
      transform:translateY(0);
      transition:transform .14s ease,box-shadow .14s ease,border-color .14s ease!important;
    }
    .nav.el-cubano-premium-nav button[data-tab]::after{
      content:"";
      position:absolute;
      left:17%;right:17%;bottom:0;
      height:5px;
      border-radius:99px 99px 0 0;
      background:#267642;
    }
    .nav.el-cubano-premium-nav button[data-tab="orders"]::after{background:#dc4638}
    .nav.el-cubano-premium-nav button[data-tab="inventory"]::after{background:#f2b632}
    .nav.el-cubano-premium-nav button[data-tab="history"]::after{background:#123458}
    .nav.el-cubano-premium-nav button[data-tab="recipes"]::after{background:#267642}
    .nav.el-cubano-premium-nav button[data-tab="prepare"]::after{background:#f28b28}
    .nav.el-cubano-premium-nav button[data-tab="deliveries"]::after{background:#319552}
    .nav.el-cubano-premium-nav .nav-icon{
      width:39px!important;height:39px!important;
      display:grid!important;place-items:center!important;
      border-radius:13px!important;
      background:#fff!important;
      font-size:23px!important;
      line-height:1!important;
      box-shadow:0 4px 11px rgba(19,52,88,.12)!important;
    }
    .nav.el-cubano-premium-nav .nav-label{
      display:block!important;
      width:100%!important;
      max-width:100%!important;
      white-space:nowrap!important;
      overflow:hidden!important;
      text-overflow:ellipsis!important;
      font-size:12px!important;
      line-height:1.05!important;
      font-weight:1000!important;
      letter-spacing:-.01em!important;
    }
    .nav.el-cubano-premium-nav button[data-tab].active{
      color:#fff!important;
      border-color:transparent!important;
      background:linear-gradient(135deg,#267642,#319552)!important;
      box-shadow:0 9px 19px rgba(38,118,66,.28)!important;
      transform:translateY(-2px)!important;
    }
    .nav.el-cubano-premium-nav button[data-tab].active::after{background:#f2b632!important;height:6px!important;left:10%;right:10%}
    .nav.el-cubano-premium-nav button[data-tab].active .nav-icon{
      background:rgba(255,255,255,.96)!important;
      box-shadow:0 5px 12px rgba(0,0,0,.16)!important;
    }
    .nav.el-cubano-premium-nav button[data-tab]:active{transform:scale(.97)!important}
    @media(min-width:760px){
      .nav.el-cubano-premium-nav{grid-template-columns:repeat(6,minmax(0,1fr))!important}
      .nav.el-cubano-premium-nav button[data-tab]{min-height:88px!important}
      .nav.el-cubano-premium-nav .nav-label{font-size:13px!important}
    }
    @media(max-width:390px){
      .nav.el-cubano-premium-nav{gap:7px!important;padding:8px!important}
      .nav.el-cubano-premium-nav button[data-tab]{min-height:76px!important;padding-left:2px!important;padding-right:2px!important}
      .nav.el-cubano-premium-nav .nav-icon{width:36px!important;height:36px!important;font-size:21px!important}
      .nav.el-cubano-premium-nav .nav-label{font-size:11px!important}
    }
  `;
  document.head.appendChild(style);

  let decorating=false;
  function decorate(){
    if(decorating)return;
    decorating=true;
    try{
      const nav=document.querySelector('.nav');
      if(!nav)return;
      nav.classList.add('el-cubano-premium-nav');
      nav.querySelectorAll('button[data-tab]').forEach(button=>{
        const tab=button.dataset.tab;
        const icon=ICONS[tab]||'●';
        const label=LABELS[tab]||button.textContent.trim()||tab;
        const currentIcon=button.querySelector('.nav-icon');
        const currentLabel=button.querySelector('.nav-label');
        if(currentIcon&&currentLabel){
          if(currentIcon.textContent!==icon)currentIcon.textContent=icon;
          if(currentLabel.textContent!==label)currentLabel.textContent=label;
        }else{
          button.innerHTML=`<span class="nav-icon">${icon}</span><span class="nav-label">${label}</span>`;
        }
      });
    }finally{
      decorating=false;
    }
  }

  decorate();
  let scheduled=false;
  const observer=new MutationObserver(()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      decorate();
    });
  });
  observer.observe(document.body,{childList:true,subtree:true});
})();