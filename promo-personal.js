(() => {
  const promoId = 'promo_personal_16';

  if (typeof products !== 'undefined' && Array.isArray(products) && !products.some(product => product.id === promoId)) {
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
      promo: 'Ahorras $4.50',
      inventoryNote: 'El cóctel y el refresco quedan pendientes de receta y selección'
    });

    if (typeof state === 'object' && state) state[promoId] = 0;
    if (typeof render === 'function') render();
  }

  // Solo acomoda la información una vez. El idioma, horarios, PWA y marca de agua
  // se controlan desde pwa-init.js para evitar listeners y estilos duplicados.
  const wrap = document.querySelector('.wrap');
  const hero = document.querySelector('.hero');
  const nav = document.getElementById('customer-category-nav');
  const sections = [...document.querySelectorAll('.section[data-group]')];

  if (wrap && hero && nav && sections.length) {
    hero.insertAdjacentElement('afterend', nav);

    let info = document.getElementById('customer-info-after-menu');
    if (!info) {
      info = document.createElement('div');
      info.id = 'customer-info-after-menu';
    }

    const benefits = document.querySelector('.benefits');
    if (benefits) info.appendChild(benefits);

    [...wrap.children].forEach(element => {
      if (element.classList?.contains('notice') || element.classList?.contains('availability-note')) {
        info.appendChild(element);
      }
    });

    sections[sections.length - 1].insertAdjacentElement('afterend', info);
  }
})();
