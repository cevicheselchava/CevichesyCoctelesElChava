import { InventoryStore } from './data.js';
import { PurchaseStore, registerPurchase, purchasePreview } from './purchases-data.js';

const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const money = new Intl.NumberFormat('es-US',{style:'currency',currency:'USD'});
const MIGRATION_KEY = 'panel-next-purchase-system-v3';
const INVENTORY_KEY = 'panel-next-inventory-v2';

const UNIT_META = {
  g:{group:'mass',factor:1}, kg:{group:'mass',factor:1000}, oz:{group:'mass',factor:28.349523125}, lb:{group:'mass',factor:453.59237},
  ml:{group:'volume',factor:1}, L:{group:'volume',factor:1000}, 'fl oz':{group:'volume',factor:29.5735295625}, 'galón':{group:'volume',factor:3785.411784},
  pieza:{group:'count',factor:1}, unidad:{group:'count',factor:1}, pzas:{group:'count',factor:1}
};

const PRESENTATIONS = [
  ['Presentaciones',['bolsa','caja','paquete','botella','lata','manojo','charola','bote','pieza']],
  ['Por peso',['lb','oz','kg','g']],
  ['Por volumen',['L','ml','fl oz','galón']]
];

const CONTENT_UNITS = ['lb','oz','kg','g','pieza','ml','L','fl oz','galón'];
const DIRECT_UNITS = new Set(['lb','oz','kg','g','L','ml','fl oz','galón','pieza']);

function cleanNumber(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return '0';
  const r = Math.round(n * 1000) / 1000;
  return Number.isInteger(r) ? String(r) : String(r);
}

function convertQty(qty, from, to) {
  const n = Number(qty);
  if (!Number.isFinite(n)) return null;
  if (from === to) return n;
  const a = UNIT_META[from], b = UNIT_META[to];
  if (!a || !b || a.group !== b.group) return null;
  return n * a.factor / b.factor;
}

// Costo real por unidad de inventario, aunque la compra venga en bolsa de 12 oz,
// paquete de 25 piezas, botella de 32 fl oz, etc.
InventoryStore.unitCost = function(item) {
  if (!item) return 0;
  const price = Number(item.purchasePrice || 0);
  const content = Number(item.contentQty || 0);
  const contentUnit = item.contentUnit || item.unit;
  const stockPerPresentation = convertQty(content, contentUnit, item.unit);
  if (!(price >= 0) || !(stockPerPresentation > 0)) return Number(item.cost || 0);
  return price / stockPerPresentation;
};

function inventoryNameKey(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
}

function findItem(name) {
  const key = inventoryNameKey(name);
  return InventoryStore.list().find(item=>inventoryNameKey(item.name)===key) || null;
}

function ensureItem(meta) {
  const current = findItem(meta.name);
  if (current) {
    const patch = {};
    ['category','unit','purchaseUnit','contentQty','contentUnit','minimum'].forEach(key=>{
      if (meta[key] !== undefined && (current[key] === undefined || current[key] === null || current[key] === '' || key === 'purchaseUnit' || key === 'contentQty' || key === 'contentUnit')) patch[key] = meta[key];
    });
    if (Object.keys(patch).length) InventoryStore.update(current.id,patch);
    return InventoryStore.get(current.id);
  }
  return InventoryStore.create({ qty:0, minimum:0, purchasePrice:0, ...meta });
}

function migrateCatalog() {
  if (localStorage.getItem(MIGRATION_KEY) === 'done') return;

  // Quita únicamente el renglón genérico de demostración "Contenedores".
  try {
    const raw = JSON.parse(localStorage.getItem(INVENTORY_KEY) || '[]');
    if (Array.isArray(raw)) {
      const filtered = raw.filter(item=>inventoryNameKey(item?.name) !== 'contenedores');
      if (filtered.length !== raw.length) localStorage.setItem(INVENTORY_KEY,JSON.stringify(filtered));
    }
  } catch (_) {}

  // Si todavía están exactamente las existencias demo y nunca se registró una compra,
  // arranca en cero para que lo de hoy sea inventario real, no datos falsos.
  if (!PurchaseStore.list().length) {
    const demo = [
      ['Filete de pescado',6.5],
      ['Camarón',2],
      ['Tomate',3]
    ];
    const matches = demo.every(([name,qty])=>Math.abs(Number(findItem(name)?.qty || 0)-qty)<0.0001);
    if (matches) demo.forEach(([name])=>{ const item=findItem(name); if(item) InventoryStore.update(item.id,{qty:0}); });
  }

  // Presentaciones reales/base. Los precios viejos se conservan y Firebase los migra.
  const shrimp = findItem('Camarón');
  if (shrimp) InventoryStore.update(shrimp.id,{unit:'lb',purchaseUnit:'bolsa',contentQty:12,contentUnit:'oz'});

  [
    {name:'Contenedor ceviche ½ lb',category:'Empaques',unit:'pieza',purchaseUnit:'paquete',contentQty:25,contentUnit:'pieza'},
    {name:'Contenedor ceviche 1 lb',category:'Empaques',unit:'pieza',purchaseUnit:'paquete',contentQty:25,contentUnit:'pieza'},
    {name:'Tapa ceviche · ½ lb / 1 lb',category:'Empaques',unit:'pieza',purchaseUnit:'paquete',contentQty:25,contentUnit:'pieza'},
    {name:'Contenedor cóctel 12 oz',category:'Empaques',unit:'pieza',purchaseUnit:'paquete',contentQty:25,contentUnit:'pieza'},
    {name:'Tapa cóctel 12 oz',category:'Empaques',unit:'pieza',purchaseUnit:'paquete',contentQty:25,contentUnit:'pieza'},
    {name:'Cuchara',category:'Desechables',unit:'pieza',purchaseUnit:'paquete',contentQty:100,contentUnit:'pieza'},
    {name:'Servilletas',category:'Desechables',unit:'pieza',purchaseUnit:'paquete',contentQty:120,contentUnit:'pieza'},
    {name:'Tostadas',category:'Desechables',unit:'pieza',purchaseUnit:'paquete',contentQty:22,contentUnit:'pieza'}
  ].forEach(ensureItem);

  localStorage.setItem(MIGRATION_KEY,'done');
}

migrateCatalog();

function removeOldPlan() {
  $('#purchasePlanSection')?.remove();
  try { localStorage.removeItem('panel-preparation-plan-v1'); } catch (_) {}
}

function presentationOptions(selected='') {
  return PRESENTATIONS.map(([label,values])=>`<optgroup label="${label}">${values.map(v=>`<option value="${v}" ${v===selected?'selected':''}>${v}</option>`).join('')}</optgroup>`).join('');
}

function unitOptions(selected='') {
  return CONTENT_UNITS.map(v=>`<option value="${v}" ${v===selected?'selected':''}>${v}</option>`).join('');
}

function itemOptions(selected='') {
  return InventoryStore.list().map(item=>`<option value="${item.id}" ${item.id===selected?'selected':''}>${item.name}</option>`).join('');
}

function selectedItem() {
  const id = $('#simplePurchaseProduct')?.value;
  return InventoryStore.list().find(item=>item.id===id) || null;
}

function questionFor(unit) {
  const map = {bolsa:'¿Cuántas bolsas?',caja:'¿Cuántas cajas?',paquete:'¿Cuántos paquetes?',botella:'¿Cuántas botellas?',lata:'¿Cuántas latas?',manojo:'¿Cuántos manojos?',charola:'¿Cuántas charolas?',bote:'¿Cuántos botes?',pieza:'¿Cuántas piezas?',lb:'¿Cuántas lb?',oz:'¿Cuántas oz?',kg:'¿Cuántos kg?',g:'¿Cuántos g?',L:'¿Cuántos L?',ml:'¿Cuántos ml?','fl oz':'¿Cuántas fl oz?','galón':'¿Cuántos galones?'};
  return map[unit] || 'Cantidad comprada';
}

function ensureModal() {
  if ($('#simplePurchaseModal')) return;
  const modal = document.createElement('div');
  modal.className = 'purchase-modal';
  modal.id = 'simplePurchaseModal';
  modal.hidden = true;
  modal.innerHTML = `
    <section class="purchase-sheet" role="dialog" aria-modal="true">
      <div class="modal-head"><div><small>NUEVA</small><h2>Compra</h2></div><button class="modal-close" id="closeSimplePurchase" type="button">×</button></div>
      <form id="simplePurchaseForm">
        <div class="purchase-form-section">
          <div class="purchase-form-grid">
            <label class="full">Producto<select id="simplePurchaseProduct" required></select></label>
            <label class="full">Presentación / cómo lo compras<select id="simplePurchasePresentation" required></select></label>
            <label class="full"><span id="simplePurchaseQtyLabel">Cantidad comprada</span><input id="simplePurchaseQty" type="number" min="0.01" step="0.01" inputmode="decimal" required></label>
            <div class="full" id="simpleContentBlock">
              <div class="purchase-form-grid">
                <label>Contenido de cada presentación<input id="simplePurchaseContentQty" type="number" min="0.01" step="0.01" inputmode="decimal" required></label>
                <label>Unidad<select id="simplePurchaseContentUnit" required></select></label>
              </div>
            </div>
            <label class="full"><span id="simplePurchasePriceLabel">Precio por presentación</span><input id="simplePurchasePrice" type="number" min="0" step="0.01" inputmode="decimal" required></label>
            <label class="full">Tienda <small style="text-transform:none">(opcional)</small><input id="simplePurchaseStore" placeholder="Walmart, H-E-B…"></label>
          </div>
          <div class="purchase-preview" id="simplePurchasePreview"></div>
        </div>
        <div class="purchase-modal-actions"><button class="cancel" id="cancelSimplePurchase" type="button">Cancelar</button><button class="save" type="submit">Agregar a inventario</button></div>
      </form>
    </section>`;
  document.body.appendChild(modal);

  $('#closeSimplePurchase').onclick = closeModal;
  $('#cancelSimplePurchase').onclick = closeModal;
  modal.addEventListener('click',e=>{ if(e.target===modal) closeModal(); });
  $('#simplePurchaseProduct').addEventListener('change',applyItemDefaults);
  $('#simplePurchasePresentation').addEventListener('change',applyPresentation);
  ['simplePurchaseQty','simplePurchaseContentQty','simplePurchaseContentUnit','simplePurchasePrice'].forEach(id=>$('#'+id)?.addEventListener('input',updatePreview));
  $('#simplePurchaseContentUnit').addEventListener('change',updatePreview);
  $('#simplePurchaseForm').addEventListener('submit',savePurchase);
}

function openModal(productId=null) {
  ensureModal();
  const form = $('#simplePurchaseForm');
  form.reset();
  $('#simplePurchaseProduct').innerHTML = `<option value="">Selecciona producto</option>${itemOptions(productId||'')}`;
  $('#simplePurchasePresentation').innerHTML = presentationOptions();
  $('#simplePurchaseContentUnit').innerHTML = unitOptions();
  if (productId) applyItemDefaults();
  else {
    $('#simplePurchasePresentation').value='bolsa';
    $('#simplePurchaseContentQty').value='1';
    $('#simplePurchaseContentUnit').value='pieza';
    applyPresentation();
  }
  $('#simplePurchaseModal').hidden=false;
  $('#purchaseModal') && ($('#purchaseModal').hidden=true);
  document.body.classList.add('modal-open');
}

function closeModal() {
  if ($('#simplePurchaseModal')) $('#simplePurchaseModal').hidden=true;
  document.body.classList.remove('modal-open');
}

function applyItemDefaults() {
  const item=selectedItem();
  if (!item) return;
  const presentation=item.purchaseUnit||item.unit||'pieza';
  $('#simplePurchasePresentation').innerHTML=presentationOptions(presentation);
  $('#simplePurchasePresentation').value=presentation;
  $('#simplePurchaseQty').value='1';
  $('#simplePurchaseContentQty').value=String(Number(item.contentQty||1));
  $('#simplePurchaseContentUnit').innerHTML=unitOptions(item.contentUnit||item.unit);
  $('#simplePurchaseContentUnit').value=item.contentUnit||item.unit||'pieza';
  $('#simplePurchasePrice').value=Number(item.purchasePrice||0)>0?String(Number(item.purchasePrice)) : '';
  applyPresentation(false);
}

function applyPresentation(resetContent=true) {
  const unit=$('#simplePurchasePresentation').value;
  $('#simplePurchaseQtyLabel').textContent=questionFor(unit);
  $('#simplePurchasePriceLabel').textContent=`Precio por ${unit}`;
  const direct=DIRECT_UNITS.has(unit);
  $('#simpleContentBlock').hidden=direct;
  if (direct && resetContent) {
    $('#simplePurchaseContentQty').value='1';
    if (CONTENT_UNITS.includes(unit)) $('#simplePurchaseContentUnit').value=unit;
  }
  updatePreview();
}

function updatePreview() {
  const item=selectedItem();
  const qty=Number($('#simplePurchaseQty')?.value||0);
  const presentation=$('#simplePurchasePresentation')?.value||'';
  const direct=DIRECT_UNITS.has(presentation);
  const contentQty=direct?1:Number($('#simplePurchaseContentQty')?.value||0);
  const contentUnit=direct?presentation:($('#simplePurchaseContentUnit')?.value||'');
  const price=Number($('#simplePurchasePrice')?.value||0);
  const box=$('#simplePurchasePreview');
  if (!box || !item) { if(box) box.innerHTML='Selecciona un producto.'; return; }

  const preview=purchasePreview(item,qty,presentation,contentQty,contentUnit);
  const perPresentation=convertQty(contentQty,contentUnit,item.unit);
  const unitCost=perPresentation && price>=0 ? price/perPresentation : null;
  const contentText=direct ? `${cleanNumber(qty)} ${presentation}` : `${cleanNumber(qty)} ${presentation}${qty===1?'':'s'} × ${cleanNumber(contentQty)} ${contentUnit}`;
  box.innerHTML=`
    <div class="purchase-preview-row"><span>Compra</span><strong>${contentText}</strong></div>
    <div class="purchase-preview-row"><span>Entra a inventario</span><strong>${preview.automatic?`+${cleanNumber(preview.stockAdded)} ${preview.stockUnit}`:'Revisa unidad/contenido'}</strong></div>
    <div class="purchase-preview-row"><span>Total pagado</span><strong>${money.format(Math.max(0,qty*price))}</strong></div>
    <div class="purchase-preview-row"><span>Costo real</span><strong>${unitCost!==null?`${money.format(unitCost)} / ${item.unit}`:'—'}</strong></div>`;
}

function savePurchase(event) {
  event.preventDefault();
  const item=selectedItem();
  if (!item) return;
  const presentation=$('#simplePurchasePresentation').value;
  const direct=DIRECT_UNITS.has(presentation);
  const result=registerPurchase({
    productId:item.id,
    productName:item.name,
    quantity:Number($('#simplePurchaseQty').value||0),
    unit:presentation,
    contentQty:direct?1:Number($('#simplePurchaseContentQty').value||0),
    contentUnit:direct?presentation:$('#simplePurchaseContentUnit').value,
    unitPrice:Number($('#simplePurchasePrice').value||0),
    store:$('#simplePurchaseStore').value.trim(),
    date:localDateISO()
  });
  if (!result.ok) return toast(result.error||'No se pudo registrar');
  closeModal();
  renderSimplePurchases();
  window.dispatchEvent(new CustomEvent('panel:inventory-changed',{detail:{source:'purchase'}}));
  const unitCost=InventoryStore.unitCost(result.item);
  toast(`Inventario +${cleanNumber(result.purchase.stockAdded)} ${result.purchase.stockUnit} · costo ${money.format(unitCost)}/${result.item.unit}`);
}

function localDateISO() {
  const now=new Date();
  return new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);
}

function toast(message) {
  const el=$('#toast');
  if(!el)return;
  el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2200);
}

function renderSimplePurchases() {
  const view=$('#purchasesView');
  if(!view)return;
  removeOldPlan();
  const today=PurchaseStore.today();
  const spend=today.reduce((sum,row)=>sum+Number(row.total||0),0);
  const rows=PurchaseStore.list().slice(0,20);
  view.innerHTML=`
    <div class="module-topbar">
      <button class="back-button" id="simplePurchasesBack" type="button">‹</button>
      <div><small>MÓDULO</small><h2>Compras</h2></div>
      <button class="new-order-button" id="simpleNewPurchase" type="button">＋ Compra</button>
    </div>
    <div class="purchase-kpis">
      <article class="purchase-kpi today"><small>Compras hoy</small><strong>${today.length}</strong></article>
      <article class="purchase-kpi spend"><small>Gasto hoy</small><strong>${money.format(spend)}</strong></article>
      <article class="purchase-kpi low"><small>Productos</small><strong>${InventoryStore.list().length}</strong></article>
    </div>
    <section class="purchase-section">
      <div class="purchase-section-title"><div><h3>Compras recientes</h3><small>Al registrar, se suma al inventario y se actualiza el costo real</small></div></div>
      <div class="purchase-history">${rows.length?rows.map(row=>{
        const item=InventoryStore.get(row.productId);
        const unitCost=item?InventoryStore.unitCost(item):0;
        const content=row.contentQty>0?` · ${cleanNumber(row.contentQty)} ${row.contentUnit} por ${row.unit}`:'';
        return `<article class="purchase-history-card"><div class="purchase-history-head"><div><span class="purchase-folio">${row.id}</span><h4>${row.productName}</h4></div><div class="purchase-total">${money.format(row.total)}</div></div><div class="purchase-meta"><div><small>Compraste</small><strong>${cleanNumber(row.quantity)} ${row.unit}</strong></div><div><small>Presentación</small><strong>${content?content.replace(' · ',''):'—'}</strong></div><div><small>Costo real</small><strong>${item?`${money.format(unitCost)} / ${item.unit}`:'—'}</strong></div></div><div class="purchase-stock-ok">✓ Inventario +${cleanNumber(row.stockAdded)} ${row.stockUnit}</div></article>`;
      }).join(''):'<div class="purchase-empty"><span>🛒</span><h4>Aún no hay compras</h4><p>Toca + Compra para meter lo que compraste.</p></div>'}</div>
    </section>`;
  $('#simplePurchasesBack').onclick=()=>{ location.href=location.pathname+location.search; };
  $('#simpleNewPurchase').onclick=()=>openModal();
}

function activateSimpleView() {
  const view=$('#purchasesView');
  if (!view || !view.classList.contains('active')) return;
  renderSimplePurchases();
}

// El módulo viejo puede intentar volver a insertar el plan; se elimina siempre.
new MutationObserver(()=>{
  removeOldPlan();
  if ($('#purchasesView')?.classList.contains('active') && !$('#simpleNewPurchase')) renderSimplePurchases();
}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});

// Captura accesos a Compras y a botones viejos de comprar.
document.addEventListener('click',event=>{
  const module=event.target.closest('[data-module="compras"]');
  if(module){ setTimeout(activateSimpleView,0); return; }
  const button=event.target.closest('#newPurchaseButton,[data-buy-product],[data-plan-buy-product]');
  if(button){
    event.preventDefault();
    event.stopPropagation();
    const productId=button.dataset.buyProduct||button.dataset.planBuyProduct||null;
    setTimeout(()=>openModal(productId),0);
  }
},true);

window.addEventListener('panel:open-purchase',event=>{
  event.stopImmediatePropagation?.();
  openModal(event.detail?.productId||null);
},true);

removeOldPlan();
ensureModal();
setTimeout(activateSimpleView,50);
