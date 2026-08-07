(() => {
  const promoId = 'promo_personal_16';

  if (typeof products === 'undefined' || !Array.isArray(products)) return;
  if (!products.some(product => product.id === promoId)) {
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

  // Marca de agua un poco más sólida, sin cambiar el resto del diseño.
  const styleId = 'el-cubano-watermark-stronger';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #el-cubano-watermark{
        position:fixed;
        left:50%;
        top:54%;
        width:min(78vw,520px);
        aspect-ratio:1/1;
        transform:translate(-50%,-50%);
        background:url('/el-cubano-logo-transparent.png') center/contain no-repeat;
        opacity:.27;
        filter:saturate(.92) contrast(.96);
        pointer-events:none;
        z-index:0;
      }
      @media(max-width:560px){
        #el-cubano-watermark{
          width:86vw;
          top:57%;
          opacity:.29;
        }
      }
    `;
    document.head.appendChild(style);
  }

  if (!document.getElementById('el-cubano-watermark')) {
    const watermark = document.createElement('div');
    watermark.id = 'el-cubano-watermark';
    watermark.setAttribute('aria-hidden', 'true');
    document.body.appendChild(watermark);
  }
})();
