import { InventoryStore, OrdersStore } from './data.js';
import { RecipeStore } from './recipes-data.js';

const strip = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'')
  .trim()
  .toLowerCase();

function singularWord(word) {
  const value = strip(word);
  if (value.endsWith('es') && value.length > 4) return value.slice(0,-2);
  if (value.endsWith('s') && value.length > 3) return value.slice(0,-1);
  return value;
}

function phraseRoot(value) {
  return strip(value)
    .split(/\s+/)
    .filter(Boolean)
    .map(singularWord)
    .join(' ');
}

const UNIT_ALIASES = {
  l:'L', litro:'L', litros:'L',
  ml:'ml', mililitro:'ml', mililitros:'ml',
  'fl oz':'fl oz', floz:'fl oz',
  g:'g', gramo:'g', gramos:'g',
  kg:'kg', kilogramo:'kg', kilogramos:'kg',
  oz:'oz', onza:'oz', onzas:'oz',
  lb:'lb', lbs:'lb', libra:'lb', libras:'lb',
  pieza:'pieza', piezas:'pieza', pza:'pieza', pzas:'pieza', unidad:'pieza', unidades:'pieza',
  orden:'orden', ordenes:'orden', porcion:'orden', porciones:'orden',
  vaso:'vaso', vasos:'vaso',
  pizca:'pizca', pizcas:'pizca',
  cucharada:'cucharada', cucharadas:'cucharada',
  cucharadita:'cucharadita', cucharaditas:'cucharadita',
  taza:'taza', tazas:'taza'
};

const UNIT_META = {
  ml:{group:'volume',factor:1},
  L:{group:'volume',factor:1000},
  'fl oz':{group:'volume',factor:29.5735},
  cucharada:{group:'volume',factor:14.7868},
  cucharadita:{group:'volume',factor:4.92892},
  taza:{group:'volume',factor:236.588},
  g:{group:'mass',factor:1},
  kg:{group:'mass',factor:1000},
  oz:{group:'mass',factor:28.3495},
  lb:{group:'mass',factor:453.592},
  pieza:{group:'count',factor:1},
  orden:{group:'serving',factor:1},
  vaso:{group:'glass',factor:1},
  pizca:{group:'pinch',factor:1}
};

function unitKey(unit) {
  const clean = strip(unit);
  return UNIT_ALIASES[clean] || unit || '';
}

function convertQty(qty, fromUnit, toUnit) {
  const from = unitKey(fromUnit);
  const to = unitKey(toUnit);
  if (!from || !to) return null;
  if (strip(from) === strip(to)) return Number(qty || 0);
  const fromMeta = UNIT_META[from];
  const toMeta = UNIT_META[to];
  if (!fromMeta || !toMeta || fromMeta.group !== toMeta.group) return null;
  return Number(qty || 0) * fromMeta.factor / toMeta.factor;
}

function menuAliases(recipe) {
  return String(recipe?.menuItem || '')
    .split(/[,/;|]+/)
    .map(value=>value.trim())
    .filter(Boolean);
}

function matchScore(recipe, item) {
  const itemName = phraseRoot(item?.name);
  if (!itemName) return 0;
  const recipeName = phraseRoot(recipe?.name);
  if (recipeName === itemName) return recipe.type === 'Producto final' ? 120 : 105;

  const aliases = menuAliases(recipe);
  let best = 0;
  for (const alias of aliases) {
    const aliasRoot = phraseRoot(alias);
    if (!aliasRoot) continue;
    if (aliasRoot === itemName) best = Math.max(best, recipe.type === 'Producto final' ? 110 : 95);
    else if (itemName.includes(aliasRoot) || aliasRoot.includes(itemName)) best = Math.max(best, recipe.type === 'Producto final' ? 90 : 75);
    else {
      const aliasFirst = aliasRoot.split(' ')[0];
      const itemFirst = itemName.split(' ')[0];
      if (aliasFirst && aliasFirst === itemFirst) best = Math.max(best, recipe.type === 'Producto final' ? 80 : 65);
    }
  }
  return best;
}

export function findRecipeForItem(item) {
  return RecipeStore.list()
    .map(recipe=>({recipe,score:matchScore(recipe,item)}))
    .filter(row=>row.score > 0)
    .sort((a,b)=>b.score-a.score)[0]?.recipe || null;
}

function orderScale(item, recipe) {
  const orderQty = Number(item?.recipeQty ?? item?.qty ?? 0);
  const recipeQty = Number(recipe?.yieldQty || 0);
  if (!(orderQty > 0) || !(recipeQty > 0)) return null;

  const orderUnit = unitKey(item?.recipeUnit || item?.unit);
  const yieldUnit = unitKey(recipe?.yieldUnit);
  if (!orderUnit || !yieldUnit) return orderQty / recipeQty;
  if (strip(orderUnit) === strip(yieldUnit)) return orderQty / recipeQty;

  const orderInYieldUnit = convertQty(orderQty, orderUnit, yieldUnit);
  if (orderInYieldUnit === null) return null;
  return orderInYieldUnit / recipeQty;
}

function inventoryByName(name) {
  const target = strip(name);
  return InventoryStore.list().find(item=>strip(item.name) === target) || null;
}

function cleanNumber(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return 0;
  if (Math.abs(number) >= 100) return Math.round(number * 10) / 10;
  return Math.round(number * 100) / 100;
}

export function recipePlanForItem(item) {
  const recipe = findRecipeForItem(item);
  if (!recipe) return { recipe:null, scale:null, compatible:false, ingredients:[] };

  const scale = orderScale(item, recipe);
  const compatible = scale !== null;
  const displayScale = compatible ? scale : 1;
  const ingredients = recipe.ingredients.map(ingredient=>{
    const fixed = ingredient.fixed !== false;
    const qty = fixed ? cleanNumber(Number(ingredient.qty || 0) * displayScale) : null;
    const inventoryItem = inventoryByName(ingredient.name);
    return {
      ...ingredient,
      qty,
      fixed,
      inventoryItem,
      linked:Boolean(inventoryItem)
    };
  });

  return { recipe, scale, compatible, ingredients };
}

export function consumeInventoryForOrder(orderId) {
  const order = OrdersStore.get(orderId);
  if (!order) return { ok:false, message:'Pedido no encontrado', items:[] };
  if (order.inventoryProcessedAt) {
    return order.inventoryConsumption || { ok:true, already:true, items:[] };
  }

  const results = [];
  let recipeCount = 0;

  for (const item of Array.isArray(order.items) ? order.items : []) {
    const plan = recipePlanForItem(item);
    if (!plan.recipe) {
      results.push({ product:item.name, status:'no_recipe', label:'Sin receta configurada' });
      continue;
    }
    recipeCount += 1;

    if (!plan.compatible) {
      const requestedQty = item.recipeQty ?? item.qty ?? 0;
      const requestedUnit = item.recipeUnit || item.unit || '';
      results.push({
        product:item.name,
        recipe:plan.recipe.name,
        status:'order_unit_mismatch',
        label:`No se puede calcular ${requestedQty} ${requestedUnit} contra ${plan.recipe.yieldQty} ${plan.recipe.yieldUnit}`
      });
      continue;
    }

    for (const ingredient of plan.ingredients) {
      if (!ingredient.fixed) {
        results.push({ product:item.name, ingredient:ingredient.name, status:'manual', label:'Al gusto' });
        continue;
      }
      if (!ingredient.inventoryItem) {
        results.push({ product:item.name, ingredient:ingredient.name, status:'unlinked', label:'No está vinculado a inventario' });
        continue;
      }

      const neededInInventoryUnit = convertQty(ingredient.qty, ingredient.unit, ingredient.inventoryItem.unit);
      if (neededInInventoryUnit === null) {
        results.push({
          product:item.name,
          ingredient:ingredient.name,
          status:'ingredient_unit_mismatch',
          label:`No se puede convertir ${ingredient.unit || 'sin unidad'} a ${ingredient.inventoryItem.unit || 'sin unidad'}`
        });
        continue;
      }

      const needed = cleanNumber(neededInInventoryUnit);
      const available = Number(ingredient.inventoryItem.qty || 0);
      if (available + 1e-9 < needed) {
        results.push({
          product:item.name,
          ingredient:ingredient.name,
          status:'shortage',
          needed,
          unit:ingredient.inventoryItem.unit,
          available:cleanNumber(available),
          label:`Faltan ${cleanNumber(needed - available)} ${ingredient.inventoryItem.unit}`
        });
        continue;
      }

      const remaining = cleanNumber(Math.max(0, available - needed));
      InventoryStore.update(ingredient.inventoryItem.id,{qty:remaining});
      results.push({
        product:item.name,
        ingredient:ingredient.name,
        status:'deducted',
        qty:needed,
        unit:ingredient.inventoryItem.unit,
        remaining,
        label:`Descontado ${needed} ${ingredient.inventoryItem.unit}`
      });
    }
  }

  const deducted = results.filter(row=>row.status === 'deducted').length;
  const alerts = results.filter(row=>['shortage','unlinked','ingredient_unit_mismatch','order_unit_mismatch','no_recipe'].includes(row.status)).length;
  const summary = {
    ok:true,
    processedAt:Date.now(),
    recipeCount,
    deducted,
    alerts,
    items:results
  };

  OrdersStore.update(orderId,{
    inventoryProcessedAt:summary.processedAt,
    inventoryConsumption:summary
  });
  return summary;
}
