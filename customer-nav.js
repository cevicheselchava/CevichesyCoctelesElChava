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
          gap:5px;
          margin:12px 0 14px;
          padding:8px;
          background:rgba(255,255,255,.94);
          border:1px solid #e8e1d4;
          border-radius:20px;
          box-shadow:0 9px 24px rgba(24,55,70,.10);
        }
        #${NAV_ID} button{
          min-width:0;
          min-height:64px;
          padding:7px 2px;
          border:0;
          border-radius:14px;
          background:#f4f6f4;
          color:#123458;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          gap:3px;
          font-size:10px;
          line-height:1.05;
          font-weight:900;
          box-shadow:none;
        }
        #${NAV_ID} button.active{
          background:linear-gradient(135deg,#267642,#319552);
          color:#fff;
          box-shadow:inset 0 -4px 0 #f2b632,0 5px 12px rgba(38,118,66,.24);
        }
        #${NAV_ID} .cat-icon{font-size:20px;line-height:1}
        #${NAV_ID} .cat-label{display:block;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .section[data-group]{margin-top:0!important}
        .section[data-group]>.section-title{display:none!important}
        .section[data-group]>.products{margin-top:0!important}
        .section[data-group].open>.products{margin-top:8px!important}
        @media(min-width:720px){#${NAV_ID} button{font-size:13px}#${NAV_ID} .cat-icon{font-size:24px}}
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
