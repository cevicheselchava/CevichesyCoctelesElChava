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
})();
