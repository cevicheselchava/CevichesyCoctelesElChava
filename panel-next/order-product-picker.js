import { OrdersStore, MenuStore } from './data.js';
import { RecipeStore } from './recipes-data.js';

const $ = selector => document.querySelector(selector);

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .trim()
    .toLowerCase();
}

function productNames() {
  const map = new Map();

  MenuStore.list().forEach(item => {
    const name = String(item?.name || '').trim();
    if (name) map.set(normalize(name), name);
  });

  RecipeStore.list()
    .filter(recipe => String(recipe?.type || '').trim().toLowerCase() === 'producto final')
    .forEach(recipe => {
      const name = String(recipe?.menuItem || recipe?.name || '').trim();
      if (name && !map.has(normalize(name))) map.set(normalize(name), name);
    });

  return [...map.values()].sort((a,b)=>a.localeCompare(b,'es'));
}

function populatePicker(select, selectedValue = '') {
  if (!select) return;
  const selected = String(selectedValue || select.value || '').trim();
  const names = productNames();

  select.innerHTML = '';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = names.length ? 'Selecciona un producto' : 'No hay productos configurados';
  select.appendChild(placeholder);

  names.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });

  if (selected && !names.some(name => normalize(name) === normalize(selected))) {
    const option = document.createElement('option');
    option.value = selected;
    option.textContent = selected;
    select.appendChild(option);
  }

  select.value = selected || '';
}

function ensureProductPicker() {
  const current = $('#orderProductName');
  if (!current) return null;

  if (current.tagName === 'SELECT') {
    populatePicker(current);
    return current;
  }

  const select = document.createElement('select');
  select.id = 'orderProductName';
  select.required = true;
  select.setAttribute('aria-label','Producto');
  current.replaceWith(select);
  populatePicker(select);
  return select;
}

function updatePreview() {
  const host = $('#orderPreview');
  if (!host) return;
  const name = $('#orderProductName')?.value?.trim() || 'Producto';
  const unit = $('#orderUnit')?.value?.trim() || '';
  const qty = Number($('#orderQty')?.value || 0);
  const rawPrice = $('#orderPrice')?.value ?? '';
  const priceText = rawPrice === '' ? 'Precio pendiente' : `$${(qty * Number(rawPrice || 0)).toFixed(2)}`;
  host.innerHTML = `<span>${qty || 0} ${unit} · ${name}</span><strong>${priceText}</strong>`;
}

function clearProductDetails() {
  const qty = $('#orderQty');
  const unit = $('#orderUnit');
  const price = $('#orderPrice');
  if (qty) qty.value = '';
  if (unit) unit.value = '';
  if (price) price.value = '';
  updatePreview();
}

function prepareNewOrder() {
  const select = ensureProductPicker();
  populatePicker(select,'');
  if (select) select.value = '';
  clearProductDetails();
}

function prepareEditOrder(id) {
  const order = OrdersStore.get(id);
  const item = order?.items?.[0] || null;
  const select = ensureProductPicker();
  populatePicker(select,item?.name || '');
  if (select) select.value = item?.name || '';
  updatePreview();
}

setTimeout(ensureProductPicker,0);

document.addEventListener('change', event => {
  if (event.target?.id !== 'orderProductName') return;
  // Elegir un producto solo cambia el producto. Cantidad, unidad y precio quedan como estén.
  updatePreview();
});

document.addEventListener('click', event => {
  if (event.target.closest('#newOrderButton')) {
    setTimeout(prepareNewOrder,0);
    return;
  }

  const edit = event.target.closest('[data-order-action="edit"]');
  if (edit) setTimeout(()=>prepareEditOrder(edit.dataset.id),0);
});
