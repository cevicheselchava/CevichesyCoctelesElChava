import { InventoryStore } from './data.js';

const strip = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'')
  .trim()
  .toLowerCase();

const UNIT_ALIASES = {
  l:'L', litro:'L', litros:'L',
  ml:'ml', mililitro:'ml', mililitros:'ml',
  'fl oz':'fl oz', floz:'fl oz',
  g:'g', gramo:'g', gramos:'g',
  kg:'kg', kilogramo:'kg', kilogramos:'kg',
  oz:'oz', onza:'oz', onzas:'oz',
  lb:'lb', lbs:'lb', libra:'lb', libras:'lb',
  pieza:'pieza', piezas:'pieza', pza:'pieza', pzas:'pieza', unidad:'pieza', unidades:'pieza',
  pizca:'pizca', pizcas:'pizca',
  cucharada:'cucharada', cucharadas:'cucharada',
  cucharadita:'cucharadita', cucharaditas:'cucharadita',
  taza:'taza', tazas:'taza'
};

const UNIT_META = {
  ml:{group:'volume',factor:1}, L:{group:'volume',factor:1000}, 'fl oz':{group:'volume',factor:29.5735295625},
  cucharada:{group:'volume',factor:14.78676478125}, cucharadita:{group:'volume',factor:4.92892159375}, taza:{group:'volume',factor:236.5882365},
  g:{group:'mass',factor:1}, kg:{group:'mass',factor:1000}, oz:{group:'mass',factor:28.349523125}, lb:{group:'mass',factor:453.59237},
  pieza:{group:'count',factor:1}, pizca:{group:'pinch',factor:1}
};

function unitKey(unit) {
  const clean = strip(unit);
  return UNIT_ALIASES[clean] || unit || '';
}

function convertQty(qty, fromUnit, toUnit) {
  const number = Number(qty);
  if (!Number.isFinite(number)) return null;
  const from = unitKey(fromUnit);
  const to = unitKey(toUnit);
  if (!from || !to) return null;
  if (strip(from) === strip(to)) return number;
  const source = UNIT_META[from];
  const target = UNIT_META[to];
  if (!source || !target || source.group !== target.group) return null;
  return number * source.factor / target.factor;
}

function inventoryByName(name) {
  const target = strip(name);
  return InventoryStore.list().find(item => strip(item.name) === target) || null;
}

function ingredientCost(ingredient = {}) {
  if (ingredient.fixed === false) {
    return { ...ingredient, status:'al_gusto', cost:null, inventoryItem:null, convertedQty:null, unitCost:null };
  }

  const inventoryItem = inventoryByName(ingredient.name);
  if (!inventoryItem) {
    return { ...ingredient, status:'unlinked', cost:null, inventoryItem:null, convertedQty:null, unitCost:null };
  }

  const convertedQty = convertQty(Number(ingredient.qty || 0), ingredient.unit, inventoryItem.unit);
  if (convertedQty === null) {
    return { ...ingredient, status:'unit_mismatch', cost:null, inventoryItem, convertedQty:null, unitCost:null };
  }

  const unitCost = Number(InventoryStore.unitCost(inventoryItem));
  const hasPrice = Number(inventoryItem.purchasePrice || 0) > 0 || unitCost > 0;
  if (!Number.isFinite(unitCost) || unitCost < 0 || !hasPrice) {
    return { ...ingredient, status:'no_price', cost:null, inventoryItem, convertedQty, unitCost:null };
  }

  return {
    ...ingredient,
    status:'costed',
    inventoryItem,
    convertedQty,
    unitCost,
    cost:convertedQty * unitCost
  };
}

export function recipeCost(recipe = {}) {
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients.map(ingredientCost) : [];
  const costed = ingredients.filter(item => item.status === 'costed');
  const missing = ingredients.filter(item => ['unlinked','unit_mismatch','no_price'].includes(item.status));
  const alGusto = ingredients.filter(item => item.status === 'al_gusto');
  const total = costed.reduce((sum,item)=>sum + Number(item.cost || 0),0);
  const yieldQty = Number(recipe.yieldQty || 0);
  const perYieldUnit = yieldQty > 0 ? total / yieldQty : null;

  return {
    ingredients,
    total,
    perYieldUnit,
    costedCount:costed.length,
    missingCount:missing.length,
    alGustoCount:alGusto.length,
    complete:missing.length === 0,
    estimated:missing.length === 0 && alGusto.length > 0
  };
}
