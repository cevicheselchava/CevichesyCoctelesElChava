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

// Venta usa exactamente la misma lista base de productos que Pedidos del panel.
// Si Configuración tiene productos guardados, se usan esos; si no, se usan los cinco ceviches del panel.
const PANEL_PRODUCTS = [
  { name:'Ceviche de camarón', unit:'lb' },
  { name:'Ceviche de pescado', unit:'lb' },
  { name:'Ceviche mixto', unit:'lb' },
  { name:'Ceviche pulpo y camarón', unit:'lb' },
  { name:'Ceviche pulpo y pescado', unit:'lb' }
];

function salesCatalog() {
  const configured = MenuStore.list().filter(item => String(item?.name || '').trim());
  if (configured.length) {
    return configured.map(item => ({
      name:String(item.name || '').trim(),
      unit:String(item.unit || '').trim(),
      price:item.price !== null && item.price !== undefined && item.price !== '' ? Number(item.price) : null
    }));
  }
  return PANEL_PRODUCTS.map(item => ({ ...item, price:null }));
}

function ensureDirectSaleStyles() {
  if ($('#directSaleStyles')) return;
  const style = document.createElement('style');
  style.id = 'directSaleStyles';
  style.textContent = `
    .module-card[data-module="venta"]{background:linear-gradient(145deg,#ff9e49,#ef6805)!important;color:#fff!important}
    .module-card[data-module="entregas"]{background:linear-gradient(145deg,#35c2c0,#079394)!important;color:#fff!important}
    .module-card[data-module="dinero"]{background:linear-gradient(145deg,#46687d,#263f50)!important;color:#fff!important}
    .sale-product-picker{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:8px}
    .sale-product-button{border:2px solid #dce5e0;background:#fff;border-radius:16px;padding:13px 12px;min-height:68px;text-align:center;color:#17211c;box-shadow:0 5px 14px rgba(25,45,36,.05)}
    .sale-product-button strong{display:block;font-size:16px;line-height:1.12;font-weight:1000}
    .sale-product-button small{display:block;margin-top:6px;color:#6b7871;font-size:12px;font-weight:800}
    .sale-product-button:nth-child(5n+1){background:#e8f8ee;border-color:#bfe4cd;color:#08713a}
    .sale-product-button:nth-child(5n+2){background:#e8f4ff;border-color:#c7dff3;color:#155c91}
    .sale-product-button:nth-child(5n+3){background:#fff4c9;border-color:#f1d77b;color:#6d5100}
    .sale-product-button:nth-child(5n+4){background:#ffe8ef;border-color:#f1c7d4;color:#8a3453}
    .sale-product-button:nth-child(5n+5){background:#eee8ff;border-color:#d8cef4;color:#543a8d}
    .sale-product-button.active{border-color:#078844!important;background:#078844!important;color:#fff!important;box-shadow:0 0 0 3px rgba(7,136,68,.12)}
    .sale-product-button.active small{color:#fff}
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
  button.innerHTML = `<span class="module-icon" aria-hidden="true">💵</span><span class="module-copy"><strong>Venta</strong><small>Registra una venta del día</small></span>`;
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
      <div class="modal-head"><div><small>VENTA DE HOY</small><h2 id="directSaleTitle">Venta</h2></div><button class="modal-close" id="closeDirectSale" type="button">×</button></div>
      <form id="directSaleForm">
        <div class="form-section">
          <h3>Producto</h3><p class="sale-selection-title">Toca el producto</p><div class="sale-product-picker" id="saleProductButtons"></div>
          <input id="saleProduct" type="hidden">
          <div class="form-grid two" style="margin-top:14px">
            <label>Cantidad<input id="saleQty" type="number" min="0.01" step="0.01" value="1" required></label>
            <label>Unidad<input id="saleUnit" readonly></label>
            <label class="full">Precio unitario<input id="salePrice" type="number" min="0" step="0.01" required></label>
          </div>
        </div>
        <div class="form-section"><h3>Cliente y entrega</h3><div class="form-grid two">
          <label>Nombre<input id="saleCustomer" autocomplete="name" required></label><label>Teléfono<input id="salePhone" type="tel" autocomplete="tel" required></label>
          <label class="full">Dirección<input id="saleAddress" autocomplete="street-address" required></label><label>ZIP<input id="saleZip" inputmode="numeric"></label><label>Hora<input id="saleTime" type="time" required></label>
        </div></div>
        <div class="form-section"><h3>Pago</h3><div class="form-grid two">
          <label>Forma de pago<select id="salePayment"></select></label><label>Estado<select id="salePaymentStatus"><option value="pending">Pendiente</option><option value="paid">Pagado</option></select></label><label class="full">Notas<input id="saleNotes" placeholder="Opcional"></label>
        </div></div>
        <div class="order-preview" id="salePreview"></div><div class="modal-actions"><button class="secondary-action" id="cancelDirectSale" type="button">Cancelar</button><button class="primary-action" type="submit">Guardar venta</button></div>
      </form>
    </section>`;
  document.body.appendChild(modal);
  $('#directSaleForm')?.addEventListener('submit',saveSale);
}

function fillOptions() {
  const products = salesCatalog();
  const box = $('#saleProductButtons');
  if (box) box.innerHTML = products.map((item,index) => {
    const info = [item.unit || '', item.price !== null ? `$${Number(item.price).toFixed(2)}` : ''].filter(Boolean).join(' · ');
    return `<button class="sale-product-button" type="button" data-sale-product-index="${index}"><strong>${escapeHtml(item.name)}</strong>${info ? `<small>${escapeHtml(info)}</small>` : ''}</button>`;
  }).join('');
  $('#salePayment').innerHTML = PAYMENT_METHODS.map(item=>`<option>${escapeHtml(item)}</option>`).join('');
}

function selectProduct(index) {
  const item = salesCatalog()[index];
  if (!item) return;
  $('#saleProduct').value = item.name || '';
  $('#saleQty').value = '1';
  $('#saleUnit').value = item.unit || 'lb';
  $('#salePrice').value = item.price !== null ? Number(item.price) : '';
  $('#salePrice').readOnly = item.price !== null;
  document.querySelectorAll('.sale-product-button').forEach((button,buttonIndex)=>button.classList.toggle('active',buttonIndex === index));
  updatePreview();
  if (item.price === null) $('#salePrice')?.focus();
}

function updatePreview() {
  const qty = Number($('#saleQty')?.value || 0);
  const unit = $('#saleUnit')?.value || '';
  const name = $('#saleProduct')?.value || '';
  const rawPrice = $('#salePrice')?.value ?? '';
  const price = rawPrice === '' ? null : Number(rawPrice);
  if (!$('#salePreview')) return;
  if (!name) return void ($('#salePreview').innerHTML = '<span>Selecciona un producto</span><strong>$0.00</strong>');
  $('#salePreview').innerHTML = `<span>${qty || 0} ${escapeHtml(unit)} · ${escapeHtml(name)}</span><strong>${price === null ? 'Escribe precio' : `$${(qty*price).toFixed(2)}`}</strong>`;
}

function openSale() {
  ensureModal();
  $('#directSaleForm').reset();
  $('#saleProduct').value = '';
  $('#saleUnit').value = '';
  $('#salePrice').value = '';
  $('#salePrice').readOnly = false;
  $('#saleQty').value = '1';
  $('#saleTime').value = currentTime();
  $('#salePaymentStatus').value = 'pending';
  fillOptions();
  updatePreview();
  $('#directSaleModal').hidden = false;
  document.body.classList.add('modal-open');
}
function closeSale() { if ($('#directSaleModal')) $('#directSaleModal').hidden = true; document.body.classList.remove('modal-open'); }
function toast(message) { const el=$('#toast'); if(!el)return; el.textContent=message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove('show'),1900); }

function saveSale(event) {
  event.preventDefault();
  const name = $('#saleProduct').value.trim();
  const unit = $('#saleUnit').value.trim();
  const qty = Number($('#saleQty').value || 0);
  const price = Number($('#salePrice').value || 0);
  if (!name) return toast('Selecciona un producto');
  if (!unit) return toast('Ese producto no tiene unidad');
  if (!(qty > 0)) return toast('Revisa la cantidad');
  if (!Number.isFinite(price) || price < 0) return toast('Escribe el precio');

  const created = OrdersStore.create({
    customer:$('#saleCustomer').value.trim(), phone:$('#salePhone').value.trim(), address:$('#saleAddress').value.trim(), zip:$('#saleZip').value.trim(),
    source:'Venta directa', directSale:true, date:localISO(), time:$('#saleTime').value, payment:$('#salePayment').value, paymentStatus:$('#salePaymentStatus').value, notes:$('#saleNotes').value.trim(),
    items:[{ name, qty, unit, price, lineTotal:qty*price }], total:qty*price
  });
  OrdersStore.update(created.id,{status:'ready',directSale:true,readyAt:Date.now()});
  closeSale();
  toast('Venta guardada · lista para entrega');
}

ensureDirectSaleStyles(); ensureModal(); setTimeout(ensureSaleButton,0);
window.addEventListener('hashchange',()=>setTimeout(ensureSaleButton,0));
window.addEventListener('panel:orders-changed',()=>setTimeout(ensureSaleButton,0));
window.addEventListener('panel:menu-changed',()=>{ if(!$('#directSaleModal')?.hidden) fillOptions(); });
document.addEventListener('click',event=>{
  const productButton=event.target.closest('[data-sale-product-index]');
  if(productButton){event.preventDefault();selectProduct(Number(productButton.dataset.saleProductIndex));return;}
  const sale=event.target.closest('[data-module="venta"]');
  if(sale){event.preventDefault();event.stopImmediatePropagation();openSale();return;}
  if(event.target.closest('#closeDirectSale,#cancelDirectSale')){event.preventDefault();closeSale();return;}
  if(event.target.id==='directSaleModal') closeSale();
},true);
document.addEventListener('input',event=>{if(event.target.matches('#saleQty,#salePrice')) updatePreview();});
