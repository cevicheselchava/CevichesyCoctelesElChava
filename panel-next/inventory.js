import { InventoryStore } from './data.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const money = new Intl.NumberFormat('es-US',{style:'currency',currency:'USD'});

const CATEGORIES = ['Ingrediente','Empaque','Bebida','Salsa / condimento','Desechable','Limpieza','Otro'];
const INVENTORY_UNITS = ['lb','oz','kg','g','pieza','unidad','ml','L','fl oz','galón','docena','otro'];
const PURCHASE_UNITS = ['bolsa','caja','paquete','pieza','unidad','botella','lata','galón','cubeta','rollo','costal','charola','otro'];

let inventoryFilter = 'all';
let inventoryQuery = '';
let editingInventoryId = null;
let adjustingInventoryId = null;

function options(values, placeholder = 'Seleccionar') {
  return `<option value="">${placeholder}</option>${values.map(value => `<option value="${value}">${value}</option>`).join('')}`;
}

function ensureOption(select, value) {
  if (!select || !value) return;
  if (![...select.options].some(option => option.value === value)) {
    select.insertAdjacentHTML('beforeend', `<option value="${value}">${value}</option>`);
  }
}

function ensureInventoryAssets() {
  if (!document.querySelector('link[href="./inventory.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './inventory.css';
    document.head.appendChild(link);
  }

  if (!$('#inventoryView')) {
    const section = document.createElement('section');
    section.className = 'view inventory-view';
    section.id = 'inventoryView';
    section.dataset.view = 'inventario';
    section.innerHTML = `
      <div class="module-topbar">
        <button class="back-button" id="inventoryBack" type="button">‹</button>
        <div><small>MÓDULO</small><h2>Inventario</h2></div>
        <button class="new-order-button" id="newInventoryButton" type="button">＋ Producto</button>
      </div>
      <div class="inventory-kpis" id="inventoryKpis"></div>
      <div class="inventory-toolbar">
        <label class="inventory-search">⌕ <input id="inventorySearch" type="search" placeholder="Buscar producto o categoría"></label>
        <select class="inventory-filter" id="inventoryFilter">
          <option value="all">Todos</option>
          <option value="low">Bajo mínimo</option>
          <option value="out">Agotados</option>
        </select>
      </div>
      <div class="inventory-list" id="inventoryList"></div>`;
    document.querySelector('main.content')?.appendChild(section);
  }

  if (!$('#inventoryModal')) {
    const modal = document.createElement('div');
    modal.className = 'inventory-modal';
    modal.id = 'inventoryModal';
    modal.hidden = true;
    modal.innerHTML = `
      <section class="inventory-sheet" role="dialog" aria-modal="true">
        <div class="modal-head">
          <div><small id="inventoryEyebrow">NUEVO</small><h2 id="inventoryModalTitle">Producto</h2></div>
          <button class="modal-close" id="closeInventoryModal" type="button">×</button>
        </div>
        <form id="inventoryForm">
          <div class="inventory-form-section">
            <h3>Inventario y receta</h3>
            <div class="inventory-form-grid">
              <label class="full">Producto<input id="inventoryName" required placeholder="Filete de pescado"></label>
              <label>Categoría<select id="inventoryCategory">${options(CATEGORIES,'Elige categoría')}</select></label>
              <label>Unidad de inventario<select id="inventoryUnit" required>${options(INVENTORY_UNITS,'Elige unidad')}</select></label>
              <label>Cantidad actual<input id="inventoryQty" type="number" min="0" step="0.01" required></label>
              <label>Stock mínimo<input id="inventoryMinimum" type="number" min="0" step="0.01" required></label>
            </div>
          </div>

          <div class="inventory-form-section purchase-presentation">
            <h3>Presentación de compra</h3>
            <div class="inventory-form-grid">
              <label>Unidad de compra<select id="inventoryPurchaseUnit" required>${options(PURCHASE_UNITS,'Elige presentación')}</select></label>
              <label>Contenido por unidad<input id="inventoryContentQty" type="number" min="0.01" step="0.01" required placeholder="2"></label>
              <label>Unidad del contenido<select id="inventoryContentUnit" required>${options(INVENTORY_UNITS,'Elige unidad')}</select></label>
              <label>Precio por unidad de compra<input id="inventoryPurchasePrice" type="number" min="0" step="0.01" placeholder="9.50"></label>
            </div>
            <div class="purchase-calculation" id="purchaseCalculation">Configura la presentación para calcular el costo real.</div>
          </div>

          <div class="inventory-modal-actions">
            <button class="cancel" id="cancelInventory" type="button">Cancelar</button>
            <button class="save" type="submit">Guardar</button>
          </div>
        </form>
      </section>`;
    document.body.appendChild(modal);
  }

  if (!$('#adjustInventoryModal')) {
    const modal = document.createElement('div');
    modal.className = 'adjust-modal';
    modal.id = 'adjustInventoryModal';
    modal.hidden = true;
    modal.innerHTML = `
      <section class="adjust-sheet" role="dialog" aria-modal="true">
        <div class="modal-head">
          <div><small>AJUSTAR</small><h2 id="adjustInventoryTitle">Inventario</h2></div>
          <button class="modal-close" id="closeAdjustInventory" type="button">×</button>
        </div>
        <form id="adjustInventoryForm">
          <div class="inventory-form-section">
            <h3>Nueva existencia</h3>
            <div class="adjust-current" id="adjustInventoryCurrent"></div>
            <div class="inventory-form-grid" style="margin-top:12px">
              <label class="full">Cantidad actualizada<input id="adjustInventoryQty" type="number" min="0" step="0.01" required></label>
            </div>
          </div>
          <div class="inventory-modal-actions">
            <button class="cancel" id="cancelAdjustInventory" type="button">Cancelar</button>
            <button class="save" type="submit">Guardar ajuste</button>
          </div>
        </form>
      </section>`;
    document.body.appendChild(modal);
  }
}

function statusFor(item) {
  const qty = Number(item.qty || 0);
  const minimum = Number(item.minimum || 0);
  if (qty <= 0) return ['Agotado','out'];
  if (qty <= minimum) return ['Bajo','low'];
  return ['Disponible','ok'];
}

function inventoryRows() {
  const q = inventoryQuery.trim().toLowerCase();
  return InventoryStore.list().filter(item => {
    const qty = Number(item.qty || 0);
    const min = Number(item.minimum || 0);
    if (inventoryFilter === 'low' && !(qty <= min && qty > 0)) return false;
    if (inventoryFilter === 'out' && qty > 0) return false;
    if (q && !`${item.name} ${item.category || ''} ${item.unit || ''} ${item.purchaseUnit || ''}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

function presentationText(item) {
  return `${item.purchaseUnit || item.unit || 'unidad'} de ${Number(item.contentQty || 1)} ${item.contentUnit || item.unit || ''}`;
}

function renderInventory() {
  if (!$('#inventoryKpis') || !$('#inventoryList')) return;
  const items = InventoryStore.list();
  const low = items.filter(item => Number(item.qty || 0) > 0 && Number(item.qty || 0) <= Number(item.minimum || 0)).length;
  const out = items.filter(item => Number(item.qty || 0) <= 0).length;
  const value = items.reduce((sum,item)=>sum + Number(item.qty || 0) * InventoryStore.unitCost(item),0);
  $('#inventoryKpis').innerHTML = [
    ['Productos',items.length,'total'],['Bajo mínimo',low,'low'],['Agotados',out,'out'],['Valor',money.format(value),'value']
  ].map(([label,value,tone])=>`<article class="inventory-kpi ${tone}"><small>${label}</small><strong>${value}</strong></article>`).join('');

  const rows = inventoryRows();
  $('#inventoryList').innerHTML = rows.length ? rows.map(item => {
    const [statusLabel,statusClass] = statusFor(item);
    const unitCost = InventoryStore.unitCost(item);
    return `
      <article class="inventory-card">
        <div class="inventory-card-head">
          <div><span class="inventory-category">${item.category || 'Sin categoría'}</span><h3>${item.name}</h3></div>
          <span class="inventory-status ${statusClass}">${statusLabel}</span>
        </div>
        <div class="inventory-stock">
          <div><small>Existencia</small><strong>${Number(item.qty || 0)} ${item.unit || ''}</strong></div>
          <div><small>Mínimo</small><strong>${Number(item.minimum || 0)} ${item.unit || ''}</strong></div>
          <div><small>Costo real</small><strong>${money.format(unitCost)} / ${item.unit || 'unidad'}</strong></div>
        </div>
        <div class="purchase-strip">
          <div><small>Se compra por</small><strong>${presentationText(item)}</strong></div>
          <div><small>Precio de compra</small><strong>${money.format(Number(item.purchasePrice || 0))} / ${item.purchaseUnit || item.unit || 'unidad'}</strong></div>
        </div>
        <div class="inventory-card-actions">
          <button class="inventory-action edit" data-inventory-action="edit" data-id="${item.id}" type="button">Editar</button>
          <button class="inventory-action adjust" data-inventory-action="adjust" data-id="${item.id}" type="button">Ajustar</button>
        </div>
      </article>`;
  }).join('') : `<div class="inventory-empty"><span>📦</span><h3>No hay productos aquí</h3><p>Agrega un producto o cambia el filtro.</p></div>`;
}

function openInventory() {
  ensureInventoryAssets();
  $$('.view').forEach(view => view.classList.toggle('active', view.id === 'inventoryView'));
  $('#hero')?.classList.remove('compact');
  $('#bottomNav')?.classList.add('hidden');
  if (location.hash !== '#inventario') history.replaceState(null,'','#inventario');
  renderInventory();
  window.scrollTo({top:0,behavior:'auto'});
}

function goHome() {
  const clean = location.pathname + location.search;
  location.href = clean;
}

function updatePurchaseCalculation() {
  const purchaseUnit = $('#inventoryPurchaseUnit')?.value || 'unidad';
  const contentQty = Number($('#inventoryContentQty')?.value || 0);
  const contentUnit = $('#inventoryContentUnit')?.value || $('#inventoryUnit')?.value || 'unidad';
  const purchasePriceRaw = $('#inventoryPurchasePrice')?.value;
  const purchasePrice = purchasePriceRaw === '' ? null : Number(purchasePriceRaw);
  const box = $('#purchaseCalculation');
  if (!box) return;
  if (!contentQty || contentQty <= 0) {
    box.textContent = 'Configura la presentación para calcular el costo real.';
    return;
  }
  const base = `1 ${purchaseUnit} = ${contentQty} ${contentUnit}`;
  if (purchasePrice === null || !Number.isFinite(purchasePrice)) {
    box.textContent = base;
    return;
  }
  box.innerHTML = `${base} · <strong>${money.format(purchasePrice)} por ${purchaseUnit}</strong> · Costo real <strong>${money.format(purchasePrice / contentQty)} / ${contentUnit}</strong>`;
}

function syncContentUnit() {
  const inventoryUnit = $('#inventoryUnit')?.value;
  const contentUnit = $('#inventoryContentUnit');
  if (inventoryUnit && contentUnit && !contentUnit.value) contentUnit.value = inventoryUnit;
  updatePurchaseCalculation();
}

function openInventoryModal(id = null) {
  editingInventoryId = id;
  $('#inventoryForm').reset();
  if (id) {
    const item = InventoryStore.get(id);
    if (!item) return;
    $('#inventoryEyebrow').textContent = 'EDITAR';
    $('#inventoryModalTitle').textContent = item.name;
    $('#inventoryName').value = item.name || '';
    ensureOption($('#inventoryCategory'), item.category);
    $('#inventoryCategory').value = item.category || '';
    ensureOption($('#inventoryUnit'), item.unit);
    $('#inventoryUnit').value = item.unit || '';
    $('#inventoryQty').value = item.qty ?? 0;
    $('#inventoryMinimum').value = item.minimum ?? 0;
    ensureOption($('#inventoryPurchaseUnit'), item.purchaseUnit || item.unit);
    $('#inventoryPurchaseUnit').value = item.purchaseUnit || item.unit || '';
    $('#inventoryContentQty').value = item.contentQty ?? 1;
    ensureOption($('#inventoryContentUnit'), item.contentUnit || item.unit);
    $('#inventoryContentUnit').value = item.contentUnit || item.unit || '';
    $('#inventoryPurchasePrice').value = item.purchasePrice ?? '';
  } else {
    $('#inventoryEyebrow').textContent = 'NUEVO';
    $('#inventoryModalTitle').textContent = 'Producto';
    $('#inventoryQty').value = '0';
    $('#inventoryMinimum').value = '0';
    $('#inventoryContentQty').value = '1';
  }
  updatePurchaseCalculation();
  $('#inventoryModal').hidden = false;
  document.body.classList.add('modal-open');
}

function closeInventoryModal() {
  $('#inventoryModal').hidden = true;
  editingInventoryId = null;
  document.body.classList.remove('modal-open');
}

function openAdjustModal(id) {
  const item = InventoryStore.get(id);
  if (!item) return;
  adjustingInventoryId = id;
  $('#adjustInventoryTitle').textContent = item.name;
  $('#adjustInventoryCurrent').innerHTML = `Existencia actual: <strong>${Number(item.qty || 0)} ${item.unit || ''}</strong>`;
  $('#adjustInventoryQty').value = item.qty ?? 0;
  $('#adjustInventoryModal').hidden = false;
  document.body.classList.add('modal-open');
}

function closeAdjustModal() {
  $('#adjustInventoryModal').hidden = true;
  adjustingInventoryId = null;
  document.body.classList.remove('modal-open');
}

function toast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),1600);
}

ensureInventoryAssets();

document.addEventListener('click', event => {
  const module = event.target.closest('[data-module="inventario"]');
  if (module) {
    event.preventDefault();
    event.stopImmediatePropagation();
    openInventory();
    return;
  }
  const action = event.target.closest('[data-inventory-action]');
  if (!action) return;
  event.preventDefault();
  if (action.dataset.inventoryAction === 'edit') openInventoryModal(action.dataset.id);
  if (action.dataset.inventoryAction === 'adjust') openAdjustModal(action.dataset.id);
}, true);

$('#inventoryBack')?.addEventListener('click',goHome);
$('#newInventoryButton')?.addEventListener('click',()=>openInventoryModal());
$('#closeInventoryModal')?.addEventListener('click',closeInventoryModal);
$('#cancelInventory')?.addEventListener('click',closeInventoryModal);
$('#inventoryModal')?.addEventListener('click',event=>{ if (event.target === $('#inventoryModal')) closeInventoryModal(); });
$('#closeAdjustInventory')?.addEventListener('click',closeAdjustModal);
$('#cancelAdjustInventory')?.addEventListener('click',closeAdjustModal);
$('#adjustInventoryModal')?.addEventListener('click',event=>{ if (event.target === $('#adjustInventoryModal')) closeAdjustModal(); });

$('#inventorySearch')?.addEventListener('input',event=>{ inventoryQuery = event.target.value; renderInventory(); });
$('#inventoryFilter')?.addEventListener('change',event=>{ inventoryFilter = event.target.value; renderInventory(); });
$('#inventoryUnit')?.addEventListener('change',syncContentUnit);
['inventoryPurchaseUnit','inventoryContentQty','inventoryContentUnit','inventoryPurchasePrice'].forEach(id => {
  $(`#${id}`)?.addEventListener('input',updatePurchaseCalculation);
  $(`#${id}`)?.addEventListener('change',updatePurchaseCalculation);
});

$('#inventoryForm')?.addEventListener('submit',event=>{
  event.preventDefault();
  const wasEditing = Boolean(editingInventoryId);
  const payload = {
    name:$('#inventoryName').value.trim(),
    category:$('#inventoryCategory').value,
    unit:$('#inventoryUnit').value,
    qty:Number($('#inventoryQty').value || 0),
    minimum:Number($('#inventoryMinimum').value || 0),
    purchaseUnit:$('#inventoryPurchaseUnit').value,
    contentQty:Number($('#inventoryContentQty').value || 0),
    contentUnit:$('#inventoryContentUnit').value,
    purchasePrice:$('#inventoryPurchasePrice').value === '' ? 0 : Number($('#inventoryPurchasePrice').value)
  };
  if (!payload.name || !payload.unit || !payload.purchaseUnit || !payload.contentUnit || !Number.isFinite(payload.qty) || !Number.isFinite(payload.minimum) || !Number.isFinite(payload.contentQty) || payload.contentQty <= 0) return;
  if (editingInventoryId) InventoryStore.update(editingInventoryId,payload);
  else InventoryStore.create(payload);
  closeInventoryModal();
  renderInventory();
  toast(wasEditing ? 'Producto actualizado' : 'Producto agregado');
});

$('#adjustInventoryForm')?.addEventListener('submit',event=>{
  event.preventDefault();
  if (!adjustingInventoryId) return;
  const qty = Number($('#adjustInventoryQty').value);
  if (!Number.isFinite(qty) || qty < 0) return;
  InventoryStore.adjust(adjustingInventoryId,qty);
  closeAdjustModal();
  renderInventory();
  toast('Inventario actualizado');
});

if (location.hash === '#inventario') openInventory();
