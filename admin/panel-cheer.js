(()=>{
  if(window.__EL_CUBANO_PANEL_CHEER_V1__)return;
  window.__EL_CUBANO_PANEL_CHEER_V1__=true;

  const style=document.createElement('style');
  style.id='el-cubano-panel-cheer-v1';
  style.textContent=`
    /* Alegre y limpio: acentos reggae sin convertir el panel en fiesta */
    .manual-sheet,
    #recipePurchaseModal .modal-card,
    #recipePurchaseModal .purchase-modal,
    #recipePurchaseModal>div{
      position:relative!important;
      background:linear-gradient(165deg,#fffef9 0%,#fffaf0 58%,#f7fff8 100%)!important;
    }
    .manual-sheet:before,
    #recipePurchaseModal .modal-card:before,
    #recipePurchaseModal .purchase-modal:before{
      content:"";position:sticky;display:block;top:-16px;height:7px;margin:-16px -16px 14px;z-index:3;
      background:linear-gradient(90deg,#dc4638 0 33%,#f2b632 33% 66%,#267642 66% 100%);
    }

    .manual-sheet h2{display:flex;align-items:center;gap:10px;font-size:25px!important}
    .manual-sheet h2:before{
      content:'🧾';width:42px;height:42px;display:grid;place-items:center;border-radius:14px;
      background:#fff1d1;box-shadow:0 5px 13px rgba(18,52,88,.10);font-size:23px;
    }
    .manual-sheet>p{padding:10px 12px;border-radius:13px;background:#eef8ef;color:#315541!important;border-left:5px solid #267642}
    .manual-grid{gap:11px!important}
    .manual-grid label{font-weight:1000;color:#123458}
    .manual-grid input,.manual-grid select{
      margin-top:5px;background:#fff!important;border:1.5px solid #ddd4c4!important;border-radius:14px!important;
      box-shadow:0 3px 9px rgba(18,52,88,.035);
    }
    .manual-grid input:focus,.manual-grid select:focus{border-color:#f2b632!important;outline:3px solid rgba(242,182,50,.18)!important}
    .manual-check{background:linear-gradient(135deg,#fff9e8,#fff)!important;border-color:#ead89b!important;border-left:5px solid #f2b632!important}
    .manual-summary{
      position:relative;padding:14px 14px 14px 55px!important;border-radius:17px!important;
      background:linear-gradient(135deg,#eef8ef,#fffdf3)!important;border:1px solid #b9d9bf!important;
      box-shadow:0 6px 15px rgba(38,118,66,.08)!important;line-height:1.55!important;
    }
    .manual-summary:before{content:'💵';position:absolute;left:13px;top:14px;width:32px;height:32px;display:grid;place-items:center;border-radius:50%;background:#267642;color:#fff}
    .manual-top{gap:10px!important}
    .manual-top button{min-height:52px!important;border-radius:15px!important;box-shadow:0 6px 14px rgba(18,52,88,.10)!important;font-size:14px}
    .manual-add{background:linear-gradient(135deg,#267642,#319552)!important;border-bottom:5px solid #f2b632!important}
    .manual-route{background:linear-gradient(135deg,#f3f7ff,#fff)!important;border:1px solid #cad9eb!important;color:#123458!important}
    .manual-save{background:linear-gradient(135deg,#267642,#319552)!important;border-bottom:4px solid #f2b632!important;box-shadow:0 7px 16px rgba(38,118,66,.20)!important}
    .manual-cancel{background:#f1f3f5!important}

    /* Modal de compra: más visual sin perder rapidez */
    #recipePurchaseModal{backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)}
    #recipePurchaseModal h2,#purchaseModalTitle{
      display:flex!important;align-items:center!important;gap:10px!important;color:#123458!important;font-size:25px!important;
    }
    #purchaseModalTitle:before{content:'🛒';width:42px;height:42px;flex:0 0 42px;display:grid;place-items:center;border-radius:14px;background:#fff1d1;box-shadow:0 5px 13px rgba(18,52,88,.10);font-size:22px}
    #purchaseModalNeed{
      display:inline-block!important;margin:2px 0 13px!important;padding:7px 11px!important;border-radius:999px!important;
      background:#ffe8e4!important;color:#c8382d!important;font-weight:1000!important;border:1px solid #f0b8b1!important;
    }
    #simplePurchaseForm{gap:11px!important}
    #simplePurchaseForm label{font-weight:1000!important;color:#123458!important}
    #simplePurchaseForm input,#simplePurchaseForm select{
      margin-top:5px!important;background:#fff!important;border:1.5px solid #dcd4c6!important;border-radius:14px!important;
      box-shadow:0 3px 9px rgba(18,52,88,.035)!important;
    }
    #simplePurchaseForm input:focus,#simplePurchaseForm select:focus{border-color:#f2b632!important;outline:3px solid rgba(242,182,50,.18)!important}
    #simplePackageFields{
      background:linear-gradient(135deg,#fff9e7,#fffdf6)!important;border:1px solid #efd99a!important;
      border-left:5px solid #f2b632!important;border-radius:16px!important;padding:12px!important;
    }
    #simplePackageFields:before{content:'📦 Presentación del paquete';grid-column:1/-1;color:#8a6200;font-weight:1000;font-size:14px}
    #simpleTotal{border-color:#a9d2b1!important;background:#f9fff9!important;font-size:21px!important;font-weight:1000!important;color:#267642!important}
    #simpleBuyNote{
      position:relative!important;padding:14px 14px 14px 55px!important;border-radius:17px!important;
      background:linear-gradient(135deg,#eaf8ed,#fffbea)!important;border:1px solid #b6d9be!important;
      box-shadow:0 6px 15px rgba(38,118,66,.08)!important;font-size:15px!important;
    }
    #simpleBuyNote:before{content:'✅';position:absolute;left:13px;top:50%;transform:translateY(-50%);width:32px;height:32px;display:grid;place-items:center;border-radius:50%;background:#267642;color:#fff}
    #purchaseCalc{display:none!important}

    #recipePurchaseModal button.primary,#recipePurchaseModal .primary{
      background:linear-gradient(135deg,#267642,#319552)!important;border-bottom:4px solid #f2b632!important;
      box-shadow:0 7px 16px rgba(38,118,66,.20)!important;border-radius:14px!important;
    }
    #recipePurchaseModal button.secondary,#recipePurchaseModal .secondary{border-radius:14px!important}

    @media(max-width:560px){
      .manual-sheet h2,#purchaseModalTitle{font-size:23px!important}
      .manual-sheet h2:before,#purchaseModalTitle:before{width:38px;height:38px;flex-basis:38px;font-size:20px}
      .manual-summary,#simpleBuyNote{padding-left:51px!important}
    }
  `;
  document.head.appendChild(style);

  const iconMap={
    'Filete de pescado':'🐟','Camarón':'🍤','Tentáculo de pulpo':'🐙','Tomate':'🍅','Pepino':'🥒','Cebolla morada':'🧅','Cilantro':'🌿','Jugo de limón':'🍋','Clamato':'🥤','Aguacate':'🥑','Coca-Cola':'🥤'
  };

  function decoratePurchase(){
    const title=document.getElementById('purchaseModalTitle');
    if(!title)return;
    const raw=(title.textContent||'').replace(/^Editar\s*·\s*/,'').trim();
    const icon=Object.entries(iconMap).find(([name])=>raw.includes(name))?.[1]||'🛒';
    title.style.setProperty('--purchase-icon',`'${icon}'`);
    const styleId='dynamicPurchaseIcon';
    let dynamic=document.getElementById(styleId);
    if(!dynamic){dynamic=document.createElement('style');dynamic.id=styleId;document.head.appendChild(dynamic)}
    dynamic.textContent=`#purchaseModalTitle:before{content:'${icon}'!important}`;
  }

  decoratePurchase();
  const observer=new MutationObserver(decoratePurchase);
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});
})();