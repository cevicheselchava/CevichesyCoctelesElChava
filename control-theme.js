(()=>{
  const VERSION='13';
  const LOGO='/pwa-icon.svg?v=20260806';
  const NAV_ICONS={orders:'🧾',inventory:'📦',history:'🕒',recipes:'👨‍🍳'};
  const INGREDIENT_ICONS={
    'Filete de pescado':'🐟','Camarón':'🍤','Tentáculo de pulpo':'🐙','Tomate':'🍅','Pepino':'🥒',
    'Cebolla morada':'🧅','Cilantro':'🌿','Jugo de limón':'🍋','Clamato':'🥤',
    'Contenedor para ceviche 16 oz (1 libra)':'🥣','Tapa para contenedor de 16 oz':'🔘',
    'Tenedores':'🍴','Cucharas':'🥄','Servilletas':'🧻','Coca-Cola':'🥤'
  };

  document.title='Panel Operativo El Cubano';
  const themeMeta=document.querySelector('meta[name="theme-color"]');
  if(themeMeta)themeMeta.setAttribute('content','#267642');

  const style=document.createElement('style');
  style.id='el-cubano-operativo-theme';
  style.textContent=`
    :root{--navy:#123458;--green:#267642;--green2:#319552;--yellow:#f2b632;--red:#dc4638;--orange:#f28b28;--cream:#fffdf7;--ink:#17304f;--muted:#6b778a;--line:#e8e1d4}
    html{background:var(--cream)}
    body{position:relative;padding-top:max(0px,env(safe-area-inset-top));background:#fffdf8;color:var(--ink);min-height:100vh}
    body:before{content:"";position:fixed;inset:0;z-index:-2;background:radial-gradient(circle at 5% 5%,rgba(48,150,82,.17),transparent 28%),radial-gradient(circle at 95% 20%,rgba(242,182,50,.18),transparent 30%),radial-gradient(circle at 92% 88%,rgba(220,70,56,.12),transparent 32%),linear-gradient(160deg,#fff 0%,#fffdf8 52%,#f7fff8 100%)}
    body:after{content:"";position:fixed;left:-16%;right:-16%;bottom:-5%;height:180px;z-index:-1;opacity:.45;background:linear-gradient(8deg,transparent 0 18%,rgba(48,150,82,.18) 19% 35%,transparent 36% 47%,rgba(242,182,50,.2) 48% 63%,transparent 64% 75%,rgba(220,70,56,.13) 76% 88%,transparent 89%);transform:rotate(-4deg);pointer-events:none}
    .wrap{max-width:1100px;padding:14px}
    .hero{position:relative;overflow:hidden;min-height:142px;padding:16px 19px;background:rgba(255,255,255,.93);color:var(--ink);border-radius:28px;border:1px solid rgba(225,219,207,.92);box-shadow:0 14px 34px rgba(34,60,82,.12)}
    .hero:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 86% 10%,rgba(48,150,82,.18),transparent 30%),radial-gradient(circle at 100% 80%,rgba(242,182,50,.2),transparent 34%),linear-gradient(145deg,transparent 58%,rgba(220,70,56,.08));pointer-events:none}
    .hero img{position:relative;width:112px;height:112px;border-radius:24px;padding:3px;background:#fff;box-shadow:0 8px 22px rgba(20,54,68,.14)}
    .hero>div{position:relative;z-index:1}.hero h1{font-size:28px;line-height:1.05;margin:0;color:var(--navy)}.hero h1 span{display:block;margin-top:4px;color:var(--green);font-family:Georgia,serif;font-size:35px;font-style:italic}.hero p{font-size:15px;color:#5b687b;margin-top:8px}
    .sync{border:0;border-left:6px solid var(--green);background:rgba(239,251,241,.96);border-radius:15px;padding:12px 14px;box-shadow:0 5px 16px rgba(38,92,55,.08)}
    .sync.error{border:1px solid #f1c0bd;border-left:6px solid var(--red);background:#fff5f3;color:#8e2920;font-size:14px;line-height:1.35}
    .stats{gap:10px;margin-top:12px}.stat{position:relative;min-height:112px;padding:14px 12px 12px 58px;border:1px solid transparent;box-shadow:0 7px 20px rgba(19,40,71,.08)}
    .stat:before{position:absolute;left:13px;top:15px;width:36px;height:36px;display:grid;place-items:center;border-radius:50%;font-size:20px;color:#fff}
    .stat:nth-child(1){background:linear-gradient(145deg,#f0fff2,#fff);border-color:#d2ead6}.stat:nth-child(1):before{content:'💵';background:var(--green)}.stat:nth-child(1) b{color:var(--green)}
    .stat:nth-child(2){background:linear-gradient(145deg,#fff8e7,#fff);border-color:#f0dfad}.stat:nth-child(2):before{content:'📈';background:var(--yellow)}.stat:nth-child(2) b{color:#ce8a0b}
    .stat:nth-child(3){background:linear-gradient(145deg,#f2f7ff,#fff);border-color:#d2dfef}.stat:nth-child(3):before{content:'📋';background:var(--navy)}
    .stat:nth-child(4){background:linear-gradient(145deg,#fff2ef,#fff);border-color:#f0cbc6}.stat:nth-child(4):before{content:'⚠️';background:var(--red)}
    .stat small{font-size:13px;line-height:1.25}.stat b{font-size:25px;margin-top:7px}
    .nav,.nav.recipe-nav{grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;margin:12px 0 14px;padding:8px;background:rgba(255,255,255,.94);border:1px solid var(--line);border-radius:20px;box-shadow:0 9px 24px rgba(24,55,70,.1);top:max(0px,env(safe-area-inset-top))}
    .nav button{min-width:0;min-height:64px;padding:7px 2px;border-radius:14px;background:#f4f6f4;color:var(--navy);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-size:11px;line-height:1.1}
    .nav button.active{background:linear-gradient(135deg,var(--green),var(--green2));color:#fff;box-shadow:inset 0 -4px 0 var(--yellow),0 5px 12px rgba(38,118,66,.24)}
    .nav-icon{font-size:22px;line-height:1}.nav-label{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
    .card{border:1px solid rgba(231,224,211,.94);border-radius:21px;box-shadow:0 8px 24px rgba(25,48,80,.07);padding:15px;background:rgba(255,255,255,.95)}
    .card h2{display:flex;align-items:center;gap:9px;font-size:23px;margin-bottom:12px}.card h2:before{content:'✦';display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:#fff2d8;color:var(--red);font-size:21px}
    #recipes .card h2:before{content:'👨‍🍳';background:#eff9ef}
    .notice{position:relative;background:linear-gradient(135deg,#fff9e9,#fffdf7);border:1px solid #f0d999;border-radius:15px;padding:13px 48px 13px 13px;line-height:1.4}.notice:after{content:'🍋';position:absolute;right:13px;top:50%;transform:translateY(-50%);font-size:29px}
    input,select{border:1.5px solid #d9d2c5;border-radius:14px;padding:13px;background:#fff}input:focus,select:focus{outline:3px solid rgba(242,182,50,.22);border-color:var(--yellow)}
    .primary{border-radius:14px;background:linear-gradient(135deg,var(--green),var(--green2));box-shadow:0 7px 16px rgba(38,118,66,.22)}
    .orders-tools{display:grid;gap:9px;margin:0 0 12px}.orders-search{position:relative}.orders-search:before{content:'🔎';position:absolute;left:13px;top:50%;transform:translateY(-50%);z-index:1}.orders-search input{padding-left:44px}.order-filters{display:flex;gap:7px;overflow:auto;padding:2px 0 4px;scrollbar-width:none}.order-filters::-webkit-scrollbar{display:none}.order-filter{border:1px solid #e3ddd2;border-radius:999px;padding:9px 13px;background:#fff;color:var(--navy);font-weight:900;white-space:nowrap}.order-filter.active{background:var(--red);border-color:var(--red);color:#fff}.order-counters{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.order-counter{border-radius:14px;padding:10px;background:#f7f8f7;text-align:center;font-weight:900}.order-counter b{display:block;font-size:22px;margin-top:2px}.order-counter[data-status="nuevo"] b{color:var(--red)}.order-counter[data-status="confirmado"] b{color:#c98909}.order-counter[data-status="entregado"] b{color:var(--green)}
    .order-list{gap:11px}.order{position:relative;border-radius:18px;border:1px solid #e7e0d4;background:#fff;padding:14px;box-shadow:0 6px 17px rgba(24,48,67,.07);overflow:hidden}.order:before{content:"";position:absolute;left:0;top:0;bottom:0;width:6px;background:var(--red)}.order.status-confirmado:before{background:var(--yellow)}.order.status-entregado:before{background:var(--green)}.order.status-cancelado:before{background:#9b9b9b}.order-head{align-items:flex-start;padding-left:3px}.order strong{font-size:18px}.order small{font-size:13px;line-height:1.5}.badge{padding:7px 10px}.nuevo{background:#ffe7e2;color:#b8281f}.confirmado{background:#fff1c8;color:#8a5a00}.entregado{background:#e2f5e5;color:#176b2c}.cancelado{background:#ececec;color:#666}.order-items{background:#faf9f6;border:0;border-radius:12px;padding:10px;margin-top:10px}.actions{gap:7px}.actions button{border-radius:12px}.secondary{background:#fff0ed;color:#a72a22}.success{background:linear-gradient(135deg,var(--green),var(--green2));color:#fff}.danger{background:#f1f1f1;color:#777}
    .recipe-presets{gap:9px}.recipe-preset{border:1.5px solid var(--green)!important;border-radius:14px!important;background:#fff!important;color:var(--green)!important;padding:13px 8px!important}.recipe-preset.active{border-color:var(--red)!important;background:linear-gradient(135deg,var(--red),#ef6355)!important;color:#fff!important}.recipe-check input{accent-color:var(--green)}
    .recipe-summary{position:relative;padding:14px 14px 14px 53px!important;background:linear-gradient(135deg,#eef8ef,#fbfffb)!important;border:1px solid #bcdcc2!important;border-radius:16px!important}.recipe-summary:before{content:'📝';position:absolute;left:13px;top:50%;transform:translateY(-50%);width:30px;height:30px;display:grid;place-items:center;border-radius:50%;background:var(--green);color:#fff}
    .recipe-group h3,.group-title{background:linear-gradient(90deg,#edf7ef,#f8fbf8)!important;border-left:5px solid var(--yellow);border-radius:12px!important;color:var(--navy)!important}.recipe-row{position:relative;padding-left:58px!important;border-radius:15px!important;border:1px solid #e5ded2!important;box-shadow:0 4px 12px rgba(25,48,80,.05)}.ingredient-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);width:36px;height:36px;display:grid;place-items:center;border-radius:50%;background:#fff3d6;font-size:21px}.recipe-buy{padding:7px 10px;border-radius:12px;background:#fff0ed;color:var(--red)!important}.recipe-buy.enough{background:#effaef;color:var(--green)!important}
    .inv,.movement{border-radius:15px;border-color:#e5ded2;box-shadow:0 4px 12px rgba(25,48,80,.045)}
    .footer{background:linear-gradient(90deg,#173b2a,var(--green));border-top:4px solid var(--yellow);font-size:13px;text-align:center}
    .simple-purchase-form{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:8px}.simple-purchase-form .full{grid-column:1/-1}.simple-purchase-form label{font-size:14px}.simple-purchase-form input,.simple-purchase-form select{padding:12px}.simple-store-other[hidden],.simple-package-fields[hidden]{display:none!important}.simple-package-fields{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:10px;border-radius:13px;background:#f6f7f4;border:1px solid #e4e1d8}.simple-buy-note{grid-column:1/-1;margin:0;padding:9px 11px;border-radius:11px;background:#eff8ef;color:#17304f;font-size:13px;font-weight:900;line-height:1.4}
    @media(min-width:760px){.hero>div{max-width:none}.nav button{font-size:13px}.nav-icon{font-size:25px}.order-counters{grid-template-columns:repeat(3,180px)}}
    @media(max-width:560px){.wrap{padding:10px}.hero{min-height:126px;padding:13px}.hero img{width:92px;height:92px}.hero h1{font-size:22px}.hero h1 span{font-size:29px}.hero p{font-size:13px}.hero>div{max-width:63%}.stats{grid-template-columns:repeat(2,minmax(0,1fr))}.stat{min-height:108px;padding-left:52px}.nav button{font-size:10px}.nav-icon{font-size:19px}.card{padding:12px}.card h2{font-size:21px}.order-counters{grid-template-columns:repeat(3,1fr)}.order-counter{font-size:11px;padding:8px 4px}.recipe-row{padding-left:54px!important}.simple-purchase-form{grid-template-columns:1fr}.simple-purchase-form .full{grid-column:1}.simple-package-fields{grid-column:1;grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  function brandHeader(){
    const hero=document.querySelector('.hero');
    if(!hero)return;
    const img=hero.querySelector('img');
    const h1=hero.querySelector('h1');
    const p=hero.querySelector('p');
    if(img){img.src=LOGO;img.alt='Ceviches y Cócteles El Cubano';}
    if(h1)h1.innerHTML='Panel Operativo <span>El Cubano</span>';
    if(p)p.textContent='Ceviches & Cócteles';
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

  let lastPurchaseTitle='';

  function itemByTitle(title){
    if(typeof ITEMS==='undefined')return null;
    return Object.entries(ITEMS).find(([,item])=>item?.name===title)?.[1]||null;
  }

  function niceUnit(unit,singular=false){
    const map={lb:'lb',oz:'oz',pzas:singular?'pieza':'piezas',latas:singular?'lata':'latas',sobres:singular?'sobre':'sobres',manojo:singular?'manojo':'manojos','fl oz':'fl oz'};
    return map[unit]||unit||'unidad';
  }

  function directChoices(item){
    const base=item?.purchaseUnit||item?.unit||'pzas';
    if(base==='lb')return [{v:'lb',t:'lb'},{v:'oz',t:'oz'},{v:'package',t:'paquete'}];
    return [{v:base,t:niceUnit(base,true)},{v:'package',t:'paquete'}];
  }

  function contentChoices(item){
    const base=item?.purchaseUnit||item?.unit||'pzas';
    if(base==='lb')return [{v:'oz',t:'oz'},{v:'lb',t:'lb'}];
    return [{v:base,t:niceUnit(base,false)}];
  }

  function simplifyPurchaseModal(){
    const modal=document.getElementById('recipePurchaseModal');
    const oldGrid=modal?.querySelector('.purchase-grid');
    const oldStore=document.getElementById('purchaseModalStore');
    const oldContent=document.getElementById('purchasePackContent');
    const oldUnit=document.getElementById('purchasePackUnit');
    const oldPrice=document.getElementById('purchasePackPrice');
    const oldCount=document.getElementById('purchasePackCount');
    if(!modal||!oldGrid||!oldStore||!oldContent||!oldUnit||!oldPrice||!oldCount)return;

    let form=document.getElementById('simplePurchaseForm');
    if(!form){
      oldGrid.style.display='none';
      form=document.createElement('div');
      form.id='simplePurchaseForm';
      form.className='simple-purchase-form';
      form.innerHTML=`
        <label class="full">Tienda
          <select id="simpleStore"><option value="Walmart">Walmart</option><option value="H-E-B">H-E-B</option><option value="Sam's">Sam's</option><option value="Costco">Costco</option><option value="Otra">Otra</option></select>
        </label>
        <label class="full simple-store-other" id="simpleOtherStoreWrap" hidden>Otra tienda<input id="simpleOtherStore" placeholder="Nombre de la tienda"></label>
        <label>Cantidad<input id="simpleQty" type="number" min="0.01" step="0.01"></label>
        <label>Unidad<select id="simpleUnit"></select></label>
        <div class="simple-package-fields" id="simplePackageFields" hidden>
          <label>Cada paquete trae<input id="simplePackageContent" type="number" min="0.01" step="0.01"></label>
          <label>Contenido en<select id="simplePackageUnit"></select></label>
        </div>
        <label class="full">Total pagado<input id="simpleTotal" type="number" min="0" step="0.01" placeholder="$0.00"></label>
        <div class="simple-buy-note" id="simpleBuyNote"></div>`;
      oldGrid.before(form);

      const store=form.querySelector('#simpleStore');
      const other=form.querySelector('#simpleOtherStore');
      const qty=form.querySelector('#simpleQty');
      const unit=form.querySelector('#simpleUnit');
      const packContent=form.querySelector('#simplePackageContent');
      const packUnit=form.querySelector('#simplePackageUnit');
      const total=form.querySelector('#simpleTotal');

      const sync=()=>{
        const title=(document.getElementById('purchaseModalTitle')?.textContent||'').replace('Editar · ','').trim();
        const item=itemByTitle(title);
        if(!item)return;
        const isPackage=unit.value==='package';
        const quantity=Math.max(0,Number(qty.value||0));
        const paid=Math.max(0,Number(total.value||0));
        const selectedStore=store.value==='Otra'?(other.value.trim()||'Otra'):store.value;
        oldStore.value=selectedStore;

        if(isPackage){
          const packages=Math.max(1,Math.round(quantity||1));
          const each=Math.max(0,Number(packContent.value||0));
          oldCount.value=String(packages);
          oldContent.value=String(each);
          if([...oldUnit.options].some(option=>option.value===packUnit.value))oldUnit.value=packUnit.value;
          oldPrice.value=String(packages?paid/packages:paid);
        }else{
          oldCount.value='1';
          oldContent.value=String(quantity);
          if([...oldUnit.options].some(option=>option.value===unit.value))oldUnit.value=unit.value;
          oldPrice.value=String(paid);
        }

        [oldContent,oldUnit,oldPrice,oldCount].forEach(control=>control.dispatchEvent(new Event('input',{bubbles:true})));
        oldUnit.dispatchEvent(new Event('change',{bubbles:true}));

        const base=item.purchaseUnit||item.unit||'';
        let amount=0;
        if(isPackage){
          const packages=Math.max(1,Math.round(quantity||1));
          const each=Math.max(0,Number(packContent.value||0));
          amount=base==='lb'&&packUnit.value==='oz'?packages*each/16:packages*each;
        }else{
          amount=base==='lb'&&unit.value==='oz'?quantity/16:quantity;
        }
        amount=Math.round((amount+Number.EPSILON)*1000)/1000;
        const note=form.querySelector('#simpleBuyNote');
        if(isPackage){
          note.innerHTML=`Entrarán al inventario <b>${amount} ${niceUnit(base,false)}</b> · Total <b>$${paid.toFixed(2)}</b>`;
        }else{
          note.innerHTML=`Entrarán al inventario <b>${amount} ${niceUnit(base,false)}</b> · Total <b>$${paid.toFixed(2)}</b>`;
        }
        setTimeout(()=>{
          const calc=document.getElementById('purchaseCalc');
          if(calc)calc.innerHTML=note.innerHTML;
        },0);
      };

      const togglePackage=()=>{
        form.querySelector('#simplePackageFields').hidden=unit.value!=='package';
        qty.step=unit.value==='package'?'1':'0.01';
        if(unit.value==='package'&&Number(qty.value||0)<1)qty.value='1';
        sync();
      };

      store.addEventListener('change',()=>{form.querySelector('#simpleOtherStoreWrap').hidden=store.value!=='Otra';sync();});
      other.addEventListener('input',sync);
      qty.addEventListener('input',sync);
      unit.addEventListener('change',togglePackage);
      packContent.addEventListener('input',sync);
      packUnit.addEventListener('change',sync);
      total.addEventListener('input',sync);
      form.__sync=sync;
      form.__togglePackage=togglePackage;
    }

    const title=(document.getElementById('purchaseModalTitle')?.textContent||'').replace('Editar · ','').trim();
    if(modal.hidden||!title||title===lastPurchaseTitle)return;
    lastPurchaseTitle=title;
    const item=itemByTitle(title);
    if(!item)return;

    const store=form.querySelector('#simpleStore');
    const other=form.querySelector('#simpleOtherStore');
    const qty=form.querySelector('#simpleQty');
    const unit=form.querySelector('#simpleUnit');
    const packContent=form.querySelector('#simplePackageContent');
    const packUnit=form.querySelector('#simplePackageUnit');
    const total=form.querySelector('#simpleTotal');
    const knownStores=['Walmart','H-E-B',"Sam's",'Costco'];
    const currentStore=(oldStore.value||'').trim();
    if(knownStores.includes(currentStore)){store.value=currentStore;other.value='';form.querySelector('#simpleOtherStoreWrap').hidden=true;}
    else if(currentStore){store.value='Otra';other.value=currentStore;form.querySelector('#simpleOtherStoreWrap').hidden=false;}
    else{store.value='Walmart';other.value='';form.querySelector('#simpleOtherStoreWrap').hidden=true;}

    unit.innerHTML=directChoices(item).map(option=>`<option value="${option.v}">${option.t}</option>`).join('');
    packUnit.innerHTML=contentChoices(item).map(option=>`<option value="${option.v}">${option.t}</option>`).join('');

    const packageDefault=['mariscos','desechables','refrescos'].includes(item.group);
    const needText=document.getElementById('purchaseModalNeed')?.textContent||'';
    const needNumber=Number((needText.match(/[0-9]+(?:\.[0-9]+)?/)||[])[0]||0);
    const editing=(document.getElementById('purchaseModalTitle')?.textContent||'').startsWith('Editar · ');

    if(editing){
      const count=Math.max(1,Number(oldCount.value||1));
      const packaged=packageDefault||count>1;
      unit.value=packaged?'package':(oldUnit.value||item.purchaseUnit||item.unit);
      qty.value=packaged?String(count):String(oldContent.value||needNumber||1);
      packContent.value=String(oldContent.value||1);
      if([...packUnit.options].some(option=>option.value===oldUnit.value))packUnit.value=oldUnit.value;
      total.value=String((Number(oldPrice.value||0)*count)||'');
    }else{
      unit.value=packageDefault?'package':(item.purchaseUnit||item.unit||'lb');
      qty.value=packageDefault?String(Math.max(1,Number(oldCount.value||1))):String(needNumber||1);
      packContent.value=packageDefault&&Number(oldContent.value||0)>0?String(oldContent.value):'';
      if([...packUnit.options].some(option=>option.value===oldUnit.value))packUnit.value=oldUnit.value;
      total.value='';
    }
    form.__togglePackage?.();
  }

  function ensureOrderTools(){
    const panel=document.getElementById('orders');
    const notice=panel?.querySelector('.notice');
    if(!panel||!notice||panel.querySelector('.orders-tools'))return;
    const tools=document.createElement('div');
    tools.className='orders-tools';
    tools.innerHTML=`<div class="orders-search"><input id="ordersSearch" type="search" placeholder="Buscar pedido, cliente o teléfono"></div><div class="order-filters"><button class="order-filter active" data-filter="todos">Todos</button><button class="order-filter" data-filter="nuevo">Nuevos</button><button class="order-filter" data-filter="confirmado">Confirmados</button><button class="order-filter" data-filter="entregado">Entregados</button><button class="order-filter" data-filter="cancelado">Cancelados</button></div><div class="order-counters"><div class="order-counter" data-status="nuevo">Nuevos<b>0</b></div><div class="order-counter" data-status="confirmado">Confirmados<b>0</b></div><div class="order-counter" data-status="entregado">Entregados<b>0</b></div></div>`;
    notice.before(tools);
    tools.querySelector('#ordersSearch').addEventListener('input',filterOrders);
    tools.querySelectorAll('.order-filter').forEach(button=>button.addEventListener('click',()=>{
      tools.querySelectorAll('.order-filter').forEach(x=>x.classList.toggle('active',x===button));
      filterOrders();
    }));
  }

  function filterOrders(){
    const panel=document.getElementById('orders');
    if(!panel)return;
    const query=(panel.querySelector('#ordersSearch')?.value||'').trim().toLowerCase();
    const active=panel.querySelector('.order-filter.active')?.dataset.filter||'todos';
    panel.querySelectorAll('.order').forEach(order=>{
      const badge=order.querySelector('.badge');
      const status=['nuevo','confirmado','entregado','cancelado'].find(x=>badge?.classList.contains(x))||'nuevo';
      const visible=(active==='todos'||active===status)&&(!query||order.textContent.toLowerCase().includes(query));
      order.hidden=!visible;
    });
  }

  function decorateOrders(){
    const panel=document.getElementById('orders');
    if(!panel)return;
    const counts={nuevo:0,confirmado:0,entregado:0,cancelado:0};
    panel.querySelectorAll('.order').forEach(order=>{
      const badge=order.querySelector('.badge');
      const status=['nuevo','confirmado','entregado','cancelado'].find(x=>badge?.classList.contains(x))||'nuevo';
      order.classList.remove('status-nuevo','status-confirmado','status-entregado','status-cancelado');
      order.classList.add(`status-${status}`);
      counts[status]=(counts[status]||0)+1;
    });
    Object.entries(counts).forEach(([status,count])=>{
      const target=panel.querySelector(`.order-counter[data-status="${status}"] b`);
      if(target)target.textContent=String(count);
    });
    filterOrders();
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

  let scheduled=false;
  let observer=null;
  function finish(){
    scheduled=false;
    if(observer)observer.disconnect();
    document.querySelector('.nav button[data-tab="purchases"]')?.remove();
    brandHeader();
    decorateNav();
    decorateIngredients();
    simplifyPurchaseModal();
    ensureOrderTools();
    decorateOrders();
    tidyStatus();
    const footer=document.querySelector('.footer');
    if(footer&&footer.textContent!==`Panel Operativo El Cubano · v${VERSION}`)footer.textContent=`Panel Operativo El Cubano · v${VERSION}`;
    if(observer)observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  }
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(finish)}

  finish();
  observer=new MutationObserver(schedule);
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});
})();