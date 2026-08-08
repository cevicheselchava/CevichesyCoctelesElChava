(() => {
  // Runtime final ligero: instalación, categorías, horarios y traducción.
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
      boxShadow: '0 7px 20px rgba(0,0,0,.28)', cursor: 'pointer'
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
    window.addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js').catch(console.error));
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

  // Categorías: abrir una; tocar la misma otra vez la cierra.
  document.addEventListener('click', event => {
    const button = event.target.closest('#customer-category-nav button[data-group]');
    if (!button) return;
    const nav = document.getElementById('customer-category-nav');
    const section = document.querySelector(`.section[data-group="${button.dataset.group}"]`);
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

  // Horarios: SIEMPRE hay opciones. Si se elige hoy, oculta horas ya pasadas.
  function setupDeliveryTimes() {
    const dateInput = document.getElementById('date');
    const timeSelect = document.getElementById('time');
    if (!dateInput || !timeSelect) return;

    const localDate = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    const label = minutes => {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const period = hour >= 12 ? 'p. m.' : 'a. m.';
      return `${hour % 12 || 12}:${String(minute).padStart(2,'0')} ${period}`;
    };

    function fillTimes() {
      const previous = timeSelect.value;
      const selectedDate = dateInput.value;
      const now = new Date();
      const isToday = selectedDate && selectedDate === localDate(now);
      const minimum = Math.ceil((now.getHours() * 60 + now.getMinutes() + 30) / 20) * 20;

      timeSelect.disabled = false;
      timeSelect.replaceChildren();
      const first = document.createElement('option');
      first.value = '';
      first.textContent = 'Selecciona un horario';
      timeSelect.appendChild(first);

      for (let minutes = 660; minutes <= 1140; minutes += 20) {
        if (isToday && minutes < minimum) continue;
        const option = document.createElement('option');
        option.value = label(minutes);
        option.textContent = label(minutes);
        timeSelect.appendChild(option);
      }

      if ([...timeSelect.options].some(option => option.value === previous)) timeSelect.value = previous;
      else timeSelect.value = '';
    }

    dateInput.addEventListener('change', fillTimes);
    timeSelect.addEventListener('pointerdown', fillTimes);
    timeSelect.addEventListener('focus', fillTimes);
    fillTimes();
  }

  // ---------- Español / English sin MutationObserver ----------
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
    ['💯 Seguro', '💯 Secure'], ['Sin anticipos', 'No prepayment'],
    ['💵 Paga al recibir', '💵 Pay on delivery'], ['Efectivo o Cash App', 'Cash or Cash App'],
    ['Área delimitada', 'Service area'],
    ['Promociones', 'Promotions'], ['Entrega', 'Same-day'], ['Cócteles', 'Cocktails'],
    ['Sobre pedido', 'Preorder'], ['Refrescos', 'Sodas'],
    ['PEDIR PARA AHORITA', 'ORDER FOR NOW'],
    ['Datos de entrega', 'Delivery details'], ['Día de entrega', 'Delivery date'],
    ['Hora de entrega', 'Delivery time'], ['Selecciona un horario', 'Select a time'],
    ['Tu carrito', 'Your cart'], ['Seguir comprando', 'Keep shopping'], ['Enviar pedido', 'Send order'],
    ['Agrega productos', 'Add products'], ['Ver carrito y continuar', 'View cart and continue'],
    ['Revisar antes de enviar', 'Review before sending'], ['Precio pendiente', 'Price pending'],
    ['por presentación', 'per serving']
  ]);

  const attrMap = {
    'Nombre': 'Name', 'Teléfono': 'Phone', 'Dirección de entrega': 'Delivery address',
    'Notas del pedido': 'Order notes', 'Día de entrega': 'Delivery date', 'Hora de entrega': 'Delivery time',
    'Ir al carrito': 'Go to cart', 'Cerrar carrito': 'Close cart'
  };

  function translateString(original) {
    const trimmed = original.trim();
    if (!trimmed) return original;
    if (exact.has(trimmed)) return original.replace(trimmed, exact.get(trimmed));
    let out = original;
    [
      [/Elige tu refresco en notas/gi, 'Choose your soda in notes'],
      [/cócteles chicos/gi, 'small seafood cocktails'], [/cóctel chico/gi, 'small seafood cocktail'],
      [/ceviche de pescado/gi, 'fish ceviche'], [/ceviche de camarón/gi, 'shrimp ceviche'],
      [/ceviche mixto/gi, 'mixed ceviche'], [/pulpo y pescado/gi, 'octopus & fish'],
      [/pulpo y camarón/gi, 'octopus & shrimp'], [/Ahorras\s*\$([0-9.]+)/gi, 'Save $$$1'],
      [/refrescos/gi, 'sodas'], [/refresco/gi, 'soda'], [/camarón/gi, 'shrimp'],
      [/pescado/gi, 'fish'], [/pulpo/gi, 'octopus'], [/mixto/gi, 'mixed'],
      [/½ libra/gi, '½ lb'], [/1 libra/gi, '1 lb']
    ].forEach(([pattern, replacement]) => { out = out.replace(pattern, replacement); });
    return out;
  }

  function translateNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.__esText === undefined) node.__esText = node.nodeValue;
      node.nodeValue = language === 'en' ? translateString(node.__esText) : node.__esText;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || node.id === 'language-switch' || node.matches('script,style')) return;
    ['placeholder','aria-label','title'].forEach(attr => {
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

  function applyLanguage() {
    if (applying) return;
    applying = true;
    document.documentElement.lang = language;
    document.querySelectorAll('.wrap,#cartModal,.sticky').forEach(translateNode);
    document.querySelectorAll('#language-switch button').forEach(button => button.classList.toggle('active', button.dataset.lang === language));
    if (installButton) installButton.textContent = language === 'en' ? '📲 INSTALL APP' : '📲 INSTALAR APP';
    applying = false;
  }

  function buildSwitch() {
    if (document.getElementById('language-switch')) return;
    const style = document.createElement('style');
    style.textContent = `#language-switch{display:flex;align-items:center;gap:6px;margin:3px 2px 10px;position:relative;z-index:5}#language-switch button{border:0;background:transparent;color:#14365b;font-weight:900;font-size:15px;padding:7px 9px;border-radius:12px}#language-switch button.active{background:rgba(255,255,255,.82);box-shadow:0 4px 12px rgba(20,54,91,.10);outline:1px solid rgba(230,218,195,.9)}#language-switch .divider{font-weight:900;color:#9a8d78}`;
    document.head.appendChild(style);
    const switcher = document.createElement('div');
    switcher.id = 'language-switch';
    switcher.innerHTML = '<button type="button" data-lang="es">🇲🇽 ES</button><span class="divider">|</span><button type="button" data-lang="en">🇺🇸 EN</button>';
    document.querySelector('.wrap')?.prepend(switcher);
    switcher.addEventListener('click', event => {
      const button = event.target.closest('button[data-lang]');
      if (!button) return;
      language = button.dataset.lang;
      localStorage.setItem(STORAGE_KEY, language);
      applyLanguage();
    });
  }

  function hookDynamicContent() {
    if (typeof window.changeQty === 'function' && !window.changeQty.__languageHooked) {
      const original = window.changeQty;
      const wrapped = function(...args) {
        const result = original.apply(this, args);
        requestAnimationFrame(applyLanguage);
        return result;
      };
      wrapped.__languageHooked = true;
      window.changeQty = wrapped;
    }
    ['cartTop','send'].forEach(id => document.getElementById(id)?.addEventListener('click', () => setTimeout(applyLanguage, 0)));
  }

  function init() {
    setupDeliveryTimes();
    buildSwitch();
    hookDynamicContent();
    applyLanguage();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
