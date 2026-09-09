import { BUSINESS } from './config.js';
import { InventoryStore } from './data.js';
import { PurchaseStore, registerPurchase, purchasePreview } from './purchases-data.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const money = new Intl.NumberFormat(BUSINESS.locale,{style:'currency',currency:BUSINESS.currency});
const PURCHASE_UNITS = ['bolsa','caja','paquete','pieza','unidad','botella','lata','galón','cubeta','rollo','costal','charola','lb','oz','kg','g','L','ml','fl oz','otro'];
let selectedProductId = null;

function cleanNumber(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return '0';
  const rounded = Math.round(number * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function localDateISO() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0,10);
}

function ensureAssets() {
  if (!document.querySelector('link[href="./purchases.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './purchases.css';
    document.head.appendChild(link);
  }

  if (!$('#purchasesView')) {
    const section = document.createElement('section');
    section.className = 'view purchases-view';
    section.id = 'purchasesView';
    section.dataset.view = 'compras';
    section.innerHTML = `
      <div class="module-topbar">
        <button class="back-button" id="purchasesBack" type="button">‹</button>
        <div><small>MÓDULO</small><h2>Compras</h2></div>
        <button class="new-order-button" id="newPurchaseButton" type="button">＋ Compra</button>
      </div>
      <div class="purchase-kpis" id="purchaseKpis"></div>
      <section class="purchase-section">
        <div class="purchase-section-title"><div><h3>Inventario bajo</h3><small>Referencia de existencias y stock mínimo</small></div></div>
        <div class="purchase-low-list" id="purchaseLowList"></div>
      </section>
      <section class="purchase-section">
        <div class="purchase-section-title"><div><h3>Compras recientes</h3><small>Lo que ya entró al inventario</small></div></div>
        <div class="purchase-history" id="purchaseHistory"></div>
      </section>`;
    document.querySelector('main.content')?.appendChild(section);
  }

  if (!$('#purchaseModal')) {
    const modal = document.createElement('div');
    modal.className = 'purchase-modal';
    modal.id = 'purchaseModal';
    modal.hidden = true;
    modal.innerHTML = `
      <section class="purchase-sheet" role="dialog" aria-modal="true" aria-labelledby="purchaseModalTitle">
        <div class="modal-head">
          <div><small>NUEVA</small><h2 id="purchaseModalTitle">Compra</h2></div>
          <button class="modal-close" id="closePurchaseModal" type="button">×</button>
        </div>
        <form id="purchaseForm">
          <div class="purchase-form-section">
            <h3>Registrar compra</h3>
            <div class="purchase-form-grid">
              <label class="full">Producto<select id="purchaseProduct" required></select></label>
              <label>Cantidad<input id="purchaseQty" type="number" min="0.01" step="0.01" placeholder="Cantidad" required></label>
              <label>Unidad<select id="purchaseUnit" required></select></label>
              <label class="full">Precio por unidad<input id="purchasePrice" type="number" min="0" step="0.01" placeholder="0.00" required></label>
              <label class="full">Tienda<input id="purchaseStore" placeholder="Ej. H-E-B, Walmart, Restaurant Depot" required></label>
            </div>
            <div class="purchase-preview" id="purchasePreview"></div>
          </div>
          <div class="purchase-modal-actions">
            <button class="cancel" id="cancelPurchase" type="button">Cancelar</button>
            <button class="save" type="submit">Guardar compra</button>
          </div>
        </form>
      </section>`;
    document.body.appendChild(modal);
  }
}

function inventoryItems() {
  return InventoryStore.list();
}

function lowItems() {
  return InventoryStore.low().sort((a,b)=>{
    const ar = Number(a.qty || 0) / Math.max(1,Number(a.minimum || 0));
    const br = Number(b.qty || 0) / Math.max(1,Number(b.minimum || 0));
    return ar - br;
  });
}

function unitOptions(selected = '') {
  const values = [...PURCHASE_UNITS];
  if (selected && !values.includes(selected)) values.unshift(selected);
  return values.map(unit=>`<option value="${unit}" ${unit===selected?'selected':''}>${unit}</option>`).join('');
}

function purchaseKpis() {
  const today = PurchaseStore.today();
  const spend = today.reduce((sum,row)=>sum + Number(row.total || 0),0);
  return [
    ['Inventario bajo',lowItems().length,'low'],
    ['Compras hoy',today.length,'today'],
    ['Gasto hoy',money.format(spend),'spend']
  ];
}

function lowCard(item) {
  return `
    <article class="purchase-low-card">
      <div class="purchase-low-head">
        <div>
          <h4>${item.name}</h4>
          <div class="purchase-stock">Inventario actual <b>${cleanNumber(item.qty)} ${item.unit}</b> · stock mínimo <b>${cleanNumber(item.minimum)} ${item.unit}</b></div>
        </div>
        <button class="purchase-buy-button" data-buy-product="${item.id}" type="button">Registrar compra</button>
      </div>
    </article>`;
}

function historyCard(row) {
  const stock = row.autoStock
    ? `<div class="purchase-stock-ok">✓ Inventario +${cleanNumber(row.stockAdded)} ${row.stockUnit}</div>`
    : `<div class="purchase-stock-warn">⚠ Compra guardada; esta presentación necesita equivalencia para subir inventario automáticamente.</div>`;
  return `
    <article class="purchase-history-card">
      <div class="purchase-history-head">
        <div><span class="purchase-folio">${row.id}</span><h4>${row.productName}</h4></div>
        <div class="purchase-total">${money.format(row.total)}</div>
      </div>
      <div class="purchase-meta">
        <div><small>Compra</small><strong>${cleanNumber(row.quantity)} ${row.unit}</strong></div>
        <div><small>Precio</small><strong>${money.format(row.unitPrice)} c/u</strong></div>
        <div><small>Tienda</small><strong>${row.store || '—'}</strong></div>
      </div>
      ${stock}
    </article>`;
}

function renderPurchases() {
  if (!$('#purchaseKpis')) return;
  $('#purchaseKpis').innerHTML = purchaseKpis().map(([label,value,tone])=>`<article class="purchase-kpi ${tone}"><small>${label}</small><strong>${value}</strong></article>`).join('');

  const low = lowItems();
  $('#purchaseLowList').innerHTML = low.length
    ? low.map(lowCard).join('')
    : `<div class="purchase-empty"><span>✓</span><h4>Inventario arriba del mínimo</h4><p>Puedes registrar una compra de cualquier producto cuando quieras.</p></div>`;

  const history = PurchaseStore.list().slice(0,12);
  $('#purchaseHistory').innerHTML = history.length
    ? history.map(historyCard).join('')
    : `<div class="purchase-empty"><span>🛒</span><h4>Aún no hay compras</h4><p>Cuando registres una compra aparecerá aquí.</p></div>`;

  updateHomePurchaseSummary();
}

function updateHomePurchaseSummary() {
  const card = $$('.summary-card').find(node=>node.querySelector('b')?.textContent.trim() === 'Por comprar');
  if (!card) return;
  const count = lowItems().length;
  const value = card.querySelector('strong');
  const note = card.querySelector('small');
  if (value) value.textContent = String(count);
  if (note) note.textContent = count === 1 ? 'Producto bajo mínimo' : 'Productos bajo mínimo';
}

function openPurchases() {
  ensureAssets();
  $$('.view').forEach(view=>view.classList.toggle('active',view.id === 'purchasesView'));
  $('#hero')?.classList.remove('compact');
  $('#bottomNav')?.classList.add('hidden');
  if (location.hash !== '#compras') history.replaceState(null,'','#compras');
  renderPurchases();
  window.scrollTo({top:0,behavior:'auto'});
}

function goHome() {
  const clean = location.pathname + location.search;
  location.href = clean;
}

function populateProducts(productId = null) {
  const select = $('#purchaseProduct');
  if (!select) return;
  const items = inventoryItems();
  select.innerHTML = `<option value="">Selecciona producto</option>${items.map(item=>`<option value="${item.id}" ${item.id===productId?'selected':''}>${item.name}</option>`).join('')}`;
}

function selectedItem() {
  const id = $('#purchaseProduct')?.value || selectedProductId;
  return inventoryItems().find(item=>item.id === id) || null;
}

function applyProductDefaults() {
  const item = selectedItem();
  if (!item) {
    selectedProductId = null;
    $('#purchaseUnit').innerHTML = unitOptions();
    updatePurchasePreview();
    return;
  }
  selectedProductId = item.id;
  $('#purchaseUnit').innerHTML = unitOptions(item.purchaseUnit || item.unit);
  $('#purchaseUnit').value = item.purchaseUnit || item.unit;
  $('#purchasePrice').value = Number(item.purchasePrice || 0) || '';
  updatePurchasePreview();
}

function updatePurchasePreview() {
  const item = selectedItem();
  const qty = Number($('#purchaseQty')?.value || 0);
  const unit = $('#purchaseUnit')?.value || '';
  const priceRaw = $('#purchasePrice')?.value;
  const price = priceRaw === '' ? 0 : Number(priceRaw || 0);
  const total = qty * price;
  const preview = purchasePreview(item,qty,unit);

  if (!$('#purchasePreview')) return;
  $('#purchasePreview').innerHTML = `
    <div class="purchase-preview-row"><span>Total compra</span><strong>${money.format(Number.isFinite(total) ? total : 0)}</strong></div>
    <div class="purchase-preview-row"><span>Entra a inventario</span><strong>${preview.automatic ? `+${cleanNumber(preview.stockAdded)} ${preview.stockUnit}` : 'Revisar equivalencia'}</strong></div>`;
}

function openPurchaseModal(productId = null, quantity = null) {
  ensureAssets();
  $('#purchaseForm').reset();
  selectedProductId = productId;
  populateProducts(productId);
  $('#purchaseUnit').innerHTML = unitOptions();
  $('#purchaseQty').value = quantity && Number(quantity) > 0 ? String(quantity) : '';
  if (productId) applyProductDefaults();
  else updatePurchasePreview();
  $('#purchaseModal').hidden = false;
  document.body.classList.add('modal-open');
}

function closePurchaseModal() {
  $('#purchaseModal').hidden = true;
  selectedProductId = null;
  document.body.classList.remove('modal-open');
}

function showPurchaseToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),1900);
}

function savePurchase(event) {
  event.preventDefault();
  const item = selectedItem();
  if (!item) return;
  const result = registerPurchase({
    productId:item.id,
    productName:item.name,
    quantity:Number($('#purchaseQty').value || 0),
    unit:$('#purchaseUnit').value,
    unitPrice:Number($('#purchasePrice').value || 0),
    store:$('#purchaseStore').value.trim(),
    date:localDateISO()
  });
  if (!result.ok) {
    showPurchaseToast(result.error || 'No se pudo guardar la compra');
    return;
  }
  closePurchaseModal();
  renderPurchases();
  if (result.autoStock) showPurchaseToast(`Compra guardada · +${cleanNumber(result.purchase.stockAdded)} ${result.purchase.stockUnit} al inventario`);
  else showPurchaseToast('Compra guardada · revisa equivalencia de inventario');
}

ensureAssets();

document.addEventListener('click',event=>{
  const module = event.target.closest('[data-module="compras"]');
  if (module) {
    event.preventDefault();
    event.stopImmediatePropagation();
    openPurchases();
    return;
  }

  const buy = event.target.closest('[data-buy-product]');
  if (buy) {
    event.preventDefault();
    openPurchaseModal(buy.dataset.buyProduct);
  }
},true);

window.addEventListener('panel:open-purchase',event=>{
  const productId = event.detail?.productId || null;
  const quantity = event.detail?.quantity || null;
  openPurchaseModal(productId,quantity);
});

$('#purchasesBack')?.addEventListener('click',goHome);
$('#newPurchaseButton')?.addEventListener('click',()=>openPurchaseModal());
$('#closePurchaseModal')?.addEventListener('click',closePurchaseModal);
$('#cancelPurchase')?.addEventListener('click',closePurchaseModal);
$('#purchaseModal')?.addEventListener('click',event=>{if(event.target === $('#purchaseModal')) closePurchaseModal();});
$('#purchaseProduct')?.addEventListener('change',applyProductDefaults);
$('#purchaseQty')?.addEventListener('input',updatePurchasePreview);
$('#purchaseUnit')?.addEventListener('change',updatePurchasePreview);
$('#purchasePrice')?.addEventListener('input',updatePurchasePreview);
$('#purchaseForm')?.addEventListener('submit',savePurchase);

updateHomePurchaseSummary();
if (location.hash === '#compras') openPurchases();
