(()=>{
  if(document.getElementById('customer-panel-buttons-style')) return;
  const style=document.createElement('style');
  style.id='customer-panel-buttons-style';
  style.textContent=`
    .section{margin-top:10px!important}
    .section-title{
      position:relative;
      background:rgba(255,255,255,.82)!important;
      color:#123458!important;
      border:1px solid rgba(222,218,207,.9)!important;
      border-radius:17px!important;
      padding:12px 14px!important;
      box-shadow:0 7px 18px rgba(24,49,73,.08)!important;
      backdrop-filter:blur(10px);
      -webkit-backdrop-filter:blur(10px);
      overflow:hidden;
    }
    .section-title::before{
      content:"";
      position:absolute;
      left:0;top:0;bottom:0;
      width:5px;
      border-radius:17px 0 0 17px;
      background:#d9b53d;
    }
    .section-heading{font-weight:1000!important;color:inherit!important}
    .section-title small{color:#6c7887!important;font-weight:900!important}
    .section-right{position:relative;z-index:1}
    .accordion-arrow{color:#123458!important}

    .section[data-group="promotions"] .section-title::before{background:#dc4638}
    .section[data-group="immediate"] .section-title::before{background:#2f8b50}
    .section[data-group="cocktails"] .section-title::before{background:#e5a91f}
    .section[data-group="preorder"] .section-title::before{background:#d86d4b}
    .section[data-group="drinks"] .section-title::before{background:#6b9b55}

    .section.open .section-title{
      background:linear-gradient(135deg,rgba(38,118,66,.98),rgba(47,139,80,.96))!important;
      color:#fff!important;
      border-color:rgba(38,118,66,.7)!important;
      box-shadow:0 9px 20px rgba(38,118,66,.18)!important;
    }
    .section.open .section-title::before{width:100%;opacity:.08;background:#fff!important}
    .section.open .section-title::after{
      content:"";
      position:absolute;
      left:18px;right:18px;bottom:0;
      height:4px;
      border-radius:999px 999px 0 0;
      background:#f2b632;
    }
    .section.open .section-title small{color:#fff3c4!important}
    .section.open .accordion-arrow{color:#fff!important}

    .benefit{
      background:rgba(255,255,255,.72)!important;
      border:1px solid rgba(220,216,205,.85)!important;
      box-shadow:0 5px 14px rgba(24,49,73,.06)!important;
      backdrop-filter:blur(8px);
      -webkit-backdrop-filter:blur(8px);
    }

    .instant-order-button{
      background:linear-gradient(135deg,#f2b632,#e8a61e)!important;
      color:#123458!important;
      border:1px solid rgba(211,154,22,.55)!important;
      border-radius:17px!important;
      box-shadow:0 8px 18px rgba(198,143,20,.18)!important;
    }

    @media(max-width:560px){
      .section-title{padding:11px 13px!important;border-radius:16px!important}
      .section-title::before{border-radius:16px 0 0 16px}
    }
  `;
  document.head.appendChild(style);
})();