import { InventoryStore } from './data.js';

const PURCHASE_KEY = 'panel-next-purchases-v1';

function todayISO() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0,10);
}

function norm(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .trim()
    .toLowerCase();
}

function readRows() {
  try {
    const raw = localStorage.getItem(PURCHASE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeRows(rows) {
  localStorage.setItem(PURCHASE_KEY, JSON.stringify(rows));
}

function syncLatestTodayForItem(item) {
  if (!item) return false;
  const price = Number(item.purchasePrice || 0);
  if (!(price >= 0)) return false;

  const rows = readRows();
  const today = todayISO();
  const index = rows.findIndex(row =>
    String(row.date || '') === today &&
    (String(row.productId || '') === String(item.id || '') || norm(row.productName) === norm(item.name))
  );
  if (index < 0) return false;

  const row = rows[index];
  const samePresentation = String(row.unit || '') === String(item.purchaseUnit || item.unit || '');
  const sameContentUnit = String(row.contentUnit || '') === String(item.contentUnit || item.unit || '');
  const sameContentQty = Math.abs(Number(row.contentQty || 0) - Number(item.contentQty || 0)) < 0.0001;
  if (!samePresentation || !sameContentUnit || !sameContentQty) return false;

  const newTotal = Number(row.quantity || 0) * price;
  if (Math.abs(Number(row.unitPrice || 0) - price) < 0.0001 && Math.abs(Number(row.total || 0) - newTotal) < 0.0001) return false;

  rows[index] = {
    ...row,
    unitPrice:price,
    total:newTotal,
    correctedFromInventory:true,
    correctedAt:Date.now()
  };
  writeRows(rows);
  window.dispatchEvent(new CustomEvent('panel:purchases-changed',{detail:{source:'inventory-price-correction',purchaseId:row.id}}));
  return true;
}

function syncTodayFromInventory() {
  InventoryStore.list().forEach(syncLatestTodayForItem);
}

// Corrige también compras de hoy que ya se habían capturado antes de instalar este ajuste.
setTimeout(syncTodayFromInventory, 700);

// Cuando se edita un producto en Inventario, refleja el precio nuevo en la compra más reciente de hoy.
document.addEventListener('submit', event => {
  if (event.target?.id !== 'inventoryForm') return;
  const productName = document.querySelector('#inventoryName')?.value?.trim() || '';
  setTimeout(() => {
    const item = InventoryStore.list().find(row => norm(row.name) === norm(productName));
    if (syncLatestTodayForItem(item)) {
      const toast = document.querySelector('#toast');
      if (toast) {
        toast.textContent = 'Precio corregido también en Compras';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 1800);
      }
    }
  }, 50);
}, true);
