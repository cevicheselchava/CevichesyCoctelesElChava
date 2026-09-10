import './photo-inventory.js';

// Entrada única al módulo de Compras.
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function ensurePurchasesStyles() {
  if ([...document.styleSheets].some(sheet=>String(sheet.href||'').includes('/purchases.css'))) return;
  if (document.querySelector('link[data-purchases-style="1"]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './purchases.css?v=20260909-2000';
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

document.addEventListener('click', event => {
  const module = event.target.closest('[data-module="compras"]');
  if (!module) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  openPurchases();
}, true);

import('./purchase-system-v4.js?v=20260909-2000').then(() => import('./purchase-ui-cleanup.js?v=20260909-2355')).then(() => {
  if (location.hash === '#compras') openPurchases();
});
