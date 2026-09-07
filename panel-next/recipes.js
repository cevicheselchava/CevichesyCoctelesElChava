import { BUSINESS } from './config.js';
import { InventoryStore } from './data.js';
import { RecipeStore } from './recipes-data.js';
import { recipeCost } from './recipe-cost.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const money = new Intl.NumberFormat(BUSINESS.locale,{style:'currency',currency:BUSINESS.currency});
const UNITS = ['ml','L','fl oz','oz','lb','g','kg','pieza','pizca','cucharada','cucharadita','taza','porción','otro'];

let recipeQuery = '';
let editingRecipeId = null;

function options(values, placeholder='Seleccionar') {
  return `<option value="">${placeholder}</option>${values.map(value=>`<option value="${value}">${value}</option>`).join('')}`;
}

function cleanNumber(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return '0';
  const rounded = Math.round(number * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function ensureRecipeAssets() {
  if (!document.querySelector('link[href="./recipes.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './recipes.css';
    document.head.appendChild(link);
  }

  if (!$('#recipesView')) {
    const section = document.createElement('section');
    section.className = 'view recipes-view';
    section.id = 'recipesView';
    section.dataset.view = 'recetas';
    section.innerHTML = `
      <div class="module-topbar">
        <button class="back-button" id="recipesBack" type="button">‹</button>
        <div><small>MÓDULO</small><h2>Recetas</h2></div>
        <button class="new-order-button" id="newRecipeButton" type="button">＋ Receta</button>
      </div>
      <div class="recipe-kpis" id="recipeKpis"></div>
      <div class="recipe-toolbar">
        <label class="recipe-search">⌕ <input id="recipeSearch" type="search" placeholder="Buscar receta o ingrediente"></label>
      </div>
      <div class="recipe-list" id="recipeList"></div>`;
    document.querySelector('main.content')?.appendChild(section);
  }

  if (!$('#recipeModal')) {
    const modal = document.createElement('div');
    modal.className = 'recipe-modal';
    modal.id = 'recipeModal';
    modal.hidden = true;
    modal.innerHTML = `
      <section class="recipe-sheet" role="dialog" aria-modal="true">
        <div class="modal-head">
          <div><small id="recipeEyebrow">NUEVA</small><h2 id="recipeModalTitle">Receta</h2></div>
          <button class="modal-close" id="closeRecipeModal" type="button">×</button>
        </div>
        <form id="recipeForm">
          <div class="recipe-form-section recipe-basic-section">
            <h3>Receta</h3>
            <div class="recipe-form-grid recipe-basic-grid">
              <label class="full">Nombre<input id="recipeName" required placeholder="Ej. Ceviche mixto"></label>
              <label>Rendimiento<input id="recipeYieldQty" type="number" min="0.01" step="0.01" value="1" required></label>
              <label>Unidad<select id="recipeYieldUnit" required>${options(UNITS,'Elige unidad')}</select></label>
            </div>
          </div>
          <div class="recipe-form-section">
            <h3>Ingredientes</h3>
            <datalist id="recipeInventoryOptions"></datalist>
            <div class="recipe-rows" id="recipeRows"></div>
            <button class="add-ingredient" id="addRecipeIngredient" type="button">＋ Agregar ingrediente</button>
            <div class="recipe-cost-preview" id="recipeCostPreview"></div>
          </div>
          <div class="recipe-modal-actions">
            <button class="cancel" id="cancelRecipe" type="button">Cancelar</button>
            <button class="save" type="submit">Guardar receta</button>
          </div>
        </form>
      </section>`;
    document.body.appendChild(modal);
  }
}

function inventoryNames() {
  return InventoryStore.list().map(item => String(item.name || '').trim()).filter(Boolean);
}

function isInventoryLinked(name) {
  const target = String(name || '').trim().toLowerCase();
  return InventoryStore.list().some(item => String(item.name || '').trim().toLowerCase() === target);
}

function ingredientText(ingredient) {
  if (ingredient.fixed === false) return 'Al gusto';
  return `${cleanNumber(ingredient.qty)} ${ingredient.unit || ''}`.trim();
}

function filteredRecipes() {
  const q = recipeQuery.trim().toLowerCase();
  return RecipeStore.list().filter(recipe => {
    if (!q) return true;
    const haystack = `${recipe.name} ${recipe.ingredients.map(item=>item.name).join(' ')}`.toLowerCase();
    return haystack.includes(q);
  });
}

function ingredientCostText(costRow) {
  if (!costRow) return '';
  if (costRow.status === 'costed') return money.format(costRow.cost || 0);
  if (costRow.status === 'al_gusto') return 'Sin costear';
  if (costRow.status === 'unlinked') return 'No vinculado';
  if (costRow.status === 'unit_mismatch') return 'Revisar unidad';
  if (costRow.status === 'no_price') return 'Sin precio';
  return '';
}

function recipeCostBox(recipe) {
  const cost = recipeCost(recipe);
  const totalLabel = !cost.complete ? 'Costo parcial' : (cost.estimated ? 'Costo estimado' : 'Costo receta');
  const perLabel = `Costo por ${recipe.yieldUnit || 'unidad'}`;
  const perValue = cost.complete && cost.perYieldUnit !== null ? money.format(cost.perYieldUnit) : 'Pendiente';
  let note = '';
  if (cost.missingCount) note = `Faltan ${cost.missingCount} ${cost.missingCount === 1 ? 'ingrediente' : 'ingredientes'} por costear.`;
  else if (cost.alGustoCount) note = `No incluye ${cost.alGustoCount} ${cost.alGustoCount === 1 ? 'ingrediente al gusto' : 'ingredientes al gusto'}.`;
  else note = 'Calculado con los precios registrados en Inventario / Compras.';

  return `
    <div class="recipe-cost-box ${cost.complete ? 'complete' : 'partial'}">
      <div><small>${totalLabel}</small><strong>${money.format(cost.total)}</strong></div>
      <div><small>${perLabel}</small><strong>${perValue}</strong></div>
      <p>${note}</p>
    </div>`;
}

function renderRecipes() {
  if (!$('#recipeKpis') || !$('#recipeList')) return;
  const recipes = RecipeStore.list();
  const ingredientCount = recipes.reduce((sum,recipe)=>sum + recipe.ingredients.length,0);
  const withCost = recipes.filter(recipe=>recipeCost(recipe).complete).length;
  $('#recipeKpis').innerHTML = [
    ['Recetas',recipes.length,'total'],
    ['Ingredientes',ingredientCount,'ingredients'],
    ['Con costo',withCost,'linked']
  ].map(([label,value,tone])=>`<article class="recipe-kpi ${tone}"><small>${label}</small><strong>${value}</strong></article>`).join('');

  const rows = filteredRecipes();
  $('#recipeList').innerHTML = rows.length ? rows.map(recipe => {
    const cost = recipeCost(recipe);
    return `
      <article class="recipe-card">
        <div class="recipe-card-head">
          <div><span class="recipe-type">RECETA</span><h3>${recipe.name}</h3></div>
          <div class="recipe-yield"><small>Rinde</small><strong>${cleanNumber(recipe.yieldQty)} ${recipe.yieldUnit}</strong></div>
        </div>
        <div class="recipe-ingredients">
          ${recipe.ingredients.map((item,index)=>`
            <div class="recipe-ingredient">
              <span><i class="recipe-stock-dot ${isInventoryLinked(item.name)?'ok':'missing'}"></i>${item.name}</span>
              <div class="recipe-ingredient-right">
                <strong>${ingredientText(item)}</strong>
                <small>${ingredientCostText(cost.ingredients[index])}</small>
              </div>
            </div>`).join('')}
        </div>
        ${recipeCostBox(recipe)}
        <div class="recipe-card-actions"><button class="recipe-action edit" data-recipe-action="edit" data-id="${recipe.id}" type="button">Editar</button></div>
      </article>`;
  }).join('') : `<div class="recipe-empty"><span>📖</span><h3>No hay recetas aquí</h3><p>Agrega una receta o cambia la búsqueda.</p></div>`;
}

function openRecipes() {
  ensureRecipeAssets();
  $$('.view').forEach(view => view.classList.toggle('active', view.id === 'recipesView'));
  $('#hero')?.classList.remove('compact');
  $('#bottomNav')?.classList.add('hidden');
  if (location.hash !== '#recetas') history.replaceState(null,'','#recetas');
  renderRecipes();
  window.scrollTo({top:0,behavior:'auto'});
}

function goHome() {
  const clean = location.pathname + location.search;
  location.href = clean;
}

function recipeRowTemplate(ingredient = {}) {
  const fixed = ingredient.fixed !== false;
  const savedNote = String(ingredient.note || '').replace(/"/g,'&quot;');
  return `
    <div class="recipe-row" data-recipe-row data-note="${savedNote}">
      <div class="recipe-row-grid">
        <label>Ingrediente<input data-field="name" list="recipeInventoryOptions" value="${ingredient.name || ''}" placeholder="Nombre" required></label>
        <label>Cantidad<input data-field="qty" type="number" min="0" step="0.01" value="${fixed && ingredient.qty !== undefined && ingredient.qty !== null ? ingredient.qty : ''}" ${fixed?'':'disabled'}></label>
        <label>Unidad<select data-field="unit" ${fixed?'':'disabled'}>${options(UNITS,'Unidad')}</select></label>
        <div class="recipe-row-buttons">
          <button class="taste ${fixed?'':'active'}" data-recipe-row-action="taste" type="button">Al gusto</button>
          <button class="remove" data-recipe-row-action="remove" type="button">×</button>
        </div>
      </div>
    </div>`;
}

function addRecipeRow(ingredient = {}) {
  $('#recipeRows').insertAdjacentHTML('beforeend', recipeRowTemplate(ingredient));
  const row = $('#recipeRows').lastElementChild;
  const unit = row?.querySelector('[data-field="unit"]');
  if (unit && ingredient.unit) {
    if (![...unit.options].some(option=>option.value===ingredient.unit)) unit.insertAdjacentHTML('beforeend',`<option value="${ingredient.unit}">${ingredient.unit}</option>`);
    unit.value = ingredient.unit;
  }
  updateRecipeCostPreview();
}

function populateInventoryOptions() {
  const list = $('#recipeInventoryOptions');
  if (list) list.innerHTML = inventoryNames().map(name=>`<option value="${name}"></option>`).join('');
}

function openRecipeModal(id = null) {
  editingRecipeId = id;
  $('#recipeForm').reset();
  $('#recipeRows').innerHTML = '';
  populateInventoryOptions();
  if (id) {
    const recipe = RecipeStore.get(id);
    if (!recipe) return;
    $('#recipeEyebrow').textContent = 'EDITAR';
    $('#recipeModalTitle').textContent = recipe.name;
    $('#recipeName').value = recipe.name;
    $('#recipeYieldQty').value = recipe.yieldQty || 1;
    $('#recipeYieldUnit').value = recipe.yieldUnit || '';
    recipe.ingredients.forEach(addRecipeRow);
  } else {
    $('#recipeEyebrow').textContent = 'NUEVA';
    $('#recipeModalTitle').textContent = 'Receta';
    $('#recipeYieldQty').value = '1';
    addRecipeRow();
  }
  updateRecipeCostPreview();
  $('#recipeModal').hidden = false;
  document.body.classList.add('modal-open');
}

function closeRecipeModal() {
  $('#recipeModal').hidden = true;
  editingRecipeId = null;
  document.body.classList.remove('modal-open');
}

function parseRecipeRows() {
  return [...$('#recipeRows').querySelectorAll('[data-recipe-row]')].map(row => {
    const fixed = !row.querySelector('[data-recipe-row-action="taste"]').classList.contains('active');
    return {
      name:row.querySelector('[data-field="name"]').value.trim(),
      qty:fixed ? Number(row.querySelector('[data-field="qty"]').value || 0) : null,
      unit:fixed ? row.querySelector('[data-field="unit"]').value : '',
      fixed,
      note:row.dataset.note || ''
    };
  }).filter(item=>item.name);
}

function draftRecipe() {
  return {
    name:$('#recipeName')?.value.trim() || '',
    yieldQty:Number($('#recipeYieldQty')?.value || 0),
    yieldUnit:$('#recipeYieldUnit')?.value || '',
    ingredients:$('#recipeRows') ? parseRecipeRows() : []
  };
}

function updateRecipeCostPreview() {
  const box = $('#recipeCostPreview');
  if (!box) return;
  const draft = draftRecipe();
  if (!draft.ingredients.length) {
    box.innerHTML = `<span>El costo aparecerá aquí cuando agregues ingredientes.</span>`;
    return;
  }
  const cost = recipeCost(draft);
  const title = !cost.complete ? 'Costo parcial' : (cost.estimated ? 'Costo estimado' : 'Costo de receta');
  const per = cost.complete && cost.perYieldUnit !== null && draft.yieldUnit
    ? `${money.format(cost.perYieldUnit)} por ${draft.yieldUnit}`
    : 'Costo por rendimiento pendiente';
  let note = '';
  if (cost.missingCount) note = `${cost.missingCount} ${cost.missingCount === 1 ? 'ingrediente falta' : 'ingredientes faltan'} por vincular, costear o ajustar de unidad.`;
  else if (cost.alGustoCount) note = `No incluye ${cost.alGustoCount} ${cost.alGustoCount === 1 ? 'ingrediente al gusto' : 'ingredientes al gusto'}.`;
  else note = 'Se actualizará automáticamente cuando cambien los precios de compra.';
  box.innerHTML = `
    <div><small>${title}</small><strong>${money.format(cost.total)}</strong></div>
    <div><small>Rendimiento</small><strong>${per}</strong></div>
    <p>${note}</p>`;
}

function toast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),1600);
}

ensureRecipeAssets();

document.addEventListener('click', event => {
  const module = event.target.closest('[data-module="recetas"]');
  if (module) {
    event.preventDefault();
    event.stopImmediatePropagation();
    openRecipes();
    return;
  }

  const action = event.target.closest('[data-recipe-action]');
  if (action) {
    event.preventDefault();
    if (action.dataset.recipeAction === 'edit') openRecipeModal(action.dataset.id);
    return;
  }

  const rowAction = event.target.closest('[data-recipe-row-action]');
  if (!rowAction) return;
  event.preventDefault();
  const row = rowAction.closest('[data-recipe-row]');
  if (rowAction.dataset.recipeRowAction === 'remove') {
    row.remove();
    if (!$('#recipeRows').children.length) addRecipeRow();
    updateRecipeCostPreview();
  }
  if (rowAction.dataset.recipeRowAction === 'taste') {
    rowAction.classList.toggle('active');
    const taste = rowAction.classList.contains('active');
    const qty = row.querySelector('[data-field="qty"]');
    const unit = row.querySelector('[data-field="unit"]');
    qty.disabled = taste;
    unit.disabled = taste;
    if (taste) { qty.value = ''; unit.value = ''; }
    updateRecipeCostPreview();
  }
}, true);

$('#recipesBack')?.addEventListener('click',goHome);
$('#newRecipeButton')?.addEventListener('click',()=>openRecipeModal());
$('#closeRecipeModal')?.addEventListener('click',closeRecipeModal);
$('#cancelRecipe')?.addEventListener('click',closeRecipeModal);
$('#recipeModal')?.addEventListener('click',event=>{ if (event.target === $('#recipeModal')) closeRecipeModal(); });
$('#recipeSearch')?.addEventListener('input',event=>{ recipeQuery = event.target.value; renderRecipes(); });
$('#addRecipeIngredient')?.addEventListener('click',()=>addRecipeRow());
$('#recipeForm')?.addEventListener('input',event=>{
  if (event.target.closest('[data-recipe-row]') || ['recipeYieldQty','recipeYieldUnit'].includes(event.target.id)) updateRecipeCostPreview();
});
$('#recipeForm')?.addEventListener('change',event=>{
  if (event.target.closest('[data-recipe-row]') || event.target.id === 'recipeYieldUnit') updateRecipeCostPreview();
});

$('#recipeForm')?.addEventListener('submit',event=>{
  event.preventDefault();
  const ingredients = parseRecipeRows();
  const existing = editingRecipeId ? RecipeStore.get(editingRecipeId) : null;
  const payload = {
    name:$('#recipeName').value.trim(),
    type:existing?.type || 'Producto final',
    menuItem:existing?.menuItem || '',
    yieldQty:Number($('#recipeYieldQty').value || 0),
    yieldUnit:$('#recipeYieldUnit').value,
    notes:existing?.notes || '',
    ingredients
  };
  if (!payload.name || !payload.yieldUnit || !Number.isFinite(payload.yieldQty) || payload.yieldQty <= 0 || !ingredients.length) return;
  const wasEditing = Boolean(editingRecipeId);
  if (editingRecipeId) RecipeStore.update(editingRecipeId,payload);
  else RecipeStore.create(payload);
  closeRecipeModal();
  renderRecipes();
  toast(wasEditing ? 'Receta actualizada' : 'Receta agregada');
});

if (location.hash === '#recetas') openRecipes();
