(() => {
  'use strict';

  // ---------- PWA ----------
  let installPrompt = null;
  let installButton = null;

  function removeInstallButton() {
    if (installButton) installButton.remove();
    installButton = null;
  }

  function showInstallButton() {
    if (installButton || window.matchMedia('(display-mode: standalone)').matches) return;
    installButton = document.createElement('button');
    installButton.type = 'button';
    installButton.textContent = '📲 INSTALAR APP';
    installButton.setAttribute('aria-label', 'Instalar Ceviches y Cócteles El Cubano');
    Object.assign(installButton.style, {
      position: 'fixed', right: '12px', bottom: '102px', zIndex: '9999',
      border: '0', borderRadius: '14px', padding: '13px 16px',
      background: '#267642', color: '#fff', fontSize: '15px', fontWeight: '900',
      boxShadow: '0 7px 20px rgba(0,0,0,.28)'
    });
    installButton.addEventListener('click', async () => {
      if (!installPrompt) return;
      installButton.disabled = true;
      await installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      removeInstallButton();
    });
    document.body.appendChild(installButton);
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').catch(console.error);
    });
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    showInstallButton();
  });
  window.addEventListener('appinstalled', removeInstallButton);

  // ---------- LIMPIEZA DE CAPAS VIEJAS ----------
  function cleanupOldLayers() {
    document.getElementById('el-cubano-watermark')?.remove();
    document.getElementById('el-cubano-watermark-stronger')?.remove();
    document.getElementById('el-cubano-watermark-style')?.remove();

    if (!document.getElementById('single-watermark-strength')) {
      const style = document.createElement('style');
      style.id = 'single-watermark-strength';
      style.textContent = '.wrap::before{opacity:.22!important}';
      document.head.appendChild(style);
    }
  }

  // ---------- CATEGORÍAS: UN SOLO CONTROL ----------
  document.addEventListener('click', event => {
    const button = event.target.closest('#customer-category-nav button[data-group]');
    if (!button) return;

    const nav = document.getElementById('customer-category-nav');
    const group = button.dataset.group;
    const section = document.querySelector(`.section[data-group="${group}"]`);
    if (!nav || !section) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const wasOpen = section.classList.contains('open');
    document.querySelectorAll('.section[data-group]').forEach(item => {
      item.classList.remove('open');
      item.querySelector('.section-title')?.setAttribute('aria-expanded', 'false');
    });
    nav.querySelectorAll('button[data-group]').forEach(item => item.classList.remove('active'));

    if (!wasOpen) {
      section.classList.add('open');
      section.querySelector('.section-title')?.setAttribute('aria-expanded', 'true');
      button.classList.add('active');
    }
  }, true);

  // ---------- HORARIOS: SE ELIMINAN LOS LISTENERS VIEJOS Y QUEDA UNO SOLO ----------
  function setupCleanDeliveryTime() {
    const oldDate = document.getElementById('date');
    const oldTime = document.getElementById('time');
    if (!oldDate || !oldTime) return;

    const dateInput = oldDate.cloneNode(true);
    const timeSelect = oldTime.cloneNode(false);
    timeSelect.id = 'time';
    timeSelect.setAttribute('aria-label', 'Hora de entrega');

    oldDate.replaceWith(dateInput);
    oldTime.replaceWith(timeSelect);

    function formatSlot(minutes) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const period = hour >= 12 ? 'p. m.' : 'a. m.';
      return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${period}`;
    }

    function fillTimes() {
      const previous = timeSelect.value;
      timeSelect.innerHTML = '<option value="">Selecciona un horario</option>';
      for (let minutes = 660; minutes <= 1140; minutes += 20) {
        const label = formatSlot(minutes);
        const option = document.createElement('option');
        option.value = label;
        option.textContent = label;
        timeSelect.appendChild(option);
      }
      if ([...timeSelect.options].some(option => option.value === previous)) {
        timeSelect.value = previous;
      }
    }

    fillTimes();
    timeSelect.addEventListener('pointerdown', fillTimes, { passive: true });
    timeSelect.addEventListener('focus', fillTimes, { passive: true });
    dateInput.addEventListener('change', fillTimes);

    // Android a veces abre el selector antes de que otros scripts terminen.
    setTimeout(fillTimes, 50);
    setTimeout(fillTimes, 300);
  }

  // ---------- ESPAÑOL / ENGLISH SIN OBSERVER ----------
  const STORAGE_KEY = 'el-cubano-language';
  let language = localStorage.getItem(STORAGE_KEY) || 'es';

  const exact = new Map([
    ['Ceviches & Cócteles', 'Ceviches & Seafood Cocktails'],
    ['Fresco · preparado al momento', 'Fresh · made to order'],
    ['🥣 Ceviche real, preparado fresco', '🥣 Real ceviche, freshly prepared'],
    ['Hecho al momento · Sabor que sí se antoja', 'Made to order · Fresh flavor you’ll crave'],
    ['¿Qué se te antoja hoy?', 'What are you craving today?'],
    ['Programa tu pedido · Delivery gratis en área delimitada', 'Schedule your order · Free delivery within the service area'],
    ['💯 Seguro', '💯 Secure'], ['Sin anticipos', 'No prepayment'],
    ['💵 Paga al recibir', '💵 Pay on delivery'], ['Efectivo o Cash App', 'Cash or Cash App'],
    ['🚚 Delivery', '🚚 Delivery'], ['Área delimitada', 'Service area'],
    ['Promociones', 'Promotions'], ['Entrega', 'Same-day'], ['Cócteles', 'Cocktails'],
    ['Sobre pedido', 'Preorder'], ['Refrescos', 'Sodas'],
    ['PEDIR PARA AHORITA', 'ORDER FOR NOW'], ['Datos de entrega', 'Delivery details'],
    ['Día de entrega', 'Delivery date'], ['Hora de entrega', 'Delivery time'],
    ['Selecciona un horario', 'Select a time'], ['Tu carrito', 'Your cart'],
    ['Seguir comprando', 'Keep shopping'], ['Enviar pedido', 'Send order'],
    ['Agrega productos', 'Add products'], ['Ver carrito y continuar', 'View cart and continue'],
    ['Revisar antes de enviar', 'Review before sending'], ['Precio pendiente', 'Price pending'],
    ['por presentación', 'per serving']
  ]);

  const attrMap = new Map([
    ['Nombre', 'Name'], ['Teléfono', 'Phone'], ['Dirección de entrega', 'Delivery address'],
    ['Notas del pedido', 'Order notes'], ['Día de entrega', 'Delivery date'],
    ['Hora de entrega', 'Delivery time'], ['Ir al carrito', 'Go to cart'], ['Cerrar carrito', 'Close cart']
  ]);

  function translateString(text) {
    const trimmed = text.trim();
    if (!trimmed) return text;
    if (exact.has(trimmed)) return text.replace(trimmed, exact.get(trimmed));
    return text
      .replace(/Ahorras\s*\$([0-9.]+)/gi, 'Save $$$1')
      .replace(/ceviche de pescado/gi, 'fish ceviche')
      .replace(/ceviche de camarón/gi, 'shrimp ceviche')
      .replace(/ceviche mixto/gi, 'mixed ceviche')
      .replace(/pulpo y pescado/gi, 'octopus & fish')
      .replace(/pulpo y camarón/gi, 'octopus & shrimp')
      .replace(/cóctel chico/gi, 'small seafood cocktail')
      .replace(/cócteles chicos/gi, 'small seafood cocktails')
      .replace(/refresco/gi, 'soda')
      .replace(/½ libra/gi, '½ lb')
      .replace(/1 libra/gi, '1 lb');
  }

  function translateElement(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (node.parentElement?.closest('script,style,#language-switch')) return;
      if (node.__esText === undefined) node.__esText = node.nodeValue;
      node.nodeValue = language === 'en' ? translateString(node.__esText) : node.__esText;
    });

    root.querySelectorAll('[placeholder],[aria-label],[title]').forEach(node => {
      ['placeholder', 'aria-label', 'title'].forEach(attr => {
        if (!node.hasAttribute(attr)) return;
        const key = '__es_' + attr.replace('-', '_');
        if (node[key] === undefined) node[key] = node.getAttribute(attr);
        node.setAttribute(attr, language === 'en' ? (attrMap.get(node[key]) || translateString(node[key])) : node[key]);
      });
    });
  }

  function applyLanguage() {
    document.documentElement.lang = language === 'en' ? 'en' : 'es';
    translateElement(document.body);
    document.querySelectorAll('#language-switch button').forEach(button => {
      button.classList.toggle('active', button.dataset.lang === language);
    });
    if (installButton) installButton.textContent = language === 'en' ? '📲 INSTALL APP' : '📲 INSTALAR APP';
  }

  function buildLanguageSwitch() {
    if (document.getElementById('language-switch')) return;
    const style = document.createElement('style');
    style.textContent = '#language-switch{display:flex;align-items:center;gap:6px;margin:3px 2px 10px;position:relative;z-index:5}#language-switch button{border:0;background:transparent;color:#14365b;font-weight:900;font-size:15px;padding:7px 9px;border-radius:12px}#language-switch button.active{background:rgba(255,255,255,.82);box-shadow:0 4px 12px rgba(20,54,91,.10);outline:1px solid rgba(230,218,195,.9)}#language-switch .divider{font-weight:900;color:#9a8d78}';
    document.head.appendChild(style);

    const switcher = document.createElement('div');
    switcher.id = 'language-switch';
    switcher.innerHTML = '<button type="button" data-lang="es">🇲🇽 ES</button><span class="divider">|</span><button type="button" data-lang="en">🇺🇸 EN</button>';
    const wrap = document.querySelector('.wrap');
    if (wrap) wrap.insertBefore(switcher, wrap.firstChild);

    switcher.addEventListener('click', event => {
      const button = event.target.closest('button[data-lang]');
      if (!button) return;
      language = button.dataset.lang;
      localStorage.setItem(STORAGE_KEY, language);
      applyLanguage();
    });
  }

  function init() {
    cleanupOldLayers();
    setupCleanDeliveryTime();
    buildLanguageSwitch();
    applyLanguage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
