import { OrdersStore, MenuStore } from './data.js';
import { PAYMENT_METHODS } from './config.js';

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
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

function ensureDirectSaleStyles() {
  if ($('#directSaleStyles')) return;
  const style = document.createElement('style');
  style.id = 'directSaleStyles';
  style.textContent = `
    /* Cada módulo tiene un color distinto */
    .module-card[data-module="venta"]{background:linear-gradient(145deg,#ff9e49,#ef6805)!important;color:#fff!important}
    .module-card[data-module="entregas"]{background:linear-gradient(145deg,#35c2c0,#079394)!important;color:#fff!important}
    .module-card[data-module="dinero"]{background:linear-gradient(145deg,#46687d,#263f50)!important;color:#fff!important}

    .sale-product-picker{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:8px}
    .sale-product-button{border:2px solid #dce5e0;background:#fff;border-radius:16px;padding:13px 12px;min-height:68px;text-align:left;color:#17211c;box-shadow:0 5px 14px rgba(25,45,36,.05)}
    .sale-product-button strong{display:block;font-size:16px;line-height:1.12;font-weight:1000}
    .sale-product-button small{display:block;margin-top:6px;color:#6b7871;font-size:12px;font-weight:800}
    .sale-product-button.active{border-color:#078844;background:#e9f8ef;box-shadow:0 0 0 3px rgba(7,136,68,.12)}
    .sale-product-empty{grid-column:1/-1;border:1px dashed #cbd8d1;border-radius:15px;padding:14px;color:#68756f;font-size:13px;background:#f8faf9}
    .sale-auto-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:13px}
    .sale-auto-fields label{font-size:13px;font-weight:900;color:#6e7a74;text-transform:uppercase}
    .sale-auto-fields input{display:block;width:100%;margin-top:6px;border:1px solid #d6dfda;border-radius:14px;padding:0 12px;min-height:56px;font-size:18px;background:#f4f7f5;color:#17211c;font-weight:800}
    .sale-selection-title{margin:0 0 4px;color:#6e7a74;font-size:12px;font-weight:1000;text-transform:uppercase;letter-spacing:.04em}
    @media(max-width:560px){.sale-product-picker{grid-template-columns:1fr 1fr}.sale-product-button{min-height:64px;padding:11px 10px}.sale-product-button strong{font-size:15px}}
  `;
  document.head.appendChild(style);
}

function ensureSaleButton() {
  ensureDirectSaleStyles();
  const grid = $('#moduleGrid');
  if (!grid || grid.querySelector('[data-module="venta"]')) return;
  const button = document.createElement('button');
  button.className = 'module-card sale-card';
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
  ensureDirectSaleStyles();
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
          <p class="sale-selection-title">Toca el producto</p>
          <div class="sale-product-picker" id="saleProductButtons"></div>
          <input id="saleProduct" type="hidden">
          <div class="form-grid two" style="margin-top:14px">
            <label>Cantidad<input id="saleQty" type="number" min="0.01" step="0.01" value="1" required></label>
            <label>Unidad<input id="saleUnit" readonly></label>
            <label class="full">Precio unitario<input id="salePrice" type="number" min="0" step="0.01" readonly></label>
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
  $('#directSaleForm')?.addEventListener('submit',saveSale);
}

function fillOptions() {
  const products = MenuStore.list();
  const box = $('#saleProductButtons');
  if (box) {
    box.innerHTML = products.length
      ? products.map((item,index) => {
          const unit = item.unit || '';
          const price = item.price !== null && item.price !== undefined && item.price !== '' ? `$${Number(item.price).toFixed(2)}` : 'Sin precio';
          return `<button class="sale-product-button" type="button" data-sale-product-index="${index}"><strong>${escapeHtml(item.name || 'Producto')}</strong><small>${escapeHtml(unit)}${unit ? ' · ' : ''}${escapeHtml(price)}</small></button>`;
        }).join('')
      : '<div class="sale-product-empty">No hay productos registrados todavía. Agrégalos en Configuración para que aparezcan aquí.</div>';
  }
  $('#salePayment').innerHTML = PAYMENT_METHODS.map(item=>`<option>${escapeHtml(item)}</option>`).join('');
}

function selectProduct(index) {
  const products = MenuStore.list();
  const item = products[index];
  if (!item) return;
  $('#saleProduct').value = item.name || '';
  $('#saleUnit').value = item.unit || '';
  $('#salePrice').value = item.price !== null && item.price !== undefined && item.price !== '' ? Number(item.price) : '';
  document.querySelectorAll('.sale-product-button').forEach((button,buttonIndex)=>button.classList.toggle('active',buttonIndex === index));
  updatePreview();
}

function updatePreview() {
  const qty = Number($('#saleQty')?.value || 0);
  const unit = $('#saleUnit')?.value || '';
  const name = $('#saleProduct')?.value || '';
  const price = Number($('#salePrice')?.value || 0);
  if (!$('#salePreview')) return;
  if (!name) {
    $('#salePreview').innerHTML = '<span>Selecciona un producto</span><strong>$0.00</strong>';
    return;
  }
  $('#salePreview').innerHTML = `<span>${qty || 0} ${escapeHtml(unit)} · ${escapeHtml(name)}</span><strong>$${(qty*price).toFixed(2)}</strong>`;
}

function openSale() {
  ensureModal();
  $('#directSaleForm').reset();
  $('#saleProduct').value = '';
  $('#saleUnit').value = '';
  $('#salePrice').value = '';
  $('#saleQty').value = '1';
  $('#saleTime').value = currentTime();
  $('#salePaymentStatus').value = 'pending';
  fillOptions();
  updatePreview();
  $('#directSaleModal').hidden = false;
  document.body.classList.add('modal-open');
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
  clearTimeout(toast.timer);
  toast.timer = setTimeout(()=>el.classList.remove('show'),1900);
}

function saveSale(event) {
  event.preventDefault();
  const name = $('#saleProduct').value.trim();
  const unit = $('#saleUnit').value.trim();
  const qty = Number($('#saleQty').value || 0);
  const price = Number($('#salePrice').value || 0);
  if (!name) return toast('Selecciona un producto');
  if (!unit) return toast('Ese producto no tiene unidad registrada');
  if (!(qty > 0)) return toast('Revisa la cantidad');
  if (!Number.isFinite(price) || price < 0) return toast('Ese producto no tiene precio válido');

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
      name,
      qty,
      unit,
      price,
      lineTotal:qty*price
    }],
    total:qty*price
  });

  OrdersStore.update(created.id,{status:'ready',directSale:true,readyAt:Date.now()});
  closeSale();
  toast('Venta guardada · lista para entrega');
}

ensureDirectSaleStyles();
ensureModal();
setTimeout(ensureSaleButton,0);
window.addEventListener('hashchange',()=>setTimeout(ensureSaleButton,0));
window.addEventListener('panel:orders-changed',()=>setTimeout(ensureSaleButton,0));

document.addEventListener('click',event=>{
  const productButton = event.target.closest('[data-sale-product-index]');
  if (productButton) {
    event.preventDefault();
    selectProduct(Number(productButton.dataset.saleProductIndex));
    return;
  }

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
  if (event.target.matches('#saleQty')) updatePreview();
});
