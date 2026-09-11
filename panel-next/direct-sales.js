import { OrdersStore } from './data.js';
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

// Catálogo real de la app de pedidos. No incluye productos inventados.
// En ceviches guardamos la cantidad en lb para que Preparación descuente correctamente lo preparado.
const SALES_CATALOG = [
  { id:'combo_constructor', name:'Combo Constructor', detail:'1 lb ceviche de pescado + 1 cóctel chico', unit:'combo', qty:1, price:22 },
  { id:'combo_hambre', name:'Combo Hambre', detail:'1 lb ceviche de camarón + 1 cóctel chico', unit:'combo', qty:1, price:27 },
  { id:'combo_camaradas', name:'Combo Camaradas', detail:'1 lb pescado + 1 lb camarón + 2 cócteles chicos', unit:'combo', qty:1, price:49 },

  { id:'fish_half', name:'Ceviche de pescado', detail:'½ libra', unit:'lb', qty:0.5, price:8 },
  { id:'fish_lb', name:'Ceviche de pescado', detail:'1 libra', unit:'lb', qty:1, price:15 },
  { id:'shrimp_half', name:'Ceviche de camarón', detail:'½ libra', unit:'lb', qty:0.5, price:11 },
  { id:'shrimp_lb', name:'Ceviche de camarón', detail:'1 libra', unit:'lb', qty:1, price:20 },
  { id:'mixed_half', name:'Ceviche mixto', detail:'Pescado y camarón · ½ libra', unit:'lb', qty:0.5, price:13 },
  { id:'mixed_lb', name:'Ceviche mixto', detail:'Pescado y camarón · 1 libra', unit:'lb', qty:1, price:25 },

  { id:'cocktail_shrimp_small', name:'Cóctel de camarón', detail:'Chico · 12 oz', unit:'12 oz', qty:1, price:null },
  { id:'cocktail_shrimp_medium', name:'Cóctel de camarón', detail:'Mediano · 16 oz', unit:'16 oz', qty:1, price:null },
  { id:'cocktail_mixed_small', name:'Cóctel mixto', detail:'Camarón y pulpo · Chico · 12 oz · Sobre pedido', unit:'12 oz', qty:1, price:null },
  { id:'cocktail_mixed_medium', name:'Cóctel mixto', detail:'Camarón y pulpo · Mediano · 16 oz · Sobre pedido', unit:'16 oz', qty:1, price:null },

  { id:'octopus_fish_half', name:'Ceviche de pulpo y pescado', detail:'½ libra · Sobre pedido', unit:'lb', qty:0.5, price:13 },
  { id:'octopus_fish_lb', name:'Ceviche de pulpo y pescado', detail:'1 libra · Sobre pedido', unit:'lb', qty:1, price:25 },
  { id:'octopus_shrimp_half', name:'Ceviche de pulpo y camarón', detail:'½ libra · Sobre pedido', unit:'lb', qty:0.5, price:13 },
  { id:'octopus_shrimp_lb', name:'Ceviche de pulpo y camarón', detail:'1 libra · Sobre pedido', unit:'lb', qty:1, price:25 },

  { id:'soda', name:'Refresco', detail:'Sabores sujetos a disponibilidad', unit:'pieza', qty:1, price:2.5 }
];

function ensureDirectSaleStyles() {
  if ($('#directSaleStyles')) return;
  const style = document.createElement('style');
  style.id = 'directSaleStyles';
  style.textContent = `
    .module-card[data-module="venta"]{background:linear-gradient(145deg,#ff9e49,#ef6805)!important;color:#fff!important}
    .module-card[data-module="entregas"]{background:linear-gradient(145deg,#35c2c0,#079394)!important;color:#fff!important}
    .module-card[data-module="dinero"]{background:linear-gradient(145deg,#46687d,#263f50)!important;color:#fff!important}
    .sale-product-picker{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:8px}
    .sale-product-button{border:2px solid #dce5e0;background:#fff;border-radius:16px;padding:13px 12px;min-height:76px;text-align:left;color:#17211c;box-shadow:0 5px 14px rgba(25,45,36,.05)}
    .sale-product-button strong{display:block;font-size:16px;line-height:1.12;font-weight:1000}
    .sale-product-button small{display:block;margin-top:5px;color:#6b7871;font-size:12px;font-weight:800;line-height:1.25}
    .sale-product-button.active{border-color:#078844;background:#e9f8ef;box-shadow:0 0 0 3px rgba(7,136,68,.12)}
    .sale-selection-title{margin:0 0 4px;color:#6e7a74;font-size:12px;font-weight:1000;text-transform:uppercase;letter-spacing:.04em}
    @media(max-width:560px){.sale-product-picker{grid-template-columns:1fr 1fr}.sale-product-button{min-height:72px;padding:11px 10px}.sale-product-button strong{font-size:15px}}
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
          <input id="saleProduct" type="hidden"><input id="saleDetail" type="hidden">
          <div class="form-grid two" style="margin-top:14px">
            <label>Cantidad<input id="saleQty" type="number" min="0.01" step="0.01" value="1" required></label>
            <label>Unidad<input id="saleUnit" readonly></label>
            <label class="full">Precio unitario<input id="salePrice" type="number" min="0" step="0.01"></label>
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
  const box = $('#saleProductButtons');
  if (box) box.innerHTML = SALES_CATALOG.map((item,index) => {
    const price = item.price === null ? 'Precio pendiente' : `$${Number(item.price).toFixed(2)}`;
    return `<button class="sale-product-button" type="button" data-sale-product-index="${index}"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.detail)} · ${escapeHtml(price)}</small></button>`;
  }).join('');
  $('#salePayment').innerHTML = PAYMENT_METHODS.map(item=>`<option>${escapeHtml(item)}</option>`).join('');
}

function selectProduct(index) {
  const item = SALES_CATALOG[index];
  if (!item) return;
  $('#saleProduct').value = item.name;
  $('#saleDetail').value = item.detail || '';
  $('#saleQty').value = String(item.qty ?? 1);
  $('#saleUnit').value = item.unit || '';
  $('#salePrice').value = item.price === null ? '' : Number(item.price);
  $('#salePrice').readOnly = item.price !== null;
  document.querySelectorAll('.sale-product-button').forEach((button,buttonIndex)=>button.classList.toggle('active',buttonIndex === index));
  updatePreview();
}

function updatePreview() {
  const qty = Number($('#saleQty')?.value || 0);
  const unit = $('#saleUnit')?.value || '';
  const name = $('#saleProduct')?.value || '';
  const rawPrice = $('#salePrice')?.value ?? '';
  const price = rawPrice === '' ? null : Number(rawPrice);
  if (!$('#salePreview')) return;
  if (!name) return void ($('#salePreview').innerHTML = '<span>Selecciona un producto</span><strong>$0.00</strong>');
  $('#salePreview').innerHTML = `<span>${qty || 0} ${escapeHtml(unit)} · ${escapeHtml(name)}</span><strong>${price === null ? 'Precio pendiente' : `$${(qty*price).toFixed(2)}`}</strong>`;
}

function openSale() {
  ensureModal();
  $('#directSaleForm').reset();
  $('#saleProduct').value = '';
  $('#saleDetail').value = '';
  $('#saleUnit').value = '';
  $('#salePrice').value = '';
  $('#salePrice').readOnly = true;
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
  const detail = $('#saleDetail').value.trim();
  const unit = $('#saleUnit').value.trim();
  const qty = Number($('#saleQty').value || 0);
  const rawPrice = $('#salePrice').value;
  const price = rawPrice === '' ? NaN : Number(rawPrice);
  if (!name) return toast('Selecciona un producto');
  if (!unit) return toast('Ese producto no tiene unidad');
  if (!(qty > 0)) return toast('Revisa la cantidad');
  if (!Number.isFinite(price) || price < 0) return toast('Escribe el precio de ese producto');

  const created = OrdersStore.create({
    customer:$('#saleCustomer').value.trim(), phone:$('#salePhone').value.trim(), address:$('#saleAddress').value.trim(), zip:$('#saleZip').value.trim(),
    source:'Venta directa', directSale:true, date:localISO(), time:$('#saleTime').value, payment:$('#salePayment').value, paymentStatus:$('#salePaymentStatus').value, notes:$('#saleNotes').value.trim(),
    items:[{ name, detail, qty, unit, price, lineTotal:qty*price }], total:qty*price
  });
  OrdersStore.update(created.id,{status:'ready',directSale:true,readyAt:Date.now()});
  closeSale();
  toast('Venta guardada · lista para entrega');
}

ensureDirectSaleStyles(); ensureModal(); setTimeout(ensureSaleButton,0);
window.addEventListener('hashchange',()=>setTimeout(ensureSaleButton,0));
window.addEventListener('panel:orders-changed',()=>setTimeout(ensureSaleButton,0));
document.addEventListener('click',event=>{
  const productButton=event.target.closest('[data-sale-product-index]');
  if(productButton){event.preventDefault();selectProduct(Number(productButton.dataset.saleProductIndex));return;}
  const sale=event.target.closest('[data-module="venta"]');
  if(sale){event.preventDefault();event.stopImmediatePropagation();openSale();return;}
  if(event.target.closest('#closeDirectSale,#cancelDirectSale')){event.preventDefault();closeSale();return;}
  if(event.target.id==='directSaleModal') closeSale();
},true);
document.addEventListener('input',event=>{if(event.target.matches('#saleQty,#salePrice')) updatePreview();});
