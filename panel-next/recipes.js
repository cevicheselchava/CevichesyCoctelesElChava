import { InventoryStore } from './data.js';
import { RecipeStore } from './recipes-data.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const UNITS = ['ml','L','fl oz','oz','lb','g','kg','pieza','pizca','cucharada','cucharadita','taza','porción','otro'];
const TYPES = ['Producto final','Base / salsa','Complemento','Bebida','Otro'];

let recipeQuery = '';
let editingRecipeId = null;

function options(values, placeholder='Seleccionar') {
  return `<option value="">${placeholder}</option>${values.map(value=>`<option value="${value}">${value}</option>`).join('')}`;
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
          <div class="recipe-form-section">
            <h3>Datos de la receta</h3>
            <div class="recipe-form-grid">
              <label class="full">Nombre<input id="recipeName" required placeholder="Ej. Salsa para cóctel"></label>
              <label>Tipo<select id="recipeType" required>${options(TYPES,'Elige tipo')}</select></label>
              <label>Se usa en<input id="recipeMenuItem" placeholder="Ej. Cócteles"></label>
              <label>Rendimiento<input id="recipeYieldQty" type="number" min="0.01" step="0.01" value="1" required></label>
              <label>Unidad<select id="recipeYieldUnit" required>${options(UNITS,'Elige unidad')}</select></label>
              <label class="full">Notas<textarea id="recipeNotes" placeholder="Observaciones de preparación"></textarea></label>
            </div>
          </div>
          <div class="recipe-form-section">
            <h3>Ingredientes</h3>
            <datalist id="recipeInventoryOptions"></datalist>
            <div class="recipe-rows" id="recipeRows"></div>
            <button class="add-ingredient" id="addRecipeIngredient" type="button">＋ Agregar ingrediente</button>
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
  return `${Number(ingredient.qty || 0)} ${ingredient.unit || ''}`.trim();
}

function filteredRecipes() {
  const q = recipeQuery.trim().toLowerCase();
  return RecipeStore.list().filter(recipe => {
    if (!q) return true;
    const haystack = `${recipe.name} ${recipe.type} ${recipe.menuItem} ${recipe.ingredients.map(item=>item.name).join(' ')}`.toLowerCase();
    return haystack.includes(q);
  });
}

function renderRecipes() {
  if (!$('#recipeKpis') || !$('#recipeList')) return;
  const recipes = RecipeStore.list();
  const ingredientCount = recipes.reduce((sum,recipe)=>sum + recipe.ingredients.length,0);
  const linkedCount = recipes.reduce((sum,recipe)=>sum + recipe.ingredients.filter(item=>isInventoryLinked(item.name)).length,0);
  $('#recipeKpis').innerHTML = [
    ['Recetas',recipes.length,'total'],
    ['Ingredientes',ingredientCount,'ingredients'],
    ['Vinculados',linkedCount,'linked']
  ].map(([label,value,tone])=>`<article class="recipe-kpi ${tone}"><small>${label}</small><strong>${value}</strong></article>`).join('');

  const rows = filteredRecipes();
  $('#recipeList').innerHTML = rows.length ? rows.map(recipe => `
    <article class="recipe-card">
      <div class="recipe-card-head">
        <div><span class="recipe-type">${recipe.type}</span><h3>${recipe.name}</h3></div>
        <div class="recipe-yield"><small>Rinde</small><strong>${recipe.yieldQty} ${recipe.yieldUnit}</strong></div>
      </div>
      ${recipe.menuItem ? `<div class="recipe-menu-link">Se usa en: <strong>${recipe.menuItem}</strong></div>` : ''}
      <div class="recipe-ingredients">
        ${recipe.ingredients.map(item=>`
          <div class="recipe-ingredient">
            <span><i class="recipe-stock-dot ${isInventoryLinked(item.name)?'ok':'missing'}"></i>${item.name}${item.note?` <em>· ${item.note}</em>`:''}</span>
            <strong>${ingredientText(item)}</strong>
          </div>`).join('')}
      </div>
      ${recipe.notes ? `<div class="recipe-notes">${recipe.notes}</div>` : ''}
      <div class="recipe-card-actions"><button class="recipe-action edit" data-recipe-action="edit" data-id="${recipe.id}" type="button">Editar</button></div>
    </article>`).join('') : `<div class="recipe-empty"><span>📖</span><h3>No hay recetas aquí</h3><p>Agrega una receta o cambia la búsqueda.</p></div>`;
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
  return `
    <div class="recipe-row" data-recipe-row>
      <div class="recipe-row-grid">
        <label>Ingrediente<input data-field="name" list="recipeInventoryOptions" value="${ingredient.name || ''}" placeholder="Nombre" required></label>
        <label>Cantidad<input data-field="qty" type="number" min="0" step="0.01" value="${fixed && ingredient.qty !== undefined && ingredient.qty !== null ? ingredient.qty : ''}" ${fixed?'':'disabled'}></label>
        <label>Unidad<select data-field="unit" ${fixed?'':'disabled'}>${options(UNITS,'Unidad')}</select></label>
        <div class="recipe-row-buttons">
          <button class="taste ${fixed?'':'active'}" data-recipe-row-action="taste" type="button">Al gusto</button>
          <button class="remove" data-recipe-row-action="remove" type="button">×</button>
        </div>
      </div>
      <label class="recipe-row-note">Nota<input data-field="note" value="${ingredient.note || ''}" placeholder="Opcional"></label>
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
    $('#recipeType').value = recipe.type;
    $('#recipeMenuItem').value = recipe.menuItem || '';
    $('#recipeYieldQty').value = recipe.yieldQty || 1;
    $('#recipeYieldUnit').value = recipe.yieldUnit || '';
    $('#recipeNotes').value = recipe.notes || '';
    recipe.ingredients.forEach(addRecipeRow);
  } else {
    $('#recipeEyebrow').textContent = 'NUEVA';
    $('#recipeModalTitle').textContent = 'Receta';
    $('#recipeYieldQty').value = '1';
    addRecipeRow();
  }
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
      note:row.querySelector('[data-field="note"]').value.trim()
    };
  }).filter(item=>item.name);
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
  }
  if (rowAction.dataset.recipeRowAction === 'taste') {
    rowAction.classList.toggle('active');
    const taste = rowAction.classList.contains('active');
    const qty = row.querySelector('[data-field="qty"]');
    const unit = row.querySelector('[data-field="unit"]');
    qty.disabled = taste;
    unit.disabled = taste;
    if (taste) { qty.value = ''; unit.value = ''; }
  }
}, true);

$('#recipesBack')?.addEventListener('click',goHome);
$('#newRecipeButton')?.addEventListener('click',()=>openRecipeModal());
$('#closeRecipeModal')?.addEventListener('click',closeRecipeModal);
$('#cancelRecipe')?.addEventListener('click',closeRecipeModal);
$('#recipeModal')?.addEventListener('click',event=>{ if (event.target === $('#recipeModal')) closeRecipeModal(); });
$('#recipeSearch')?.addEventListener('input',event=>{ recipeQuery = event.target.value; renderRecipes(); });
$('#addRecipeIngredient')?.addEventListener('click',()=>addRecipeRow());

$('#recipeForm')?.addEventListener('submit',event=>{
  event.preventDefault();
  const ingredients = parseRecipeRows();
  const payload = {
    name:$('#recipeName').value.trim(),
    type:$('#recipeType').value,
    menuItem:$('#recipeMenuItem').value.trim(),
    yieldQty:Number($('#recipeYieldQty').value || 0),
    yieldUnit:$('#recipeYieldUnit').value,
    notes:$('#recipeNotes').value.trim(),
    ingredients
  };
  if (!payload.name || !payload.type || !payload.yieldUnit || !Number.isFinite(payload.yieldQty) || payload.yieldQty <= 0 || !ingredients.length) return;
  const wasEditing = Boolean(editingRecipeId);
  if (editingRecipeId) RecipeStore.update(editingRecipeId,payload);
  else RecipeStore.create(payload);
  closeRecipeModal();
  renderRecipes();
  toast(wasEditing ? 'Receta actualizada' : 'Receta agregada');
});

if (location.hash === '#recetas') openRecipes();
