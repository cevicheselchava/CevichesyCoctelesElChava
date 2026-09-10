const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
}

function dishMeta(label) {
  const text = normalize(label);
  if (text.includes('pulpo') && text.includes('camaron')) return {kind:'pulpo-camaron',icon:'🐙🦐'};
  if (text.includes('pulpo') && text.includes('pescado')) return {kind:'pulpo-pescado',icon:'🐙🐟'};
  if (text.includes('mixto')) return {kind:'mixto',icon:'🦐🐟'};
  if (text.includes('camaron')) return {kind:'camaron',icon:'🦐'};
  if (text.includes('pescado')) return {kind:'pescado',icon:'🐟'};
  return {kind:'otro',icon:'🍽️'};
}

function decorateButtons() {
  const view = $('#purchasesView');
  if (!view) return;

  const includes = $('.purchase-includes-section',view);
  if (includes) includes.remove();

  $$('.purchase-dish-button',view).forEach(button=>{
    if ($('.purchase-dish-icon',button)) return;
    const label = button.textContent.trim();
    const meta = dishMeta(label);
    button.dataset.dishKind = meta.kind;
    button.innerHTML = `<span class="purchase-dish-icon" aria-hidden="true">${meta.icon}</span><span class="purchase-dish-label">${label}</span>`;
  });
}

function installStyles() {
  if ($('#purchaseDishButtonStyles')) return;
  const style = document.createElement('style');
  style.id = 'purchaseDishButtonStyles';
  style.textContent = `
    .purchase-includes-section{display:none!important}
    .purchase-dish-buttons{gap:10px!important}
    .purchase-dish-button{display:grid!important;grid-template-columns:auto 1fr;align-items:center!important;justify-items:start!important;gap:10px!important;min-height:76px!important;padding:12px 14px!important;border-width:2px!important;border-radius:18px!important;box-shadow:0 6px 14px rgba(30,50,42,.08)!important;text-align:left!important}
    .purchase-dish-icon{font-size:30px;line-height:1;filter:saturate(1.15)}
    .purchase-dish-label{font-size:16px;line-height:1.15;font-weight:1000}
    .purchase-dish-button[data-dish-kind="camaron"]{background:linear-gradient(135deg,#07934a,#10ad62)!important;border-color:#07b95b!important;color:#fff!important}
    .purchase-dish-button[data-dish-kind="pescado"]{background:linear-gradient(135deg,#e6f5ff,#cfeaff)!important;border-color:#55aef0!important;color:#173b5d!important}
    .purchase-dish-button[data-dish-kind="mixto"]{background:linear-gradient(135deg,#fff4b8,#ffd979)!important;border-color:#f3a719!important;color:#513100!important}
    .purchase-dish-button[data-dish-kind="pulpo-camaron"]{background:linear-gradient(135deg,#ffe7ef,#ffc8da)!important;border-color:#ef79a1!important;color:#641d38!important}
    .purchase-dish-button[data-dish-kind="pulpo-pescado"]{background:linear-gradient(135deg,#eee5ff,#d9c8ff)!important;border-color:#9b79ef!important;color:#351a70!important}
    .purchase-dish-button.active{position:relative;box-shadow:0 0 0 3px rgba(7,136,68,.16),0 8px 18px rgba(30,50,42,.12)!important;transform:translateY(-1px)}
    .purchase-dish-button.active:after{content:'✓';position:absolute;right:10px;top:10px;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.92);color:#078844;font-size:15px;font-weight:1000}
    @media(max-width:720px){
      .purchase-dish-button{min-height:84px!important;padding:11px 12px!important;gap:8px!important}
      .purchase-dish-icon{font-size:28px}.purchase-dish-label{font-size:15px}
    }
  `;
  document.head.appendChild(style);
}

let queued = false;
function schedule() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(()=>{
    queued = false;
    decorateButtons();
  });
}

installStyles();
schedule();
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
