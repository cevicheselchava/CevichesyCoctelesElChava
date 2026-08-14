(()=>{
  if(window.__EL_CUBANO_PURCHASE_FLOW_V1__)return;
  window.__EL_CUBANO_PURCHASE_FLOW_V1__=true;

  const style=document.createElement('style');
  style.id='el-cubano-purchase-flow-v1';
  style.textContent=`
    #recipePurchaseModal .purchase-reggae-stripe{
      height:7px;margin:0 0 14px;border-radius:999px;
      background:linear-gradient(90deg,#d94135 0 33.33%,#f2b632 33.33% 66.66%,#267642 66.66% 100%);
      box-shadow:0 4px 10px rgba(18,52,88,.08);
    }
    #recipePurchaseModal #simplePurchaseForm{
      gap:12px!important;
    }
    #recipePurchaseModal #simplePurchaseForm .purchase-flow-step{
      position:relative!important;
      padding:31px 12px 12px!important;
      border-radius:17px!important;
      border:1px solid #e7dfd1!important;
      background:rgba(255,255,255,.92)!important;
      box-shadow:0 6px 15px rgba(18,52,88,.055)!important;
      overflow:hidden;
    }
    #recipePurchaseModal #simplePurchaseForm .purchase-flow-step:before{
      content:'PASO ' attr(data-step);
      position:absolute;left:12px;top:9px;
      font-size:11px;line-height:1;font-weight:1000;letter-spacing:.08em;color:#6a7483;
    }
    #recipePurchaseModal #simplePurchaseForm .purchase-flow-step:after{
      content:'';position:absolute;left:0;top:0;bottom:0;width:5px;background:#267642;
    }
    #recipePurchaseModal #simplePurchaseForm .purchase-flow-step[data-step="1"]{background:linear-gradient(135deg,#f3fbf4,#fff)!important}
    #recipePurchaseModal #simplePurchaseForm .purchase-flow-step[data-step="1"]:after{background:#267642}
    #recipePurchaseModal #simplePurchaseForm .purchase-flow-step[data-step="2"]{background:linear-gradient(135deg,#fff9e7,#fff)!important}
    #recipePurchaseModal #simplePurchaseForm .purchase-flow-step[data-step="2"]:after{background:#f2b632}
    #recipePurchaseModal #simplePurchaseForm .purchase-flow-step[data-step="3"]{background:linear-gradient(135deg,#fff4f1,#fff)!important}
    #recipePurchaseModal #simplePurchaseForm .purchase-flow-step[data-step="3"]:after{background:#dc4638}
    #recipePurchaseModal #simplePurchaseForm .purchase-flow-step[data-step="4"]{background:linear-gradient(135deg,#f2fbf4,#fffdf4)!important}
    #recipePurchaseModal #simplePurchaseForm .purchase-flow-step[data-step="4"]:after{background:#267642}
    #recipePurchaseModal #simplePurchaseForm .purchase-flow-step input,
    #recipePurchaseModal #simplePurchaseForm .purchase-flow-step select{
      width:100%!important;box-sizing:border-box!important;margin-top:7px!important;
    }
    #recipePurchaseModal #simplePackageFields{
      position:relative!important;
      margin-top:0!important;
      background:linear-gradient(145deg,#fff9e3,#fffdf7)!important;
      border:1px solid #ead58c!important;border-left:6px solid #f2b632!important;
      box-shadow:0 6px 15px rgba(138,98,0,.06)!important;
    }
    #recipePurchaseModal #simplePackageFields:after{
      content:'';position:absolute;right:10px;top:10px;width:38px;height:6px;border-radius:99px;
      background:linear-gradient(90deg,#dc4638 0 33%,#f2b632 33% 66%,#267642 66% 100%);
      opacity:.9;
    }
    #recipePurchaseModal #simpleBuyNote{
      padding:13px!important;background:transparent!important;border:0!important;box-shadow:none!important;
    }
    #recipePurchaseModal #simpleBuyNote:before{display:none!important}
    #recipePurchaseModal .buy-note-grid{
      display:grid;grid-template-columns:1fr 1fr;gap:9px;width:100%;
    }
    #recipePurchaseModal .buy-note-card{
      min-width:0;padding:12px;border-radius:16px;border:1px solid #d9dfd6;background:#fff;
      box-shadow:0 5px 12px rgba(18,52,88,.06);
    }
    #recipePurchaseModal .buy-note-card:first-child{background:linear-gradient(135deg,#eaf8ed,#fff);border-color:#b7d8bd}
    #recipePurchaseModal .buy-note-card:last-child{background:linear-gradient(135deg,#fff7df,#fff);border-color:#ead79a}
    #recipePurchaseModal .buy-note-card small{display:block;color:#667184;font-weight:900;font-size:11px;line-height:1.2;margin-bottom:4px}
    #recipePurchaseModal .buy-note-card strong{display:block;color:#123458;font-size:19px;line-height:1.1;overflow-wrap:anywhere}
    #recipePurchaseModal .buy-note-card:first-child strong{color:#267642}
    #recipePurchaseModal .buy-note-card:last-child strong{color:#bd7b00}
    #recipePurchaseModal #purchaseModalNeed{box-shadow:0 4px 10px rgba(220,70,56,.08)}
    @media(max-width:560px){
      #recipePurchaseModal #simplePurchaseForm .purchase-flow-step{grid-column:1/-1!important}
      #recipePurchaseModal .buy-note-grid{grid-template-columns:1fr 1fr}
      #recipePurchaseModal .buy-note-card{padding:11px 9px}
      #recipePurchaseModal .buy-note-card strong{font-size:17px}
    }
  `;
  document.head.appendChild(style);

  function setLabelText(label,text){
    if(!label)return;
    const node=[...label.childNodes].find(n=>n.nodeType===Node.TEXT_NODE);
    if(!node)return;
    if(node.nodeValue.trim()!==text)node.nodeValue=`${text}\n`;
  }

  function unitCopy(value,optionText){
    if(value==='package')return 'Paquetes comprados';
    if(value==='lb')return 'Libras compradas';
    if(value==='oz')return 'Onzas compradas';
    if(value==='pzas')return 'Piezas compradas';
    if(value==='latas')return 'Latas compradas';
    if(value==='sobres')return 'Sobres comprados';
    if(value==='manojo')return 'Manojos comprados';
    return `Cantidad comprada${optionText?` (${optionText})`:''}`;
  }

  function decorateSummary(note){
    if(!note||note.querySelector('.buy-note-grid'))return;
    const text=(note.textContent||'').replace(/\s+/g,' ').trim();
    const match=text.match(/Entrar[aá]n al inventario\s+(.+?)\s+·\s+Total\s+(\$[0-9.,]+)/i);
    if(!match)return;
    note.innerHTML=`<div class="buy-note-grid"><div class="buy-note-card"><small>📥 ENTRA AL INVENTARIO</small><strong>${match[1]}</strong></div><div class="buy-note-card"><small>💵 TOTAL PAGADO</small><strong>${match[2]}</strong></div></div>`;
  }

  function decorate(){
    const modal=document.getElementById('recipePurchaseModal');
    const form=document.getElementById('simplePurchaseForm');
    if(!modal||!form)return;

    const title=document.getElementById('purchaseModalTitle');
    if(title&&!modal.querySelector('.purchase-reggae-stripe')){
      const stripe=document.createElement('div');
      stripe.className='purchase-reggae-stripe';
      title.before(stripe);
    }

    const store=document.getElementById('simpleStore');
    const qty=document.getElementById('simpleQty');
    const unit=document.getElementById('simpleUnit');
    const packContent=document.getElementById('simplePackageContent');
    const packUnit=document.getElementById('simplePackageUnit');
    const total=document.getElementById('simpleTotal');
    if(!store||!qty||!unit||!packContent||!packUnit||!total)return;

    const storeLabel=store.closest('label');
    const qtyLabel=qty.closest('label');
    const unitLabel=unit.closest('label');
    const contentLabel=packContent.closest('label');
    const packUnitLabel=packUnit.closest('label');
    const totalLabel=total.closest('label');

    if(unitLabel&&qtyLabel&&unitLabel.nextElementSibling!==qtyLabel){
      form.insertBefore(unitLabel,qtyLabel);
    }

    [[storeLabel,'1'],[unitLabel,'2'],[qtyLabel,'3'],[totalLabel,'4']].forEach(([label,step])=>{
      if(!label)return;
      label.classList.add('purchase-flow-step');
      if(label.dataset.step!==step)label.dataset.step=step;
    });

    setLabelText(storeLabel,'¿Dónde lo compraste?');
    setLabelText(unitLabel,'¿Cómo lo compraste?');
    const selected=unit.options[unit.selectedIndex];
    setLabelText(qtyLabel,unitCopy(unit.value,selected?.textContent?.trim()));
    const weightPackage=[...packUnit.options].some(option=>option.value==='lb'||option.value==='oz');
    setLabelText(contentLabel,weightPackage?'Peso por paquete':'Contenido por paquete');
    setLabelText(packUnitLabel,weightPackage?'Unidad del peso':'Unidad del contenido');
    setLabelText(totalLabel,'¿Cuánto pagaste?');

    if(!unit.dataset.purchaseFlowBound){
      unit.dataset.purchaseFlowBound='1';
      unit.addEventListener('change',()=>requestAnimationFrame(decorate));
    }

    decorateSummary(document.getElementById('simpleBuyNote'));
  }

  let queued=false;
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;decorate();});
  }

  decorate();
  const observer=new MutationObserver(schedule);
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});
})();