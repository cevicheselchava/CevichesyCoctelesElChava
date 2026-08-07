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
