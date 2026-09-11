import { OrdersStore, MenuStore } from './data.js';
import { PAYMENT_METHODS, UNITS } from './config.js';

const $ = selector => document.querySelector(selector);
const localISO = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth()+1).padStart(2,'0');
  const d = String(now.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
};
const currentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
};

function ensureSaleButton() {
  const grid = $('#moduleGrid');
  if (!grid || grid.querySelector('[data-module="venta"]')) return;
  const button = document.createElement('button');
  button.className = 'module-card purple';
  button.dataset.module = 'venta';
  button.type = 'button';
  button.innerHTML = `
    <span class="module-icon" aria-hidden="true">💵</span>
    <span class="module-copy"><strong>Venta</strong><small>Registra una venta del día</small></span>`;
  const pedidos = grid.querySelector('[data-module="pedidos"]');
  pedidos?.insertAdjacentElement('afterend',button);
  if (!pedidos) grid.prepend(button);
}

function ensureModal() {
  if ($('#directSaleModal')) return;
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'directSaleModal';
  modal.hidden = true;
  modal.innerHTML = `
    <section class="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="directSaleTitle">
      <div class="modal-head">
        <div><small>VENTA DE HOY</small><h2 id="directSaleTitle">Venta</h2></div>
        <button class="modal-close" id="closeDirectSale" type="button">×</button>
      </div>
      <form id="directSaleForm">
        <div class="form-section">
          <h3>Producto</h3>
          <div class="form-grid two">
            <label class="full">Producto<input id="saleProduct" list="saleProductOptions" required></label>
            <datalist id="saleProductOptions"></datalist>
            <label>Cantidad<input id="saleQty" type="number" min="0.01" step="0.01" value="1" required></label>
            <label>Unidad<input id="saleUnit" list="saleUnitOptions" required></label>
            <datalist id="saleUnitOptions"></datalist>
            <label class="full">Precio unitario<input id="salePrice" type="number" min="0" step="0.01" required></label>
          </div>
        </div>
        <div class="form-section">
          <h3>Cliente y entrega</h3>
          <div class="form-grid two">
            <label>Nombre<input id="saleCustomer" autocomplete="name" required></label>
            <label>Teléfono<input id="salePhone" type="tel" autocomplete="tel" required></label>
            <label class="full">Dirección<input id="saleAddress" autocomplete="street-address" required></label>
            <label>ZIP<input id="saleZip" inputmode="numeric"></label>
            <label>Hora<input id="saleTime" type="time" required></label>
          </div>
        </div>
        <div class="form-section">
          <h3>Pago</h3>
          <div class="form-grid two">
            <label>Forma de pago<select id="salePayment"></select></label>
            <label>Estado<select id="salePaymentStatus"><option value="pending">Pendiente</option><option value="paid">Pagado</option></select></label>
            <label class="full">Notas<input id="saleNotes" placeholder="Opcional"></label>
          </div>
        </div>
        <div class="order-preview" id="salePreview"></div>
        <div class="modal-actions">
          <button class="secondary-action" id="cancelDirectSale" type="button">Cancelar</button>
          <button class="primary-action" type="submit">Guardar venta</button>
        </div>
      </form>
    </section>`;
  document.body.appendChild(modal);
}

function fillOptions() {
  $('#saleProductOptions').innerHTML = MenuStore.list().map(item=>`<option value="${item.name}"></option>`).join('');
  $('#saleUnitOptions').innerHTML = UNITS.map(unit=>`<option value="${unit}"></option>`).join('');
  $('#salePayment').innerHTML = PAYMENT_METHODS.map(item=>`<option>${item}</option>`).join('');
}

function applyProduct() {
  const name = $('#saleProduct').value.trim().toLowerCase();
  const item = MenuStore.list().find(row=>String(row.name||'').trim().toLowerCase() === name);
  if (!item) return updatePreview();
  if (item.unit) $('#saleUnit').value = item.unit;
  if (item.price !== null && item.price !== undefined && item.price !== '') $('#salePrice').value = item.price;
  updatePreview();
}

function updatePreview() {
  const qty = Number($('#saleQty')?.value || 0);
  const unit = $('#saleUnit')?.value || '';
  const name = $('#saleProduct')?.value || 'Producto';
  const price = Number($('#salePrice')?.value || 0);
  if ($('#salePreview')) $('#salePreview').innerHTML = `<span>${qty || 0} ${unit} · ${name}</span><strong>$${(qty*price).toFixed(2)}</strong>`;
}

function openSale() {
  ensureModal();
  fillOptions();
  $('#directSaleForm').reset();
  $('#saleQty').value = '1';
  $('#saleTime').value = currentTime();
  $('#salePaymentStatus').value = 'pending';
  updatePreview();
  $('#directSaleModal').hidden = false;
  document.body.classList.add('modal-open');
  setTimeout(()=>$('#saleProduct')?.focus(),50);
}

function closeSale() {
  if ($('#directSaleModal')) $('#directSaleModal').hidden = true;
  document.body.classList.remove('modal-open');
}

function toast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),1900);
}

function saveSale(event) {
  event.preventDefault();
  const qty = Number($('#saleQty').value || 0);
  const price = Number($('#salePrice').value || 0);
  if (!(qty > 0) || !Number.isFinite(price) || price < 0) return;

  const created = OrdersStore.create({
    customer:$('#saleCustomer').value.trim(),
    phone:$('#salePhone').value.trim(),
    address:$('#saleAddress').value.trim(),
    zip:$('#saleZip').value.trim(),
    source:'Venta directa',
    directSale:true,
    date:localISO(),
    time:$('#saleTime').value,
    payment:$('#salePayment').value,
    paymentStatus:$('#salePaymentStatus').value,
    notes:$('#saleNotes').value.trim(),
    items:[{
      name:$('#saleProduct').value.trim(),
      qty,
      unit:$('#saleUnit').value.trim(),
      price,
      lineTotal:qty*price
    }],
    total:qty*price
  });

  OrdersStore.update(created.id,{status:'ready',directSale:true,readyAt:Date.now()});
  closeSale();
  toast('Venta guardada · lista para entrega');
}

ensureModal();
setTimeout(ensureSaleButton,0);
window.addEventListener('hashchange',()=>setTimeout(ensureSaleButton,0));
window.addEventListener('panel:orders-changed',()=>setTimeout(ensureSaleButton,0));

document.addEventListener('click',event=>{
  const sale = event.target.closest('[data-module="venta"]');
  if (sale) {
    event.preventDefault();
    event.stopImmediatePropagation();
    openSale();
    return;
  }
  if (event.target.closest('#closeDirectSale,#cancelDirectSale')) {
    event.preventDefault();
    closeSale();
    return;
  }
  if (event.target.id === 'directSaleModal') closeSale();
},true);

document.addEventListener('input',event=>{
  if (event.target.matches('#saleProduct')) applyProduct();
  if (event.target.matches('#saleQty,#saleUnit,#salePrice')) updatePreview();
});

$('#directSaleForm')?.addEventListener('submit',saveSale);
