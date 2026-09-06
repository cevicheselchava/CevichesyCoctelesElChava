import { BUSINESS, MODULES, HOME_SUMMARY } from './config.js';

const $ = (selector, root = document) => root.querySelector(selector);

function applyBrand() {
  document.documentElement.style.setProperty('--brand-logo', `url("${BUSINESS.watermark}")`);
  $('#brandLogo').src = BUSINESS.logo;
  $('#panelTitle').textContent = BUSINESS.panelTitle;
  $('#sideSlogan').innerHTML = BUSINESS.sideSlogan.replace('\n', '<br>');
  $('#footerSlogan').innerHTML = BUSINESS.footerSlogan.replace('\n', '<br>');
  $('#footerTag').innerHTML = BUSINESS.footerTag.replace('\n', '<br>');
}

function moduleCard(module) {
  const badge = module.badge ? `<span class="module-badge">${module.badge}</span>` : '';
  const extra = module.wide ? '<span class="recipe-tagline">El Sabor<br>de un Buen Día</span>' : '';
  return `
    <button class="module-card ${module.color} ${module.wide ? 'wide' : ''}" data-module="${module.id}" type="button">
      ${badge}
      <span class="module-icon" aria-hidden="true">${module.icon}</span>
      <span class="module-copy">
        <strong>${module.label}</strong>
        <small>${module.subtitle}</small>
      </span>
      ${extra}
    </button>
  `;
}

function summaryCard(item) {
  return `
    <article class="summary-card ${item.tone}">
      <span class="summary-icon">${item.icon}</span>
      <strong>${item.value}</strong>
      <b>${item.label}</b>
      <small>${item.note}</small>
    </article>
  `;
}

function renderHome() {
  $('#moduleGrid').innerHTML = MODULES.map(moduleCard).join('');
  $('#summaryGrid').innerHTML = HOME_SUMMARY.map(summaryCard).join('');

  const date = new Intl.DateTimeFormat('es-MX', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date());
  $('#todayDate').textContent = date.replace('.', '');
}

function bindInteractions() {
  document.addEventListener('click', (event) => {
    const card = event.target.closest('[data-module]');
    if (!card) return;
    const module = MODULES.find(item => item.id === card.dataset.module);
    if (!module) return;
    window.location.hash = module.id;
    showToast(`${module.label}: siguiente módulo por construir`);
  });

  $('#menuButton').addEventListener('click', () => showToast('Menú general'));
  $('#bellButton').addEventListener('click', () => showToast('3 notificaciones'));

  document.querySelectorAll('.bottom-nav button').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.bottom-nav button').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      if (button.dataset.nav !== 'inicio') showToast(`${button.textContent.trim()}: módulo pendiente`);
    });
  });
}

let toastTimer;
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

applyBrand();
renderHome();
bindInteractions();
