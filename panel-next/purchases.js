// Entrada única al módulo de Compras.
// La pantalla vieja fue retirada: este archivo solo crea el contenedor,
// abre el módulo y carga la versión definitiva una sola vez.

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function ensurePurchasesStyles() {
  if ([...document.styleSheets].some(sheet=>String(sheet.href||'').includes('/purchases.css'))) return;
  if (document.querySelector('link[data-purchases-style="1"]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './purchases.css?v=20260909-0200';
  link.dataset.purchasesStyle = '1';
  document.head.appendChild(link);
}

function ensurePurchasesView() {
  let view = $('#purchasesView');
  if (view) return view;

  view = document.createElement('section');
  view.className = 'view purchases-view';
  view.id = 'purchasesView';
  view.dataset.view = 'compras';
  document.querySelector('main.content')?.appendChild(view);
  return view;
}

function openPurchases() {
  ensurePurchasesStyles();
  const view = ensurePurchasesView();
  $$('.view').forEach(node => node.classList.toggle('active', node === view));
  $('#hero')?.classList.remove('compact');
  $('#bottomNav')?.classList.add('hidden');
  if (location.hash !== '#compras') history.replaceState(null,'','#compras');
  window.scrollTo({top:0,behavior:'auto'});
}

ensurePurchasesStyles();
ensurePurchasesView();

// Evita que app.js muestre la pantalla/mensaje genérico antes de Compras.
document.addEventListener('click', event => {
  const module = event.target.closest('[data-module="compras"]');
  if (!module) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  openPurchases();
}, true);

// Carga únicamente la pantalla definitiva de Compras.
import('./purchase-system-fix.js').then(() => {
  if (location.hash === '#compras') openPurchases();
});
