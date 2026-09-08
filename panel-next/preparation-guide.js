import { recipePlanForItem } from './recipe-engine.js';

function formatAmount(ingredient) {
  if (ingredient.fixed === false) return 'Al gusto';
  const qty = Number(ingredient.qty || 0);
  const shown = Number.isInteger(qty) ? qty : Math.round(qty * 100) / 100;
  return `${shown} ${ingredient.unit || ''}`.trim();
}

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function preparationSteps(productName) {
  const name = normalize(productName);
  if (!name.includes('ceviche')) return [];

  const steps = [];
  if (name.includes('pescado') || name.includes('mixto')) {
    steps.push('Cocer el pescado y dejarlo enfriar por completo.');
  }
  if (name.includes('camaron') || name.includes('mixto')) {
    steps.push('Cocer el camarón y dejarlo enfriar por completo.');
  }
  if (name.includes('pulpo')) {
    steps.push('Tener el pulpo cocido y frío.');
  }
  steps.push('Picar tomate, pepino, cebolla morada y cilantro.');
  steps.push('Mezclar los mariscos con las verduras.');
  steps.push('Agregar el jugo de limón y el Clamato.');
  steps.push('Mezclar bien, porcionar y mantener refrigerado.');
  return steps;
}

function ensureStyles() {
  if (document.getElementById('prepGuideStyles')) return;
  const style = document.createElement('style');
  style.id = 'prepGuideStyles';
  style.textContent = `
    .prep-guide{margin-top:12px;border:1px solid #e2e8e4;border-radius:16px;background:#fff;overflow:hidden}
    .prep-guide-section{padding:15px 16px}.prep-guide-section + .prep-guide-section{border-top:1px solid #e7ece9}
    .prep-guide-title{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:10px}
    .prep-guide-title strong{font-size:18px;color:#1d2923}.prep-guide-title small{font-size:12px;color:#6b776f;font-weight:800}
    .prep-guide-ingredients{display:grid;gap:7px}.prep-guide-ingredient{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:10px 12px;border-radius:11px;background:#f5f7f6}
    .prep-guide-ingredient span{font-size:15px;color:#354139}.prep-guide-ingredient strong{font-size:16px;color:#111;white-space:nowrap}
    .prep-guide-procedure{background:#fffaf0}.prep-guide-procedure ol{margin:0;padding-left:24px;display:grid;gap:9px}.prep-guide-procedure li{padding-left:3px;font-size:15px;line-height:1.35;color:#303933}
    @media(max-width:720px){.prep-guide-section{padding:14px}.prep-guide-title strong{font-size:17px}.prep-guide-ingredient{padding:10px}.prep-guide-ingredient span{font-size:14px}.prep-guide-ingredient strong{font-size:15px}.prep-guide-procedure li{font-size:14px}}
  `;
  document.head.appendChild(style);
}

function enhanceRow(row) {
  const input = row.querySelector('[data-prep-plan-key]');
  const plannedQty = Number(input?.value || 0);
  const productName = row.querySelector('.prep-plan-product strong')?.textContent?.trim() || '';
  const unit = row.querySelector('.prep-plan-product small')?.textContent?.trim() || '';

  const oldPreview = row.querySelector('.prep-plan-recipe');
  if (!(plannedQty > 0) || !productName) {
    oldPreview?.remove();
    return;
  }

  const plan = recipePlanForItem({
    name: productName,
    qty: plannedQty,
    unit,
    recipeQty: plannedQty,
    recipeUnit: unit
  });
  if (!plan.recipe || !plan.compatible) return;

  const ingredients = plan.ingredients.map(ingredient => `
    <div class="prep-guide-ingredient">
      <span>${ingredient.name}</span>
      <strong>${formatAmount(ingredient)}</strong>
    </div>`).join('');

  const steps = preparationSteps(productName);
  const procedure = steps.length ? `
    <div class="prep-guide-section prep-guide-procedure">
      <div class="prep-guide-title"><strong>Preparación</strong><small>${plannedQty} ${unit}</small></div>
      <ol>${steps.map(step => `<li>${step}</li>`).join('')}</ol>
    </div>` : '';

  const guide = document.createElement('div');
  guide.className = 'prep-guide';
  guide.innerHTML = `
    <div class="prep-guide-section">
      <div class="prep-guide-title"><strong>Ingredientes</strong><small>Para ${plannedQty} ${unit}</small></div>
      <div class="prep-guide-ingredients">${ingredients}</div>
    </div>
    ${procedure}`;

  oldPreview?.replaceWith(guide);
  if (!oldPreview) row.appendChild(guide);
}

function enhancePreparation() {
  ensureStyles();
  document.querySelectorAll('.prep-plan-row').forEach(enhanceRow);
}

function scheduleEnhance() {
  setTimeout(enhancePreparation, 40);
  setTimeout(enhancePreparation, 180);
}

document.addEventListener('click', event => {
  if (event.target.closest('[data-module="preparacion"]')) scheduleEnhance();
}, true);

document.addEventListener('change', event => {
  if (event.target.closest('[data-prep-plan-key]')) scheduleEnhance();
});

window.addEventListener('panel:orders-changed', scheduleEnhance);
window.addEventListener('hashchange', () => {
  if (location.hash === '#preparacion') scheduleEnhance();
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scheduleEnhance, { once:true });
} else {
  scheduleEnhance();
}
