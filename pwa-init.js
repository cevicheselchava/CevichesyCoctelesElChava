(() => {
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
      position: 'fixed',
      right: '12px',
      bottom: '102px',
      zIndex: '9999',
      border: '0',
      borderRadius: '14px',
      padding: '13px 16px',
      background: '#267642',
      color: '#ffffff',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '15px',
      fontWeight: '900',
      boxShadow: '0 7px 20px rgba(0,0,0,.28)',
      cursor: 'pointer'
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
      navigator.serviceWorker.register('/service-worker.js').catch(error => {
        console.error('No se pudo registrar la PWA:', error);
      });
    });
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    showInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    removeInstallButton();
  });

  // Menú de categorías: tocar abre; tocar el mismo botón otra vez cierra.
  document.addEventListener('click', event => {
    const button = event.target.closest('#customer-category-nav button[data-group]');
    if (!button) return;

    const nav = document.getElementById('customer-category-nav');
    if (!nav) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const group = button.dataset.group;
    const section = document.querySelector(`.section[data-group="${group}"]`);
    const wasOpen = !!section?.classList.contains('open');

    document.querySelectorAll('.section[data-group]').forEach(item => {
      item.classList.remove('open');
      const title = item.querySelector('.section-title');
      if (title) title.setAttribute('aria-expanded', 'false');
    });

    nav.querySelectorAll('button[data-group]').forEach(item => {
      item.classList.remove('active');
    });

    if (!wasOpen && section) {
      section.classList.add('open');
      const title = section.querySelector('.section-title');
      if (title) title.setAttribute('aria-expanded', 'true');
      button.classList.add('active');
    }
  }, true);
})();

// ---------- Español / English ----------
(() => {
  const STORAGE_KEY = 'el-cubano-language';
  let language = localStorage.getItem(STORAGE_KEY) || 'es';
  let applying = false;

  const exact = new Map([
    ['Ceviches & Cócteles', 'Ceviches & Seafood Cocktails'],
    ['Fresco · preparado al momento', 'Fresh · made to order'],
    ['🥣 Ceviche real, preparado fresco', '🥣 Real ceviche, freshly prepared'],
    ['Hecho al momento · Sabor que sí se antoja', 'Made to order · Fresh flavor you’ll crave'],
    ['¿Qué se te antoja hoy?', 'What are you craving today?'],
    ['Programa tu pedido · Delivery gratis en área delimitada', 'Schedule your order · Free delivery within the service area'],
    ['💯 Seguro', '💯 Secure'],
    ['Sin anticipos', 'No prepayment'],
    ['💵 Paga al recibir', '💵 Pay on delivery'],
    ['Efectivo o Cash App', 'Cash or Cash App'],
    ['🚚 Delivery', '🚚 Delivery'],
    ['Área delimitada', 'Service area'],
    ['📍 Fuera de San Antonio:', '📍 Outside San Antonio:'],
    ['puede aplicar compra mínima según la distancia.', 'a minimum purchase may apply depending on distance.'],
    ['⏰ Entregas en horarios de 20 minutos.', '⏰ Delivery slots every 20 minutes.'],
    ['Cantidad limitada por día y sujeta a disponibilidad.', 'Limited daily availability.'],
    ['⭐ SOBRE PEDIDO:', '⭐ PREORDER:'],
    ['Pulpo y pescado · Pulpo y camarón. Disponibles en ½ libra y 1 libra.', 'Octopus & fish · Octopus & shrimp. Available in ½ lb and 1 lb.'],
    ['Promociones', 'Promotions'],
    ['Entrega', 'Same-day'],
    ['Cócteles', 'Cocktails'],
    ['Sobre pedido', 'Preorder'],
    ['Refrescos', 'Sodas'],
    ['Precios de lanzamiento', 'Launch prices'],
    ['El mismo día', 'Same day'],
    ['Precios pendientes', 'Prices pending'],
    ['Programa con anticipación', 'Schedule ahead'],
    ['🔥 PROMOCIONES', '🔥 PROMOTIONS'],
    ['⚡ ENTREGA INMEDIATA', '⚡ SAME-DAY DELIVERY'],
    ['🍹 CÓCTELES', '🍹 SEAFOOD COCKTAILS'],
    ['📅 SOBRE PEDIDO', '📅 PREORDER'],
    ['🥤 REFRESCOS', '🥤 SODAS'],
    ['PEDIR PARA AHORITA', 'ORDER FOR NOW'],
    ['Datos de entrega', 'Delivery details'],
    ['Día de entrega', 'Delivery date'],
    ['Hora de entrega', 'Delivery time'],
    ['Selecciona un horario', 'Select a time'],
    ['Todos los derechos reservados © 2026 · Desarrollado por Salmar Marketing Digital', 'All rights reserved © 2026 · Developed by Salmar Marketing Digital'],
    ['Tu carrito', 'Your cart'],
    ['Seguir comprando', 'Keep shopping'],
    ['Enviar pedido', 'Send order'],
    ['Total', 'Total'],
    ['Agrega productos', 'Add products'],
    ['Ver carrito y continuar', 'View cart and continue'],
    ['Revisar antes de enviar', 'Review before sending'],
    ['Promo Personal', 'Personal Promo'],
    ['Combo Constructor', 'Builder Combo'],
    ['Combo Hambre', 'Hungry Combo'],
    ['Combo Camaradas', 'Crew Combo'],
    ['Ceviche de pescado', 'Fish ceviche'],
    ['Ceviche de camarón', 'Shrimp ceviche'],
    ['Ceviche mixto', 'Mixed ceviche'],
    ['Pulpo y pescado', 'Octopus & fish'],
    ['Pulpo y camarón', 'Octopus & shrimp'],
    ['Refresco', 'Soda'],
    ['Precio pendiente', 'Price pending'],
    ['por presentación', 'per serving']
  ]);

  const attrMap = {
    'Nombre': 'Name',
    'Teléfono': 'Phone',
    'Dirección de entrega': 'Delivery address',
    'Notas del pedido': 'Order notes',
    'Día de entrega': 'Delivery date',
    'Hora de entrega': 'Delivery time',
    'Ir al carrito': 'Go to cart',
    'Cerrar carrito': 'Close cart',
    'Instalar Ceviches y Cócteles El Cubano': 'Install Ceviches y Cócteles El Cubano'
  };

  function translateString(original) {
    const trimmed = original.trim();
    if (!trimmed) return original;
    if (exact.has(trimmed)) return original.replace(trimmed, exact.get(trimmed));

    let out = original;
    const replacements = [
      [/Elige tu refresco en notas/gi, 'Choose your soda in notes'],
      [/1 libra de ceviche de pescado/gi, '1 lb fish ceviche'],
      [/1 libra de ceviche de camarón/gi, '1 lb shrimp ceviche'],
      [/½ libra de ceviche de pescado/gi, '½ lb fish ceviche'],
      [/½ libra de ceviche de camarón/gi, '½ lb shrimp ceviche'],
      [/1 libra de pescado/gi, '1 lb fish'],
      [/1 libra de camarón/gi, '1 lb shrimp'],
      [/½ libra de pescado/gi, '½ lb fish'],
      [/½ libra de camarón/gi, '½ lb shrimp'],
      [/2 cócteles chicos/gi, '2 small seafood cocktails'],
      [/1 cóctel chico/gi, '1 small seafood cocktail'],
      [/cócteles chicos/gi, 'small seafood cocktails'],
      [/cóctel chico/gi, 'small seafood cocktail'],
      [/cóctel mediano/gi, 'medium seafood cocktail'],
      [/ceviche de pescado/gi, 'fish ceviche'],
      [/ceviche de camarón/gi, 'shrimp ceviche'],
      [/ceviche mixto/gi, 'mixed ceviche'],
      [/pulpo y pescado/gi, 'octopus & fish'],
      [/pulpo y camarón/gi, 'octopus & shrimp'],
      [/Disponibles en ½ libra y 1 libra/gi, 'Available in ½ lb and 1 lb'],
      [/Disponible en ½ libra y 1 libra/gi, 'Available in ½ lb and 1 lb'],
      [/Precios pendientes/gi, 'Prices pending'],
      [/Precio pendiente/gi, 'Price pending'],
      [/Ahorras\s*\$([0-9.]+)/gi, 'Save $$$1'],
      [/por presentación/gi, 'per serving'],
      [/refrescos/gi, 'sodas'],
      [/refresco/gi, 'soda'],
      [/camarón/gi, 'shrimp'],
      [/pescado/gi, 'fish'],
      [/pulpo/gi, 'octopus'],
      [/mixto/gi, 'mixed'],
      [/½ libra/gi, '½ lb'],
      [/1 libra/gi, '1 lb']
    ];
    replacements.forEach(([pattern, replacement]) => {
      out = out.replace(pattern, replacement);
    });
    return out;
  }

  function translateNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.__esText === undefined) node.__esText = node.nodeValue;
      node.nodeValue = language === 'en' ? translateString(node.__esText) : node.__esText;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.id === 'language-switch' || node.matches('script,style')) return;

    ['placeholder', 'aria-label', 'title'].forEach(attr => {
      if (!node.hasAttribute(attr)) return;
      const key = '__es_' + attr.replace('-', '_');
      if (node[key] === undefined) node[key] = node.getAttribute(attr);
      node.setAttribute(attr, language === 'en' ? (attrMap[node[key]] || translateString(node[key])) : node[key]);
    });

    if (node.tagName === 'OPTION') {
      if (node.__esOption === undefined) node.__esOption = node.textContent;
      node.textContent = language === 'en' ? translateString(node.__esOption) : node.__esOption;
      return;
    }

    [...node.childNodes].forEach(translateNode);
  }

  function updateInstallButton() {
    const button = [...document.querySelectorAll('button')].find(item => /INSTALAR APP|INSTALL APP/.test(item.textContent));
    if (button) button.textContent = language === 'en' ? '📲 INSTALL APP' : '📲 INSTALAR APP';
  }

  function applyLanguage() {
    if (applying) return;
    applying = true;
    document.documentElement.lang = language === 'en' ? 'en' : 'es';
    const wrap = document.querySelector('.wrap');
    if (wrap) translateNode(wrap);
    const modal = document.getElementById('cartModal');
    if (modal) translateNode(modal);
    const sticky = document.querySelector('.sticky');
    if (sticky) translateNode(sticky);
    updateInstallButton();
    document.querySelectorAll('#language-switch button').forEach(button => {
      button.classList.toggle('active', button.dataset.lang === language);
    });
    applying = false;
  }

  function buildSwitch() {
    if (document.getElementById('language-switch')) return;

    const style = document.createElement('style');
    style.textContent = `
      #language-switch{display:flex;align-items:center;gap:6px;margin:3px 2px 10px;position:relative;z-index:5}
      #language-switch button{border:0;background:transparent;color:#14365b;font-weight:900;font-size:15px;padding:7px 9px;border-radius:12px;cursor:pointer}
      #language-switch button.active{background:rgba(255,255,255,.82);box-shadow:0 4px 12px rgba(20,54,91,.10);outline:1px solid rgba(230,218,195,.9)}
      #language-switch .divider{font-weight:900;color:#9a8d78}
    `;
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

  const observer = new MutationObserver(() => {
    if (applying) return;
    clearTimeout(observer._timer);
    observer._timer = setTimeout(applyLanguage, 50);
  });

  function initLanguage() {
    buildSwitch();
    applyLanguage();
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguage, { once: true });
  } else {
    initLanguage();
  }
})();
