const RECIPE_STORAGE_KEY = 'panel-next-recipes-v1';

function seedRecipes() {
  return [
    {
      id:'R-1001',
      name:'Salsa para cóctel',
      type:'Base / salsa',
      yieldQty:1,
      yieldUnit:'L',
      menuItem:'Cócteles',
      notes:'Receta familiar de El Cubano',
      ingredients:[
        { name:'Salsa catsup', qty:500, unit:'ml', fixed:true },
        { name:'Puré de tomate', qty:500, unit:'ml', fixed:true, note:'o 500 g' },
        { name:'Clamato', qty:300, unit:'ml', fixed:true },
        { name:'Jugo de limón', qty:30, unit:'ml', fixed:true },
        { name:'Salsa inglesa', qty:5, unit:'ml', fixed:true },
        { name:'Salsa Maggi', qty:5, unit:'ml', fixed:true },
        { name:'Pimienta', qty:1, unit:'pizca', fixed:true }
      ],
      createdAt:Date.now()-86400000,
      updatedAt:Date.now()-3600000
    }
  ];
}

function normalizeIngredient(ingredient = {}) {
  return {
    name:String(ingredient.name || '').trim(),
    qty:ingredient.fixed === false ? null : Number(ingredient.qty || 0),
    unit:String(ingredient.unit || '').trim(),
    fixed:ingredient.fixed !== false,
    note:String(ingredient.note || '').trim()
  };
}

function normalizeRecipe(recipe = {}) {
  return {
    ...recipe,
    name:String(recipe.name || '').trim(),
    type:String(recipe.type || 'Producto final'),
    yieldQty:Number(recipe.yieldQty || 1),
    yieldUnit:String(recipe.yieldUnit || 'porción'),
    menuItem:String(recipe.menuItem || '').trim(),
    notes:String(recipe.notes || '').trim(),
    ingredients:Array.isArray(recipe.ingredients) ? recipe.ingredients.map(normalizeIngredient).filter(item => item.name) : []
  };
}

function readRecipes() {
  try {
    const raw = localStorage.getItem(RECIPE_STORAGE_KEY);
    if (!raw) {
      const seeded = seedRecipes();
      localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw).map(normalizeRecipe);
  } catch {
    return seedRecipes();
  }
}

function writeRecipes(recipes) {
  const normalized = recipes.map(normalizeRecipe);
  localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export const RecipeStore = {
  list() {
    return readRecipes().sort((a,b) => String(a.name || '').localeCompare(String(b.name || ''), 'es'));
  },
  get(id) {
    return readRecipes().find(recipe => recipe.id === id) || null;
  },
  create(recipe) {
    const recipes = readRecipes();
    const nextNumber = recipes.reduce((max,row) => Math.max(max, Number(String(row.id || '').replace(/\D/g,'')) || 0), 1000) + 1;
    const created = normalizeRecipe({ ...recipe, id:`R-${nextNumber}`, createdAt:Date.now(), updatedAt:Date.now() });
    recipes.push(created);
    writeRecipes(recipes);
    return created;
  },
  update(id, patch) {
    const recipes = readRecipes();
    const index = recipes.findIndex(recipe => recipe.id === id);
    if (index < 0) return null;
    recipes[index] = normalizeRecipe({ ...recipes[index], ...patch, updatedAt:Date.now() });
    writeRecipes(recipes);
    return recipes[index];
  },
  remove(id) {
    const recipes = readRecipes().filter(recipe => recipe.id !== id);
    writeRecipes(recipes);
    return recipes;
  },
  resetDemo() {
    return writeRecipes(seedRecipes());
  }
};
