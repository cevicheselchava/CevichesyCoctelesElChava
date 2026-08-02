(() => {
  const promoId = 'promo_personal_16';

  if (typeof products === 'undefined' || !Array.isArray(products)) return;
  if (products.some(product => product.id === promoId)) return;

  const recipe = typeof halfRecipe === 'function' && typeof fish1 !== 'undefined'
    ? halfRecipe(fish1)
    : {};

  products.unshift({
    id: promoId,
    group: 'promotions',
    name: '🔥 Promo Personal',
    detail: '½ libra de ceviche de pescado + 1 cóctel chico + 1 refresco · Elige tu refresco en notas',
    price: 16,
    cost: null,
    recipe,
    promo: 'Solo $16',
    inventoryNote: 'El cóctel y el refresco quedan pendientes de receta y selección'
  });

  if (typeof state === 'object' && state) state[promoId] = 0;
  if (typeof render === 'function') render();
})();
