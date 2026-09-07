import { BUSINESS, PAYMENT_METHODS } from './config.js';
import { OrdersStore } from './data.js';
import { PurchaseStore } from './purchases-data.js';
import { ManualExpenseStore, localDateISO } from './money-data.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const money = new Intl.NumberFormat(BUSINESS.locale,{style:'currency',currency:BUSINESS.currency});
const EXPENSE_CATEGORIES = ['Insumos','Gasolina / transporte','Renta','Servicios','Mantenimiento','Comisiones','Otros'];
let moneyFilter = 'all';
let selectedCategory = 'Otros';
let selectedPayment = PAYMENT_METHODS[0] || 'Efectivo';

function deliveredToday(order) {
  if (order.status !== 'delivered') return false;
  if (order.deliveredAt) return localDateISO(order.deliveredAt) === localDateISO();
  return order.date === localDateISO();
}

function salesToday() {
  return OrdersStore.list().filter(deliveredToday);
}

function automaticExpensesToday() {
  return PurchaseStore.today();
}

function manualExpensesToday() {
  return ManualExpenseStore.today();
}

function totals() {
  const sales = salesToday();
  const salesTotal = sales.reduce((sum,row)=>sum + Number(row.total || 0),0);
  const pending = sales.filter(row=>row.paymentStatus !== 'paid').reduce((sum,row)=>sum + Number(row.total || 0),0);
  const purchases = automaticExpensesToday().reduce((sum,row)=>sum + Number(row.total || 0),0);
  const manual = manualExpensesToday().reduce((sum,row)=>sum + Number(row.amount || 0),0);
  const expenses = purchases + manual;
  return { salesTotal, expenses, result:salesTotal-expenses, pending };
}

function ensureAssets() {
  if (!document.querySelector('link[href="./money.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './money.css';
    document.head.appendChild(link);
  }

  if (!$('#moneyView')) {
    const section = document.createElement('section');
    section.className = 'view money-view';
    section.id = 'moneyView';
    section.dataset.view = 'dinero';
    section.innerHTML = `
      <div class="module-topbar">
        <button class="back-button" id="moneyBack" type="button">‹</button>
        <div><small>MÓDULO</small><h2>Dinero</h2></div>
        <button class="new-order-button" id="newExpenseButton" type="button">＋ Gasto</button>
      </div>
      <div class="money-kpis" id="moneyKpis"></div>
      <div class="money-tabs" id="moneyTabs">
        <button class="active" data-money-filter="all">Todos</button>
        <button data-money-filter="income">Ingresos</button>
        <button data-money-filter="expense">Gastos</button>
        <button data-money-filter="pending">Por cobrar</button>
      </div>
      <section class="money-section">
        <div class="money-section-head"><div><h3>Movimientos de hoy</h3><small>Pedidos, compras y gastos manuales</small></div></div>
        <div class="money-list" id="moneyList"></div>
      </section>`;
    document.querySelector('main.content')?.appendChild(section);
  }

  if (!$('#moneyExpenseModal')) {
    const modal = document.createElement('div');
    modal.className = 'money-modal';
    modal.id = 'moneyExpenseModal';
    modal.hidden = true;
    modal.innerHTML = `
      <section class="money-sheet" role="dialog" aria-modal="true">
        <div class="modal-head">
          <div><small>NUEVO</small><h2>Gasto</h2></div>
          <button class="modal-close" id="closeMoneyExpense" type="button">×</button>
        </div>
        <form id="moneyExpenseForm">
          <div class="money-form-section">
            <h3>Registrar gasto</h3>
            <div class="money-form-grid">
              <label class="full">Concepto<input id="moneyExpenseConcept" placeholder="Ej. Gasolina, hielo, reparación" required></label>
              <label>Monto<input id="moneyExpenseAmount" type="number" min="0.01" step="0.01" placeholder="0.00" required></label>
              <label>Fecha<input id="moneyExpenseDate" type="date" required></label>
              <label class="full">Nota<input id="moneyExpenseNote" placeholder="Opcional"></label>
            </div>
            <div class="money-choice-label">Categoría</div>
            <div class="money-choice-grid" id="moneyCategoryChoices"></div>
            <div class="money-choice-label">Pago</div>
            <div class="money-choice-grid" id="moneyPaymentChoices"></div>
          </div>
          <div class="money-modal-actions">
            <button class="cancel" id="cancelMoneyExpense" type="button">Cancelar</button>
            <button class="save" type="submit">Guardar gasto</button>
          </div>
        </form>
      </section>`;
    document.body.appendChild(modal);
  }
}

function kpiHtml() {
  const t = totals();
  return [
    ['Ventas hoy',money.format(t.salesTotal),'sales'],
    ['Gastos hoy',money.format(t.expenses),'expenses'],
    ['Resultado',money.format(t.result),`result ${t.result < 0 ? 'negative' : ''}`],
    ['Por cobrar',money.format(t.pending),'pending']
  ].map(([label,value,tone])=>`<article class="money-kpi ${tone}"><small>${label}</small><strong>${value}</strong></article>`).join('');
}

function movementRows() {
  const sales = salesToday().map(order=>({
    id:order.id,
    type:order.paymentStatus === 'paid' ? 'income' : 'pending',
    title:order.customer || 'Cliente',
    amount:Number(order.total || 0),
    label:order.paymentStatus === 'paid' ? 'Venta cobrada' : 'Venta por cobrar',
    meta:[order.payment || '—',order.time || '—',order.id],
    note:(order.items || []).map(item=>`${item.qty || 0} ${item.unit || ''} · ${item.name || 'Producto'}`).join(' · '),
    at:Number(order.deliveredAt || order.updatedAt || order.createdAt || 0)
  }));

  const purchases = automaticExpensesToday().map(row=>({
    id:row.id,
    type:'expense',
    title:row.productName || 'Compra',
    amount:Number(row.total || 0),
    label:'Compra de inventario',
    meta:[row.store || '—',`${row.quantity || 0} ${row.unit || ''}`,row.id],
    note:'Entró automáticamente desde Compras',
    at:Number(row.createdAt || 0)
  }));

  const manual = manualExpensesToday().map(row=>({
    id:row.id,
    type:'expense',
    title:row.concept,
    amount:Number(row.amount || 0),
    label:row.category || 'Gasto',
    meta:[row.payment || '—',row.category || 'Otros',row.id],
    note:row.note || 'Gasto registrado manualmente',
    at:Number(row.createdAt || 0)
  }));

  return [...sales,...purchases,...manual].sort((a,b)=>b.at-a.at);
}

function movementCard(row) {
  const sign = row.type === 'income' ? '+' : (row.type === 'pending' ? '' : '−');
  const amount = `${sign}${money.format(row.amount)}`;
  return `
    <article class="money-row ${row.type}">
      <div class="money-row-head">
        <div><small>${row.label}</small><h4>${row.title}</h4></div>
        <div class="money-amount">${amount}</div>
      </div>
      <div class="money-meta">
        <div><small>Pago / lugar</small><strong>${row.meta[0]}</strong></div>
        <div><small>Detalle</small><strong>${row.meta[1]}</strong></div>
        <div><small>Folio</small><strong>${row.meta[2]}</strong></div>
      </div>
      ${row.note ? `<div class="money-note">${row.note}</div>` : ''}
    </article>`;
}

function renderMoney() {
  if (!$('#moneyKpis') || !$('#moneyList')) return;
  $('#moneyKpis').innerHTML = kpiHtml();
  const rows = movementRows().filter(row=>moneyFilter === 'all' || row.type === moneyFilter);
  $('#moneyList').innerHTML = rows.length
    ? rows.map(movementCard).join('')
    : `<div class="money-empty"><span>🪙</span><h4>No hay movimientos aquí</h4><p>Los pedidos entregados y las compras aparecerán automáticamente.</p></div>`;
}

function openMoney() {
  ensureAssets();
  $$('.view').forEach(view=>view.classList.toggle('active',view.id === 'moneyView'));
  $('#hero')?.classList.remove('compact');
  $('#bottomNav')?.classList.add('hidden');
  if (location.hash !== '#dinero') history.replaceState(null,'','#dinero');
  renderMoney();
  window.scrollTo({top:0,behavior:'auto'});
}

function goHome() {
  const clean = location.pathname + location.search;
  location.href = clean;
}

function renderChoices() {
  $('#moneyCategoryChoices').innerHTML = EXPENSE_CATEGORIES.map(value=>`<button type="button" class="${value===selectedCategory?'active':''}" data-money-category="${value}">${value}</button>`).join('');
  $('#moneyPaymentChoices').innerHTML = PAYMENT_METHODS.map(value=>`<button type="button" class="${value===selectedPayment?'active':''}" data-money-payment="${value}">${value}</button>`).join('');
}

function openExpenseModal() {
  $('#moneyExpenseForm').reset();
  $('#moneyExpenseDate').value = localDateISO();
  selectedCategory = 'Otros';
  selectedPayment = PAYMENT_METHODS[0] || 'Efectivo';
  renderChoices();
  $('#moneyExpenseModal').hidden = false;
  document.body.classList.add('modal-open');
}

function closeExpenseModal() {
  $('#moneyExpenseModal').hidden = true;
  document.body.classList.remove('modal-open');
}

function showMoneyToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),1800);
}

function saveExpense(event) {
  event.preventDefault();
  const created = ManualExpenseStore.create({
    concept:$('#moneyExpenseConcept').value.trim(),
    amount:Number($('#moneyExpenseAmount').value || 0),
    category:selectedCategory,
    payment:selectedPayment,
    date:$('#moneyExpenseDate').value,
    note:$('#moneyExpenseNote').value.trim()
  });
  if (!created) return;
  closeExpenseModal();
  renderMoney();
  showMoneyToast('Gasto guardado');
}

ensureAssets();

document.addEventListener('click',event=>{
  const module = event.target.closest('[data-module="dinero"]');
  if (module) {
    event.preventDefault();
    event.stopImmediatePropagation();
    openMoney();
    return;
  }
  const category = event.target.closest('[data-money-category]');
  if (category) {
    selectedCategory = category.dataset.moneyCategory;
    renderChoices();
    return;
  }
  const payment = event.target.closest('[data-money-payment]');
  if (payment) {
    selectedPayment = payment.dataset.moneyPayment;
    renderChoices();
  }
},true);

$('#moneyBack')?.addEventListener('click',goHome);
$('#newExpenseButton')?.addEventListener('click',openExpenseModal);
$('#closeMoneyExpense')?.addEventListener('click',closeExpenseModal);
$('#cancelMoneyExpense')?.addEventListener('click',closeExpenseModal);
$('#moneyExpenseModal')?.addEventListener('click',event=>{if(event.target === $('#moneyExpenseModal')) closeExpenseModal();});
$('#moneyExpenseForm')?.addEventListener('submit',saveExpense);
$('#moneyTabs')?.addEventListener('click',event=>{
  const button = event.target.closest('[data-money-filter]');
  if (!button) return;
  moneyFilter = button.dataset.moneyFilter;
  $$('#moneyTabs button').forEach(item=>item.classList.toggle('active',item === button));
  renderMoney();
});

if (location.hash === '#dinero') openMoney();
