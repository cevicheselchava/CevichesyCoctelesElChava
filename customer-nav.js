(()=>{
  const NAV_ID='customer-category-nav';
  const STYLE_ID='customer-category-nav-style';
  const ITEMS=[
    ['promotions','🔥','Promociones'],
    ['immediate','⚡','Entrega'],
    ['cocktails','🍹','Cócteles'],
    ['preorder','📅','Sobre pedido'],
    ['drinks','🥤','Refrescos']
  ];

  function setActive(group){
    document.querySelectorAll('.section[data-group]').forEach(section=>{
      const open=section.dataset.group===group;
      section.classList.toggle('open',open);
      const title=section.querySelector('.section-title');
      if(title)title.setAttribute('aria-expanded',open?'true':'false');
    });
    document.querySelectorAll(`#${NAV_ID} button`).forEach(button=>{
      button.classList.toggle('active',button.dataset.group===group);
    });
  }

  function install(){
    const firstSection=document.querySelector('.section[data-group]');
    if(!firstSection||document.getElementById(NAV_ID))return;

    if(!document.getElementById(STYLE_ID)){
      const style=document.createElement('style');
      style.id=STYLE_ID;
      style.textContent=`
        #${NAV_ID}{
          display:grid;
          grid-template-columns:repeat(5,minmax(0,1fr));
          gap:7px;
          margin:13px 0 15px;
          padding:9px;
          background:rgba(255,255,255,.80);
          border:1px solid #e8dfcf;
          border-radius:22px;
          box-shadow:0 10px 26px rgba(24,55,70,.09);
          backdrop-filter:blur(8px);
          -webkit-backdrop-filter:blur(8px);
        }
        #${NAV_ID} button{
          position:relative;
          overflow:hidden;
          min-width:0;
          min-height:70px;
          padding:8px 3px 10px;
          border:1px solid rgba(231,223,210,.9);
          border-radius:16px;
          background:rgba(250,250,247,.96);
          color:#14365b;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          gap:4px;
          font-size:10px;
          line-height:1.05;
          font-weight:900;
          box-shadow:0 5px 13px rgba(24,55,70,.05);
        }
        #${NAV_ID} button:after{content:"";position:absolute;left:13%;right:13%;bottom:0;height:4px;border-radius:9px;background:#257344}
        #${NAV_ID} button:nth-child(1):after{background:#dc4638}
        #${NAV_ID} button:nth-child(2):after{background:#f4bf32}
        #${NAV_ID} button:nth-child(3):after{background:#257344}
        #${NAV_ID} button:nth-child(4):after{background:#dc4638}
        #${NAV_ID} button:nth-child(5):after{background:#f4bf32}
        #${NAV_ID} button.active{color:#fff;box-shadow:0 7px 16px rgba(32,70,55,.18);transform:translateY(-1px)}
        #${NAV_ID} button:nth-child(1).active{background:linear-gradient(135deg,#c83a30,#e75e4e)}
        #${NAV_ID} button:nth-child(2).active{background:linear-gradient(135deg,#edb020,#f6c944);color:#14365b}
        #${NAV_ID} button:nth-child(3).active{background:linear-gradient(135deg,#257344,#3d9960)}
        #${NAV_ID} button:nth-child(4).active{background:linear-gradient(135deg,#c83a30,#e75e4e)}
        #${NAV_ID} button:nth-child(5).active{background:linear-gradient(135deg,#edb020,#f6c944);color:#14365b}
        #${NAV_ID} .cat-icon{font-size:22px;line-height:1}
        #${NAV_ID} .cat-label{display:block;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .section[data-group]{margin-top:0!important}
        .section[data-group]>.section-title{display:none!important}
        .section[data-group]>.products{margin-top:0!important}
        .section[data-group].open>.products{margin-top:9px!important}
        @media(min-width:720px){#${NAV_ID} button{font-size:13px;min-height:76px}#${NAV_ID} .cat-icon{font-size:25px}}
        @media(max-width:420px){#${NAV_ID}{gap:5px;padding:7px}#${NAV_ID} button{min-height:65px;border-radius:14px;font-size:9px}#${NAV_ID} .cat-icon{font-size:20px}}
      `;
      document.head.appendChild(style);
    }

    const nav=document.createElement('div');
    nav.id=NAV_ID;
    nav.setAttribute('aria-label','Categorías del menú');
    ITEMS.forEach(([group,icon,label],index)=>{
      const button=document.createElement('button');
      button.type='button';
      button.dataset.group=group;
      button.innerHTML=`<span class="cat-icon">${icon}</span><span class="cat-label">${label}</span>`;
      button.addEventListener('click',()=>setActive(group));
      nav.appendChild(button);
      if(index===0)button.classList.add('active');
    });
    firstSection.before(nav);
    setActive('promotions');
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
  new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});
})();
