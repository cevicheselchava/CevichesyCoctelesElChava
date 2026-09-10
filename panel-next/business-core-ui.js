import { OrdersStore } from './data.js';
import { PurchaseStore } from './purchases-data.js';
import { BusinessCore } from './business-core.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function toast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(()=>el.classList.remove('show'),2200);
}

function installStyles() {
  if ($('#businessCoreUiStyles')) return;
  const style = document.createElement('style');
  style.id = 'businessCoreUiStyles';
  style.textContent = `
    #preparationView #prepKpis,#preparationView #prepTabs,#preparationView #prepList{display:none!important}
    .core-production-actions{display:grid;gap:8px;margin-top:14px}
    .core-production-button{width:100%;border:0;border-radius:15px;background:#078844;color:#fff;min-height:52px;padding:12px 16px;font-size:17px;font-weight:1000}
    .core-production-note{font-size:12px;font-weight:800;color:#6b7770;text-align:center}
    .core-ready-button{border:0;border-radius:12px;background:#078844;color:#fff;padding:11px 14px;min-height:44px;font-size:15px;font-weight:1000}
    #preparationView .prep-dish-panel{margin-top:4px}
  `;
  document.head.appendChild(style);
}

function enhancePreparation() {
  const view = $('#preparationView');
  if (!view) return;

  const workspace = view.querySelector('.prep-dish-workspace');
  const input = workspace?.querySelector('[data-prep-plan-key]');
  if (!workspace || !input) return;

  let actions = workspace.querySelector('.core-production-actions');
  if (!actions) {
    actions = document.createElement('div');
    actions.className = 'core-production-actions';
    actions.innerHTML = `
      <button class="core-production-button" type="button" data-core-production>Registrar preparación</button>
      <div class="core-production-note">Descuenta ingredientes al registrar lo que realmente preparaste.</div>`;
    workspace.appendChild(actions);
  }
}

function enhanceOrders() {
  $$('#ordersList .order-card').forEach(card => {
    const id = card.dataset.orderId;
    const order = id ? OrdersStore.get(id) : null;
    const actions = card.querySelector('.order-card-actions');
    if (!order || !actions) return;

    const existing = actions.querySelector('[data-core-ready]');
    if (order.status === 'preparing') {
      if (!existing) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'core-ready-button';
        button.dataset.coreReady = id;
        button.textContent = '✓ Marcar listo';
        actions.appendChild(button);
      }
    } else {
      existing?.remove();
    }
  });
}

function simplifyPurchasesLabels() {
  const needs = $('[data-purchase-toggle="needs"] span');
  if (needs) {
    const prefix = needs.textContent.trim().startsWith('▼') ? '▼' : '▶';
    const next = `${prefix} Lista de compra`;
    if (needs.textContent !== next) needs.textContent = next;
  }

  const calcSubtitle = $('#purchasesView .purchase-calculator-section .purchase-section-title small');
  if (calcSubtitle) calcSubtitle.hidden = true;
}

function applyUI() {
  installStyles();
  enhancePreparation();
  enhanceOrders();
  simplifyPurchasesLabels();
}

let scheduled = false;
function scheduleUI() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(()=>{
    scheduled = false;
    applyUI();
  });
}

function registerPreparation(button) {
  const workspace = button.closest('.prep-dish-workspace');
  const input = workspace?.querySelector('[data-prep-plan-key]');
  const name = workspace?.querySelector('.prep-dish-head h3')?.textContent?.trim() || '';
  const unit = workspace?.querySelector('.prep-dish-input span')?.textContent?.trim()
    || workspace?.querySelector('.prep-dish-head > span')?.textContent?.trim()
    || '';
  const qty = Number(input?.value || 0);

  if (!(qty > 0)) {
    toast('Escribe cuánto preparaste');
    input?.focus();
    return;
  }

  const result = BusinessCore.registerProduction({productName:name,qty,unit});
  if (!result.ok) {
    toast(result.error || 'No se pudo registrar la preparación');
    return;
  }

  if (input) {
    input.value = '';
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }
  const alerts = result.alerts?.length || 0;
  toast(alerts ? `Preparación registrada · ${alerts} aviso${alerts === 1 ? '' : 's'}` : 'Preparación registrada · inventario actualizado');
}

function markOrderReady(button) {
  const id = button.dataset.coreReady;
  const result = BusinessCore.setOrderStatus(id,'ready',{readyAt:Date.now()});
  toast(result.ok ? 'Pedido listo para entrega' : (result.error || 'No se pudo marcar listo'));
}

document.addEventListener('click',event => {
  const produce = event.target.closest('[data-core-production]');
  if (produce) {
    event.preventDefault();
    event.stopPropagation();
    registerPreparation(produce);
    return;
  }

  const ready = event.target.closest('[data-core-ready]');
  if (ready) {
    event.preventDefault();
    event.stopPropagation();
    markOrderReady(ready);
  }
},true);

let lastPurchaseEvent = '';
window.addEventListener('panel:inventory-changed',event => {
  if (event.detail?.source !== 'purchase') return;
  const purchase = PurchaseStore.list()[0];
  if (!purchase || purchase.id === lastPurchaseEvent) return;
  lastPurchaseEvent = purchase.id;
  BusinessCore.recordEvent('purchase',{
    purchaseId:purchase.id,
    productId:purchase.productId,
    productName:purchase.productName,
    quantity:purchase.quantity,
    unit:purchase.unit,
    total:purchase.total
  });
});

window.addEventListener('panel:orders-changed',scheduleUI);
window.addEventListener('panel:production-changed',scheduleUI);

new MutationObserver(scheduleUI).observe(document.documentElement,{childList:true,subtree:true});

applyUI();
