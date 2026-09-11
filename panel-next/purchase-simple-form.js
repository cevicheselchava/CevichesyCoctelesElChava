const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];

function option(value,label,selected=false) {
  return `<option value="${String(value || '').replace(/"/g,'&quot;')}" ${selected?'selected':''}>${label}</option>`;
}

function ensureShell() {
  const form = $('#simplePurchaseForm');
  const section = form?.querySelector('.purchase-button-form');
  if (!form || !section) return null;
  let shell = $('#purchaseSimpleSelectors');
  if (!shell) {
    shell = document.createElement('div');
    shell.id = 'purchaseSimpleSelectors';
    shell.className = 'purchase-simple-selectors';
    shell.innerHTML = `
      <label>Categoría<select id="purchaseSimpleCategory"></select></label>
      <label>Producto<select id="purchaseSimpleProduct"></select></label>
      <label>Presentación<select id="purchaseSimplePresentation"></select></label>`;
    section.prepend(shell);

    $('#purchaseSimpleCategory').addEventListener('change',event=>{
      const button = $(`[data-purchase-category="${CSS.escape(event.target.value)}"]`);
      button?.click();
      requestAnimationFrame(syncSelectors);
    });
    $('#purchaseSimpleProduct').addEventListener('change',event=>{
      const button = $(`[data-purchase-product="${CSS.escape(event.target.value)}"]`);
      button?.click();
      requestAnimationFrame(syncSelectors);
    });
    $('#purchaseSimplePresentation').addEventListener('change',event=>{
      const button = $(`[data-purchase-presentation="${CSS.escape(event.target.value)}"]`);
      button?.click();
      requestAnimationFrame(syncSelectors);
    });
  }
  return shell;
}

function syncSelectors() {
  const shell = ensureShell();
  if (!shell) return;

  const category = $('#purchaseSimpleCategory');
  const product = $('#purchaseSimpleProduct');
  const presentation = $('#purchaseSimplePresentation');
  const selectedProduct = $('#simplePurchaseProduct')?.value || '';
  const selectedPresentation = $('#simplePurchasePresentation')?.value || '';

  const categoryButtons = $$('#purchaseCategoryButtons [data-purchase-category]');
  category.innerHTML = categoryButtons.map(button=>option(button.dataset.purchaseCategory,button.textContent.trim(),button.classList.contains('active'))).join('');

  const productButtons = $$('#purchaseProductButtons [data-purchase-product]');
  product.innerHTML = productButtons.length
    ? `<option value="">Selecciona producto</option>${productButtons.map(button=>option(button.dataset.purchaseProduct,button.textContent.trim(),button.dataset.purchaseProduct===selectedProduct)).join('')}`
    : '<option value="">Sin productos</option>';
  product.value = selectedProduct;

  const presentationButtons = $$('#purchasePresentationButtons [data-purchase-presentation]');
  presentation.innerHTML = presentationButtons.length
    ? presentationButtons.map(button=>option(button.dataset.purchasePresentation,button.textContent.trim(),button.dataset.purchasePresentation===selectedPresentation)).join('')
    : '<option value="">Selecciona presentación</option>';
  presentation.value = selectedPresentation;

  const contentBlock = $('#simpleContentBlock');
  if (contentBlock && !contentBlock.hidden) {
    let select = $('#purchaseSimpleContentUnit');
    if (!select) {
      select = document.createElement('select');
      select.id = 'purchaseSimpleContentUnit';
      select.addEventListener('change',event=>{
        const button = $(`[data-purchase-content-unit="${CSS.escape(event.target.value)}"]`);
        button?.click();
      });
      contentBlock.appendChild(select);
    }
    const selectedUnit = $('#simplePurchaseContentUnit')?.value || '';
    const unitButtons = $$('#purchaseContentUnitButtons [data-purchase-content-unit]');
    select.innerHTML = unitButtons.map(button=>option(button.dataset.purchaseContentUnit,button.textContent.trim(),button.dataset.purchaseContentUnit===selectedUnit)).join('');
    select.value = selectedUnit;
  }
}

function installStyles() {
  if ($('#purchaseSimpleFormStyles')) return;
  const style = document.createElement('style');
  style.id = 'purchaseSimpleFormStyles';
  style.textContent = `
    #simplePurchaseModal .purchase-choice-label,
    #simplePurchaseModal #purchaseCategoryButtons,
    #simplePurchaseModal #purchaseProductButtons,
    #simplePurchaseModal #purchasePresentationButtons,
    #simplePurchaseModal #purchaseContentUnitButtons{display:none!important}
    .purchase-simple-selectors{display:grid;gap:10px}
    .purchase-simple-selectors label{display:grid;gap:6px;font-size:13px;font-weight:1000;color:#536159}
    .purchase-simple-selectors select,#purchaseSimpleContentUnit{width:100%;min-height:54px;border:2px solid #d7e1dc;border-radius:10px;background:#fff;padding:10px 12px;font-size:18px;font-weight:900;color:#1f2c25}
    #simplePurchaseModal .purchase-button-form{gap:10px!important}
    #simplePurchaseModal .purchase-content-block{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:end}
    #simplePurchaseModal .purchase-content-block[hidden]{display:none!important}
    #simplePurchaseModal .purchase-content-block label{margin:0}
    #simplePurchaseModal .purchase-store-label{margin-top:2px}
    #simplePurchaseModal .purchase-preview{margin-top:2px}
    @media(max-width:560px){#simplePurchaseModal .purchase-content-block{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
}

installStyles();
ensureShell();
syncSelectors();

document.addEventListener('click',event=>{
  if (event.target.closest('#simpleNewPurchase,[data-purchase-product],[data-purchase-category],[data-purchase-presentation]')) {
    requestAnimationFrame(syncSelectors);
  }
});

window.addEventListener('panel:inventory-changed',()=>requestAnimationFrame(syncSelectors));
