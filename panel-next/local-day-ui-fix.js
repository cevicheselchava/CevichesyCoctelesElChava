import { OrdersStore } from './data.js';

function localDateISO(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0,10);
}

function todayRows() {
  const today = localDateISO();
  return OrdersStore.list().filter(order => String(order.date || '') === today);
}

function money(value) {
  return new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(Number(value || 0));
}

function patchOrderKpis() {
  const cards = [...document.querySelectorAll('#orderKpis .order-kpi')];
  if (cards.length < 4) return;

  const rows = todayRows();
  const pending = rows.filter(order => order.status === 'pending').length;
  const ready = rows.filter(order => order.status === 'ready').length;
  const sales = rows
    .filter(order => order.status === 'delivered')
    .reduce((sum, order) => sum + Number(order.total || 0), 0);
  const values = [String(pending), String(rows.length), String(ready), money(sales)];

  cards.forEach((card,index) => {
    const strong = card.querySelector('strong');
    if (strong && strong.textContent !== values[index]) strong.textContent = values[index];
  });
}

function patchHomeSummary() {
  const cards = [...document.querySelectorAll('#summaryGrid .summary-card')];
  if (cards.length < 4) return;

  const rows = todayRows();
  const preparing = rows.filter(order => ['pending','preparing'].includes(order.status)).length;
  const sales = rows
    .filter(order => order.status === 'delivered')
    .reduce((sum, order) => sum + Number(order.total || 0), 0);
  const values = [String(rows.length), `${preparing} ${preparing === 1 ? 'pedido' : 'pedidos'}`, null, money(sales)];

  cards.forEach((card,index) => {
    if (values[index] === null) return;
    const strong = card.querySelector('strong');
    if (strong && strong.textContent !== values[index]) strong.textContent = values[index];
  });
}

function patchLocalDayUi() {
  patchOrderKpis();
  patchHomeSummary();
}

let scheduled = false;
function schedulePatch() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    patchLocalDayUi();
  });
}

document.addEventListener('click', event => {
  if (!event.target.closest('#newOrderButton')) return;
  setTimeout(() => {
    const input = document.querySelector('#orderDate');
    if (input) input.value = localDateISO();
  }, 0);
}, true);

const observer = new MutationObserver(schedulePatch);
observer.observe(document.documentElement, { childList:true, subtree:true });

window.addEventListener('panel:orders-changed', schedulePatch);
window.addEventListener('hashchange', schedulePatch);
requestAnimationFrame(patchLocalDayUi);
