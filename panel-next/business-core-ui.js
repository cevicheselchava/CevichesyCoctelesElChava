import { OrdersStore } from './data.js';
import { PurchaseStore } from './purchases-data.js';
import { BusinessCore } from './business-core.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const MODULE_VIEWS = {
  pedidos:'ordersView',
  compras:'purchasesView',
  preparacion:'preparationView',
  entregas:'deliveriesView',
  inventario:'inventoryView',
  dinero:'moneyView',
  recetas:'recipesView'
};

function toast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(()=>el.classList.remove('show'),2000);
}

function installStyles() {
  if ($('#businessCoreUiStyles')) return;
  const style = document.createElement('style');
  style.id = 'businessCoreUiStyles';
  style.textContent = `
    #homeView .summary-section,#homeView .footer-brand{display:none!important}
    body.core-home #bottomNav{display:none!important}
    body.core-home{padding-bottom:0!important}
    #homeView .module-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important;max-width:760px;margin:4px auto 0}
    #homeView .module-card,#homeView .module-card.wide{grid-column:auto!important;min-height:104px!important;border-radius:14px!important;padding:14px 16px!important;display:grid!important;grid-template-columns:48px minmax(0,1fr) auto!important;gap:12px!important;align-items:center!important;justify-items:start!important;text-align:left!important}
    #homeView .module-card .module-icon,#homeView .module-card.wide .module-icon{font-size:36px!important;justify-self:center!important}
    #homeView .module-card .module-copy strong,#homeView .module-card.wide .module-copy strong{margin:0!important;font-size:22px!important;line-height:1.05!important}
    #homeView .module-card .module-copy small{display:none!important}
    #homeView .recipe-tagline{display:none!important}
    #homeView .module-badge{position:static!important;grid-column:3!important;grid-row:1!important;min-width:34px!important;height:34px!important;border-width:2px!important;font-size:14px!important}
    #homeView{padding-bottom:8px}
    .module-topbar{margin-bottom:14px!important}
    .module-topbar h2{font-size:34px!important}
    .back-button,.new-order-button,.order-action,.inventory-action,.recipe-action,.delivery-action,.money-tabs button,.delivery-tabs button,.status-tabs button,.inventory-category-button{border-radius:10px!important}
    .new-order-button{min-height:50px!important;font-size:16px!important}
    .status-tabs,.delivery-tabs,.money-tabs{gap:8px!important}
    .status-tabs button,.delivery-tabs button,.money-tabs button{min-height:42px!important;padding:9px 14px!important}
    #preparationView #prepKpis,#preparationView #prepTabs,#preparationView #prepList{display:none!important}
    #preparationView .prep-dish-panel{margin-top:4px}
    #preparationView .prep-dish-workspace{border-radius:14px!important;box-shadow:none!important}
    #preparationView .prep-dish-picker{border-radius:12px!important;min-height:66px!important;box-shadow:none!important}
    #preparationView .prep-dish-metrics{grid-template-columns:1fr!important}
    #preparationView .prep-dish-stat{display:none!important}
    .core-production-actions{display:grid;gap:8px;margin-top:14px}
    .core-production-button{width:100%;border:0;border-radius:10px;background:#078844;color:#fff;min-height:54px;padding:12px 16px;font-size:18px;font-weight:1000}
    .core-production-note{font-size:12px;font-weight:800;color:#6b7770;text-align:center}
    .core-ready-button{border:0;border-radius:10px;background:#078844;color:#fff;padding:11px 14px;min-height:44px;font-size:15px;font-weight:1000}
    #inventoryView .inventory-category-nav{gap:8px!important}
    #inventoryView .inventory-category-button{min-height:44px!important;padding:9px 14px!important}
    #inventoryView .inventory-card{border-radius:12px!important;box-shadow:none!important}
    #recipesView .recipe-kpis{display:none!important}
    #recipesView .recipe-card{border-radius:12px!important;box-shadow:none!important;padding:0!important;overflow:hidden!important}
    #recipesView .recipe-card-head{padding:14px 15px!important;cursor:pointer!important}
    #recipesView .recipe-card:not(.core-recipe-open) .recipe-ingredients,
    #recipesView .recipe-card:not(.core-recipe-open) .recipe-cost-box,
    #recipesView .recipe-card:not(.core-recipe-open) .recipe-card-actions{display:none!important}
    #recipesView .recipe-card.core-recipe-open .recipe-ingredients,
    #recipesView .recipe-card.core-recipe-open .recipe-cost-box,
    #recipesView .recipe-card.core-recipe-open .recipe-card-actions{margin-left:14px!important;margin-right:14px!important}
    #recipesView .recipe-card.core-recipe-open .recipe-card-actions{margin-bottom:14px!important}
    .core-recipe-chevron{font-size:25px;font-weight:1000;margin-left:10px;color:#078844}
    #purchasesView .purchase-kpis,#purchasesView .purchase-history{display:none!important}
    @media(max-width:720px){
      #homeView .module-grid{grid-template-columns:1fr 1fr!important;gap:9px!important}
      #homeView .module-card,#homeView .module-card.wide{min-height:94px!important;grid-template-columns:40px minmax(0,1fr) auto!important;padding:12px 11px!important;gap:8px!important}
      #homeView .module-card .module-icon,#homeView .module-card.wide .module-icon{font-size:31px!important}
      #homeView .module-card .module-copy strong,#homeView .module-card.wide .module-copy strong{font-size:18px!important}
      .module-topbar h2{font-size:30px!important}
    }
  `;
  document.head.appendChild(style);
}

function enhanceHome() {
  const home = $('#homeView');
  if (!home) return;
  document.body.classList.toggle('core-home',home.classList.contains('active'));
  home.dataset.coreReady = '1';
  $$('#homeView .module-card').forEach(button=>{
    button.setAttribute('aria-label',button.querySelector('.module-copy strong')?.textContent?.trim() || 'Módulo');
  });
}

function enhancePreparation() {
  const view = $('#preparationView');
  if (!view) return;
  const workspace = view.querySelector('.prep-dish-workspace');
  const input = workspace?.querySelector('[data-prep-plan-key]');
  if (!workspace || !input) return;
  const inputLabel = input.closest('.prep-dish-input')?.querySelector('small');
  if (inputLabel) inputLabel.textContent = 'Cantidad a preparar';
  let actions = workspace.querySelector('.core-production-actions');
  if (!actions) {
    actions = document.createElement('div');
    actions.className = 'core-production-actions';
    actions.innerHTML = `
      <button class="core-production-button" type="button" data-core-production>Registrar preparación</button>
      <div class="core-production-note">Descuenta del inventario únicamente lo que realmente preparaste.</div>`;
    workspace.appendChild(actions);
  }
}

function enhanceOrders() {
  $$('#ordersList .order-card').forEach(card=>{
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

function enhanceRecipes() {
  $$('#recipesView .recipe-card').forEach(card=>{
    const head = card.querySelector('.recipe-card-head');
    if (!head || head.dataset.coreRecipeBound === '1') return;
    head.dataset.coreRecipeBound = '1';
    head.setAttribute('role','button');
    head.setAttribute('tabindex','0');
    head.setAttribute('aria-expanded','false');
    const chevron = document.createElement('span');
    chevron.className = 'core-recipe-chevron';
    chevron.textContent = '›';
    head.appendChild(chevron);
  });
}

function simplifyPurchasesLabels() {
  const button = $('#simpleNewPurchase');
  if (button) button.textContent = 'Registrar compra';
}

function moduleHealth() {
  const missing = Object.entries(MODULE_VIEWS)
    .filter(([,viewId])=>!document.getElementById(viewId))
    .map(([module])=>module);
  document.documentElement.dataset.panelHealth = missing.length ? `missing:${missing.join(',')}` : 'ok';
  if (missing.length) console.warn('Panel: módulos sin vista',missing);
}

function applyUI() {
  installStyles();
  enhanceHome();
  enhancePreparation();
  enhanceOrders();
  enhanceRecipes();
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

function goHome() {
  const clean = location.pathname + location.search;
  location.href = clean;
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
  toast(alerts
    ? `Preparación registrada · ${alerts} aviso${alerts === 1 ? '' : 's'}`
    : 'Preparación registrada · inventario actualizado');
}

function markOrderReady(button) {
  const id = button.dataset.coreReady;
  const result = BusinessCore.setOrderStatus(id,'ready',{readyAt:Date.now()});
  toast(result.ok ? 'Pedido listo para entrega' : (result.error || 'No se pudo marcar listo'));
}

function toggleRecipe(card) {
  if (!card) return;
  const open = !card.classList.contains('core-recipe-open');
  $$('#recipesView .recipe-card.core-recipe-open').forEach(other=>{
    if (other !== card) {
      other.classList.remove('core-recipe-open');
      const otherHead = other.querySelector('.recipe-card-head');
      const otherChevron = other.querySelector('.core-recipe-chevron');
      otherHead?.setAttribute('aria-expanded','false');
      if (otherChevron) otherChevron.textContent = '›';
    }
  });
  card.classList.toggle('core-recipe-open',open);
  const head = card.querySelector('.recipe-card-head');
  const chevron = card.querySelector('.core-recipe-chevron');
  head?.setAttribute('aria-expanded',String(open));
  if (chevron) chevron.textContent = open ? '⌄' : '›';
}

document.addEventListener('click',event=>{
  const prepBack = event.target.closest('#preparationView [data-back-home], #preparationView #prepBack');
  if (prepBack) {
    event.preventDefault();
    event.stopImmediatePropagation();
    goHome();
    return;
  }
  const produce = event.target.closest('[data-core-production]');
  if (produce) {
    event.preventDefault();
    event.stopPropagation();
    registerPreparation(produce);
    return;
  }
  const ready = event.target.closest('.core-ready-button[data-core-ready]');
  if (ready) {
    event.preventDefault();
    event.stopPropagation();
    markOrderReady(ready);
    return;
  }
  const recipeHead = event.target.closest('#recipesView .recipe-card-head');
  if (recipeHead && !event.target.closest('[data-recipe-action]')) {
    event.preventDefault();
    toggleRecipe(recipeHead.closest('.recipe-card'));
  }
},true);

document.addEventListener('keydown',event=>{
  if (!['Enter',' '].includes(event.key)) return;
  const head = event.target.closest?.('#recipesView .recipe-card-head');
  if (!head) return;
  event.preventDefault();
  toggleRecipe(head.closest('.recipe-card'));
});

let lastPurchaseEvent = '';
window.addEventListener('panel:inventory-changed',event=>{
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
  scheduleUI();
});

window.addEventListener('panel:orders-changed',scheduleUI);
window.addEventListener('panel:production-changed',scheduleUI);
window.addEventListener('panel:menu-changed',scheduleUI);
window.addEventListener('hashchange',scheduleUI);
document.addEventListener('change',event=>{
  if (event.target.closest?.('[data-prep-plan-key]')) requestAnimationFrame(scheduleUI);
});

applyUI();
setTimeout(()=>{ applyUI(); moduleHealth(); },250);
setTimeout(moduleHealth,1200);
