const RECIPE_STORAGE_KEY = 'panel-next-recipes-v1';
const MEASURED_MIXED_MIGRATION_KEY = 'panel-next-recipes-measured-mixed-v1';

function seedRecipes() {
  const cevicheBase = [
    { name:'Tomate', qty:1.6, unit:'oz', fixed:true },
    { name:'Pepino', qty:1.6, unit:'oz', fixed:true },
    { name:'Cebolla morada', qty:0.8, unit:'oz', fixed:true },
    { name:'Cilantro', qty:0.2, unit:'oz', fixed:true },
    { name:'Jugo de limón', qty:1, unit:'fl oz', fixed:true },
    { name:'Clamato', qty:0.67, unit:'fl oz', fixed:true }
  ];

  // Cantidades medidas en una preparación real de 3 lb de ceviche mixto.
  const measuredMixedBase = [
    { name:'Tomate', qty:8/3, unit:'oz', fixed:true },
    { name:'Cebolla morada', qty:1, unit:'oz', fixed:true },
    { name:'Pepino', qty:5/3, unit:'oz', fixed:true },
    { name:'Clamato', qty:4/3, unit:'fl oz', fixed:true },
    { name:'Jugo de limón', qty:1, unit:'fl oz', fixed:true },
    { name:'Cilantro', qty:1/3, unit:'oz', fixed:true },
    { name:'Salsa negra', qty:1/3, unit:'oz', fixed:true },
    { name:'Salsa picante', qty:1/3, unit:'oz', fixed:true }
  ];

  const cevicheRecipe = ({ id, name, menuItem, seafood, base=cevicheBase, notes='Receta de 1 lb' }) => ({
    id,
    name,
    type:'Producto final',
    yieldQty:1,
    yieldUnit:'lb',
    menuItem,
    notes,
    ingredients:[...seafood.map(item => ({ ...item })), ...base.map(item => ({ ...item }))],
    createdAt:Date.now(),
    updatedAt:Date.now()
  });

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
    },
    cevicheRecipe({
      id:'R-CV-FISH',
      name:'Ceviche de pescado',
      menuItem:'Ceviche de pescado',
      seafood:[
        { name:'Filete de pescado', qty:8, unit:'oz', fixed:true }
      ]
    }),
    cevicheRecipe({
      id:'R-CV-SHRIMP',
      name:'Ceviche de camarón',
      menuItem:'Ceviche de camarón',
      seafood:[
        { name:'Camarón', qty:8, unit:'oz', fixed:true }
      ]
    }),
    cevicheRecipe({
      id:'R-CV-MIXED',
      name:'Ceviche mixto',
      menuItem:'Ceviche mixto',
      notes:'Receta medida de 1 lb',
      seafood:[
        { name:'Filete de pescado', qty:11/3, unit:'oz', fixed:true },
        { name:'Camarón', qty:4, unit:'oz', fixed:true }
      ],
      base:measuredMixedBase
    }),
    cevicheRecipe({
      id:'R-CV-OCT-FISH',
      name:'Ceviche pulpo y pescado',
      menuItem:'Ceviche pulpo y pescado',
      notes:'Receta medida de 1 lb',
      seafood:[
        { name:'Pulpo', qty:4, unit:'oz', fixed:true },
        { name:'Filete de pescado', qty:11/3, unit:'oz', fixed:true }
      ],
      base:measuredMixedBase
    }),
    cevicheRecipe({
      id:'R-CV-OCT-SHRIMP',
      name:'Ceviche pulpo y camarón',
      menuItem:'Ceviche pulpo y camarón',
      notes:'Receta medida de 1 lb',
      seafood:[
        { name:'Pulpo', qty:11/3, unit:'oz', fixed:true },
        { name:'Camarón', qty:4, unit:'oz', fixed:true }
      ],
      base:measuredMixedBase
    })
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

function recipeNameKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .trim()
    .toLowerCase();
}

function ingredientKey(value) {
  return recipeNameKey(value);
}

function ingredientMatches(recipe, name, qty, unit) {
  const row = (recipe.ingredients || []).find(item => ingredientKey(item.name) === ingredientKey(name));
  if (!row) return false;
  return Math.abs(Number(row.qty || 0) - Number(qty || 0)) < 0.0001 && String(row.unit || '') === unit;
}

function isLegacyMeasuredTarget(recipe) {
  const key = recipeNameKey(recipe.name);
  const targets = new Set([
    recipeNameKey('Ceviche mixto'),
    recipeNameKey('Ceviche pulpo y pescado'),
    recipeNameKey('Ceviche pulpo y camarón')
  ]);
  if (!targets.has(key)) return false;

  const common = [
    ['Tomate',1.6,'oz'],
    ['Pepino',1.6,'oz'],
    ['Cebolla morada',0.8,'oz'],
    ['Cilantro',0.2,'oz'],
    ['Jugo de limón',1,'fl oz'],
    ['Clamato',0.67,'fl oz']
  ];
  if (!common.every(([name,qty,unit])=>ingredientMatches(recipe,name,qty,unit))) return false;

  if (key === recipeNameKey('Ceviche mixto')) {
    return ingredientMatches(recipe,'Filete de pescado',4,'oz') && ingredientMatches(recipe,'Camarón',4,'oz');
  }
  if (key === recipeNameKey('Ceviche pulpo y pescado')) {
    return ingredientMatches(recipe,'Pulpo',4,'oz') && ingredientMatches(recipe,'Filete de pescado',4,'oz');
  }
  return ingredientMatches(recipe,'Pulpo',4,'oz') && ingredientMatches(recipe,'Camarón',4,'oz');
}

function migrateMeasuredMixedRecipes(recipes) {
  if (localStorage.getItem(MEASURED_MIXED_MIGRATION_KEY) === 'done') return recipes;

  const defaults = new Map(seedRecipes().map(recipe => [recipeNameKey(recipe.name),normalizeRecipe(recipe)]));
  let changed = false;
  const next = recipes.map(recipe => {
    if (!isLegacyMeasuredTarget(recipe)) return recipe;
    const replacement = defaults.get(recipeNameKey(recipe.name));
    if (!replacement) return recipe;
    changed = true;
    return normalizeRecipe({
      ...recipe,
      ingredients:replacement.ingredients.map(item=>({ ...item })),
      notes:'Receta medida de 1 lb',
      updatedAt:Date.now()
    });
  });

  if (changed) localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(next));
  localStorage.setItem(MEASURED_MIXED_MIGRATION_KEY,'done');
  return next;
}

function mergeMissingSeedRecipes(recipes) {
  const current = Array.isArray(recipes) ? recipes.map(normalizeRecipe) : [];
  const names = new Set(current.map(recipe => recipeNameKey(recipe.name)));
  const missing = seedRecipes()
    .map(normalizeRecipe)
    .filter(recipe => !names.has(recipeNameKey(recipe.name)));
  if (!missing.length) return current;
  const merged = [...current, ...missing];
  localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

function readRecipes() {
  try {
    const raw = localStorage.getItem(RECIPE_STORAGE_KEY);
    if (!raw) {
      const seeded = seedRecipes();
      localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(seeded));
      localStorage.setItem(MEASURED_MIXED_MIGRATION_KEY,'done');
      return seeded;
    }
    const merged = mergeMissingSeedRecipes(JSON.parse(raw));
    return migrateMeasuredMixedRecipes(merged);
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
    localStorage.setItem(MEASURED_MIXED_MIGRATION_KEY,'done');
    return writeRecipes(seedRecipes());
  }
};
