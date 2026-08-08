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

  // Orden de compra más directo:
  // foto/título -> categorías -> productos -> información -> pedido/checkout.
  function reorderCustomerLayout() {
    const wrap = document.querySelector('.wrap');
    const hero = document.querySelector('.hero');
    const nav = document.getElementById('customer-category-nav');
    const sections = [...document.querySelectorAll('.section[data-group]')];
    if (!wrap || !hero || !nav || !sections.length) return;

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

    if (!document.getElementById('customer-layout-order-style')) {
      const style = document.createElement('style');
      style.id = 'customer-layout-order-style';
      style.textContent = `
        #customer-category-nav{margin-top:12px!important;margin-bottom:14px!important}
        #customer-info-after-menu{margin:14px 0 4px}
        #customer-info-after-menu .benefits{margin:0 0 10px!important}
        #customer-info-after-menu .notice,
        #customer-info-after-menu .availability-note{margin:10px 0!important}
      `;
      document.head.appendChild(style);
    }
  }

  // Horarios en intervalos de 20 minutos. En Android otros scripts podían
  // volver a vaciar el selector después de llenarlo, por eso este corre al final.
  function setupDeliveryTimes() {
    const dateInput = document.getElementById('date');
    const timeSelect = document.getElementById('time');
    if (!dateInput || !timeSelect) return;

    const localDateString = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    const formatSlot = minutes => {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const period = hour >= 12 ? 'p. m.' : 'a. m.';
      return `${hour % 12 || 12}:${String(minute).padStart(2,'0')} ${period}`;
    };

    const fill = () => {
      const selected = dateInput.value;
      const previous = timeSelect.value;
      timeSelect.disabled = false;
      timeSelect.innerHTML = '<option value="">Selecciona un horario</option>';
      if (!selected) return;

      const now = new Date();
      const today = localDateString(now);
      const current = now.getHours() * 60 + now.getMinutes();
      const minimumToday = Math.ceil((current + 30) / 20) * 20;

      for (let minutes = 660; minutes <= 1140; minutes += 20) {
        if (selected === today && minutes < minimumToday) continue;
        const option = document.createElement('option');
        option.value = formatSlot(minutes);
        option.textContent = formatSlot(minutes);
        timeSelect.appendChild(option);
      }

      if ([...timeSelect.options].some(option => option.value === previous)) {
        timeSelect.value = previous;
      }
    };

    const fillLast = () => setTimeout(fill, 0);
    dateInput.addEventListener('change', fillLast);
    dateInput.addEventListener('input', fillLast);

    timeSelect.addEventListener('touchstart', fill, {passive:true});
    timeSelect.addEventListener('pointerdown', fill);
    timeSelect.addEventListener('focus', fill);
    timeSelect.addEventListener('click', fill);

    setTimeout(fill, 100);
    setTimeout(fill, 500);
    setTimeout(fill, 1200);
  }

  // En el carrito móvil la barra fija estaba tapando los botones finales.
  function fixCartButtons() {
    if (document.getElementById('mobile-cart-actions-fix')) return;
    const style = document.createElement('style');
    style.id = 'mobile-cart-actions-fix';
    style.textContent = `
      .cart-modal{z-index:1000!important}
      .cart-dialog{padding-bottom:calc(24px + env(safe-area-inset-bottom))!important}
      .cart-actions{position:relative!important;z-index:3!important;margin-top:12px!important}
      body.modal-open .sticky{display:none!important}
      @media(max-width:560px){
        .cart-dialog{max-height:92vh!important}
        .cart-actions button{min-height:54px!important;font-size:16px!important}
      }
    `;
    document.head.appendChild(style);
  }

  reorderCustomerLayout();
  setupDeliveryTimes();
  fixCartButtons();
})();
